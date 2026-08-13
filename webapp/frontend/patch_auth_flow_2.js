const fs = require('fs');

function patchJsFiles() {
  const files = ['c:/HealthSync/webapp/frontend/js/main.js', 'c:/HealthSync/webapp/frontend/js/remote_main.js'];
  for (const file of files) {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      const newRouting = `
  const savedSession = localStorage.getItem('healthsync-session');
  if (!savedSession) {
    // Unauthenticated: hide app, show onboarding
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.add('hidden');
    const obFlow = document.getElementById('onboarding-flow');
    if (obFlow) obFlow.classList.remove('hidden');
    
    // Clear hash to prevent direct dashboard routing
    if (window.location.hash) {
      history.replaceState(null, '', ' ');
    }
  } else {
    // Authenticated (pending restoreSession verify)
    const obFlow = document.getElementById('onboarding-flow');
    if (obFlow) obFlow.classList.add('hidden');
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('hidden');
    
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const parts = hash.substring(1).split('/');
      if (parts.length === 2) {
        history.replaceState({ healthsyncNavigation: true, role: parts[0], page: parts[1] }, '', hash);
        setTimeout(() => goToAppHistoryState({ role: parts[0], page: parts[1] }), 50);
      }
    } else {
      history.replaceState({ healthsyncNavigation: true, role: 'patient', page: 'dashboard' }, '', '#patient/dashboard');
    }
  }
  
  renderPatientHealthProfile();
  startHealthTipRotation();
  restoreSession();`;

      // Find the block from "const hash = window.location.hash;" to "restoreSession();"
      const startIndex = content.indexOf('const hash = window.location.hash;');
      const endIndex = content.indexOf('restoreSession();', startIndex);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const fullEndIndex = endIndex + 'restoreSession();'.length;
        content = content.substring(0, startIndex) + newRouting.trim() + content.substring(fullEndIndex);
      } else {
        console.log("Could not find block in", file);
      }

      // Also ensure restoreSession forces logout and reload when verify fails
      // Look for catch block in restoreSession
      const catchRegex = /\} catch \{[\s\S]*?localStorage\.removeItem\('healthsync-session'\);[\s\S]*?\}/;
      const newCatch = `} catch { 
      localStorage.removeItem('healthsync-session');
      if (typeof window.logoutCurrentUser === 'function') {
        window.logoutCurrentUser();
      } else {
        location.reload();
      }
    }`;
      
      content = content.replace(catchRegex, newCatch);

      fs.writeFileSync(file, content);
      console.log('Patched', file);
    }
  }
}

patchJsFiles();
