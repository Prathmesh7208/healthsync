const fs = require('fs');
let css = fs.readFileSync('c:/HealthSync/webapp/frontend/style.css', 'utf8');

// Replace .new-sidebar with .sidebar in the Mobile Sidebar Fix
css = css.replace(/\.new-sidebar {/g, '.sidebar {');
css = css.replace(/\.new-sidebar\.open {/g, '.sidebar.open {');

// Also in the Desktop Sidebar Fix
css = css.replace(/@media \(min-width: 769px\) {\s*\.sidebar {/g, '@media (min-width: 769px) {\n  .sidebar {');

fs.writeFileSync('c:/HealthSync/webapp/frontend/style.css', css);
console.log('Fixed CSS targets');
