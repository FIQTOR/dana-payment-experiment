/**
 * Generates the README screenshot SVGs.
 *
 * Uses a REAL, scannable QR code (via the `qrcode` package), the official DANA
 * brand logo, and proper SVG vector icons (Tabler, outline set) — no emojis.
 *
 * Run from `backend/`:
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
const QR_VB = qSize + quiet * 2;

const qrRects = [];
for (let y = 0; y < qSize; y++) {
  for (let x = 0; x < qSize; x++) {
    if (qData[y * qSize + x]) {
      qrRects.push(`<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>`);
    }
  }
}
const QR_PATHS = qrRects.join('');

// --------------------------------------------------------- SVG icon set ---
// Tabler Icons (outline) — MIT licensed. Icon paths (24x24 grid) inlined so the
// screenshots render identically everywhere without font/emoji dependencies.
const ICONS = {
  'credit-card': [
    'M3 8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -8',
    'M3 10l18 0',
    'M7 15l.01 0',
    'M11 15l2 0',
  ],
  'circle-check': ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M9 12l2 2l4 -4'],
  'clock': ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0', 'M12 7v5l3 3'],
  'circle-x': ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M10 10l4 4m0 -4l-4 4'],
  ban: ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0', 'M5.7 5.7l12.6 12.6'],
  'hourglass-high': [
    'M6.5 7h11',
    'M6.5 17h11',
    'M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z',
    'M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z',
  ],
  'receipt-refund': [
    'M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2',
    'M14 8h-4a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3h-4',
    'M12 6.5v9',
  ],
  coins: [
    'M9 14c0 1.657 -2.686 3 -6 3',
    'M9 14v4c0 1.657 -2.686 3 -6 3',
    'M3 14v4c0 1.657 2.686 3 6 3',
    'M9 11c0 1.657 -2.686 3 -6 3',
    'M3 11v4',
    'M16 8c0 .888 -1.343 1.72 -3.5 2',
    'M16 8c0 -1.657 -1.343 -3 -3 -3s-3 1.343 -3 3',
    'M13 20c-3.314 0 -6 -1.343 -6 -3v-3',
    'M13 20c3.314 0 6 -1.343 6 -3v-3',
    'M19 14v3c0 1.657 -2.686 3 -6 3',
    'M19 11v3',
    'M13 8v3c0 1.657 2.686 3 6 3',
  ],
  speakerphone: [
    'M18 8a3 3 0 0 1 0 6',
    'M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5',
    'M12 8h0l4 -3a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1l-4 -3h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h4z',
  ],
  'code': ['M7 8l-4 4l4 4', 'M17 8l4 4l-4 4', 'M14 4l-4 16'],
  'refresh': [
    'M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4',
    'M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4',
  ],
  'send': ['M10 14l11 -11', 'M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5'],
  plus: ['M12 5l0 14', 'M5 12l14 0'],
  'check': ['M5 12l5 5l10 -10'],
  'x': ['M18 6l-12 12', 'M6 6l12 12'],
  'copy': ['M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z', 'M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1'],
  'shield-check': ['M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06', 'M15 19l2 2l4 -4'],
  'qrcode': ['M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z', 'M4 12l4 0l0 4l-4 0z', 'M12 4l4 0l0 4l-4 0z', 'M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z', 'M7 7l.01 0', 'M7 17l.01 0', 'M17 7l.01 0'],
  'building-bank': [
    'M3 21l18 0',
    'M3 10l18 0',
    'M5 6l7 -3l7 3',
    'M4 10l0 11',
    'M20 10l0 11',
    'M8 14l0 3',
    'M12 14l0 3',
    'M16 14l0 3',
  ],
  'wallet': [
    'M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12',
    'M20 12v4h-4a2 2 0 0 1 0 -4h4',
  ],
  'database': [
    'M12 6m-8 0a8 3 0 1 0 16 0a8 3 0 1 0 -16 0',
    'M4 6v6a8 3 0 0 0 16 0v-6',
    'M4 12v6a8 3 0 0 0 16 0v-6',
  ],
  'server': [
    'M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z',
    'M3 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z',
    'M7 8l0 .01',
    'M7 16l0 .01',
  ],
  'lock': [
    'M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z',
    'M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0',
    'M8 11v-4a4 4 0 1 1 8 0v4',
  ],
  'webhook': [
    'M4 12a4 4 0 1 0 8 0a4 4 0 0 0 -8 0',
    'M12 12a4 4 0 1 0 8 0a4 4 0 0 0 -8 0',
    'M6 12v-4a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v.5',
  ],
  'bolt': ['M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11'],
};

/** Inline a Tabler outline icon as SVG, sized to `size` px at (x,y). */
function icon(name, x, y, size, { color = '#0f172a', width = 2 } = {}) {
  const paths = ICONS[name];
  if (!paths) throw new Error(`Unknown icon: ${name}`);
  const s = size / 24;
  return (
    `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${color}" ` +
    `stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">` +
    paths.map((d) => `<path d="${d}"/>`).join('') +
    `</g>`
  );
}

