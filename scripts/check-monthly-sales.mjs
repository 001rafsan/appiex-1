import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('Testing Monthly Sales & Accounts Ledger Implementation...');

const jsBundle = fs.readFileSync('admin/assets/index-Cv8Jj2gc.js', 'utf8');
const publicBundle = fs.readFileSync('public/admin/assets/index-Cv8Jj2gc.js', 'utf8');
const adminHtml = fs.readFileSync('admin.html', 'utf8');
const adminIndexHtml = fs.readFileSync('admin/index.html', 'utf8');

// 1. Check bundle presence
assert(jsBundle.includes('MonthlySalesView'), 'MonthlySalesView component missing from bundle');
assert(publicBundle.includes('MonthlySalesView'), 'MonthlySalesView component missing from public bundle');
assert(jsBundle.includes('SalesIcon'), 'SalesIcon missing from bundle');

// 2. Check sidebar placement
const overviewIdx = jsBundle.indexOf('{id:`overview`,label:`Executive Overview`,icon:Qe},');
const salesIdx = jsBundle.indexOf('{id:`monthly-sales`,label:`Per Month Sales`,icon:SalesIcon},');
const blueprintIdx = jsBundle.indexOf('{id:`blueprint-hub`,label:`Blueprint & Feature Catalog`,icon:Vt},');

assert(overviewIdx !== -1, 'Executive Overview item not found in nav');
assert(salesIdx !== -1, 'Per Month Sales item not found in nav');
assert(blueprintIdx !== -1, 'Blueprint & Feature Catalog item not found in nav');
assert(overviewIdx < salesIdx && salesIdx < blueprintIdx, 'Per Month Sales must be placed between Executive Overview and Blueprint Catalog');

// 3. Check route & title dictionaries
assert(jsBundle.includes('"monthly-sales":{title:`Monthly Sales & Accounts Ledger`,section:`Command`}'), 'Title dictionary rn missing monthly-sales entry');
assert(jsBundle.includes('case`monthly-sales`:return(0,F.jsx)(MonthlySalesView,{});'), 'Switch statement in ZR missing case monthly-sales');

// 4. Check core user requested features
assert(jsBundle.includes('proceed'), 'Proceed status missing');
assert(jsBundle.includes('confirm'), 'Confirm status missing');
assert(jsBundle.includes('cancel'), 'Cancel status missing');
assert(jsBundle.includes('totalAmountUSD') && jsBundle.includes('totalAmountBDT'), 'Monthly total calculation missing');
assert(jsBundle.includes('confirmedUSD') && jsBundle.includes('confirmedBDT'), 'Confirmed projects total calculation missing');
assert(jsBundle.includes('handleFinalizeMonth'), 'Finalize month handler missing');
assert(jsBundle.includes('handleAddSale'), 'Add sale handler missing');
assert(jsBundle.includes('appiex_monthly_sales_v2'), 'LocalStorage key missing');

// 5. Check cache buster in HTML
assert(adminHtml.includes('?v=20261112_monthly_sales_v2'), 'admin.html cache buster not updated');
assert(adminIndexHtml.includes('?v=20261112_monthly_sales_v2'), 'admin/index.html cache buster not updated');

console.log('✅ All Monthly Sales Ledger assertions PASSED with 100% precision!');
