// Apps Script Web App URL (Products sheet API), backing both Collections
// and the shop.
export const API_URL =
  "https://script.google.com/macros/s/AKfycbxYKT-EicYDi3knVTj-DFavxscdeoZA1apaLkhzSIy-_SP-z2gLDin0-ntkvtnCWEwDlw/exec";

export const ADMIN_SESSION_KEY = "santy_admin_key";

// Username/password checked client-side in AdminPage's LoginGate.
export const ADMIN_USERNAME = "santystitches";
export const ADMIN_PASSWORD = "alphawolf";

// Sent as `token` on every admin* API call — the Apps Script side (code.gs)
// must check this value and reject requests where it doesn't match.
export const ADMIN_TOKEN = "santy-2026-k7pXm2Qw9vLzR4tB8nJe";

// Paystack PUBLIC key — safe to ship client-side, this is what Paystack's
// inline popup uses to initialize a checkout. Currently a TEST key; swap
// for the pk_live_... key when going live.
// The matching SECRET key must NEVER go here — it lives only in the Apps
// Script project's Script Properties (PAYSTACK_SECRET_KEY), where Code.gs
// uses it server-side to verify payments before marking any order paid.
export const PAYSTACK_PUBLIC_KEY = "pk_test_35f573678c8764017e4052d2f7ff3b762d35ecc7";