/** Icon centered on a circle badge. */
function iconBadge(name, cx, cy, r, { bg, fg, size = 22 }) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/>` +
    icon(name, cx - size / 2, cy - size / 2, size, { color: fg })
  );
}

// ------------------------------------------------------------- DANA logo ---
const DANA_LOGO_PATHS = '<path fill="#008ceb" fill-rule="evenodd" d="M151,82.84c7.26.52,15.72-5.12,18.7-8.34,10.36-11.21,10.61-27.42.18-39.16-3.88-4.37-13-9.2-18.77-8.52H130.22V82.77l20.83.07ZM142,70.72V38.87a75,75,0,0,1,9.82,0,15.22,15.22,0,0,1,7.13,2.76c12,8.2,7,27.75-7.33,29.06A71.77,71.77,0,0,1,142,70.72Z"/><path fill="#008ceb" fill-rule="evenodd" d="M334.39,82.94H346.3V70.88h23.63l.07,12h11.91V63c0-6,.5-13.48-1-18.91a23.62,23.62,0,0,0-45.49-.25c-1.6,5.36-1.06,13.05-1.06,19,0,6.72-.07,13.48,0,20.2Zm11.92-24.19c-.07-5-.6-10.35,1.75-14.2a11.61,11.61,0,0,1,10.15-5.77,11.79,11.79,0,0,1,10.08,5.82c2.32,4,1.77,9,1.71,14.16Z"/><path fill="#008ceb" fill-rule="evenodd" d="M198.19,82.93h11.87c0-2.52-.32-10.23.11-12.06h23.54l.08,12.05h11.89c-.06-6.68,0-13.35,0-20,0-5.7.53-13.86-1-18.92a23.63,23.63,0,0,0-45.49-.23c-1.59,5.2-1.05,13.15-1.05,18.94,0,6.68-.15,13.53,0,20.19Zm11.88-24.18c-.08-5-.59-10.42,1.76-14.19a11.71,11.71,0,0,1,20.23,0c2.33,4,1.77,9.08,1.73,14.17Z"/><path fill="#008ceb" fill-rule="evenodd" d="M266.57,48.67,266.4,57c0,7-.34,20.07,0,25.76h11.64c.27-4-.42-32.41.31-33.32,0-5.52,5.77-10.66,11.59-10.68A11.62,11.62,0,0,1,298.06,42c1.48,1.35,3.75,4.43,3.71,7.54.54.31.11,30,.28,33.29H313.7l-.09-33.95c.29-2.66-1.31-6.77-2.34-8.85A23.56,23.56,0,0,0,269,39.67C268,41.72,266.32,45.94,266.57,48.67Z"/><circle fill="#008ceb" cx="54.61" cy="54.61" r="54.61"/><path fill="#fefefe" d="M86.43,54.84V70.21c0,1-.43,1.21-1.27.72a28.08,28.08,0,0,0-3.5-1.78,23.73,23.73,0,0,0-11.49-1.53,55.06,55.06,0,0,0-12.44,3.12c-4,1.35-7.92,2.81-12,3.94a33.41,33.41,0,0,1-10.42,1.37,22.12,22.12,0,0,1-11-3.43A2.71,2.71,0,0,1,23,70.2Q23,55.1,23,40c0-.49,0-1.07.44-1.32s.89.16,1.27.41a21,21,0,0,0,12.15,3.6A32.4,32.4,0,0,0,45.94,41c4.16-1.29,8.18-3,12.27-4.45a74.14,74.14,0,0,1,9.77-3,21.21,21.21,0,0,1,16.73,3.09,3.67,3.67,0,0,1,1.75,3.27c0,5,0,10,0,15Z"/>';

function danaLogo(x, y, width, { color = '#008ceb' } = {}) {
  const scale = width / 382;
  return (
    `<g transform="translate(${x},${y}) scale(${scale})">` +
    DANA_LOGO_PATHS.replace(/#008ceb/g, color) +
    `</g>`
  );
}

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
    ['dashboard', 'Dashboard', 'layout-dashboard'],
    ['create', 'Create Payment', 'plus'],
    ['transactions', 'Transactions', 'list'],
    ['disbursements', 'Disbursements', 'building-bank'],
    ['webhook', 'Webhook Tester', 'speakerphone'],
  ];
  // small inline nav icons
  ICONS['layout-dashboard'] = ['M4 4h6v8h-6z', 'M4 16h6v4h-6z', 'M14 12h6v8h-6z', 'M14 4h6v4h-6z'];
  ICONS['list'] = ['M9 6l11 0', 'M9 12l11 0', 'M9 18l11 0', 'M5 6l0 .01', 'M5 12l0 .01', 'M5 18l0 .01'];

  let navSvg = '';
  let ny = 128;
  for (const [id, label, iconName] of nav) {
    const on = id === active;
    if (on) navSvg += `<rect x="16" y="${ny - 25}" width="224" height="42" rx="12" fill="#eef4ff" stroke="#bcd0ff"/>`;
    navSvg += icon(iconName, 30, ny - 13, 18, { color: on ? '#118eea' : '#94a3b8', width: 2 });
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
  ${icon('refresh', 1172, 27, 14, { color: '#475569' })}
  <text x="1210" y="38" font-size="13" fill="#475569" text-anchor="middle">Refresh</text>
  <rect x="1264" y="18" width="80" height="32" rx="10" fill="#118eea"/>
  ${icon('plus', 1276, 27, 14, { color: '#ffffff' })}
  <text x="1310" y="38" font-size="13" fill="#fff" text-anchor="middle" font-weight="600">New</text>
  <rect x="1008" y="18" width="132" height="32" rx="16" fill="#ecfdf5" stroke="#a7f3d0"/>
  ${icon('shield-check', 1020, 27, 14, { color: '#047857' })}
  <text x="1080" y="38" font-size="12" fill="#047857" text-anchor="middle" font-weight="600">${esc(badge)}</text>

  ${body}
</svg>`;
}

