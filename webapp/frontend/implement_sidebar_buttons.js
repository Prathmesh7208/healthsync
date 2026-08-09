const fs = require('fs');

// 1. Modify main.js toggleSidebar
let js = fs.readFileSync('c:/HealthSync/webapp/frontend/js/main.js', 'utf8');
const newToggle = `window.toggleSidebar = function(forceClose = false) {
    const activeSidebar = document.querySelector('.role-panel.active .sidebar') || document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isMobile = window.innerWidth <= 768;
    if (activeSidebar) {
      if (isMobile) {
        if (forceClose) {
          activeSidebar.classList.remove('open');
          if(overlay) overlay.classList.remove('open');
        } else {
          activeSidebar.classList.toggle('open');
          if(overlay) overlay.classList.toggle('open');
        }
      } else {
        if (forceClose) {
          activeSidebar.classList.add('collapsed');
        } else {
          activeSidebar.classList.toggle('collapsed');
        }
      }
    }
  };
`;

if (js.includes('window.toggleSidebar = function')) {
    js = js.replace(/window\.toggleSidebar\s*=\s*function[\s\S]*?\};\n/, newToggle);
    fs.writeFileSync('c:/HealthSync/webapp/frontend/js/main.js', js);
    console.log('Updated main.js');
}

// 2. Modify style.css
let css = fs.readFileSync('c:/HealthSync/webapp/frontend/style.css', 'utf8');
css = css.replace(/@media \(min-width: 769px\) \{\s*\.sidebar \{[\s\S]*?#sidebar-overlay \{\s*display: none !important;\s*\}\s*\}/, 
`@media (min-width: 769px) {
  .sidebar {
    left: 0 !important;
    width: 280px !important;
    transform: none !important;
    transition: width 0.3s ease !important;
  }
  .main-area {
    margin-left: 280px !important;
    transition: margin-left 0.3s ease !important;
  }
  /* DO NOT HIDE MOBILE MENU BTN ON DESKTOP ANYMORE! */
  .mobile-menu-btn {
    display: flex !important;
  }
  #sidebar-overlay {
    display: none !important;
  }
  
  /* Collapsed state */
  .sidebar.collapsed {
    width: 80px !important;
  }
  .sidebar.collapsed .sidebar-brand-name,
  .sidebar.collapsed .nav-item span:not(.nav-icon),
  .sidebar.collapsed .sidebar-footer,
  .sidebar.collapsed .mobile-role-selector-container {
    display: none !important;
  }
  .sidebar.collapsed .sidebar-brand {
    justify-content: center;
    padding: 16px 0;
  }
  .sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 12px 0;
  }
  .sidebar.collapsed .nav-icon {
    margin-right: 0 !important;
    font-size: 20px;
  }
  .sidebar.collapsed ~ .main-area,
  .role-panel:has(.sidebar.collapsed) .main-area {
    margin-left: 80px !important;
  }
}

.mobile-close-btn {
  display: none;
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
@media (max-width: 768px) {
  .mobile-close-btn {
    display: block;
  }
}
`);

fs.writeFileSync('c:/HealthSync/webapp/frontend/style.css', css);
console.log('Updated style.css');

// 3. Modify index.html to add mobile-close-btn
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');

// Ensure we don't add multiple times
if (!html.includes('mobile-close-btn')) {
    html = html.replace(/<div class="brand-text">HealthSync<\/div>/g, '<div class="brand-text">HealthSync</div><button class="mobile-close-btn" type="button" aria-label="Close sidebar" onclick="toggleSidebar(true)"><i class="fa-solid fa-xmark"></i></button>');
    html = html.replace(/<span class="sidebar-brand-name"([^>]*)>HealthSync<\/span>/g, '<span class="sidebar-brand-name"$1>HealthSync</span><button class="mobile-close-btn" type="button" aria-label="Close sidebar" onclick="toggleSidebar(true)"><i class="fa-solid fa-xmark"></i></button>');
}

// Also update cache busters
html = html.replace(/href="style\.css(\?v=\d+)?"/g, 'href="style.css?v=' + Date.now() + '"');
html = html.replace(/src="js\/main\.js(\?v=\d+)?"/g, 'src="js/main.js?v=' + Date.now() + '"');

fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);
console.log('Updated index.html');
