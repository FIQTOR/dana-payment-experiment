/**
 * Generates the README screenshot SVGs.
 *
 * Uses a REAL, scannable QR code (via the `qrcode` package) and the official
 * DANA brand logo. Run from `backend/`:
 *
 *   node tools/buildScreenshots.js
 *
 * Output: ../docs/screenshots/*.svg
 */
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../docs/screenshots');

// ----------------------------------------------------------------- QR code ---
const QRIS =
  '00020101021226610014ID.CO.QRIS.WWW01189360000900000000000215ID10216000000000000005204581453033605802ID5910DANA STORE6007JAKARTA6304ABCD';

const qr = QRCode.create(QRIS, { errorCorrectionLevel: 'M' });
const qSize = qr.modules.size;
const qData = qr.modules.data;
const quiet = 2;
const qVb = qSize + quiet * 2;

const qrRects = [];
for (let y = 0; y < qSize; y++) {
  for (let x = 0; x < qSize; x++) {
    if (qData[y * qSize + x]) {
      qrRects.push(`<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>`);
    }
  }
}
const QR_PATHS = qrRects.join('');
const QR_VB = qVb;

// ------------------------------------------------------------- DANA logo ---
// Official DANA logo paths (viewBox 0 0 382 109.22). Colour: #008ceb.
const DANA_LOGO_PATHS = '<path fill="#008ceb" fill-rule="evenodd" d="M151,82.84c7.26.52,15.72-5.12,18.7-8.34,10.36-11.21,10.61-27.42.18-39.16-3.88-4.37-13-9.2-18.77-8.52H130.22V82.77l20.83.07ZM142,70.72V38.87a75,75,0,0,1,9.82,0,15.22,15.22,0,0,1,7.13,2.76c12,8.2,7,27.75-7.33,29.06A71.77,71.77,0,0,1,142,70.72Z"/><path fill="#008ceb" fill-rule="evenodd" d="M334.39,82.94H346.3V70.88h23.63l.07,12h11.91V63c0-6,.5-13.48-1-18.91a23.62,23.62,0,0,0-45.49-.25c-1.6,5.36-1.06,13.05-1.06,19,0,6.72-.07,13.48,0,20.2Zm11.92-24.19c-.07-5-.6-10.35,1.75-14.2a11.61,11.61,0,0,1,10.15-5.77,11.79,11.79,0,0,1,10.08,5.82c2.32,4,1.77,9,1.71,14.16Z"/><path fill="#008ceb" fill-rule="evenodd" d="M198.19,82.93h11.87c0-2.52-.32-10.23.11-12.06h23.54l.08,12.05h11.89c-.06-6.68,0-13.35,0-20,0-5.7.53-13.86-1-18.92a23.63,23.63,0,0,0-45.49-.23c-1.59,5.2-1.05,13.15-1.05,18.94,0,6.68-.15,13.53,0,20.19Zm11.88-24.18c-.08-5-.59-10.42,1.76-14.19a11.71,11.71,0,0,1,20.23,0c2.33,4,1.77,9.08,1.73,14.17Z"/><path fill="#008ceb" fill-rule="evenodd" d="M266.57,48.67,266.4,57c0,7-.34,20.07,0,25.76h11.64c.27-4-.42-32.41.31-33.32,0-5.52,5.77-10.66,11.59-10.68A11.62,11.62,0,0,1,298.06,42c1.48,1.35,3.75,4.43,3.71,7.54.54.31.11,30,.28,33.29H313.7l-.09-33.95c.29-2.66-1.31-6.77-2.34-8.85A23.56,23.56,0,0,0,269,39.67C268,41.72,266.32,45.94,266.57,48.67Z"/><circle fill="#008ceb" cx="54.61" cy="54.61" r="54.61"/><path fill="#fefefe" d="M86.43,54.84V70.21c0,1-.43,1.21-1.27.72a28.08,28.08,0,0,0-3.5-1.78,23.73,23.73,0,0,0-11.49-1.53,55.06,55.06,0,0,0-12.44,3.12c-4,1.35-7.92,2.81-12,3.94a33.41,33.41,0,0,1-10.42,1.37,22.12,22.12,0,0,1-11-3.43A2.71,2.71,0,0,1,23,70.2Q23,55.1,23,40c0-.49,0-1.07.44-1.32s.89.16,1.27.41a21,21,0,0,0,12.15,3.6A32.4,32.4,0,0,0,45.94,41c4.16-1.29,8.18-3,12.27-4.45a74.14,74.14,0,0,1,9.77-3,21.21,21.21,0,0,1,16.73,3.09,3.67,3.67,0,0,1,1.75,3.27c0,5,0,10,0,15Z"/>';

