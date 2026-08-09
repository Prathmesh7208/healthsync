const fs = require('fs');
let css = fs.readFileSync('c:/HealthSync/webapp/frontend/style.css', 'utf8');

const mobileFix = `
/* --- MOBILE SIDEBAR BULLETPROOF FIX --- */
@media (max-width: 768px) {
  .sidebar {
    position: fixed !important;
    top: 0 !important;
    left: -280px !important;
    bottom: 0 !important;
    width: 280px !important;
    height: 100dvh !important;
    z-index: 999999 !important;
    transition: left 0.3s ease !important;
    transform: none !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .sidebar.open {
    left: 0 !important;
    transform: none !important;
  }
}
`;

if (!css.includes('MOBILE SIDEBAR BULLETPROOF FIX')) {
  css += mobileFix;
  fs.writeFileSync('c:/HealthSync/webapp/frontend/style.css', css);
  console.log('Appended mobile fix');
} else {
  console.log('Already there');
}
