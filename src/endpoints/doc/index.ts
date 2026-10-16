export async function handleDoc(): Promise<Response> {
  const docText = `================================================================================
HOUSIKA CLIENT BACKEND API
Version 1.4 | 15 October 2026 | Pure Backend Cloudflare Worker
================================================================================

BASE PATH: /client/api/v1

1. PUBLIC ENDPOINTS (No Auth Required / Optional Bearer)
   GET  /health
   GET  /doc                                      (Plain text documentation)
   GET  /client/api/v1/public/home                (5 units per category, Cache API)
   GET  /client/api/v1/public/search?q=&country=  (Cloudflare AI query extraction)
   GET  /client/api/v1/public/category/:category  (Available units by category)
   GET  /client/api/v1/public/units               (List public available units)
   GET  /client/api/v1/public/units/:id           (Public unit card details)
   GET  /client/api/v1/public/properties/:id      (Public property & available units)
   GET  /client/api/v1/public/receipts/verify     (HMAC signed QR verification DTO)

2. INDIVIDUAL BOOKING FLOW (accountType === 'individual' only)
   POST /client/api/v1/bookings                  Body: { unitId, voucherCode? }
   GET  /client/api/v1/bookings/me               (List caller's bookings)
   GET  /client/api/v1/bookings/me/:id           (Booking detail)
   POST /client/api/v1/bookings/me/:id/cancel    (Cancel pending booking)

3. LANDLORD & COMPANY BOOKING MANAGEMENT
   GET  /client/api/v1/landlord/bookings         (List incoming bookings)
   GET  /client/api/v1/landlord/bookings/:id     (Incoming booking detail)
   POST /client/api/v1/landlord/bookings/:id/approve
   POST /client/api/v1/landlord/bookings/:id/reject

4. PROPERTIES & UNITS (Landlord / Company Staff with permission)
   POST /client/api/v1/properties                (Atomic create property + units + Paystack)
   GET  /client/api/v1/properties                (List owned properties)
   GET  /client/api/v1/properties/:id            (Get owned property)
   PATCH /client/api/v1/properties/:id           (Update property)
   POST /client/api/v1/units                     (Add unit to property)
   GET  /client/api/v1/units                     (List owned units)
   GET  /client/api/v1/units/:id                 (Get owned unit)
   PATCH /client/api/v1/units/:id/status         (Update unit status)

5. PAYMENTS & PAYSTACK WEBHOOK
   POST /client/api/v1/payments/init             (Init Paystack transaction)
   POST /client/api/v1/webhooks/paystack         (HMAC SHA512 signature verified webhook)
   GET  /client/api/v1/payments/verify?reference=(Redirect verification UX)
   GET  /client/api/v1/payments/:id              (Payment detail)

6. RECEIPTS & CHATS
   POST /client/api/v1/receipts                  (Create immutable receipt)
   GET  /client/api/v1/receipts                  (List landlord receipts)
   GET  /client/api/v1/receipts/:id              (Get receipt)
   POST /client/api/v1/chats                     (Create chat on property/unit)
   GET  /client/api/v1/chats                     (List caller's chats)
   GET  /client/api/v1/chats/:id/messages        (Poll messages in chat)
   POST /client/api/v1/chats/:id/messages        (Send message in chat)

7. COMPANY PORTAL (accountType === 'company' only)
   GET  /client/api/v1/company/dashboard         (Dashboard & effective permissions)
   GET  /client/api/v1/company/staff             (List company staff)
   POST /client/api/v1/company/staff             (Create staff: ceo/admin/mgr/cc)
   PATCH /client/api/v1/company/staff/:id/role   (Update staff role)
   POST /client/api/v1/company/staff/:id/suspend (Suspend staff)
   GET  /client/api/v1/company/privileges        (List assigned privileges)
   PUT  /client/api/v1/company/privileges/:staffId (Assign privileges)
   POST /client/api/v1/company/tenants/lookup    (Send OTP to target email)
   POST /client/api/v1/company/tenants/lookup/verify (Verify OTP & get profile)

8. STORAGE
   POST /client/api/v1/storage/presign           (Upload URL & key for media)

9. SCHEDULER (CRON)
   - Every 30 min: Stale unpaid booking cleanup, landlord approval reminders
   - Daily 00:00: 30-day draft property/unit cleanup, file_bin enqueue & purge
`;
  return new Response(docText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
