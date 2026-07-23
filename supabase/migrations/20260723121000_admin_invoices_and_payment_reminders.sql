-- Admin create invoice (custom lines / pricing) + unpaid payment reminders.
--
-- Reminder schedule: day 3 and day 6 after invoice creation while still unpaid.
-- Operators can also manually send a follow-up from the Emails admin page.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

ALTER TABLE public.payment_tracking
  ADD COLUMN IF NOT EXISTS payment_reminder_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_note text;

-- ---------------------------------------------------------------------------
-- admin_create_invoice
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_create_invoice_impl(
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
  p_lines jsonb,
  p_shipping numeric,
  p_note text,
  p_send_email boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_email text := lower(btrim(COALESCE(p_customer_email, '')));
  v_name text := btrim(COALESCE(p_customer_name, ''));
  v_phone text := NULLIF(btrim(COALESCE(p_customer_phone, '')), '');
  v_note text := NULLIF(btrim(COALESCE(p_note, '')), '');
  v_shipping numeric(10,2) := ROUND(GREATEST(0, COALESCE(p_shipping, 0))::numeric, 2);
  v_line jsonb;
  v_id text;
  v_name_line text;
  v_line_type text;
  v_note_line text;
  v_image text;
  v_quantity integer;
  v_price numeric(10,2);
  v_line_total numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_tax numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_rebuilt jsonb := '[]'::jsonb;
  v_index integer := 0;
  v_order_ref text;
  v_tracking_id uuid;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF v_email = '' OR position('@' IN v_email) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A valid customer email is required');
  END IF;

  IF v_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer name is required');
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array'
     OR jsonb_array_length(p_lines) < 1 OR jsonb_array_length(p_lines) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Add between 1 and 100 invoice lines');
  END IF;

  FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    v_index := v_index + 1;
    v_id := NULLIF(btrim(COALESCE(v_line->>'id', '')), '');
    v_name_line := btrim(COALESCE(v_line->>'name', ''));
    v_line_type := COALESCE(NULLIF(v_line->>'line_type', ''), CASE WHEN v_id IS NULL THEN 'custom' ELSE 'catalog' END);
    v_note_line := NULLIF(btrim(COALESCE(v_line->>'note', '')), '');
    v_image := NULLIF(btrim(COALESCE(v_line->>'image', '')), '');

    IF v_name_line = '' THEN
      RETURN jsonb_build_object('success', false, 'error', format('Line %s: name is required', v_index));
    END IF;

    IF jsonb_typeof(v_line->'quantity') IS DISTINCT FROM 'number' THEN
      RETURN jsonb_build_object('success', false, 'error', format('Line %s: quantity must be a number', v_index));
    END IF;
    v_quantity := ROUND((v_line->>'quantity')::numeric)::integer;
    IF v_quantity < 1 OR v_quantity > 999 THEN
      RETURN jsonb_build_object('success', false, 'error', format('Line %s: quantity must be 1-999', v_index));
    END IF;

    IF jsonb_typeof(v_line->'price') IS DISTINCT FROM 'number'
       AND jsonb_typeof(v_line->'unit_price') IS DISTINCT FROM 'number' THEN
      RETURN jsonb_build_object('success', false, 'error', format('Line %s: unit price is required', v_index));
    END IF;
    v_price := ROUND(COALESCE((v_line->>'price')::numeric, (v_line->>'unit_price')::numeric, 0), 2);
    IF v_price < 0 OR v_price > 1000000 THEN
      RETURN jsonb_build_object('success', false, 'error', format('Line %s: unit price out of range', v_index));
    END IF;

    IF v_line_type NOT IN ('catalog', 'custom') THEN
      v_line_type := 'custom';
    END IF;
    IF v_id IS NULL THEN
      v_id := 'CUSTOM-' || v_index::text;
      v_line_type := 'custom';
    END IF;

    v_line_total := ROUND(v_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
    v_rebuilt := v_rebuilt || jsonb_build_array(jsonb_build_object(
      'id', v_id,
      'name', v_name_line,
      'quantity', v_quantity,
      'price', v_price,
      'unit_price', v_price,
      'line_total', v_line_total,
      'line_type', v_line_type,
      'note', v_note_line,
      'image', v_image
    ));
  END LOOP;

  v_tax := public.checkout_gst_amount(v_subtotal);
  v_total := greatest(0, v_subtotal + v_shipping + v_tax);
  v_order_ref := 'INV-' || to_char(now() AT TIME ZONE 'UTC', 'YYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.payment_tracking (
    order_reference,
    payment_status,
    customer_email,
    customer_name,
    customer_phone,
    cart_items,
    subtotal,
    shipping,
    tax,
    discount_amount,
    total_amount,
    currency,
    created_by_admin,
    invoice_note,
    admin_notes
  ) VALUES (
    v_order_ref,
    'pending',
    v_email,
    v_name,
    v_phone,
    v_rebuilt,
    v_subtotal,
    v_shipping,
    v_tax,
    0,
    v_total,
    'AUD',
    true,
    v_note,
    v_note
  )
  RETURNING id INTO v_tracking_id;

  INSERT INTO public.admin_audit_log (
    actor,
    action,
    target_table,
    target_id,
    after,
    note
  ) VALUES (
    COALESCE(auth.uid()::text, 'system'),
    'order.create_invoice',
    'payment_tracking',
    v_tracking_id::text,
    jsonb_build_object(
      'order_reference', v_order_ref,
      'total_amount', v_total,
      'lines', jsonb_array_length(v_rebuilt),
      'send_email', COALESCE(p_send_email, true)
    ),
    COALESCE(v_note, 'Admin-created invoice')
  );

  RETURN jsonb_build_object(
    'success', true,
    'tracking_id', v_tracking_id,
    'order_reference', v_order_ref,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'tax', v_tax,
    'total_amount', v_total,
    'send_email', COALESCE(p_send_email, true)
  );
END;
$$;

REVOKE ALL ON FUNCTION private.admin_create_invoice_impl(text, text, text, jsonb, numeric, text, boolean)
  FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_create_invoice_impl(text, text, text, jsonb, numeric, text, boolean)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_invoice(
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
  p_lines jsonb,
  p_shipping numeric DEFAULT 0,
  p_note text DEFAULT NULL,
  p_send_email boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private
AS $$
  SELECT private.admin_create_invoice_impl(
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_lines,
    p_shipping,
    p_note,
    p_send_email
  );
$$;

REVOKE ALL ON FUNCTION public.admin_create_invoice(text, text, text, jsonb, numeric, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_invoice(text, text, text, jsonb, numeric, text, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- list + mark payment reminders (day 3 and day 6)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_payment_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at ASC)
    FROM (
      SELECT
        id,
        order_reference,
        customer_email,
        customer_name,
        customer_phone,
        total_amount,
        payment_status,
        payment_reminder_count,
        last_payment_reminder_at,
        created_at,
        CASE
          WHEN payment_reminder_count = 0
            AND created_at <= now() - interval '3 days' THEN 1
          WHEN payment_reminder_count = 1
            AND COALESCE(last_payment_reminder_at, created_at) <= now() - interval '3 days' THEN 2
          ELSE NULL
        END AS due_reminder_number
      FROM public.payment_tracking
      WHERE payment_status IN ('pending', 'viewed_instructions')
        AND customer_email IS NOT NULL
        AND length(btrim(customer_email)) > 0
        AND payment_reminder_count < 2
        AND (
          (payment_reminder_count = 0 AND created_at <= now() - interval '3 days')
          OR
          (payment_reminder_count = 1 AND COALESCE(last_payment_reminder_at, created_at) <= now() - interval '3 days')
        )
    ) t
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_payment_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_payment_reminders() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_mark_payment_reminder_sent(
  p_tracking_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE public.payment_tracking
     SET payment_reminder_count = LEAST(2, payment_reminder_count + 1),
         last_payment_reminder_at = now(),
         updated_at = now()
   WHERE id = p_tracking_id
     AND payment_status IN ('pending', 'viewed_instructions')
  RETURNING payment_reminder_count INTO v_count;

  IF v_count IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or already paid');
  END IF;

  RETURN jsonb_build_object('success', true, 'payment_reminder_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_payment_reminder_sent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mark_payment_reminder_sent(uuid) TO authenticated;

COMMIT;
