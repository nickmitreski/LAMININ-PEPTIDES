# Twilio WhatsApp — new order notifications

When a customer completes checkout, you can receive a **WhatsApp** message on your business phone (the number connected to your Twilio WhatsApp sender).

This is implemented inside the existing Supabase Edge Function **`send-order-email`**: after each successful order it optionally sends a WhatsApp message via Twilio to **one** admin recipient (you).

## Prerequisites

1. [Twilio](https://www.twilio.com/) account.
2. WhatsApp enabled on your Twilio number (**Messaging → Try WhatsApp** / approved sender in production).
3. Edge function deployed: `npx supabase functions deploy send-order-email --no-verify-jwt`

## Secrets (Supabase Dashboard → Project → Edge Functions → Secrets)

| Secret | Example | Purpose |
|--------|---------|---------|
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxx` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxx` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+61412345678` | Your Twilio WhatsApp-enabled sender (must include `whatsapp:`) |
| `TWILIO_ORDER_NOTIFY_TO` | `whatsapp:+61487654321` | **Your** phone number that should receive order alerts (must include `whatsapp:` and E.164 after it) |

Existing secrets (`RESEND_*`, `SUPABASE_*`) are unchanged.

### Sandbox vs production

- **Sandbox**: You must join the sandbox from the customer phone; for **your** admin notify number, add it as an approved recipient in Twilio Console or use the Sandbox “join code” flow for that number once.
- **Production**: Use an approved WhatsApp sender and numbers allowed by Twilio/your WABA.

## Message content

You receive a short plain-text message such as:

```
New order LM-XXXXXX
Jane Doe
A$199.00 AUD
Phone: +61 400 000 000
Email: jane@example.com
```

If the customer did not supply an email, `Email: not provided` appears; payment instructions are still created in-app.

## Behaviour

- Notifications are **best-effort**. Checkout still succeeds if WhatsApp fails (errors are logged in the function response JSON as `whatsapp_error`).
- The storefront **always** calls `send-order-email` after a successful order (even when the customer omitted email), so admins still get WhatsApp when configured.
- Customer payment instruction email is still sent via **Resend** only when a valid email address was entered.

## Local testing

With Supabase CLI and secrets set in `.env` for `supabase functions serve`, place a test order locally and watch function logs. Do not commit real tokens.
