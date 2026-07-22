-- Audited admin editing for unpaid order lines.
--
-- Paid/processing/fulfilled orders remain immutable. Operators may replace
-- lines only while an order is pending or payment instructions have been
-- viewed. The function recalculates totals, syncs normalized order_items, and
-- records a server-authored audit event.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS line_type text NOT NULL DEFAULT 'catalog',
  ADD COLUMN IF NOT EXISTS admin_note text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_line_type_check'
      AND conrelid = 'public.order_items'::regclass
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_line_type_check
      CHECK (line_type IN ('catalog', 'custom', 'adjustment'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION private.admin_replace_order_lines_impl(
  p_tracking_id uuid,
  p_lines jsonb,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_tracking public.payment_tracking%ROWTYPE;
  v_before jsonb;
  v_rebuilt jsonb := '[]'::jsonb;
  v_line jsonb;
  v_id text;
  v_name text;
  v_line_type text;
  v_note text;
  v_image text;
  v_quantity integer;
  v_price numeric(10,2);
  v_line_total numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2) := 0;
  v_tax numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_order_id uuid;
  v_attempt_id uuid;
  v_index integer := 0;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A reason is required');
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order lines must be an array');
  END IF;

  IF jsonb_array_length(p_lines) < 1 OR jsonb_array_length(p_lines) > 100 THEN
    RETURN jsonb_build_object(
      'success',
      false,
      'error',
      'Orders must contain between 1 and 100 lines'
    );
  END IF;

  SELECT *
    INTO v_tracking
    FROM public.payment_tracking
   WHERE id = p_tracking_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_tracking.payment_status NOT IN ('pending', 'viewed_instructions') THEN
    RETURN jsonb_build_object(
      'success',
      false,
      'error',
      'Paid or processing orders cannot have their lines rewritten'
    );
  END IF;

  v_before := jsonb_build_object(
    'cart_items', v_tracking.cart_items,
    'subtotal', v_tracking.subtotal,
    'shipping', v_tracking.shipping,
    'tax', v_tracking.tax,
    'discount_amount', v_tracking.discount_amount,
    'total_amount', v_tracking.total_amount
  );

  FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    v_index := v_index + 1;

    IF jsonb_typeof(v_line) <> 'object' THEN
      RETURN jsonb_build_object(
        'success',
        false,
        'error',
        format('Line %s must be an object', v_index)
      );
    END IF;

    v_id := left(btrim(COALESCE(v_line->>'id', '')), 120);
    v_name := left(btrim(COALESCE(v_line->>'name', '')), 240);
    v_line_type := lower(btrim(COALESCE(v_line->>'line_type', 'catalog')));
    v_note := NULLIF(left(btrim(COALESCE(v_line->>'note', '')), 500), '');
    v_image := NULLIF(left(btrim(COALESCE(v_line->>'image', '')), 1000), '');

    IF v_name = '' THEN
      RETURN jsonb_build_object(
        'success',
        false,
        'error',
        format('Line %s name is required', v_index)
      );
    END IF;

    IF jsonb_typeof(v_line->'quantity') IS DISTINCT FROM 'number'
       OR (v_line->>'quantity')::numeric <> floor((v_line->>'quantity')::numeric)
       OR (v_line->>'quantity')::numeric < 1
       OR (v_line->>'quantity')::numeric > 999 THEN
      RETURN jsonb_build_object(
        'success',
        false,
        'error',
        format('Line %s quantity is invalid', v_index)
      );
    END IF;

    IF jsonb_typeof(v_line->'price') IS DISTINCT FROM 'number'
       OR (v_line->>'price')::numeric < 0
       OR (v_line->>'price')::numeric > 1000000 THEN
      RETURN jsonb_build_object(
        'success',
        false,
        'error',
        format('Line %s price is invalid', v_index)
      );
    END IF;

    IF v_line_type NOT IN ('catalog', 'custom') THEN
      RETURN jsonb_build_object(
        'success',
        false,
        'error',
        format('Line %s type is invalid', v_index)
      );
    END IF;

    IF v_id = '' THEN
      v_id := format('CUSTOM-%s', v_index);
      v_line_type := 'custom';
    END IF;

    IF v_line_type = 'catalog'
       AND NOT EXISTS (
         SELECT 1
         FROM public.product_mappings
         WHERE cfg_code = v_id
       ) THEN
      RETURN jsonb_build_object(
        'success',
        false,
        'error',
        format('Line %s catalog product does not exist', v_index)
      );
    END IF;

    v_quantity := (v_line->>'quantity')::integer;
    v_price := round((v_line->>'price')::numeric, 2);
    v_line_total := round(v_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;

    v_rebuilt := v_rebuilt || jsonb_build_object(
      'id', v_id,
      'name', v_name,
      'quantity', v_quantity,
      'price', v_price,
      'unit_price', v_price,
      'line_total', v_line_total,
      'line_type', v_line_type,
      'note', v_note,
      'image', v_image
    );
  END LOOP;

  v_shipping := public.express_shipping_aud(v_subtotal);
  v_tax := public.checkout_gst_amount(v_subtotal);
  v_discount := least(v_subtotal, greatest(0, COALESCE(v_tracking.discount_amount, 0)));
  v_total := greatest(0, v_subtotal + v_shipping + v_tax - v_discount);

  UPDATE public.payment_tracking
     SET cart_items = v_rebuilt,
         subtotal = v_subtotal,
         shipping = v_shipping,
         tax = v_tax,
         discount_amount = v_discount,
         total_amount = v_total,
         updated_at = now()
   WHERE id = p_tracking_id;

  UPDATE public.orders
     SET subtotal = v_subtotal,
         shipping = v_shipping,
         tax = v_tax,
         discount_amount = v_discount,
         total_amount = v_total,
         updated_at = now()
   WHERE payment_tracking_id = p_tracking_id
      OR order_reference = v_tracking.order_reference
  RETURNING id INTO v_order_id;

  IF v_order_id IS NOT NULL THEN
    DELETE FROM public.order_items WHERE order_id = v_order_id;

    INSERT INTO public.order_items (
      order_id,
      cfg_code,
      product_name,
      unit_price,
      quantity,
      line_total,
      image_url,
      snapshot,
      line_type,
      admin_note
    )
    SELECT
      v_order_id,
      CASE
        WHEN line.value->>'line_type' = 'catalog'
          THEN line.value->>'id'
        ELSE NULL
      END,
      line.value->>'name',
      (line.value->>'price')::numeric,
      (line.value->>'quantity')::integer,
      (line.value->>'line_total')::numeric,
      NULLIF(line.value->>'image', ''),
      line.value,
      line.value->>'line_type',
      NULLIF(line.value->>'note', '')
    FROM jsonb_array_elements(v_rebuilt) AS line(value);

    SELECT id
      INTO v_attempt_id
      FROM public.payment_attempts
     WHERE order_id = v_order_id
     ORDER BY created_at DESC
     LIMIT 1;

    IF v_attempt_id IS NOT NULL THEN
      INSERT INTO public.payment_events (
        payment_attempt_id,
        event_type,
        payload
      )
      VALUES (
        v_attempt_id,
        'admin_order_lines_replaced',
        jsonb_build_object(
          'order_reference', v_tracking.order_reference,
          'reason', btrim(p_reason),
          'line_count', jsonb_array_length(v_rebuilt),
          'total_amount', v_total
        )
      );
    END IF;
  END IF;

  INSERT INTO public.admin_audit_log (
    actor,
    action,
    target_table,
    target_id,
    before,
    after,
    note
  )
  VALUES (
    COALESCE(auth.uid()::text, 'system'),
    'order.lines.replace',
    'payment_tracking',
    p_tracking_id::text,
    v_before,
    jsonb_build_object(
      'cart_items', v_rebuilt,
      'subtotal', v_subtotal,
      'shipping', v_shipping,
      'tax', v_tax,
      'discount_amount', v_discount,
      'total_amount', v_total
    ),
    btrim(p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'tax', v_tax,
    'discount_amount', v_discount,
    'total_amount', v_total,
    'cart_items', v_rebuilt
  );
END;
$$;

REVOKE ALL ON FUNCTION private.admin_replace_order_lines_impl(uuid, jsonb, text)
  FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_replace_order_lines_impl(uuid, jsonb, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_replace_order_lines(
  p_tracking_id uuid,
  p_lines jsonb,
  p_reason text
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private
AS $$
  SELECT private.admin_replace_order_lines_impl(
    p_tracking_id,
    p_lines,
    p_reason
  );
$$;

REVOKE ALL ON FUNCTION public.admin_replace_order_lines(uuid, jsonb, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_replace_order_lines(uuid, jsonb, text)
  TO authenticated;

COMMIT;
