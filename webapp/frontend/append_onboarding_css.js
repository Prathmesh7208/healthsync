const fs = require('fs');

const css = `
/* ==========================================================================
   NEW ONBOARDING FLOW CSS
   ========================================================================== */

.onboarding-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.onboarding-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

@media (min-width: 480px) {
  .onboarding-card {
    min-height: 700px;
    height: 90vh;
    border-radius: 24px;
    margin: 20px 0;
    overflow-y: auto;
  }
}

.onboarding-step {
  display: none;
  flex-direction: column;
  padding: 24px;
  height: 100%;
  animation: fadeIn 0.3s ease-out;
}

.onboarding-step.active {
  display: flex;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- STEP 1: LANGUAGE --- */
.language-globe-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 220px;
  background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
  margin: -24px -24px 24px -24px;
  position: relative;
  overflow: hidden;
}

@media (min-width: 480px) {
  .language-globe-container {
    border-radius: 24px 24px 0 0;
  }
}

.globe-art {
  position: relative;
  width: 120px;
  height: 120px;
}

.globe-circle {
  width: 100px;
  height: 100px;
  background-color: #38bdf8;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
  box-shadow: inset -10px -10px 20px rgba(0,0,0,0.1);
}

.globe-land {
  position: absolute;
  background-color: #4ade80;
  border-radius: 50%;
}
.g1 { width: 60px; height: 40px; top: 10%; left: -10%; }
.g2 { width: 80px; height: 50px; top: 40%; left: 40%; transform: rotate(-20deg); }
.g3 { width: 40px; height: 30px; bottom: 10%; left: 10%; }

.hello-pill {
  position: absolute;
  background: #ffffff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.english { top: 10%; left: -30%; color: #3b82f6; }
.hindi { top: 20%; right: -30%; color: #22c55e; }
.marathi { bottom: 20%; left: -20%; color: #eab308; }
.hello2 { bottom: 10%; right: -20%; color: #8b5cf6; }

.onboarding-header {
  text-align: center;
  margin-bottom: 24px;
}
.onboarding-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
}
.onboarding-header p {
  font-size: 14px;
  color: #64748b;
}

.language-choice-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.language-choice {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.language-choice:hover {
  border-color: #cbd5e1;
}

.language-choice.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.lang-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #1e3a8a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  margin-right: 16px;
}
.lang-icon.green { background: #166534; }
.lang-icon.orange { background: #9a3412; }

.lang-text {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.lang-text strong {
  font-size: 16px;
  color: #0f172a;
}
.lang-text span {
  font-size: 12px;
  color: #64748b;
}

.check-icon {
  color: #cbd5e1;
  font-size: 20px;
}
.language-choice.active .check-icon {
  color: #2563eb;
}

/* --- STEP 2, 3, 4: COMMON HEADER --- */
.onboarding-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #0f172a;
  cursor: pointer;
  padding: 4px;
}

.help-link {
  font-size: 14px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.onboarding-brand {
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 24px;
}

/* --- STEP 2: AUTH TABS --- */
.auth-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.auth-tab {
  flex: 1;
  text-align: center;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.auth-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.mobile-input-group {
  display: flex;
  gap: 8px;
}

.country-code-box {
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.input-with-icon {
  position: relative;
}
.input-with-icon i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.input-with-icon .form-control {
  padding-left: 40px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}
.divider span {
  padding: 0 10px;
  color: #94a3b8;
  font-size: 13px;
}

.social-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.secure-footer {
  text-align: center;
  font-size: 12px;
  color: #64748b;
  margin-top: 24px;
}

/* --- STEP 3: OTP --- */
.otp-number-display {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.otp-input-group {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.otp-box {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  transition: all 0.2s;
}

.otp-box:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.resend-text {
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

/* --- STEP 4: PROFILE --- */
.onboarding-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 20px;
}

.progress-step {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  z-index: 2;
}

.progress-step.active {
  background: #2563eb;
  color: #ffffff;
}

.progress-step.completed {
  background: #2563eb;
  color: #ffffff;
}

.progress-line {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 -4px;
  z-index: 1;
}

.progress-line.completed {
  background: #2563eb;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin: 8px 10px 0 10px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}
.progress-labels .active {
  color: #0f172a;
}

.gender-selection {
  display: flex;
  gap: 12px;
}

.gender-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.gender-box input {
  display: none;
}

.gender-box:hover {
  background: #f8fafc;
}

.gender-box.active {
  border-color: #2563eb;
  background: #eff6ff;
}

/* --- STEP 5: SUCCESS --- */
.confetti-container {
  position: relative;
  height: 140px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.success-checkmark {
  width: 80px;
  height: 80px;
  background: #22c55e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 40px;
  box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.4);
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleIn {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.c1, .c2, .c3, .c4, .c5 {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}
.c1 { background: #3b82f6; top: 20%; left: 30%; animation-delay: 0s; }
.c2 { background: #ef4444; top: 30%; right: 20%; animation-delay: 0.2s; }
.c3 { background: #f59e0b; bottom: 20%; left: 20%; animation-delay: 0.4s; }
.c4 { background: #10b981; bottom: 30%; right: 30%; animation-delay: 0.6s; }
.c5 { background: #8b5cf6; top: 10%; right: 40%; animation-delay: 0.8s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.feature-list-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.feature-item:last-child {
  border-bottom: none;
}

.feature-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.feature-item span {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
`;

fs.appendFileSync('c:/HealthSync/webapp/frontend/style.css', '\n' + css);
console.log('CSS appended to style.css successfully');
