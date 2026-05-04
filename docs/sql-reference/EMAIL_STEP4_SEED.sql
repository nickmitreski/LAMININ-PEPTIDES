-- ============================================================
-- STEP 4: Seed default templates
-- Run this AFTER Step 3 succeeds
-- ============================================================

INSERT INTO email_templates (name, subject, body_html, body_text)
VALUES (
  'payment_instructions',
  'Laminin - Payment Instructions for Order {{order_reference}}',
  '<p>Payment instructions template - editable from admin dashboard</p>',
  'Payment instructions template - editable from admin dashboard'
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO email_templates (name, subject, body_html, body_text)
VALUES (
  'order_confirmation',
  'Laminin - Order Confirmed {{order_reference}}',
  '<p>Order confirmation template - editable from admin dashboard</p>',
  'Order confirmation template - editable from admin dashboard'
)
ON CONFLICT (name) DO NOTHING;
