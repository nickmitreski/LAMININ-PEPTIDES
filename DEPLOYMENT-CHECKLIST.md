# 🚀 DEPLOYMENT CHECKLIST - Laminin Peptide Lab

Complete checklist for deploying your e-commerce platform to production.

---

## ✅ PRE-DEPLOYMENT CHECKS

### 1. Supabase Setup
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Verify tables created: `customers`, `order_references`, `product_mappings`
- [ ] Check seed data: 27 product mappings inserted
- [ ] Test database connection locally

### 2. Environment Variables (Local)
- [ ] Copy `.env.local.template` to `.env.local`
- [ ] Add Supabase URL: `https://ytacbvfcltikxzudlkzn.supabase.co`
- [ ] Add Supabase Anon Key: `sb_publishable_jRLtLGh7uslmqubJ_qQY7w_ogbknh7D`
- [ ] (Optional) Add protein store URL
- [ ] Test checkout flow locally

### 3. Code Quality
- [ ] `npm run typecheck` - No TypeScript errors
- [ ] `npm run lint` - Only minor warnings (acceptable)
- [ ] `npm run build` - Build succeeds
- [ ] All images optimized (or plan to optimize post-launch)

### 4. Testing
- [ ] Test product browsing
- [ ] Test cart add/remove
- [ ] Test checkout form validation
- [ ] Test order creation (check Supabase dashboard)
- [ ] Test order confirmation page
- [ ] Test mobile responsiveness

---

## 🌐 VERCEL DEPLOYMENT

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: Complete Supabase integration and production setup"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Import Project:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Framework Preset: **Vite**
   - Root Directory: `.` (default)

2. **Add Environment Variables:**
   ```env
   VITE_SUPABASE_URL=https://ytacbvfcltikxzudlkzn.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_jRLtLGh7uslmqubJ_qQY7w_ogbknh7D
   VITE_APP_URL=https://your-domain.vercel.app
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - ✅ Your site is live!

### Step 3: Configure Custom Domain (Optional)

1. Vercel Dashboard > Settings > Domains
2. Add: `laminincollective.com`
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (automatic)
5. Update `VITE_APP_URL` to your custom domain

---

## 📊 POST-DEPLOYMENT VERIFICATION

### Test Production Site:

1. **Homepage:**
   - [ ] All images load
   - [ ] Navigation works
   - [ ] Featured products display

2. **Library Page:**
   - [ ] All 27 products display
   - [ ] Category filters work
   - [ ] Search functionality works

3. **Product Pages:**
   - [ ] Product details load
   - [ ] Add to cart works
   - [ ] Structured data present (view source)

4. **Cart:**
   - [ ] Items display correctly
   - [ ] Quantity updates work
   - [ ] Total calculation correct

5. **Checkout:**
   - [ ] Form validation works
   - [ ] Supabase connection works
   - [ ] Order created in database
   - [ ] Redirect to confirmation

6. **Order Confirmation:**
   - [ ] Order details display
   - [ ] Status shows correctly
   - [ ] Support links work

---

## 🔍 SEO VERIFICATION

### Google Search Console:

1. **Submit Sitemap:**
   - Add property: `https://laminincollective.com`
   - Submit sitemap: `https://laminincollective.com/sitemap.xml`

2. **Verify robots.txt:**
   - Check: `https://laminincollective.com/robots.txt`

3. **Test Rich Results:**
   - Use: https://search.google.com/test/rich-results
   - Test a product page URL
   - Should show: ✅ Product schema detected

### Performance Audit:

```bash
# Run Lighthouse
npx lighthouse https://laminincollective.com --view
```

**Target Scores:**
- Performance: 80+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+

---

## 📈 MONITORING SETUP

### 1. Supabase Monitoring

- **Dashboard:** https://ytacbvfcltikxzudlkzn.supabase.co
- Monitor:
  - [ ] Database size (should be < 500MB on free tier)
  - [ ] API requests (< 500k/month on free tier)
  - [ ] Storage used

### 2. Vercel Analytics

- **Dashboard:** https://vercel.com/your-project/analytics
- Monitor:
  - [ ] Page views
  - [ ] Load times
  - [ ] Error rates

### 3. Order Tracking

- **Check daily:**
  ```sql
  SELECT COUNT(*) as total_orders, status
  FROM order_references
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY status;
  ```

---

## 🔒 SECURITY CHECKLIST

- [x] No credentials in git history
- [x] `.env.local` in `.gitignore`
- [x] Environment variables in Vercel only
- [x] Supabase RLS policies enabled
- [ ] Rate limiting configured (TODO if needed)
- [ ] CAPTCHA on contact form (TODO if needed)

---

## 📧 OPTIONAL: EMAIL NOTIFICATIONS

### Resend Setup (Recommended):

1. **Sign up:** https://resend.com
2. **Add domain:** `laminincollective.com`
3. **Verify DNS** records
4. **Get API key**

### Create Vercel Edge Function:

```typescript
// api/send-order-confirmation.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { order_id, customer_email } = await request.json();

  await resend.emails.send({
    from: 'info@lamininpeptab.com.au',
    to: customer_email,
    subject: `Order Confirmation - ${order_id}`,
    html: `<p>Thank you for your order!</p>`
  });

  return new Response('OK');
}
```

---

## 🎯 PARTNER STORE INTEGRATION

### If using a partner protein store:

1. **Provide partner with:**
   - Webhook endpoint (create later)
   - API documentation (`SUPABASE-SETUP.md` > Partner Store Integration)
   - Test credentials

2. **Partner implements:**
   - POST `/api/peptide-bridge/checkout` endpoint
   - Checkout page for redirected customers
   - Webhook to update order status

3. **Add to Vercel:**
   ```env
   VITE_PROTEIN_STORE_URL=https://partner-store.com
   VITE_PROTEIN_STORE_API_KEY=provided_by_partner
   ```

---

## 🐛 COMMON DEPLOYMENT ISSUES

### Issue: "Module not found"
**Fix:** Clear Vercel cache and redeploy

### Issue: Environment variables not working
**Fix:** Must start with `VITE_` for Vite apps

### Issue: Supabase connection failed
**Fix:** Check URL and key are correct, no trailing slashes

### Issue: Images not loading
**Fix:** Ensure images are in `public/` folder

### Issue: 404 on refresh
**Fix:** Vercel routing configured (already done in `vercel.json`)

---

## 📊 SUCCESS METRICS

After 1 week, check:

- [ ] Orders created successfully
- [ ] No JavaScript errors in console
- [ ] Performance score > 80
- [ ] Mobile traffic working
- [ ] All product pages indexed by Google

---

## 🎉 LAUNCH CHECKLIST

**Final Steps Before Launch:**

1. [ ] All environment variables added to Vercel
2. [ ] Supabase schema executed successfully
3. [ ] Test order completed on production
4. [ ] Custom domain configured (if applicable)
5. [ ] Analytics tracking enabled
6. [ ] Sitemap submitted to Google
7. [ ] Social media accounts updated with URL
8. [ ] Announcement email prepared

**READY TO LAUNCH? 🚀**

```bash
# Final build test
npm run build

# Deploy
git push origin main

# Verify
open https://laminincollective.com
```

---

## 📞 SUPPORT CONTACTS

- **Vercel Support:** support@vercel.com
- **Supabase Support:** https://supabase.com/dashboard/support
- **Domain Registrar:** (your provider)
- **Development Team:** (your team contact)

---

**Last Updated:** March 30, 2026
**Status:** ✅ Ready for Production
