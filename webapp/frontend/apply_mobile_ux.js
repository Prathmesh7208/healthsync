const fs = require('fs');
let css = fs.readFileSync('c:/HealthSync/webapp/frontend/style.css', 'utf8');

const mobileUxPolish = `
/* --- MOBILE UX POLISH (NATIVE APP FEEL) --- */
@media (max-width: 768px) {
  /* Optimize main content padding & safe areas */
  .page-content {
    padding: 16px 16px 32px 16px !important;
    padding-bottom: calc(32px + env(safe-area-inset-bottom)) !important;
  }
  
  /* Scale down headers slightly for small screens */
  .new-dashboard-header {
    margin-bottom: 16px !important;
  }
  .page-heading {
    font-size: 21px !important;
    letter-spacing: -0.01em;
  }
  .page-subheading {
    font-size: 14px !important;
  }

  /* Compact the cards to save vertical space */
  .new-card {
    padding: 16px !important;
  }
  .new-dash-row-1 {
    gap: 16px !important;
  }
  
  /* Make quick action grid feel native */
  .quick-action-grid {
    gap: 10px !important;
  }
  .quick-action {
    padding: 12px 8px !important;
    border-radius: 12px !important;
  }
  
  /* Adjust typography inside cards */
  .doc-details h3 {
    font-size: 15px !important;
  }
  .doc-details p {
    font-size: 12px !important;
  }
  
  /* Health stats */
  .health-stat-box {
    padding: 14px !important;
  }
  .health-stat-value {
    font-size: 20px !important;
  }
  .health-stat-label {
    font-size: 11px !important;
  }

  /* Tip banners on mobile */
  .tip-banner {
    padding: 16px !important;
  }
  .tip-text {
    font-size: 13px !important;
  }
  .tip-glass-illustration div, 
  .tip-drop-illustration div {
    font-size: 40px !important;
  }
  
  /* Updates banner */
  .updates-banner {
    padding: 14px 16px !important;
  }
}
`;

// Inject if not present
if (!css.includes('MOBILE UX POLISH')) {
  css += '\n' + mobileUxPolish;
  fs.writeFileSync('c:/HealthSync/webapp/frontend/style.css', css);
  
  // Update cache buster in HTML
  let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');
  html = html.replace(/href="style\.css(\?v=\d+)?"/g, 'href="style.css?v=' + Date.now() + '"');
  fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);

  console.log('Mobile UX Polish applied.');
} else {
  console.log('Already applied.');
}
