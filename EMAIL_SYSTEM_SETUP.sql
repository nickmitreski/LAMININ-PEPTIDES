-- ============================================================
-- EMAIL MANAGEMENT SYSTEM - Supabase SQL Setup
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Create tables
-- ============================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced')),
  resend_id TEXT,
  order_reference TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- STEP 2: RLS policies
-- ============================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_templates' AND policyname = 'Admin full access to email_templates'
  ) THEN
    CREATE POLICY "Admin full access to email_templates"
      ON email_templates FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'Admin full access to email_logs'
  ) THEN
    CREATE POLICY "Admin full access to email_logs"
      ON email_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- STEP 3: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs (recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_ref ON email_logs (order_reference);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs (created_at DESC);

-- ============================================================
-- STEP 4: RPC functions
-- ============================================================

-- Log an outbound email (called after sending via Resend)
CREATE OR REPLACE FUNCTION log_email_sent(
  p_template_id UUID DEFAULT NULL,
  p_template_name TEXT DEFAULT NULL,
  p_recipient_email TEXT DEFAULT '',
  p_recipient_name TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT '',
  p_body_html TEXT DEFAULT '',
  p_body_text TEXT DEFAULT '',
  p_status TEXT DEFAULT 'sent',
  p_resend_id TEXT DEFAULT NULL,
  p_order_reference TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO email_logs (
    template_id, template_name, recipient_email, recipient_name,
    subject, body_html, body_text, status, resend_id,
    order_reference, error_message, sent_at
  ) VALUES (
    p_template_id, p_template_name, p_recipient_email, p_recipient_name,
    p_subject, p_body_html, p_body_text, p_status, p_resend_id,
    p_order_reference, p_error_message,
    CASE WHEN p_status IN ('sent', 'delivered') THEN now() ELSE NULL END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Update email status (webhook callback from Resend)
CREATE OR REPLACE FUNCTION update_email_status(
  p_resend_id TEXT,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE email_logs
  SET
    status = p_status,
    error_message = COALESCE(p_error_message, error_message),
    sent_at = CASE
      WHEN p_status IN ('sent', 'delivered') AND sent_at IS NULL THEN now()
      ELSE sent_at
    END
  WHERE resend_id = p_resend_id;
END;
$$;

-- Get email template by name
CREATE OR REPLACE FUNCTION get_email_template(p_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subject TEXT,
  body_html TEXT,
  body_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT et.id, et.name, et.subject, et.body_html, et.body_text
  FROM email_templates et
  WHERE et.name = p_name
  LIMIT 1;
END;
$$;

-- ============================================================
-- STEP 5: Seed default templates
-- ============================================================

INSERT INTO email_templates (name, subject, body_html, body_text)
VALUES (
  'payment_instructions',
  'Laminin - Payment Instructions for Order {{order_reference}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1a1a1a;">
    <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">Laminin</h1>
    <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Research Peptides</p>
  </div>
  <div style="padding: 30px 0;">
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 10px;">Payment Instructions</h2>
    <p style="color: #444; font-size: 14px; line-height: 1.6;">Hi {{customer_name}},<br><br>Thank you for your order. Please complete your payment using the details below.</p>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Order Reference</p>
    <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1a1a1a; font-family: monospace;">{{order_reference}}</p>
    <p style="margin: 10px 0 0; font-size: 12px; color: #555;"><strong>Important:</strong> Use this reference when making your payment</p>
  </div>
  <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Amount to Pay</p>
    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1a1a1a;">{{total_amount}}</p>
  </div>
  <div style="margin: 20px 0;">
    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 15px;">Bank Account Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 12px; border: 1px solid #e5e5e5; background: #fafafa; font-size: 12px; color: #666; text-transform: uppercase; width: 140px;">BSB</td><td style="padding: 12px; border: 1px solid #e5e5e5; font-size: 14px; font-weight: 600; font-family: monospace;">{{bsb}}</td></tr>
      <tr><td style="padding: 12px; border: 1px solid #e5e5e5; background: #fafafa; font-size: 12px; color: #666; text-transform: uppercase;">Account Number</td><td style="padding: 12px; border: 1px solid #e5e5e5; font-size: 14px; font-weight: 600; font-family: monospace;">{{account_number}}</td></tr>
      <tr><td style="padding: 12px; border: 1px solid #e5e5e5; background: #fafafa; font-size: 12px; color: #666; text-transform: uppercase;">Account Name</td><td style="padding: 12px; border: 1px solid #e5e5e5; font-size: 14px; font-weight: 600;">{{account_name}}</td></tr>
    </table>
  </div>
  <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991b1b;">Reference Requirement</p>
    <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.5;">When completing payment, include your <strong>invoice reference number only</strong> as the payment reference. No additional information is to be included.</p>
  </div>
  <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1a1a1a;">Processing</p>
    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">Orders are processed once payment has been received and confirmed. We will notify you when your order is being prepared for shipment.</p>
  </div>
  <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999;">Questions? Contact us at <a href="mailto:support@lamininpeptides.com" style="color: #1a1a1a;">support@lamininpeptides.com</a></p>
    <p style="margin: 8px 0 0; font-size: 11px; color: #bbb;">All products are intended for laboratory research use only.</p>
  </div>
</div>',
  'PAYMENT INSTRUCTIONS - Order {{order_reference}}

Hi {{customer_name}},

Thank you for your order. Please complete your payment using the details below.

YOUR ORDER REFERENCE: {{order_reference}}
Important: Use this reference when making your payment

AMOUNT TO PAY: {{total_amount}}

BANK ACCOUNT DETAILS
BSB: {{bsb}}
Account Number: {{account_number}}
Account Name: {{account_name}}

REFERENCE REQUIREMENT
When completing payment, include your invoice reference number only as the payment reference.

PROCESSING
Orders are processed once payment has been received and confirmed.

Questions? Contact us at support@lamininpeptides.com'
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO email_templates (name, subject, body_html, body_text)
VALUES (
  'order_confirmation',
  'Laminin - Order Confirmed {{order_reference}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1a1a1a;">
    <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">Laminin</h1>
    <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Research Peptides</p>
  </div>
  <div style="text-align: center; padding: 30px 0;">
    <h2 style="color: #1a1a1a; font-size: 22px; margin: 15px 0 5px;">Payment Received!</h2>
    <p style="color: #666; font-size: 14px; margin: 0;">Your order is being processed</p>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase;">Order Reference</p>
    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1a1a1a; font-family: monospace;">{{order_reference}}</p>
  </div>
  <div style="padding: 20px 0;">
    <p style="color: #444; font-size: 14px; line-height: 1.6;">Hi {{customer_name}},<br><br>We have received your payment and your order is now being prepared for shipment. You will receive a tracking notification once your order has been dispatched.</p>
  </div>
  <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999;">Questions? Contact us at <a href="mailto:support@lamininpeptides.com" style="color: #1a1a1a;">support@lamininpeptides.com</a></p>
  </div>
</div>',
  'ORDER CONFIRMED - {{order_reference}}

Hi {{customer_name}},

We have received your payment and your order is now being prepared for shipment.
You will receive a tracking notification once your order has been dispatched.

Order Reference: {{order_reference}}

Questions? Contact us at support@lamininpeptides.com'
)
ON CONFLICT (name) DO NOTHING;
