const fs = require('fs');
const files = [
  'c:/HealthSync/webapp/frontend/js/main.js',
  'c:/HealthSync/webapp/frontend/js/remote_main.js'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix timezone issue in new Date().toISOString().split('T')[0]
  // We will create a local helper to format dates in local timezone.
  const tzFind1 = `const todayStr = new Date().toISOString().split('T')[0];`;
  const tzReplace1 = `const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];`;
  
  content = content.replace(new RegExp(tzFind1.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), tzReplace1);

  const tzFind2 = `days.push(d.toISOString().split('T')[0]);`;
  const tzReplace2 = `days.push(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]);`;
  content = content.replace(new RegExp(tzFind2.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), tzReplace2);

  const tzFind3 = `return d.toISOString().split('T')[0];`;
  const tzReplace3 = `return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];`;
  content = content.replace(new RegExp(tzFind3.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), tzReplace3);

  const tzFind4 = `bookingDateInput.value = new Date().toISOString().split('T')[0];`;
  const tzReplace4 = `bookingDateInput.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];`;
  content = content.replace(new RegExp(tzFind4.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), tzReplace4);
  
  const tzFind5 = `bookingDateInput.min = new Date().toISOString().split('T')[0];`;
  const tzReplace5 = `bookingDateInput.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];`;
  content = content.replace(new RegExp(tzFind5.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), tzReplace5);

  fs.writeFileSync(file, content);
}
console.log('Fixed timezone issues in frontend JS');