// ------------------------------------------------------ 1. Dashboard ---
function dashboard() {
  const stat = (x, tint, fg, iconName, label, value) => `
    <rect x="${x}" y="94" width="268" height="84" rx="16" fill="#fff" stroke="#e2e8f0"/>
    <rect x="${x + 16}" y="110" width="44" height="44" rx="12" fill="${tint}"/>
    ${icon(iconName, x + 27, 121, 22, { color: fg })}
    <text x="${x + 76}" y="126" font-size="12" fill="#64748b">${label}</text>
    <text x="${x + 76}" y="150" font-size="20" fill="#0f172a" font-weight="700">${value}</text>`;

  const statusPill = (x, y, label, iconName, cls) => `
    <rect x="${x}" y="${y}" width="104" height="24" rx="12" fill="${cls.bg}" stroke="${cls.border}"/>
    ${icon(iconName, x + 12, y + 6, 12, { color: cls.fg, width: 2.4 })}
    <text x="${x + 30}" y="${y + 16}" font-size="11" fill="${cls.fg}" font-weight="600">${label}</text>`;

  const row = (y, title, sub, amount, payer, status, iconName, cls) => `
    <rect x="304" y="${y + 16}" width="40" height="40" rx="12" fill="#f1f5f9"/>
    ${icon('qrcode', 314, y + 26, 20, { color: '#64748b' })}
    <text x="360" y="${y + 34}" font-size="13" fill="#1e293b" font-weight="600">${title}</text>
    <text x="360" y="${y + 52}" font-size="11" fill="#94a3b8">${sub}</text>
    <text x="820" y="${y + 34}" font-size="13" fill="#0f172a" font-weight="700" text-anchor="end">${amount}</text>
    <text x="820" y="${y + 52}" font-size="11" fill="#94a3b8" text-anchor="end">${payer}</text>
    ${statusPill(860, y + 28, status, iconName, cls)}`;

  const g = (bg, border, fg) => ({ bg, border, fg });

  const body = `
  ${stat(288, '#eef4ff', '#118eea', 'credit-card', 'Total Transactions', '12')}
  ${stat(572, '#ecfdf5', '#059669', 'circle-check', 'Successful', '9')}
  ${stat(856, '#fffbeb', '#d97706', 'clock', 'Pending', '2')}
  ${stat(1140, '#f5f3ff', '#7c3aed', 'wallet', 'Collected', 'Rp 1.240.000')}

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
  ${row(268, 'Kopi Susu Gula Aren x2', 'PRN-...-KSCUM · 12 Oct, 22:10', 'Rp 25.000', '0812•••789', 'Success', 'circle-check', g('#ecfdf5', '#a7f3d0', '#047857'))}
  <line x1="304" y1="344" x2="972" y2="344" stroke="#f1f5f9"/>
  ${row(348, 'Nasi Goreng Spesial', 'PRN-...-LD3PSJ · 12 Oct, 22:05', 'Rp 50.000', '—', 'Pending', 'clock', g('#fffbeb', '#fde68a', '#b45309'))}
  <line x1="304" y1="424" x2="972" y2="424" stroke="#f1f5f9"/>
  ${row(428, 'Es Teh Manis', 'PRN-...-SU90PU · 12 Oct, 21:58', 'Rp 12.000', '—', 'Cancelled', 'ban', g('#f1f5f9', '#e2e8f0', '#475569'))}
  <line x1="304" y1="504" x2="972" y2="504" stroke="#f1f5f9"/>
  ${row(508, 'Ayam Bakar Paket 1', 'PRN-...-FMDHUT · 12 Oct, 21:40', 'Rp 65.000', '0813•••221', 'Refunded', 'receipt-refund', g('#f5f3ff', '#ddd6fe', '#6d28d9'))}
  <line x1="304" y1="584" x2="972" y2="584" stroke="#f1f5f9"/>
  ${row(588, 'Pembayaran pesanan', 'PRN-...-PTNC-S · 12 Oct, 21:12', 'Rp 99.000', '0812•••010', 'Failed', 'circle-x', g('#fff1f2', '#fecdd3', '#be123c'))}

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
  ${icon('qrcode', 1132, 561, 18, { color: '#ffffff' })}
  <text x="1206" y="574" font-size="14" fill="#fff" text-anchor="middle" font-weight="600">Generate QRIS Payment</text>
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
  ${icon('qrcode', 448, 108, 20, { color: '#118eea' })}
  <text x="494" y="116" font-size="15" fill="#0f172a" font-weight="700">Kopi Susu Gula Aren x2</text>
  <text x="494" y="136" font-size="13" fill="#64748b">Rp 25.000</text>
  ${icon('x', 992, 108, 20, { color: '#94a3b8' })}
  <line x1="410" y1="156" x2="1030" y2="156" stroke="#f1f5f9"/>

  <rect x="628" y="184" width="184" height="184" rx="16" fill="#fff" stroke="#e2e8f0"/>
  ${qrCode(640, 196, 160)}
  <text x="720" y="386" font-size="12" fill="#94a3b8" text-anchor="middle">QRIS code</text>

  <text x="826" y="200" font-size="12" fill="#94a3b8">Status</text>
  <rect x="908" y="188" width="96" height="24" rx="12" fill="#fffbeb" stroke="#fde68a"/>
  ${icon('clock', 918, 194, 12, { color: '#b45309', width: 2.4 })}
  <text x="936" y="204" font-size="11" fill="#b45309" font-weight="600">Pending</text>
  ${row(240, 'Reference No', 'PRN-...-KSCUM', true)}
  ${row(272, 'DANA Ref No', 'OHSWVMQWRS3UYDSI', true)}
  ${row(304, 'Amount', 'Rp 25.000', false)}
  ${row(336, 'Created', '12 Oct 2026, 22:10', false)}
  ${row(368, 'Valid until', '12 Oct 2026, 22:40', false)}
  <line x1="438" y1="392" x2="1002" y2="392" stroke="#f1f5f9"/>

  <text x="438" y="420" font-size="11" fill="#94a3b8" font-weight="600" letter-spacing="1">TIMELINE</text>
  ${iconBadge('clock', 452, 446, 12, { bg: '#f1f5f9', fg: '#64748b', size: 14 })}
  <text x="476" y="444" font-size="12" fill="#475569" font-weight="600">PENDING</text>
  <text x="546" y="444" font-size="12" fill="#94a3b8">Transaction created</text>
  <text x="1002" y="444" font-size="11" fill="#cbd5e1" text-anchor="end">22:10</text>
  ${iconBadge('clock', 452, 480, 12, { bg: '#f1f5f9', fg: '#64748b', size: 14 })}
  <text x="476" y="478" font-size="12" fill="#475569" font-weight="600">PENDING</text>
  <text x="546" y="478" font-size="12" fill="#94a3b8">DANA QR generated</text>
  <text x="1002" y="478" font-size="11" fill="#cbd5e1" text-anchor="end">22:10</text>

  <rect x="438" y="512" width="564" height="126" rx="12" fill="#fffbeb" stroke="#fcd34d" stroke-dasharray="6 4"/>
  ${icon('circle-check', 458, 530, 14, { color: '#b45309' })}
  <text x="478" y="540" font-size="12" fill="#b45309" font-weight="700">Experiment controls (mock mode)</text>
  <rect x="458" y="556" width="260" height="34" rx="9" fill="#059669"/>
  ${icon('check', 500, 566, 14, { color: '#ffffff' })}
  <text x="596" y="578" font-size="12" fill="#fff" text-anchor="middle" font-weight="600">Mark as paid</text>
  <rect x="728" y="556" width="256" height="34" rx="9" fill="#dc2626"/>
  ${icon('x', 766, 566, 14, { color: '#ffffff' })}
  <text x="864" y="578" font-size="12" fill="#fff" text-anchor="middle" font-weight="600">Mark as failed</text>
  <text x="458" y="616" font-size="11" fill="#b45309" opacity="0.85">Simulate a payer in mock mode to test status transitions.</text>

  <line x1="410" y1="662" x2="1030" y2="662" stroke="#f1f5f9"/>
  <rect x="410" y="662" width="620" height="168" fill="#f8fafc"/>
  <rect x="438" y="686" width="250" height="42" rx="12" fill="#0f172a"/>
  ${icon('refresh', 500, 700, 15, { color: '#ffffff' })}
  <text x="575" y="712" font-size="13" fill="#fff" text-anchor="middle" font-weight="600">Query Status</text>
  <rect x="700" y="686" width="130" height="42" rx="12" fill="#fff" stroke="#e2e8f0"/>
  ${icon('ban', 726, 700, 15, { color: '#475569' })}
  <text x="782" y="712" font-size="13" fill="#475569" text-anchor="middle" font-weight="600">Cancel</text>
  `;
  return appShell({ active: 'transactions', title: 'Transactions', subtitle: 'DANA Business API · experimental integration', badge: 'Sandbox mode', body });
}