/** Inline DANA logo scaled into a width×height box at (x,y). */
function danaLogo(x, y, width, { color = '#008ceb' } = {}) {
  const scale = width / 382;
  const height = 109.22 * scale;
  return (
    `<g transform="translate(${x},${y}) scale(${scale})" >` +
    DANA_LOGO_PATHS.replace(/#008ceb/g, color) +
    `</g><!-- h=${height.toFixed(1)} -->`
  );
}

/** Inline QR code scaled into a size×size box at (x,y). */
function qrCode(x, y, size, { color = '#0f172a' } = {}) {
  const scale = size / QR_VB;
  return (
    `<g transform="translate(${x},${y}) scale(${scale})">` +
    `<rect width="${QR_VB}" height="${QR_VB}" fill="#ffffff"/>` +
    `<g fill="${color}">${QR_PATHS}</g>` +
    `</g>`
  );
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --------------------------------------------------------------- chrome ---
function appShell({ active, title, subtitle, badge, body }) {
  const nav = [
    ['dashboard', 'Dashboard'],
    ['create', 'Create Payment'],
    ['transactions', 'Transactions'],
    ['webhook', 'Webhook Tester'],
  ];
  let navSvg = '';
  let ny = 118;
  for (const [id, label] of nav) {
    const on = id === active;
    if (on) {
      navSvg += `<rect x="16" y="${ny - 24}" width="224" height="42" rx="12" fill="#eef4ff" stroke="#bcd0ff"/>`;
    }
    navSvg += `<circle cx="40" cy="${ny - 3}" r="${on ? 4 : 3}" fill="${on ? '#118eea' : '#cbd5e1'}"/>`;
    navSvg += `<text x="58" y="${ny + 2}" font-size="14" fill="${on ? '#0957a8' : '#475569'}" font-weight="${on ? 600 : 400}">${label}</text>`;
    ny += 48;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" font-family="Inter, -apple-system, 'Segoe UI', sans-serif">
  <rect width="1440" height="900" fill="#f8fafc"/>
  <!-- sidebar -->
  <rect x="0" y="0" width="256" height="900" fill="#ffffff"/>
  <line x1="256" y1="0" x2="256" y2="900" stroke="#e2e8f0"/>
  ${danaLogo(24, 26, 96)}
  <text x="24" y="86" font-size="11" fill="#94a3b8" font-weight="600" letter-spacing="1">EXPERIMENT LAB</text>
  ${navSvg}
  <rect x="16" y="820" width="224" height="44" rx="12" fill="#f8fafc"/>
  <circle cx="40" cy="842" r="4" fill="#10b981"/>
  <text x="58" y="847" font-size="12" fill="#475569" font-weight="600">Live stream connected</text>

  <!-- topbar -->
  <rect x="256" y="0" width="1184" height="66" fill="#ffffff"/>
  <line x1="256" y1="66" x2="1440" y2="66" stroke="#e2e8f0"/>
  <text x="288" y="34" font-size="18" fill="#0f172a" font-weight="700">${esc(title)}</text>
  <text x="288" y="52" font-size="12" fill="#64748b">${esc(subtitle)}</text>
  <rect x="1156" y="18" width="96" height="32" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="1204" y="38" font-size="13" fill="#475569" text-anchor="middle">↻ Refresh</text>
  <rect x="1264" y="18" width="80" height="32" rx="10" fill="#118eea"/>
  <text x="1304" y="38" font-size="13" fill="#fff" text-anchor="middle" font-weight="600">+ New</text>
  <rect x="1008" y="18" width="132" height="32" rx="16" fill="#ecfdf5" stroke="#a7f3d0"/>
  <text x="1074" y="38" font-size="12" fill="#047857" text-anchor="middle" font-weight="600">✓ ${esc(badge)}</text>

  ${body}
</svg>`;
}

// ------------------------------------------------------ 1. Dashboard ---
function dashboard() {
  const stat = (x, tint, icon, label, value) => `
    <rect x="${x}" y="94" width="268" height="84" rx="16" fill="#fff" stroke="#e2e8f0"/>
    <rect x="${x + 16}" y="110" width="44" height="44" rx="12" fill="${tint}"/>
    <text x="${x + 38}" y="138" font-size="19" text-anchor="middle">${icon}</text>
    <text x="${x + 76}" y="126" font-size="12" fill="#64748b">${label}</text>
    <text x="${x + 76}" y="150" font-size="20" fill="#0f172a" font-weight="700">${value}</text>`;

  const row = (y, title, sub, amount, payer, status, cls) => `
    <rect x="304" y="${y + 16}" width="40" height="40" rx="12" fill="#f1f5f9"/>
    <text x="324" y="${y + 42}" font-size="15" text-anchor="middle">▦</text>
    <text x="360" y="${y + 34}" font-size="13" fill="#1e293b" font-weight="600">${title}</text>
    <text x="360" y="${y + 52}" font-size="11" fill="#94a3b8">${sub}</text>
    <text x="820" y="${y + 34}" font-size="13" fill="#0f172a" font-weight="700" text-anchor="end">${amount}</text>
    <text x="820" y="${y + 52}" font-size="11" fill="#94a3b8" text-anchor="end">${payer}</text>
    <rect x="860" y="${y + 28}" width="104" height="24" rx="12" fill="${cls.bg}" stroke="${cls.border}"/>
    <text x="912" y="${y + 44}" font-size="11" fill="${cls.fg}" text-anchor="middle" font-weight="600">${status}</text>`;

  const g = (bg, border, fg) => ({ bg, border, fg });

  const body = `
  ${stat(288, '#eef4ff', '💳', 'Total Transactions', '12')}
  ${stat(572, '#ecfdf5', '✅', 'Successful', '9')}
  ${stat(856, '#fffbeb', '⏱', 'Pending', '2')}
  ${stat(1140, '#f5f3ff', '🪙', 'Collected', 'Rp 1.240.000')}

  <!-- transactions -->
  <rect x="288" y="202" width="700" height="600" rx="16" fill="#fff" stroke="#e2e8f0"/>
  <text x="312" y="236" font-size="14" fill="#1e293b" font-weight="700">Transactions</text>
  <rect x="428" y="222" width="30" height="18" rx="9" fill="#f1f5f9"/>
  <text x="443" y="235" font-size="11" fill="#64748b" text-anchor="middle">12</text>
  <rect x="676" y="220" width="46" height="22" rx="8" fill="#0f172a"/><text x="699" y="235" font-size="11" fill="#fff" text-anchor="middle">all</text>
  <rect x="726" y="220" width="70" height="22" rx="8" fill="#f1f5f9"/><text x="761" y="235" font-size="11" fill="#475569" text-anchor="middle">pending</text>
  <rect x="800" y="220" width="72" height="22" rx="8" fill="#f1f5f9"/><text x="836" y="235" font-size="11" fill="#475569" text-anchor="middle">success</text>
  <rect x="876" y="220" width="88" height="22" rx="8" fill="#f1f5f9"/><text x="920" y="235" font-size="11" fill="#475569" text-anchor="middle">refunded</text>
  <line x1="288" y1="256" x2="988" y2="256" stroke="#f1f5f9"/>
  ${row(268, 'Kopi Susu Gula Aren x2', 'PRN-...-KSCUM · 12 Oct, 22:10', 'Rp 25.000', '0812•••789', '✓ Success', g('#ecfdf5', '#a7f3d0', '#047857'))}
  <line x1="304" y1="344" x2="972" y2="344" stroke="#f1f5f9"/>
  ${row(348, 'Nasi Goreng Spesial', 'PRN-...-LD3PSJ · 12 Oct, 22:05', 'Rp 50.000', '—', '⏱ Pending', g('#fffbeb', '#fde68a', '#b45309'))}
  <line x1="304" y1="424" x2="972" y2="424" stroke="#f1f5f9"/>
  ${row(428, 'Es Teh Manis', 'PRN-...-SU90PU · 12 Oct, 21:58', 'Rp 12.000', '—', '⊘ Cancelled', g('#f1f5f9', '#e2e8f0', '#475569'))}
  <line x1="304" y1="504" x2="972" y2="504" stroke="#f1f5f9"/>
  ${row(508, 'Ayam Bakar Paket 1', 'PRN-...-FMDHUT · 12 Oct, 21:40', 'Rp 65.000', '0813•••221', '↩ Refunded', g('#f5f3ff', '#ddd6fe', '#6d28d9'))}
  <line x1="304" y1="584" x2="972" y2="584" stroke="#f1f5f9"/>
  ${row(588, 'Pembayaran pesanan', 'PRN-...-PTNC-S · 12 Oct, 21:12', 'Rp 99.000', '0812•••010', '✕ Failed', g('#fff1f2', '#fecdd3', '#be123c'))}

  <!-- create form -->
  <rect x="1004" y="202" width="404" height="600" rx="16" fill="#fff" stroke="#e2e8f0"/>
  <text x="1028" y="240" font-size="14" fill="#1e293b" font-weight="700">Create Payment</text>
  <text x="1028" y="270" font-size="12" fill="#64748b">Amount (IDR)</text>
  <rect x="1028" y="280" width="356" height="42" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="1044" y="306" font-size="14" fill="#0f172a" font-weight="600">Rp  25.000</text>
  <rect x="1028" y="332" width="70" height="24" rx="8" fill="#f1f5f9"/><text x="1063" y="348" font-size="11" fill="#475569" text-anchor="middle">Rp 10rb</text>
  <rect x="1104" y="332" width="70" height="24" rx="8" fill="#118eea"/><text x="1139" y="348" font-size="11" fill="#fff" text-anchor="middle">Rp 25rb</text>
  <rect x="1180" y="332" width="70" height="24" rx="8" fill="#f1f5f9"/><text x="1215" y="348" font-size="11" fill="#475569" text-anchor="middle">Rp 50rb</text>
  <rect x="1256" y="332" width="70" height="24" rx="8" fill="#f1f5f9"/><text x="1291" y="348" font-size="11" fill="#475569" text-anchor="middle">Rp 100rb</text>
  <text x="1028" y="392" font-size="12" fill="#64748b">Description</text>
  <rect x="1028" y="402" width="356" height="42" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="1044" y="428" font-size="13" fill="#0f172a">Pembayaran pesanan</text>
  <text x="1028" y="474" font-size="12" fill="#64748b">Valid for (minutes)</text>
  <rect x="1028" y="484" width="356" height="42" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="1044" y="510" font-size="13" fill="#0f172a">30</text>
  <rect x="1028" y="546" width="356" height="46" rx="12" fill="#118eea"/>
  <text x="1206" y="574" font-size="14" fill="#fff" text-anchor="middle" font-weight="600">▦  Generate QRIS Payment</text>
  <rect x="1028" y="610" width="356" height="172" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>
  ${qrCode(1150, 624, 112)}
  <text x="1206" y="762" font-size="12" fill="#64748b" text-anchor="middle">Live QRIS · valid 30 min</text>
  `;

  return appShell({ active: 'dashboard', title: 'Payment Dashboard', subtitle: 'DANA Business API · experimental integration', badge: 'Sandbox mode', body });
}

// ------------------------------------------------------ 2. Payment detail ---
function paymentDetail() {
  const row = (y, label, value, mono) => {
    const attrs = mono
      ? 'font-family="monospace" font-size="11" fill="#334155"'
      : 'font-size="12" font-weight="600" fill="#0f172a"';
    return `
    <text x="826" y="${y}" font-size="12" fill="#94a3b8">${label}</text>
    <text x="1004" y="${y}" text-anchor="end" ${attrs}>${value}</text>`;
  };

  const body = `
  <rect width="1440" height="900" fill="#0f172a" opacity="0.35"/>
  <rect x="410" y="70" width="620" height="760" rx="20" fill="#ffffff"/>
  <rect x="438" y="98" width="40" height="40" rx="12" fill="#eef4ff"/>
  <text x="458" y="124" font-size="17" text-anchor="middle">▦</text>
  <text x="494" y="116" font-size="15" fill="#0f172a" font-weight="700">Kopi Susu Gula Aren x2</text>
  <text x="494" y="136" font-size="13" fill="#64748b">Rp 25.000</text>
  <text x="1004" y="120" font-size="20" fill="#94a3b8" text-anchor="middle">✕</text>
  <line x1="410" y1="156" x2="1030" y2="156" stroke="#f1f5f9"/>

  <rect x="628" y="184" width="184" height="184" rx="16" fill="#fff" stroke="#e2e8f0"/>
  ${qrCode(640, 196, 160)}
  <text x="720" y="386" font-size="12" fill="#94a3b8" text-anchor="middle">QRIS code</text>

  <text x="826" y="200" font-size="12" fill="#94a3b8">Status</text>
  <rect x="908" y="188" width="96" height="24" rx="12" fill="#fffbeb" stroke="#fde68a"/>
  <text x="956" y="204" font-size="11" fill="#b45309" text-anchor="middle" font-weight="600">⏱ Pending</text>
  ${row(240, 'Reference No', 'PRN-...-KSCUM', true)}
  ${row(272, 'DANA Ref No', 'OHSWVMQWRS3UYDSI', true)}
  ${row(304, 'Amount', 'Rp 25.000', false)}
  ${row(336, 'Created', '12 Oct 2026, 22:10', false)}
  ${row(368, 'Valid until', '12 Oct 2026, 22:40', false)}
  <line x1="438" y1="392" x2="1002" y2="392" stroke="#f1f5f9"/>

  <text x="438" y="420" font-size="11" fill="#94a3b8" font-weight="600" letter-spacing="1">TIMELINE</text>
  <circle cx="452" cy="446" r="12" fill="#f1f5f9"/><text x="452" y="450" font-size="11" text-anchor="middle" fill="#64748b">⏱</text>
  <text x="476" y="444" font-size="12" fill="#475569" font-weight="600">PENDING</text>
  <text x="546" y="444" font-size="12" fill="#94a3b8">Transaction created</text>
  <text x="1002" y="444" font-size="11" fill="#cbd5e1" text-anchor="end">22:10</text>
  <circle cx="452" cy="480" r="12" fill="#f1f5f9"/><text x="452" y="484" font-size="11" text-anchor="middle" fill="#64748b">⏱</text>
  <text x="476" y="478" font-size="12" fill="#475569" font-weight="600">PENDING</text>
  <text x="546" y="478" font-size="12" fill="#94a3b8">DANA QR generated</text>
  <text x="1002" y="478" font-size="11" fill="#cbd5e1" text-anchor="end">22:10</text>

  <rect x="438" y="512" width="564" height="126" rx="12" fill="#fffbeb" stroke="#fcd34d" stroke-dasharray="6 4"/>
  <text x="458" y="540" font-size="12" fill="#b45309" font-weight="700">✓  Experiment controls (mock mode)</text>
  <rect x="458" y="556" width="260" height="34" rx="9" fill="#059669"/>
  <text x="588" y="578" font-size="12" fill="#fff" text-anchor="middle" font-weight="600">✓  Mark as paid</text>
  <rect x="728" y="556" width="256" height="34" rx="9" fill="#dc2626"/>
  <text x="856" y="578" font-size="12" fill="#fff" text-anchor="middle" font-weight="600">✕  Mark as failed</text>
  <text x="458" y="616" font-size="11" fill="#b45309" opacity="0.85">Simulate a payer in mock mode to test status transitions.</text>

  <line x1="410" y1="662" x2="1030" y2="662" stroke="#f1f5f9"/>
  <rect x="410" y="662" width="620" height="168" fill="#f8fafc"/>
  <rect x="438" y="686" width="250" height="42" rx="12" fill="#0f172a"/>
  <text x="563" y="712" font-size="13" fill="#fff" text-anchor="middle" font-weight="600">↻  Query Status</text>
  <rect x="700" y="686" width="130" height="42" rx="12" fill="#fff" stroke="#e2e8f0"/>
  <text x="765" y="712" font-size="13" fill="#475569" text-anchor="middle" font-weight="600">⊘  Cancel</text>
  `;
  return appShell({ active: 'transactions', title: 'Transactions', subtitle: 'DANA Business API · experimental integration', badge: 'Sandbox mode', body });
}

// ------------------------------------------------------ 3. Webhook tester ---
function webhookTester() {
  const body = `
  <rect x="288" y="98" width="560" height="320" rx="16" fill="#fff" stroke="#e2e8f0"/>
  <rect x="312" y="122" width="40" height="40" rx="12" fill="#ede9fe"/>
  <text x="332" y="148" font-size="17" text-anchor="middle">📢</text>
  <text x="364" y="138" font-size="14" fill="#1e293b" font-weight="700">Notification endpoint</text>
  <text x="364" y="156" font-size="12" fill="#64748b">Configure this URL in the DANA dashboard</text>
  <rect x="312" y="182" width="512" height="46" rx="12" fill="#0f172a"/>
  <text x="330" y="209" font-size="12" fill="#6ee7b7" font-family="monospace">https://xxxx.trycloudflare.com/api/webhooks/dana</text>
  <rect x="782" y="190" width="30" height="30" rx="8" fill="#1e293b"/>
  <text x="797" y="210" font-size="13" text-anchor="middle">⧉</text>
  <text x="312" y="256" font-size="12" fill="#64748b">Method</text>
  <text x="366" y="256" font-size="12" fill="#334155" font-family="monospace" font-weight="600">POST</text>
  <text x="404" y="256" font-size="12" fill="#64748b">· content-type</text>
  <text x="492" y="256" font-size="12" fill="#334155" font-family="monospace" font-weight="600">application/json</text>
  <text x="312" y="280" font-size="12" fill="#64748b">DANA signs callbacks with RSA-SHA256 (verify with your DANA public key).</text>
  <rect x="312" y="300" width="330" height="30" rx="10" fill="#f1f5f9"/>
  <text x="330" y="320" font-size="12" fill="#475569">✓ Use latest ref: PRN-...-KSCUM</text>

  <rect x="872" y="98" width="536" height="700" rx="16" fill="#fff" stroke="#e2e8f0"/>
  <text x="896" y="134" font-size="14" fill="#1e293b" font-weight="700">⌨  Test payload</text>
  <rect x="896" y="152" width="488" height="400" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="912" y="182" font-size="12" fill="#64748b" font-family="monospace">{</text>
  <text x="928" y="204" font-size="12" fill="#0f766e" font-family="monospace">"partnerReferenceNo"</text><text x="1084" y="204" font-size="12" fill="#64748b" font-family="monospace">: "PRN-...-KSCUM",</text>
  <text x="928" y="226" font-size="12" fill="#0f766e" font-family="monospace">"originalReferenceNo"</text><text x="1092" y="226" font-size="12" fill="#64748b" font-family="monospace">: "20261012...",</text>
  <text x="928" y="248" font-size="12" fill="#0f766e" font-family="monospace">"latestTransactionStatus"</text><text x="1126" y="248" font-size="12" fill="#64748b" font-family="monospace">: "SUCCESS",</text>
  <text x="928" y="270" font-size="12" fill="#0f766e" font-family="monospace">"amount"</text><text x="996" y="270" font-size="12" fill="#64748b" font-family="monospace">: { "value": "25000.00", "currency": "IDR" },</text>
  <text x="928" y="292" font-size="12" fill="#0f766e" font-family="monospace">"additionalInfo"</text><text x="1044" y="292" font-size="12" fill="#64748b" font-family="monospace">: {</text>
  <text x="944" y="314" font-size="12" fill="#0f766e" font-family="monospace">"payer"</text><text x="1002" y="314" font-size="12" fill="#64748b" font-family="monospace">: { "name": "Budi", "accountNo": "0812..." }</text>
  <text x="928" y="336" font-size="12" fill="#64748b" font-family="monospace">}</text>
  <text x="912" y="356" font-size="12" fill="#64748b" font-family="monospace">}</text>

  <rect x="896" y="572" width="360" height="44" rx="12" fill="#118eea"/>
  <text x="1076" y="599" font-size="13" fill="#fff" text-anchor="middle" font-weight="600">➤  Send notification</text>
  <rect x="1268" y="572" width="116" height="44" rx="12" fill="#fff" stroke="#e2e8f0"/>
  <text x="1326" y="599" font-size="13" fill="#475569" text-anchor="middle" font-weight="600">Reset</text>

  <rect x="896" y="632" width="488" height="138" rx="12" fill="#ecfdf5" stroke="#a7f3d0"/>
  <text x="916" y="660" font-size="12" fill="#065f46" font-weight="700">HTTP 200 · accepted</text>
  <text x="916" y="686" font-size="12" fill="#334155" font-family="monospace">{</text>
  <text x="932" y="708" font-size="12" fill="#0f766e" font-family="monospace">"responseCode"</text><text x="1064" y="708" font-size="12" fill="#64748b" font-family="monospace">: "2002500",</text>
  <text x="932" y="730" font-size="12" fill="#0f766e" font-family="monospace">"responseMessage"</text><text x="1088" y="730" font-size="12" fill="#64748b" font-family="monospace">: "Successful"</text>
  <text x="916" y="752" font-size="12" fill="#334155" font-family="monospace">}</text>
  `;
  return appShell({ active: 'webhook', title: 'Webhook Tester', subtitle: 'DANA Business API · experimental integration', badge: 'Sandbox mode', body });
}

// ------------------------------------------------------ 4. Banner ---
function banner() {
  const text = (s, len) => s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="400" viewBox="0 0 1280 400" font-family="Inter, -apple-system, 'Segoe UI', sans-serif">
  <defs>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b6fd1"/><stop offset="0.5" stop-color="#118eea"/><stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="400" fill="url(#hero)"/>
  <circle cx="1130" cy="70" r="240" fill="url(#glow)"/>
  <circle cx="120" cy="370" r="200" fill="url(#glow)"/>

  <!-- white rounded card with the real DANA logo -->
  <rect x="80" y="88" width="180" height="76" rx="18" fill="#ffffff"/>
  ${danaLogo(104, 116, 132, { color: '#008ceb' })}

  <text x="80" y="222" font-size="46" fill="#ffffff" font-weight="800">DANA Pay · Experiment Lab</text>
  <text x="80" y="262" font-size="20" fill="#e0f2fe">Experimental full-stack playground for the DANA Business API (SNAP)</text>

  <g font-size="15" font-weight="600">
    <rect x="80" y="292" width="188" height="42" rx="21" fill="#ffffff" opacity="0.16"/>
    <text x="174" y="318" fill="#fff" text-anchor="middle">⚡ Express.js API</text>
    <rect x="282" y="292" width="228" height="42" rx="21" fill="#ffffff" opacity="0.16"/>
    <text x="396" y="318" fill="#fff" text-anchor="middle">⚛ React · Vite · Tailwind v4</text>
    <rect x="524" y="292" width="196" height="42" rx="21" fill="#ffffff" opacity="0.16"/>
    <text x="622" y="318" fill="#fff" text-anchor="middle">🔐 SNAP Signatures</text>
    <rect x="734" y="292" width="150" height="42" rx="21" fill="#ffffff" opacity="0.16"/>
    <text x="809" y="318" fill="#fff" text-anchor="middle">📲 QRIS / Webhooks</text>
  </g>

  <!-- real QR in the corner -->
  <rect x="1052" y="150" width="150" height="150" rx="16" fill="#ffffff"/>
  ${qrCode(1066, 164, 122)}
  <text x="1127" y="324" font-size="12" fill="#e0f2fe" text-anchor="middle">Scannable QRIS sample</text>
</svg>`;
}

// ------------------------------------------------------------------ write ---
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'banner.svg'), banner());
fs.writeFileSync(path.join(OUT, 'dashboard.svg'), dashboard());
fs.writeFileSync(path.join(OUT, 'payment-detail.svg'), paymentDetail());
fs.writeFileSync(path.join(OUT, 'webhook-tester.svg'), webhookTester());
console.log('✓ wrote banner.svg, dashboard.svg, payment-detail.svg, webhook-tester.svg');
console.log('  QR modules:', qSize, '(real, errorCorrectionLevel=M)');
console.log('  DANA logo: official brand mark (#008ceb)');
