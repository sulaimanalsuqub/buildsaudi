# 🚀 Production Deployment Checklist - Build Saudi Platform

## Phase 1: Database Setup

### Supabase Configuration
- [ ] Run `supabase/admin-rbac.sql` in Supabase SQL Editor
  - Creates `admin_users` table
  - Sets up RLS policies
  - Registers admin functions
- [ ] Register first admin user:
  ```sql
  SELECT public.register_admin('USER_ID_HERE', 'admin@buildsaudi.com', 'admin');
  ```
  - Replace `USER_ID_HERE` with actual user UUID from auth.users
- [ ] Verify admin_users table is created and indexed
- [ ] Test RBAC with: `SELECT * FROM public.admin_users;`
- [ ] Enable Row Level Security on all tables
- [ ] Create database backups scheduled daily

### Storage Configuration
- [ ] Verify `documents` bucket exists in Supabase Storage
- [ ] Set appropriate RLS policies on storage bucket
- [ ] Configure CORS for file uploads
- [ ] Set up CDN for document delivery (optional)
- [ ] Enable versioning for document bucket (optional)

---

## Phase 2: Email Configuration (Resend)

### Resend Setup
- [ ] Verify Resend API key in environment variables
- [ ] Add production email domain
  - [ ] Verify domain ownership (DNS TXT records)
  - [ ] Configure SPF, DKIM, DMARC records
- [ ] Set sender email address (e.g., notifications@buildsaudi.com)
- [ ] Configure admin email address for notifications
- [ ] Create email templates for:
  - [ ] New quote request
  - [ ] Quote status updates
  - [ ] Vendor registration confirmation
  - [ ] RFQ notifications
  - [ ] Offer sent to client
  - [ ] Client response notifications

### Test Email Delivery
- [ ] Send test emails to all template recipients
- [ ] Verify emails in production inbox (not spam)
- [ ] Test with real domain (not localhost)

---

## Phase 3: Security Hardening

### Authentication & RBAC
- [ ] RBAC system deployed and tested
  - [ ] Admin users can access /admin
  - [ ] Non-admin users redirected to /admin/login
  - [ ] All admin API routes require admin role
- [ ] Session management configured
  - [ ] Session timeout: 24 hours (configurable)
  - [ ] Refresh token rotation enabled
  - [ ] Secure cookie flags enabled

### API Security
- [ ] Rate limiting active on all endpoints
  - [ ] File uploads: 100 req/min per IP
  - [ ] Forms: 20 req/5 min per IP
  - [ ] Admin operations: 50 req/min per user
- [ ] CORS configured properly
  - [ ] Origin whitelist set
  - [ ] Credentials allowed only for same origin
- [ ] Request validation on all inputs
  - [ ] File types validated
  - [ ] File sizes checked
  - [ ] JSON schemas validated
- [ ] SQL injection prevention
  - [ ] All queries use parameterized statements ✓
  - [ ] No raw SQL in client code ✓
- [ ] XSS prevention
  - [ ] Content Security Policy (CSP) headers configured
  - [ ] HTML escaping enabled
  - [ ] React default XSS protection enabled ✓

### Environment Variables
- [ ] All secrets in environment variables (not committed)
  - [ ] SUPABASE_SERVICE_ROLE_KEY (never expose)
  - [ ] RESEND_API_KEY
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] NEXT_PUBLIC_APP_URL
- [ ] Environment variables not logged
- [ ] Production .env.local in .gitignore ✓

---

## Phase 4: Data & Workflow Validation

### Quote Workflow State Machine
- [ ] Test complete flow:
  1. [ ] Customer submits quote request → status: `new`
  2. [ ] Admin approves → status: `admin_approved`
  3. [ ] RFQs sent to vendors → status: `rfq_sent`
  4. [ ] Vendor quotes received → status: `vendor_quotes_received`
  5. [ ] Freight quote received → status: `freight_received`
  6. [ ] Offer sent to client → status: `offer_sent`
  7. [ ] Client approves offer → status: `client_approved`
  8. [ ] Payment pending/confirmed
  9. [ ] In delivery → status: `in_delivery`
  10. [ ] Completed → status: `done`
- [ ] Cannot transition to invalid states
- [ ] Cannot skip states
- [ ] Audit log records all transitions

### Vendor Management
- [ ] Vendor status transitions work:
  - [ ] pending → active (can skip to rejected)
  - [ ] active → paused
  - [ ] paused/rejected → active
- [ ] Inactive vendors filtered from RFQ
- [ ] Vendor emails sent on status change

### Form Validation
- [ ] Quote form validation
  - [ ] Required fields checked
  - [ ] File upload working
  - [ ] Success notification sent
- [ ] Vendor registration form validation
  - [ ] Duplicate email detection
  - [ ] Duplicate CR number detection
  - [ ] Confirmation email sent
- [ ] Admin form validation
  - [ ] Price validation (> 0)
  - [ ] Quantity validation
  - [ ] Delivery date validation

### Audit Logging
- [ ] All critical operations logged in `approvals` table
  - [ ] Quote status changes
  - [ ] Vendor status changes
  - [ ] Quote item additions/deletions
  - [ ] RFQ creation
  - [ ] Vendor quote entry
  - [ ] Freight quote entry
  - [ ] Offer sent
  - [ ] Client response
  - [ ] Quote deletion