// ------------------------------------------------------ 3. Webhook tester ---
function webhookTester() {
  const body = `
  <rect x="288" y="98" width="560" height="320" rx="16" fill="#fff" stroke="#e2e8f0"/>
  <rect x="312" y="122" width="40" height="40" rx="12" fill="#ede9fe"/>
  ${icon('speakerphone', 322, 132, 20, { color: '#7c3aed' })}
  <text x="364" y="138" font-size="14" fill="#1e293b" font-weight="700">Notification endpoint</text>
  <text x="364" y="156" font-size="12" fill="#64748b">Configure this URL in the DANA dashboard</text>
  <rect x="312" y="182" width="512" height="46" rx="12" fill="#0f172a"/>
  <text x="330" y="209" font-size="12" fill="#6ee7b7" font-family="monospace">https://xxxx.trycloudflare.com/api/webhooks/dana</text>
  <rect x="782" y="190" width="30" height="30" rx="8" fill="#1e293b"/>
  ${icon('copy', 789, 197, 16, { color: '#e2e8f0' })}
  <text x="312" y="256" font-size="12" fill="#64748b">Method</text>
  <text x="366" y="256" font-size="12" fill="#334155" font-family="monospace" font-weight="600">POST</text>
  <text x="404" y="256" font-size="12" fill="#64748b">· content-type</text>
  <text x="492" y="256" font-size="12" fill="#334155" font-family="monospace" font-weight="600">application/json</text>
  <text x="312" y="280" font-size="12" fill="#64748b">DANA signs callbacks with RSA-SHA256 (verify with your DANA public key).</text>
  <rect x="312" y="300" width="330" height="30" rx="10" fill="#f1f5f9"/>
  ${icon('check', 326, 309, 14, { color: '#475569' })}
  <text x="348" y="320" font-size="12" fill="#475569">Use latest ref: PRN-...-KSCUM</text>

  <rect x="872" y="98" width="536" height="700" rx="16" fill="#fff" stroke="#e2e8f0"/>
  ${icon('code', 896, 122, 16, { color: '#94a3b8' })}
  <text x="920" y="134" font-size="14" fill="#1e293b" font-weight="700">Test payload</text>
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
  ${icon('send', 944, 587, 15, { color: '#ffffff' })}
  <text x="1090" y="599" font-size="13" fill="#fff" text-anchor="middle" font-weight="600">Send notification</text>
  <rect x="1268" y="572" width="116" height="44" rx="12" fill="#fff" stroke="#e2e8f0"/>
  <text x="1326" y="599" font-size="13" fill="#475569" text-anchor="middle" font-weight="600">Reset</text>

  <rect x="896" y="632" width="488" height="138" rx="12" fill="#ecfdf5" stroke="#a7f3d0"/>
  ${icon('circle-check', 916, 650, 14, { color: '#065f46' })}
  <text x="938" y="660" font-size="12" fill="#065f46" font-weight="700">HTTP 200 · accepted</text>
  <text x="916" y="686" font-size="12" fill="#334155" font-family="monospace">{</text>
  <text x="932" y="708" font-size="12" fill="#0f766e" font-family="monospace">"responseCode"</text><text x="1064" y="708" font-size="12" fill="#64748b" font-family="monospace">: "2002500",</text>
  <text x="932" y="730" font-size="12" fill="#0f766e" font-family="monospace">"responseMessage"</text><text x="1088" y="730" font-size="12" fill="#64748b" font-family="monospace">: "Successful"</text>
  <text x="916" y="752" font-size="12" fill="#334155" font-family="monospace">}</text>
  `;
  return appShell({ active: 'webhook', title: 'Webhook Tester', subtitle: 'DANA Business API · experimental integration', badge: 'Sandbox mode', body });
}

