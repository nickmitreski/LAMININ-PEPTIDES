# 🔐 Admin System - Quick Reference

## 🚀 Access

**URL:** `/admin/login`

**Auth:** Supabase **Authentication** (email/password). The user must be an admin:

1. **Recommended:** In Supabase SQL Editor, run `supabase/admin_auth_setup.sql` (set the email first), **or** in Dashboard → Authentication → user → **App metadata** add `{ "admin": true }`.
2. **Optional (dev):** `VITE_ADMIN_EMAIL_ALLOWLIST` in `.env.local` (comma-separated emails).

Create the user under **Authentication → Users** (or sign-up flow), then sign in at `/admin/login`.

---

## 📊 Dashboard

### URL: `/admin/dashboard`

**Features:**
- View all orders
- Update order status
- Search by order ID, email, or name
- Filter by status
- Real-time statistics

**Status Options:**
- `pending` → Awaiting payment
- `paid` → Payment received
- `processing` → Being prepared
- `shipped` → In transit
- `delivered` → Completed
- `cancelled` → Cancelled/Refunded

---

## 📦 Products

### URL: `/admin/products`

**Features:**
- View all 27 product mappings
- See CFG codes, peptide names, protein names
- Check active/inactive status
- View pricing

**Note:** Currently view-only. Edit in Supabase dashboard.

---

## 🔑 Adding Admin Users

- Add a user in **Supabase → Authentication**, then set **`admin: true`** in **App metadata** (same as `admin_auth_setup.sql`), **or** add their email to `VITE_ADMIN_EMAIL_ALLOWLIST`.

---

## 🛠️ Supabase Admin Functions

```typescript
// Get all orders
getAllOrders(limit, offset)

// Get orders by status
getOrdersByStatus('pending')

// Update order status
updateOrderStatus('PEP-20260330-AB12', 'shipped')

// Get all products
getAllProductMappings()
```

---

## 🔒 Security

**Current:**
- 24-hour session expiry
- Protected routes
- localStorage sessions

**Production Recommendations:**
- Use Supabase Auth
- Hash passwords
- Add role-based permissions
- Enable audit logging

---

## 🧪 Testing

```bash
# 1. Start dev server
npm run dev

# 2. Visit admin login
http://localhost:5173/admin/login

# 3. Login with default credentials

# 4. Test dashboard features:
- View orders
- Update status
- Search/filter
- View products

# 5. Test logout
```

---

## 📂 Key Files

```
src/
├── context/AdminAuthContext.tsx      # Auth system
├── components/admin/ProtectedRoute.tsx
├── pages/
│   ├── AdminLogin.tsx                # Login page
│   ├── AdminDashboard.tsx            # Main dashboard
│   └── AdminProducts.tsx             # Products view
└── services/supabaseService.ts       # Admin APIs
```

---

## 🚨 Common Issues

**Can't login:**
- Check email/password exact match
- Check browser console for errors

**Orders not loading:**
- Verify Supabase connection
- Check `.env.local` credentials

**Status updates failing:**
- Check Supabase RLS policies
- Check network tab for errors

---

## 📞 Support

**Supabase Dashboard:**
https://ytacbvfcltikxzudlkzn.supabase.co

**Email:**
info@lamininpeplab.com.au

---

## ✅ Pre-Deployment Checklist

- [ ] Change default admin password
- [ ] Add real admin users
- [ ] Test all features
- [ ] Verify Supabase connection
- [ ] Update credentials in Vercel
- [ ] Test on production URL

---

**Last Updated:** March 30, 2026
