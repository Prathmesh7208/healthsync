const fs = require('fs');

function patchHtmlFiles() {
  const files = ['c:/HealthSync/webapp/frontend/index.html', 'c:/HealthSync/webapp/frontend/remote_index.html'];
  for (const file of files) {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Ensure <div id="app"> is hidden by default
      if (content.includes('<div id="app">')) {
        content = content.replace('<div id="app">', '<div id="app" class="hidden">');
      }
      
      fs.writeFileSync(file, content);
      console.log('Patched', file);
    }
  }
}

function patchJsFiles() {
  const files = ['c:/HealthSync/webapp/frontend/js/main.js', 'c:/HealthSync/webapp/frontend/js/remote_main.js'];
  for (const file of files) {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // The current logic in DOMContentLoaded:
      const oldRouting = `
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
  renderPatientHealthProfile();
  startHealthTipRotation();
  restoreSession();`;

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

      if (content.includes(oldRouting.trim().substring(0, 50))) {
        // Need to be careful with exact whitespace
        const startIndex = content.indexOf('const hash = window.location.hash;');
        const endIndex = content.indexOf('restoreSession();', startIndex) + 'restoreSession();'.length;
        
        if (startIndex !== -1 && endIndex !== -1) {
          content = content.substring(0, startIndex) + newRouting.trim() + content.substring(endIndex);
        }
      }

      // Also ensure restoreSession forces logout and reload when verify fails
      // Look for catch block in restoreSession
      const oldCatch = `} catch { localStorage.removeItem('healthsync-session'); }`;
      const newCatch = `} catch { 
      localStorage.removeItem('healthsync-session');
      if (typeof window.logoutCurrentUser === 'function') {
        window.logoutCurrentUser();
      } else {
        location.reload();
      }
    }`;
      
      if (content.includes(oldCatch)) {
        content = content.replace(oldCatch, newCatch);
      }

      fs.writeFileSync(file, content);
      console.log('Patched', file);
    }
  }
}

patchHtmlFiles();
patchJsFiles();