// ------------------------------------------------------ 4. Banner ---
function banner() {
  const pill = (x, w, iconName, label) => `
    <rect x="${x}" y="292" width="${w}" height="42" rx="21" fill="#ffffff" opacity="0.16"/>
    ${icon(iconName, x + 20, 303, 18, { color: '#ffffff' })}
    <text x="${x + 46}" y="318" font-size="15" fill="#fff" font-weight="600">${label}</text>`;

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

  ${pill(80, 188, 'bolt', 'Express.js API')}
  ${pill(282, 232, 'code', 'React · Vite · Tailwind v4')}
  ${pill(528, 196, 'lock', 'SNAP Signatures')}
  ${pill(738, 170, 'qrcode', 'QRIS / Webhooks')}

  <!-- real QR in the corner -->
  <rect x="1052" y="150" width="150" height="150" rx="16" fill="#ffffff"/>
  ${qrCode(1066, 164, 122)}
  <text x="1127" y="324" font-size="12" fill="#e0f2fe" text-anchor="middle">Scannable QRIS sample</text>
</svg>`;
}

// ------------------------------------------------- 5. Architecture ---
function architecture() {
  const endpoint = (x, y, text) =>
    `<text x="${x}" y="${y}" font-size="12" fill="#334155" font-family="monospace">${esc(text)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620" viewBox="0 0 1200 620" font-family="Inter, -apple-system, 'Segoe UI', sans-serif">
  <rect width="1200" height="620" fill="#f8fafc"/>

  <!-- Frontend -->
  <rect x="60" y="80" width="300" height="440" rx="18" fill="#ffffff" stroke="#e2e8f0"/>
  ${icon('building-bank', 192, 104, 28, { color: '#118eea' })}
  <text x="210" y="150" font-size="16" fill="#0f172a" text-anchor="middle" font-weight="700">Frontend</text>
  <text x="210" y="172" font-size="12" fill="#64748b" text-anchor="middle">React 19 · Vite · Tailwind v4</text>
  <line x1="80" y1="188" x2="340" y2="188" stroke="#f1f5f9"/>
  ${icon('layout-dashboard', 92, 210, 18, { color: '#475569' })}<text x="120" y="224" font-size="13" fill="#334155">Dashboard</text>
  ${icon('plus', 92, 244, 18, { color: '#475569' })}<text x="120" y="258" font-size="13" fill="#334155">Create Payment</text>
  ${icon('list', 92, 278, 18, { color: '#475569' })}<text x="120" y="292" font-size="13" fill="#334155">Transactions</text>
  ${icon('speakerphone', 92, 312, 18, { color: '#475569' })}<text x="120" y="326" font-size="13" fill="#334155">Webhook Tester</text>
  <rect x="90" y="352" width="240" height="148" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-dasharray="5 4"/>
  ${icon('refresh', 196, 386, 22, { color: '#118eea' })}
  <text x="210" y="432" font-size="12" fill="#64748b" text-anchor="middle">Live updates via</text>
  <text x="210" y="456" font-size="14" fill="#118eea" text-anchor="middle" font-weight="700">Server-Sent Events</text>
  <text x="210" y="478" font-size="12" fill="#94a3b8" text-anchor="middle">/api/events</text>

  <!-- Backend -->
  <rect x="450" y="80" width="320" height="440" rx="18" fill="#ffffff" stroke="#e2e8f0"/>
  ${icon('server', 588, 104, 28, { color: '#0f172a' })}
  <text x="610" y="150" font-size="16" fill="#0f172a" text-anchor="middle" font-weight="700">Backend (Express)</text>
  <text x="610" y="172" font-size="12" fill="#64748b" text-anchor="middle">REST API · SNAP signing</text>
  <line x1="470" y1="188" x2="750" y2="188" stroke="#f1f5f9"/>
  ${endpoint(470, 216, 'POST /api/payments')}
  ${endpoint(470, 240, 'POST /:ref/query · /cancel · /refund')}
  ${endpoint(470, 264, 'POST /api/disbursements')}
  ${endpoint(470, 288, 'POST /api/webhooks/dana')}
  ${endpoint(470, 312, 'GET  /api/events (SSE)')}
  <rect x="470" y="332" width="280" height="168" rx="12" fill="#eef4ff" stroke="#bcd0ff"/>
  ${icon('lock', 490, 350, 18, { color: '#0957a8' })}
  <text x="516" y="364" font-size="13" fill="#0957a8" font-weight="700">SNAP Signature Layer</text>
  <text x="490" y="392" font-size="12" fill="#334155">• HMAC-SHA512 access-token</text>
  <text x="490" y="416" font-size="12" fill="#334155">• RSA-SHA256 request signing</text>
  <text x="490" y="440" font-size="12" fill="#334155">• Webhook verify (RSA)</text>
  <text x="490" y="464" font-size="12" fill="#334155">• Mock mode (no network)</text>
  <text x="490" y="488" font-size="12" fill="#64748b">• Memory or MySQL (Sequelize)</text>

  <!-- DANA -->
  <rect x="870" y="80" width="270" height="440" rx="18" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="925" y="104" width="160" height="58" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
  <g transform="translate(945,124) scale(0.315)">${DANA_LOGO_PATHS}</g>
  <text x="1005" y="200" font-size="16" fill="#0f172a" text-anchor="middle" font-weight="700">DANA Business API</text>
  <text x="1005" y="222" font-size="12" fill="#64748b" text-anchor="middle">SNAP · QRIS MPM</text>
  <line x1="890" y1="240" x2="1120" y2="240" stroke="#f1f5f9"/>
  ${endpoint(890, 272, '/authorization/v1.0/')}
  ${endpoint(902, 292, 'access-token/b2b')}
  ${endpoint(890, 322, '/v1.0/qr/qr-mpm-generate')}
  ${endpoint(890, 346, '/v1.0/qr/qr-mpm-query')}
  ${endpoint(890, 370, '/v1.0/qr/qr-mpm-cancel')}
  ${endpoint(890, 394, '/v1.0/debit/refund')}
  <text x="1005" y="440" font-size="11" fill="#94a3b8" text-anchor="middle">api-sandbox.dana.id</text>
  <text x="1005" y="458" font-size="11" fill="#94a3b8" text-anchor="middle">api.dana.id (prod)</text>

  <!-- arrows -->
  <defs>
    <marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8"/>
    </marker>
  </defs>
  <line x1="360" y1="240" x2="446" y2="240" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="446" y1="290" x2="360" y2="290" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <text x="403" y="230" font-size="11" fill="#64748b" text-anchor="middle">fetch</text>
  <text x="403" y="308" font-size="11" fill="#64748b" text-anchor="middle">JSON / SSE</text>

  <line x1="770" y1="240" x2="866" y2="240" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="866" y1="290" x2="770" y2="290" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <text x="818" y="230" font-size="11" fill="#64748b" text-anchor="middle">signed</text>
  <text x="818" y="308" font-size="11" fill="#64748b" text-anchor="middle">webhook</text>

  <text x="600" y="570" font-size="12" fill="#94a3b8" text-anchor="middle">Express backend proxies DANA; the frontend talks only to the backend via /api</text>
</svg>`;
}

// ------------------------------------------------------------------ write ---
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'banner.svg'), banner());
fs.writeFileSync(path.join(OUT, 'dashboard.svg'), dashboard());
fs.writeFileSync(path.join(OUT, 'payment-detail.svg'), paymentDetail());
fs.writeFileSync(path.join(OUT, 'webhook-tester.svg'), webhookTester());
fs.writeFileSync(path.join(OUT, 'architecture.svg'), architecture());
console.log('✓ wrote banner.svg, dashboard.svg, payment-detail.svg, webhook-tester.svg, architecture.svg');
console.log('  QR modules:', qSize, '(real, errorCorrectionLevel=M)');
console.log('  DANA logo: official brand mark (#008ceb)');
console.log('  Icons: Tabler outline SVG (no emojis)');
