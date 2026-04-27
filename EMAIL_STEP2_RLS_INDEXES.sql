-- ============================================================
-- STEP 2: RLS policies and indexes
-- Run this AFTER Step 1 succeeds
-- ============================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to email_templates"
  ON email_templates FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to email_logs"
  ON email_logs FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_email_logs_recipient ON email_logs (recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs (status);
CREATE INDEX idx_email_logs_order_ref ON email_logs (order_reference);
CREATE INDEX idx_email_logs_created ON email_logs (created_at DESC);
