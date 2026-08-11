const fs = require('fs');

const pxCss = `
/* =========================================
   PIXEL PERFECT ONBOARDING CSS
   ========================================= */
.px-perfect {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  background: #fff;
  font-family: 'Inter', sans-serif; /* assuming standard font */
}
.px-perfect.hidden {
  display: none !important;
}

/* Base Styles */
.px-perfect .brand-text {
  font-weight: 700;
  color: #0f172a;
  font-size: 18px;
}
.px-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}
.px-back, .px-help {
  background: none;
  border: none;
  font-size: 14px;
  color: #0f172a;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.px-back {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  justify-content: center;
}
.px-titles h2 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}
.px-titles p {
  color: #64748b;
  font-size: 14px;
}
.px-footer {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}
.px-footer i {
  color: #10b981;
}
.px-divider {
  text-align: center;
  color: #cbd5e1;
  font-size: 13px;
  position: relative;
}
.px-divider::before, .px-divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: #f1f5f9;
}
.px-divider::before { left: 0; }
.px-divider::after { right: 0; }

/* Language Screen */
.lang-hero {
  background: #f0f7ff;
  border-radius: 0 0 32px 32px;
  padding: 24px 20px 40px;
  text-align: center;
}
.lang-brand { margin-bottom: 30px; font-size: 20px; }
.lang-titles h3 { font-size: 16px; font-weight: 500; color: #334155; margin-bottom: 4px; }
.lang-titles h1 { font-size: 36px; font-weight: 800; color: #1d4ed8; margin-bottom: 8px; }
.lang-titles p { font-size: 14px; color: #64748b; font-weight: 500; }
.lang-illustration { display: flex; justify-content: center; margin-top: 20px; }
.lang-card-overlay {
  background: #fff;
  border-radius: 24px;
  margin: -30px 16px 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  flex: 1;
}
.lang-card-overlay h2 { font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 4px; }
.lang-card-overlay p { font-size: 13px; color: #64748b; text-align: center; margin-bottom: 24px; }
.lang-options { display: flex; flex-direction: column; gap: 12px; }
.lang-opt {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.lang-opt.active {
  border-color: #3b82f6;
  background: #eff6ff;
}
.lang-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  margin-right: 12px;
}
.bg-blue { background: #3b82f6; }
.bg-orange { background: #f97316; }
.bg-green { background: #10b981; }
.lang-text { flex: 1; }
.lang-text strong { display: block; color: #0f172a; font-size: 15px; margin-bottom: 2px; }
.lang-text span { display: block; color: #64748b; font-size: 12px; }
.lang-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
}
.lang-opt.active .lang-check { background: #3b82f6; }

/* Login Screen */
.px-card { padding: 0 20px 20px; display: flex; flex-direction: column; }
.phone-graphic {
  position: relative;
  width: 120px;
  height: 160px;
  margin: 0 auto;
}
.phone-body {
  width: 100px;
  height: 150px;
  border: 4px solid #cbd5e1;
  border-radius: 16px;
  margin: 0 auto;
  position: relative;
  background: #f8fafc;
}
.phone-screen {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.phone-avatar {
  width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; color: #94a3b8;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.phone-line { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; }
.phone-line.short { width: 60%; }
.shield-badge {
  position: absolute;
  bottom: 0;
  right: -5px;
  font-size: 48px;
  color: #3b82f6;
}
.check-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  color: #fff;
}
.px-label { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; display: block; }
.px-phone-input { display: flex; align-items: stretch; border: 1px solid #cbd5e1; border-radius: 12px; height: 52px; overflow: visible; background: #fff; position: relative;}
.px-country { padding: 0 16px; display: flex; align-items: center; border-right: 1px solid #e2e8f0; cursor: pointer; font-size: 14px; font-weight: 500;}
.px-phone-input input { flex: 1; border: none; padding: 0 16px; outline: none; border-radius: 0 12px 12px 0; font-size: 15px; width: 100%;}
.btn-block { width: 100%; }
.px-social { display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; border-radius: 12px; font-weight: 600; color: #334155; border: 1px solid #cbd5e1; }
.px-social img { width: 18px; }

/* OTP Screen */
.px-number-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f1f5f9;
  padding: 12px 20px;
  border-radius: 30px;
  margin: 0 auto;
  max-width: 280px;
}
.px-num-text { font-weight: 700; color: #0f172a; letter-spacing: 1px; font-size: 15px;}
.px-num-change { color: #3b82f6; font-weight: 600; font-size: 13px; cursor: pointer; }
.px-otp-group { display: flex; justify-content: center; gap: 8px; }
.px-otp-group input {
  width: 44px; height: 52px; border: 1px solid #cbd5e1; border-radius: 12px;
  text-align: center; font-size: 20px; font-weight: 700; color: #0f172a; outline: none;
  transition: all 0.2s;
}
.px-otp-group input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.px-resend { font-size: 13px; color: #64748b; }
.px-change-btn { color: #3b82f6; border-color: #cbd5e1; }

/* Verifying Screen */
.verifying-graphic { position: relative; width: 120px; height: 120px; margin: 0 auto; }
.v-circle-light {
  width: 120px; height: 120px; border-radius: 50%; background: #eff6ff;
  display: flex; align-items: center; justify-content: center;
}
.v-lock { font-size: 48px; color: #3b82f6; }
.v-badge-green {
  position: absolute; bottom: 0; right: 0; width: 36px; height: 36px;
  background: #10b981; border: 4px solid #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px;
}
.bouncing-dots { display: flex; justify-content: center; gap: 6px; }
.bouncing-dots .dot {
  width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.bouncing-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.bouncing-dots .dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Profile Screen */
.px-progress { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; max-width: 320px; margin: 0 auto; }
.prog-item { display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; z-index: 2; }
.prog-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #94a3b8; font-weight: 600; font-size: 14px;}
.prog-item.active .prog-circle { background: #1d4ed8; color: #fff; }
.prog-item.completed .prog-circle { background: #eff6ff; color: #3b82f6; }
.prog-item span { font-size: 12px; color: #94a3b8; font-weight: 500; }
.prog-item.active span { color: #1d4ed8; }
.prog-line { flex: 1; height: 2px; background: #f1f5f9; margin: -20px 8px 0; z-index: 1; }
.prog-line.completed { background: #1d4ed8; }

.px-form-group { padding: 0 20px; margin-bottom: 16px; }
.px-form-group label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
.px-input-icon { position: relative; }
.px-input-icon i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.px-input-icon input { width: 100%; height: 52px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 0 16px 0 44px; outline: none; font-size: 15px; }
.px-input-icon input:focus { border-color: #3b82f6; }
.px-gender-grid { display: flex; gap: 12px; }
.px-gender-pill {
  flex: 1; height: 48px; border: 1px solid #cbd5e1; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #334155; cursor: pointer; transition: all 0.2s;
}
.px-gender-pill input { display: none; }
.px-gender-pill.active { border-color: #3b82f6; background: #eff6ff; }
#step-profile .btn-primary { margin: 0 20px; width: calc(100% - 40px); }

/* Success Screen */
.success-graphic { position: relative; width: 200px; height: 200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
.success-circle-large { width: 100px; height: 100px; border-radius: 50%; background: #10b981; color: #fff; font-size: 48px; display: flex; align-items: center; justify-content: center; z-index: 2;}
.confetti-bg { position: absolute; top:0;left:0;right:0;bottom:0; background: url('data:image/svg+xml;utf8,<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="40" width="8" height="12" fill="%233b82f6" transform="rotate(45 30 40)"/><circle cx="160" cy="50" r="5" fill="%23f59e0b"/><rect x="150" y="140" width="10" height="10" fill="%23ec4899" transform="rotate(15 150 140)"/><circle cx="40" cy="150" r="4" fill="%2310b981"/></svg>') no-repeat center center; z-index: 1;}

.px-feature-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; margin: 0 20px 20px; padding: 16px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
.px-feat-row { display: flex; align-items: center; gap: 12px; }
.px-feat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.px-feat-row span { font-size: 14px; font-weight: 500; color: #0f172a; }
.bg-blue-light { background: #eff6ff; }
.bg-green-light { background: #ecfdf5; }
.bg-red-light { background: #fef2f2; }
.bg-blue-light2 { background: #f0f9ff; }
#step-success .btn-primary { margin: 0 20px; width: calc(100% - 40px); }

/* Ensure custom country dropdown is positioned properly */
#country-dropdown-container { position: relative; }
`;

const cssPath = 'c:/HealthSync/webapp/frontend/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('PIXEL PERFECT ONBOARDING CSS')) {
  fs.writeFileSync(cssPath, css + '\n' + pxCss);
  console.log('style.css updated with pixel perfect CSS');
} else {
  console.log('style.css already has pixel perfect CSS');
}
