import fs from 'node:fs';
import path from 'node:path';
import { getMonthlySalesViewCode } from './build-monthly-sales-component.mjs';

const targetFile = path.resolve('admin/assets/index-Cv8Jj2gc.js');
const backupFile = targetFile + '.bak';

// Restore from clean backup
if (fs.existsSync(backupFile)) {
  console.log('Restoring from backup...');
  fs.copyFileSync(backupFile, targetFile);
} else {
  console.log('Creating fresh backup...');
  fs.copyFileSync(targetFile, backupFile);
}

let code = fs.readFileSync(targetFile, 'utf8');

// 1. SalesIcon definition as comma-separated variable in the bundle
const salesIconDef = `SalesIcon=function(e){return (0, F.jsxs)('svg',{className:(e&&e.className)||'w-4 h-4',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor',strokeWidth:2,children:[(0, F.jsx)('path',{strokeLinecap:'round',strokeLinejoin:'round',d:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'})]});},`;

const utMarker = 'Ut=({isOpenMobile:e,onCloseMobile:t})=>';
if (!code.includes(utMarker)) {
  throw new Error('Marker Ut not found');
}
code = code.replace(utMarker, () => salesIconDef + utMarker);

// 2. Sidebar Navigation Array `l` in Ut
const overviewNavMarker = '{id:`overview`,label:`Executive Overview`,icon:Qe},';
if (!code.includes(overviewNavMarker)) {
  throw new Error('overviewNavMarker not found');
}
code = code.replace(
  overviewNavMarker,
  () => overviewNavMarker + '{id:`monthly-sales`,label:`Per Month Sales`,icon:SalesIcon},'
);

// 3. Breadcrumb & Titles map `rn`
const rnMarker = 'rn={overview:{title:`Executive Overview`,section:`Command`},';
if (!code.includes(rnMarker)) {
  throw new Error('rnMarker not found');
}
code = code.replace(
  rnMarker,
  () => rnMarker + '"monthly-sales":{title:`Monthly Sales & Accounts Ledger`,section:`Command`},'
);

// 4. Directory Search `tn`
const tnMarker = 'tn=[{id:`overview`,title:`Executive Overview`,section:`Command`,keywords:[`dashboard`,`kpi`,`revenue`,`summary`,`activity`,`timeline`]},';
if (!code.includes(tnMarker)) {
  throw new Error('tnMarker not found');
}
code = code.replace(
  tnMarker,
  () => tnMarker + '{id:`monthly-sales`,title:`Monthly Sales & Accounts Ledger`,section:`Command`,keywords:[`sales`,`monthly`,`hisab`,`revenue`,`proceed`,`confirm`,`cancel`,`deal`,`ledger`,`project`]},'
);

// 5. MonthlySalesView definition right before var ZR=
const zrMarker = 'var ZR=()=>{let{currentView:e}=I()';
if (!code.includes(zrMarker)) {
  throw new Error('zrMarker not found');
}
const monthlySalesViewComponent = getMonthlySalesViewCode();
code = code.replace(zrMarker, () => monthlySalesViewComponent + '\n\n' + zrMarker);

// 6. View Switch inside ZR
const switchMarker = 'switch(e){case`overview`:return(0,F.jsx)(hn,{});';
if (!code.includes(switchMarker)) {
  throw new Error('switchMarker not found');
}
code = code.replace(
  switchMarker,
  () => switchMarker + 'case`monthly-sales`:return(0,F.jsx)(MonthlySalesView,{});'
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully injected MonthlySalesView with safe replacer functions!');
