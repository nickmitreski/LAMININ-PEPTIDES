-- ============================================================
-- STEP 3: RPC functions
-- Run this AFTER Step 2 succeeds
-- ============================================================

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
