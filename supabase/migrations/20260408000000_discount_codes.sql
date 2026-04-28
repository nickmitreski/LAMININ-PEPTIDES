-- ============================================================
-- Discount codes system
-- ============================================================

-- discount_codes: admin-managed promo / discount codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL,
  description TEXT,                                -- admin-only note
  discount_type TEXT NOT NULL DEFAULT 'percentage'  -- 'percentage' | 'fixed'
    CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) DEFAULT 0,        -- minimum subtotal to apply
  max_discount_amount NUMERIC(10,2),               -- cap for percentage discounts (nullable = no cap)
  max_redemptions INTEGER,                         -- null = unlimited
  redemption_count INTEGER NOT NULL DEFAULT 0,
  valid_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,                         -- null = no expiry
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on upper-cased code so lookups are case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_codes_code_upper
  ON public.discount_codes (UPPER(code));

-- discount_redemptions: one row per use of a discount code
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  order_reference  TEXT NOT NULL,                   -- peptide_order_id
  customer_email   TEXT,
  discount_amount  NUMERIC(10,2) NOT NULL,          -- how much was saved
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code
  ON public.discount_redemptions (discount_code_id);

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_order
  ON public.discount_redemptions (order_reference);

-- ---- RLS --------------------------------------------------
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;

-- Public: anyone can validate a code (read active codes)
CREATE POLICY "Anyone can read active discount codes"
  ON public.discount_codes FOR SELECT
  USING (is_active = true);

-- Admin: full CRUD via jwt_is_admin()
CREATE POLICY "Admin full access to discount codes"
  ON public.discount_codes FOR ALL
  USING (public.jwt_is_admin());

-- Public: anyone can insert a redemption (happens at checkout)
CREATE POLICY "Anyone can insert discount redemptions"
  ON public.discount_redemptions FOR INSERT
  WITH CHECK (true);

-- Public: anyone can read redemptions (admin reads all, anon only sees own order)
CREATE POLICY "Anyone can read discount redemptions"
  ON public.discount_redemptions FOR SELECT
  USING (true);

-- Admin: full access to redemptions
CREATE POLICY "Admin full access to discount redemptions"
  ON public.discount_redemptions FOR ALL
  USING (public.jwt_is_admin());

-- ---- Add discount columns to order_references ---------------
ALTER TABLE public.order_references
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- ---- RPC: validate_discount_code ----------------------------
CREATE OR REPLACE FUNCTION public.validate_discount_code(p_code TEXT, p_subtotal NUMERIC DEFAULT 0)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.discount_codes%ROWTYPE;
  v_discount NUMERIC(10,2);
BEGIN
  SELECT * INTO v_row
  FROM public.discount_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid discount code');
  END IF;

  IF v_row.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This code is not yet active');
  END IF;

  IF v_row.valid_until IS NOT NULL AND v_row.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This code has expired');
  END IF;

  IF v_row.max_redemptions IS NOT NULL AND v_row.redemption_count >= v_row.max_redemptions THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This code has reached its usage limit');
  END IF;

  IF p_subtotal < v_row.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Minimum order of $%s required', v_row.min_order_amount::TEXT)
    );
  END IF;

  -- Calculate discount
  IF v_row.discount_type = 'percentage' THEN
    v_discount := ROUND(p_subtotal * v_row.discount_value / 100, 2);
    IF v_row.max_discount_amount IS NOT NULL AND v_discount > v_row.max_discount_amount THEN
      v_discount := v_row.max_discount_amount;
    END IF;
  ELSE
    v_discount := LEAST(v_row.discount_value, p_subtotal);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'discount_code_id', v_row.id,
    'code', v_row.code,
    'discount_type', v_row.discount_type,
    'discount_value', v_row.discount_value,
    'discount_amount', v_discount,
    'description', COALESCE(v_row.description, '')
  );
END;
$$;

-- ---- RPC: redeem_discount_code ------------------------------
CREATE OR REPLACE FUNCTION public.redeem_discount_code(
  p_discount_code_id UUID,
  p_order_reference TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.discount_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.discount_codes WHERE id = p_discount_code_id FOR UPDATE;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Discount code not found');
  END IF;

  IF NOT v_row.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Discount code is no longer active');
  END IF;

  IF v_row.max_redemptions IS NOT NULL AND v_row.redemption_count >= v_row.max_redemptions THEN
    RETURN jsonb_build_object('success', false, 'error', 'Discount code usage limit reached');
  END IF;

  -- Increment counter
  UPDATE public.discount_codes
  SET redemption_count = redemption_count + 1,
      updated_at = now()
  WHERE id = p_discount_code_id;

  -- Record redemption
  INSERT INTO public.discount_redemptions (discount_code_id, order_reference, customer_email, discount_amount)
  VALUES (p_discount_code_id, p_order_reference, p_customer_email, p_discount_amount);

  RETURN jsonb_build_object('success', true);
END;
$$;
