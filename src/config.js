// Apps Script Web App URL (Products sheet API), backing both Collections
// and the shop.
export const API_URL =
  "https://script.google.com/macros/s/AKfycbxYKT-EicYDi3knVTj-DFavxscdeoZA1apaLkhzSIy-_SP-z2gLDin0-ntkvtnCWEwDlw/exec";

export const ADMIN_SESSION_KEY = "santy_admin_key";

// Password checked client-side in AdminPage's LoginGate.
export const ADMIN_PASSWORD = "password";

// Sent as `token` on every admin* API call — the Apps Script side (code.gs)
// must check this value and reject requests where it doesn't match.
export const ADMIN_TOKEN = "santy-2026-k7pXm2Qw9vLzR4tB8nJe";