- [ ] Audit logs include: actor, action, timestamp, notes
- [ ] Cannot be modified or deleted

---

## Phase 5: Performance & Monitoring

### Performance Optimization
- [ ] Database queries optimized
  - [ ] Indexes created on frequently queried columns
  - [ ] N+1 queries eliminated
  - [ ] Pagination implemented
- [ ] Next.js build optimized
  - [ ] Build succeeds: `npm run build` ✓
  - [ ] No warnings during build
  - [ ] Bundle size < 500KB (main)
- [ ] Image optimization enabled
- [ ] API response times < 1 second (target)

### Monitoring & Logging
- [ ] Error tracking configured (optional: Sentry/Rollbar)
  - [ ] Unhandled errors reported
  - [ ] Error grouping enabled
  - [ ] Alerts configured
- [ ] Application logs available
  - [ ] Structured logging format
  - [ ] Log level configuration
  - [ ] Log retention > 30 days
- [ ] Uptime monitoring configured
  - [ ] Health check endpoint: `/api/health`
  - [ ] Monitoring service pinging regularly
  - [ ] Alert on downtime > 5 minutes

### Analytics (optional)
- [ ] Google Analytics configured
- [ ] Conversion tracking for quote submissions
- [ ] User flow analysis enabled
- [ ] Business metrics dashboard available

---

## Phase 6: Testing

### Automated Tests
- [ ] Unit tests: `npm run test`
- [ ] API integration tests
  - [ ] Quote creation flow
  - [ ] Vendor registration flow
  - [ ] Admin operations
- [ ] Rate limiting tests
- [ ] RBAC tests

### Manual Testing Checklist
- [ ] Customer journey test
  1. [ ] Submit quote request
  2. [ ] Receive confirmation email
  3. [ ] Admin review and approve
  4. [ ] Vendor receives RFQ
  5. [ ] Vendor submits quote
  6. [ ] Admin receives freight quote
  7. [ ] Client receives offer
  8. [ ] Client accepts/rejects

- [ ] Admin workflow test
  1. [ ] Login to admin panel
  2. [ ] View quotes
  3. [ ] Manage vendors
  4. [ ] View audit logs
  5. [ ] Export reports (if available)

- [ ] Security test
  1. [ ] Non-admin user cannot access /admin
  2. [ ] Rate limiting active (test with rapid requests)
  3. [ ] Invalid file types rejected
  4. [ ] Oversized files rejected
  5. [ ] SQL injection attempt blocked
  6. [ ] XSS attempt blocked

- [ ] Email test
  1. [ ] Quote confirmation email received
  2. [ ] Vendor registration email received
  3. [ ] RFQ email received
  4. [ ] Offer email received
  5. [ ] Status update email received

- [ ] Browser compatibility
  - [ ] Chrome/Edge (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Mobile browsers (iOS Safari, Chrome mobile)

---

## Phase 7: Deployment

### Pre-Deployment
- [ ] All code committed and pushed to main
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Performance baseline established
- [ ] Backup of production data taken

### Deployment Steps
- [ ] Deploy to production (Vercel/similar)
  ```bash
  git push origin main  # triggers auto-deploy
  ```
- [ ] Verify deployment successful
- [ ] Check application health
- [ ] Monitor error rates for 1 hour
- [ ] Notify team of deployment

### Post-Deployment
- [ ] Run smoke tests on production
- [ ] Monitor application metrics
- [ ] Check error logs
- [ ] Verify email delivery
- [ ] Test customer workflows
- [ ] Get stakeholder sign-off

---

## Phase 8: Ongoing Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check application uptime
- [ ] Verify email delivery
- [ ] Monitor performance metrics

### Weekly
- [ ] Review audit logs for unusual activity
- [ ] Check database backup completion
- [ ] Review security logs
- [ ] Performance trend analysis

### Monthly
- [ ] Security updates applied
- [ ] Dependencies updated (npm)
- [ ] Database maintenance (optimize tables)
- [ ] Capacity planning review

### Quarterly
- [ ] Penetration testing (optional)
- [ ] Disaster recovery test
- [ ] Security audit
- [ ] Performance optimization review

---

## Critical Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Resend (Email)
RESEND_API_KEY=xxx

# Application
NEXT_PUBLIC_APP_URL=https://buildsaudi.com
ADMIN_EMAIL=admin@buildsaudi.com

# Database (optional)
DATABASE_URL=postgresql://...

# Monitoring (optional)
SENTRY_DSN=xxx
```

---

## Success Criteria

- ✅ All 9 workflow issues fixed and tested
- ✅ RBAC system deployed
- ✅ Rate limiting active
- ✅ Audit logging comprehensive
- ✅ All emails sending correctly
- ✅ Admin panel fully functional
- ✅ No security vulnerabilities
- ✅ Performance meets targets
- ✅ Monitoring alerts configured
- ✅ Team trained on platform

---

## Support & Escalation

- **Critical Issue**: @dev-team on Slack (immediate)
- **Performance Issue**: Post in #performance
- **Feature Request**: Submit to product backlog
- **Bug Report**: Create GitHub issue

---

**Last Updated**: April 2026
**Status**: Ready for Production
**Deployment Date**: [TO BE FILLED]
**Deployed By**: [TO BE FILLED]
