-- Fresh-project prerequisites for backend objects that historically existed
-- only in the live database or docs/sql-reference.
--
-- This migration intentionally runs before the 20260409 security hardening
-- migrations, which add the final admin-only policies and RPC bodies.

BEGIN;

ALTER TABLE public.product_mappings
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS peptide_id text,
  ADD COLUMN IF NOT EXISTS strength text,
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS track_inventory boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_product_mappings_peptide_id
  ON public.product_mappings(peptide_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_stock
  ON public.product_mappings(stock_quantity)
  WHERE track_inventory = true;

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.product_mappings(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  file_name text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary
  ON public.product_images(product_id, is_primary);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_cfg_code text NOT NULL
    REFERENCES public.product_mappings(cfg_code) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  quantity_change integer NOT NULL,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  notes text,
  created_by_email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_cfg_code
  ON public.inventory_transactions(product_cfg_code);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at
  ON public.inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type
  ON public.inventory_transactions(transaction_type);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_name text,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced')),
  resend_id text,
  order_reference text,
  email_type text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient
  ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status
  ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_ref
  ON public.email_logs(order_reference);
CREATE INDEX IF NOT EXISTS idx_email_logs_created
  ON public.email_logs(created_at DESC);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference text,
  recipient_phone text NOT NULL,
  message_type text,
  message_body text,
  provider_message_id text,
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Live project already had sms_logs without order_reference / updated_at.
ALTER TABLE public.sms_logs
  ADD COLUMN IF NOT EXISTS order_reference text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_sms_logs_order_reference
  ON public.sms_logs(order_reference);
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider_message_id
  ON public.sms_logs(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at
  ON public.sms_logs(created_at DESC);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin select sms_logs" ON public.sms_logs;
CREATE POLICY "Admin select sms_logs"
  ON public.sms_logs FOR SELECT
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Service insert sms_logs" ON public.sms_logs;
CREATE POLICY "Service insert sms_logs"
  ON public.sms_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service update sms_logs" ON public.sms_logs;
CREATE POLICY "Service update sms_logs"
  ON public.sms_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMIT;
