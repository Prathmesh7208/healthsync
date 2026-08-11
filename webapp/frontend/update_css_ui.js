const fs = require('fs');

const cssAdditions = `
/* Custom Country Dropdown */
.custom-country-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}
.country-select-btn {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-right: none;
  border-radius: 12px 0 0 12px;
  padding: 0 12px;
  height: 48px;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;
}
.country-select-btn:hover {
  background: #f1f5f9;
}
.country-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 280px;
  max-height: 300px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.country-dropdown-menu.hidden {
  display: none !important;
}
.country-search-box {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}
.country-search-box i {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.country-search-box input {
  width: 100%;
  padding: 10px 10px 10px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.country-search-box input:focus {
  border-color: #3b82f6;
}
.country-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}
.country-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.country-item:hover {
  background: #f8fafc;
}
.country-item-flag {
  margin-right: 12px;
  font-size: 18px;
}
.country-item-name {
  flex: 1;
  font-size: 14px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.country-item-code {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}
`;

const cssPath = 'c:/HealthSync/webapp/frontend/style.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.custom-country-dropdown')) {
  fs.writeFileSync(cssPath, css + '\n' + cssAdditions);
  console.log('style.css updated with country dropdown styles');
} else {
  console.log('style.css already has country dropdown styles');
}
