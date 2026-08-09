const fs = require('fs');

let css = fs.readFileSync('c:/HealthSync/webapp/frontend/style.css', 'utf8');

// Remove the complex Desktop fix with .collapsed
css = css.replace(/@media \(min-width: 769px\) \{\s*\.sidebar \{[\s\S]*?@media \(max-width: 768px\) \{\s*\.mobile-close-btn \{\s*display: block;\s*\}\s*\}/, '');

// Now we need to make the sidebar a drawer GLOBALLY
const globalDrawerFix = `
/* --- GLOBAL DRAWER SIDEBAR FIX --- */
.sidebar, .new-sidebar {
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
.sidebar.open, .new-sidebar.open {
  left: 0 !important;
}
.main-area {
  margin-left: 0 !important;
  width: 100% !important;
}
.mobile-menu-btn {
  display: flex !important;
}
#sidebar-overlay {
  z-index: 1999 !important;
}
.mobile-close-btn {
  display: block !important;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 24px;
  cursor: pointer;
  margin-left: auto;
  opacity: 0.8;
}
.mobile-close-btn:hover {
  opacity: 1;
}
`;

css += '\n' + globalDrawerFix;

fs.writeFileSync('c:/HealthSync/webapp/frontend/style.css', css);
console.log('Global Drawer Fix Applied to style.css');
