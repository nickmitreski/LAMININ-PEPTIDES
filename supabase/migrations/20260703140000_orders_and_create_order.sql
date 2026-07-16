-- Normalized order tables + create_order RPC (legacy payment_tracking kept in sync)

BEGIN;

-- -----------------------------------------------------------------------
-- orders / order_items / payment_attempts / payment_events
-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference     text NOT NULL UNIQUE,
  payment_tracking_id uuid REFERENCES public.payment_tracking(id) ON DELETE SET NULL,
  customer_email      text NOT NULL,
  customer_name       text NOT NULL,
  customer_phone      text,
  customer_address    jsonb,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN (
                          'pending',
                          'viewed_instructions',
                          'payment_received',
                          'processing',
                          'shipped',
                          'delivered',
                          'cancelled'
                        )),
  subtotal            numeric(10,2) NOT NULL DEFAULT 0,
  shipping            numeric(10,2) NOT NULL DEFAULT 0,
  tax                 numeric(10,2) NOT NULL DEFAULT 0,
  discount_code       text,
  discount_amount     numeric(10,2) NOT NULL DEFAULT 0,
  total_amount        numeric(10,2) NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'AUD',
  idempotency_key     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
  ON public.orders(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders(created_at DESC);

CREATE TABLE IF NOT EXISTS public.order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cfg_code      text,
  product_name  text NOT NULL,
  unit_price    numeric(10,2) NOT NULL DEFAULT 0,
  quantity      integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total    numeric(10,2) NOT NULL DEFAULT 0,
  image_url     text,
  snapshot      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider    text NOT NULL DEFAULT 'bank_transfer',
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'viewed', 'completed', 'failed', 'cancelled')),
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'AUD',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id
  ON public.payment_attempts(order_id);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_attempt_id  uuid NOT NULL REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  event_type          text NOT NULL,
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_attempt_id
  ON public.payment_events(payment_attempt_id, created_at DESC);

-- -----------------------------------------------------------------------
-- RLS — admin read only; writes go through SECURITY DEFINER RPCs / service role
-- -----------------------------------------------------------------------

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read orders" ON public.orders;
CREATE POLICY "Admins can read orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admins can read order_items" ON public.order_items;
CREATE POLICY "Admins can read order_items"
  ON public.order_items FOR SELECT TO authenticated
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admins can read payment_attempts" ON public.payment_attempts;
CREATE POLICY "Admins can read payment_attempts"
  ON public.payment_attempts FOR SELECT TO authenticated
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admins can read payment_events" ON public.payment_events;
CREATE POLICY "Admins can read payment_events"
  ON public.payment_events FOR SELECT TO authenticated
  USING (public.jwt_is_admin());

