-- =====================================================================
-- Customer order-status lookup — 2026-05-17
-- =====================================================================
-- Public, no-auth-needed function that returns a SUMMARY of an order when
-- the caller supplies BOTH the order reference AND the customer email.
--
-- Why a new function (rather than extending get_payment_tracking_by_reference)
--   - The existing function takes only the reference and is used internally
--     by the order-confirmation page (URL has the ref so it's trusted).
--   - The new /order-status page asks the customer to type both fields,
--     which means anyone with the ref alone can't browse other people's
--     orders.
--   - Email comparison is case-insensitive and trimmed.
--
-- Returns
--   - On match:  jsonb { success:true, ... order summary fields ... }
--   - On any miss: jsonb { success:false, error:'Order not found' }
--     (Identical error for "wrong ref" vs "wrong email" — don't leak which.)
--
-- Safety
--   - SECURITY DEFINER so it can read payment_tracking despite admin-only RLS.
--   - `search_path` locked.
--   - Returns only customer-safe fields: status, total, deadline, last update.
--     NEVER returns customer_phone / customer_address / cart_items snapshot
--     (the customer already has these in their email).

BEGIN;

CREATE OR REPLACE FUNCTION public.lookup_order_by_ref_and_email(
  p_order_reference TEXT,
  p_customer_email  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_row RECORD;
  v_ref TEXT := UPPER(trim(COALESCE(p_order_reference, '')));
  v_email TEXT := LOWER(trim(COALESCE(p_customer_email, '')));
BEGIN
  IF v_ref = '' OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Both checks in a single query so the timing doesn't reveal whether
  -- the ref or the email was the miss.
  SELECT id, order_reference, payment_status, total_amount, currency,
         created_at, updated_at, payment_completed_at, payment_viewed_at
    INTO v_row
    FROM public.payment_tracking
   WHERE UPPER(order_reference) = v_ref
     AND LOWER(customer_email) = v_email
   LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_reference', v_row.order_reference,
    'payment_status', v_row.payment_status,
    'total_amount', v_row.total_amount,
    'currency', v_row.currency,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at,
    'payment_viewed_at', v_row.payment_viewed_at,
    'payment_completed_at', v_row.payment_completed_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_order_by_ref_and_email(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_by_ref_and_email(TEXT, TEXT)
  TO anon, authenticated;

COMMIT;
