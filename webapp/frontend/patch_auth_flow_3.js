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

      // 1. Replace routing block
      const startIndex = content.indexOf('const hash = window.location.hash;');
      const endIndex = content.indexOf('restoreSession();', startIndex);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const fullEndIndex = endIndex + 'restoreSession();'.length;
        content = content.substring(0, startIndex) + newRouting.trim() + content.substring(fullEndIndex);
        console.log("Replaced routing block in", file);
      } else {
        console.log("Could not find routing block in", file);
      }

      // 2. Replace catch block in restoreSession
      const oldCatchStr = `  } catch { \n      localStorage.removeItem('healthsync-session');\n    }`;
      const newCatchStr = `  } catch { \n      localStorage.removeItem('healthsync-session');\n      if (typeof window.logoutCurrentUser === 'function') {\n        window.logoutCurrentUser();\n      } else {\n        location.reload();\n      }\n    }`;

      if (content.includes(oldCatchStr)) {
        content = content.replace(oldCatchStr, newCatchStr);
        console.log("Replaced catch block in", file);
      } else {
        console.log("Could not find exact old catch block string in", file);
        // Fallback: try regex on the exact function text
        const funcStart = content.indexOf('async function restoreSession() {');
        const funcEnd = content.indexOf('}', content.indexOf('localStorage.removeItem', funcStart));
        
        if (funcStart !== -1) {
            let funcBody = content.substring(funcStart, funcEnd + 1);
            if (funcBody.includes("localStorage.removeItem('healthsync-session');")) {
                const replacedFuncBody = funcBody.replace(
                    /\} catch \{[\s\S]*?localStorage\.removeItem\('healthsync-session'\);[\s\S]*?\}/,
                    `} catch { \n      localStorage.removeItem('healthsync-session');\n      if (typeof window.logoutCurrentUser === 'function') {\n        window.logoutCurrentUser();\n      } else {\n        location.reload();\n      }\n    }`
                );
                content = content.substring(0, funcStart) + replacedFuncBody + content.substring(funcEnd + 1);
                console.log("Replaced catch block using fallback in", file);
            }
        }
      }

      fs.writeFileSync(file, content);
    }
  }
}

patchJsFiles();