-- -----------------------------------------------------------------------
-- create_order — server-authoritative checkout (wraps upsert_payment_tracking)
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order(
  p_order_reference TEXT,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_address JSONB DEFAULT NULL,
  p_cart_items JSONB DEFAULT '[]',
  p_subtotal NUMERIC DEFAULT 0,
  p_shipping NUMERIC DEFAULT 0,
  p_tax NUMERIC DEFAULT 0,
  p_total_amount NUMERIC DEFAULT 0,
  p_currency TEXT DEFAULT 'AUD',
  p_discount_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_upsert JSONB;
  v_tracking_id UUID;
  v_order_id UUID;
  v_attempt_id UUID;
  v_pt RECORD;
  v_item JSONB;
  v_cfg TEXT;
  v_qty INTEGER;
  v_price NUMERIC;
  v_line NUMERIC;
  v_name TEXT;
  v_image TEXT;
BEGIN
  IF p_order_reference IS NULL OR length(trim(p_order_reference)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_reference required');
  END IF;

  -- Idempotent replay: return existing normalized order if key seen
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT id INTO v_order_id
      FROM public.orders
     WHERE idempotency_key = p_idempotency_key
     LIMIT 1;
    IF v_order_id IS NOT NULL THEN
      SELECT pt.id, pt.order_reference, pt.total_amount
        INTO v_pt
        FROM public.orders o
        JOIN public.payment_tracking pt ON pt.id = o.payment_tracking_id
       WHERE o.id = v_order_id;
      RETURN jsonb_build_object(
        'success', true,
        'replay', true,
        'order_id', v_order_id,
        'tracking_id', v_pt.id,
        'order_reference', v_pt.order_reference,
        'server_total', v_pt.total_amount
      );
    END IF;
  END IF;

  v_upsert := public.upsert_payment_tracking(
    p_order_reference,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_customer_address,
    p_cart_items,
    p_subtotal,
    p_shipping,
    p_tax,
    p_total_amount,
    p_currency,
    p_discount_code,
    p_discount_amount,
    p_idempotency_key
  );

  IF COALESCE((v_upsert->>'success')::boolean, false) IS NOT TRUE THEN
    RETURN v_upsert;
  END IF;

  v_tracking_id := (v_upsert->>'tracking_id')::uuid;

  SELECT * INTO v_pt FROM public.payment_tracking WHERE id = v_tracking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'payment_tracking row missing after upsert');
  END IF;

  SELECT id INTO v_order_id FROM public.orders WHERE order_reference = p_order_reference;

  IF v_order_id IS NULL THEN
    INSERT INTO public.orders (
      order_reference, payment_tracking_id, customer_email, customer_name,
      customer_phone, customer_address, status, subtotal, shipping, tax,
      discount_code, discount_amount, total_amount, currency, idempotency_key
    ) VALUES (
      v_pt.order_reference, v_pt.id, v_pt.customer_email, v_pt.customer_name,
      v_pt.customer_phone, v_pt.customer_address, v_pt.payment_status,
      v_pt.subtotal, v_pt.shipping, v_pt.tax,
      v_pt.discount_code, COALESCE(v_pt.discount_amount, 0),
      v_pt.total_amount, v_pt.currency,
      NULLIF(trim(COALESCE(p_idempotency_key, '')), '')
    )
    RETURNING id INTO v_order_id;

    IF v_pt.cart_items IS NOT NULL AND jsonb_typeof(v_pt.cart_items) = 'array' THEN
      FOR v_item IN SELECT value FROM jsonb_array_elements(v_pt.cart_items)
      LOOP
        v_cfg := NULLIF(trim(COALESCE(v_item->>'id', '')), '');
        v_name := COALESCE(NULLIF(trim(v_item->>'name'), ''), v_cfg, 'Item');
        v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::integer, 1));
        v_price := COALESCE((v_item->>'price')::numeric, 0);
        v_line := v_price * v_qty;
        v_image := NULLIF(trim(COALESCE(v_item->>'image', '')), '');

        INSERT INTO public.order_items (
          order_id, cfg_code, product_name, unit_price, quantity, line_total, image_url, snapshot
        ) VALUES (
          v_order_id, v_cfg, v_name, v_price, v_qty, v_line, v_image, v_item
        );
      END LOOP;
    END IF;

    INSERT INTO public.payment_attempts (order_id, provider, status, amount, currency)
    VALUES (v_order_id, 'bank_transfer', 'pending', v_pt.total_amount, v_pt.currency)
    RETURNING id INTO v_attempt_id;

    INSERT INTO public.payment_events (payment_attempt_id, event_type, payload)
    VALUES (
      v_attempt_id,
      'order_created',
      jsonb_build_object(
        'order_reference', v_pt.order_reference,
        'source', 'create_order',
        'tamper_detected', COALESCE((v_upsert->>'tamper_detected')::boolean, false)
      )
    );
  END IF;

  RETURN v_upsert || jsonb_build_object(
    'order_id', v_order_id,
    'order_reference', p_order_reference
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, text, text, numeric, text
) FROM PUBLIC;

COMMIT;
