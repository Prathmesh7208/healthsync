const fs = require('fs');

// 1. Add ?reset=1 logic to remote_main.js
let jsFile = 'c:/HealthSync/webapp/frontend/js/remote_main.js';
let jsContent = fs.readFileSync(jsFile, 'utf8');

const resetLogic = `
  // Force reset for testing
  if (window.location.search.includes('reset=1')) {
    localStorage.removeItem('healthsync-session');
    sessionStorage.removeItem('healthsync-language-confirmed');
    sessionStorage.removeItem('healthsync-pending-mobile');
    window.location.href = window.location.pathname;
    return;
  }
  const savedSession = localStorage.getItem('healthsync-session');
`;

if (!jsContent.includes('reset=1')) {
  jsContent = jsContent.replace("const savedSession = localStorage.getItem('healthsync-session');", resetLogic);
  fs.writeFileSync(jsFile, jsContent);
  console.log("Added ?reset=1 logic to remote_main.js");
}

// 2. Add Logout button to all sidebars in remote_index.html
let htmlFile = 'c:/HealthSync/webapp/frontend/remote_index.html';
let htmlContent = fs.readFileSync(htmlFile, 'utf8');

const logoutHtml = `
            <div class="nav-item text-red" onclick="window.logoutCurrentUser()" style="margin-top: auto; color: #ef4444;">
              <span class="nav-icon"><i class="fa-solid fa-right-from-bracket"></i></span> Log Out
            </div>
          </nav>`;

if (!htmlContent.includes('Log Out')) {
  htmlContent = htmlContent.replace(/<\/nav>/g, logoutHtml);
  fs.writeFileSync(htmlFile, htmlContent);
  console.log("Added Log Out buttons to remote_index.html");
}
