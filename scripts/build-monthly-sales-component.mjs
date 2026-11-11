import fs from 'node:fs';
import path from 'node:path';

// Let's create the code for MonthlySalesView
export function getMonthlySalesViewCode() {
  return `
function MonthlySalesView() {
  var ctx = I();
  var addToast = ctx.addToast;
  var globalCurrency = ctx.currency;

  var STORAGE_KEY = 'appiex_monthly_sales_v1';
  var RATE = 122; // 1 USD = 122 BDT

  // Initial Seed Data
  var defaultData = {
    selectedMonthId: '2026-11',
    months: [
      { id: '2026-11', name: 'November 2026', status: 'active', closedAt: null, notes: 'Current active monthly sales pipeline' },
      { id: '2026-10', name: 'October 2026', status: 'closed', closedAt: '2026-10-31', notes: 'Reconciled and closed - 4 projects confirmed' },
      { id: '2026-09', name: 'September 2026', status: 'closed', closedAt: '2026-09-30', notes: 'Q3 closing cycle - 3 projects confirmed' }
    ],
    items: [
      { id: 'sale_nov_1', monthId: '2026-11', clientName: 'WATCH 24 BD', projectTitle: 'Luxury Horology Platform v2 & 0% EMI', service: 'Full-Stack E-Commerce', amountUSD: 2800, amountBDT: 341600, date: '2026-11-04', status: 'confirm', notes: 'SSLCOMMERZ 36m EMI & Cloudinary CDN' },
      { id: 'sale_nov_2', monthId: '2026-11', clientName: 'Mamun WiFi', projectTitle: 'ISP Digital Expansion & Subscriber Portal', service: 'Web App & Growth Funnel', amountUSD: 1500, amountBDT: 183000, date: '2026-11-06', status: 'confirm', notes: 'Area coverage checker + automated billing' },
      { id: 'sale_nov_3', monthId: '2026-11', clientName: 'Time Dune Horology', projectTitle: 'Interactive 3D WebGL Sand Chronometer', service: '3D & Motion UI', amountUSD: 2200, amountBDT: 268400, date: '2026-11-08', status: 'confirm', notes: 'Three.js particle shaders and 60fps physics' },
      { id: 'sale_nov_4', monthId: '2026-11', clientName: 'Apex Logistics Ltd', projectTitle: 'Fleet Telemetry Dashboard & Dispatch System', service: 'Custom Web Application', amountUSD: 3500, amountBDT: 427000, date: '2026-11-09', status: 'proceed', notes: 'Client review scheduled for Wednesday' },
      { id: 'sale_nov_5', monthId: '2026-11', clientName: 'Nordic AI Solutions', projectTitle: 'Autonomous Customer Support Voice Agent', service: 'AI Automation & Agents', amountUSD: 1800, amountBDT: 219600, date: '2026-11-10', status: 'proceed', notes: 'Evaluating Vercel AI SDK integration' },
      { id: 'sale_nov_6', monthId: '2026-11', clientName: 'Legacy Print Studio', projectTitle: 'Print Catalog Redesign & Digital Lookbook', service: 'Creative Design', amountUSD: 600, amountBDT: 73200, date: '2026-11-02', status: 'cancel', notes: 'Client postponed project to next fiscal quarter' },

      { id: 'sale_oct_1', monthId: '2026-10', clientName: 'Royal Timepieces BD', projectTitle: 'Swiss Horology Flagship Store', service: 'Full-Stack E-Commerce', amountUSD: 3200, amountBDT: 390400, date: '2026-10-12', status: 'confirm', notes: 'Authorized Tissot & Seiko catalog' },
      { id: 'sale_oct_2', monthId: '2026-10', clientName: 'KPRverse Web3', projectTitle: 'Interactive WebGL Cyber Canvas', service: '3D WebGL & Motion', amountUSD: 2400, amountBDT: 292800, date: '2026-10-18', status: 'confirm', notes: 'Spatial visual showroom' },
      { id: 'sale_oct_3', monthId: '2026-10', clientName: 'Monaco Go Express', projectTitle: 'Express Logistics Dispatch API', service: 'Cloud & API Integration', amountUSD: 1900, amountBDT: 231800, date: '2026-10-24', status: 'confirm', notes: 'Real-time parcel routing' },
      { id: 'sale_oct_4', monthId: '2026-10', clientName: 'Libas Nafs Studio', projectTitle: 'Luxury Modest Fashion Store', service: 'Web Development', amountUSD: 1600, amountBDT: 195200, date: '2026-10-28', status: 'confirm', notes: 'Editorial UI and mobile checkout' },

      { id: 'sale_sep_1', monthId: '2026-09', clientName: 'Puma BD Official', projectTitle: 'Apparel Discovery & Inventory Bridge', service: 'Full-Stack Engineering', amountUSD: 2900, amountBDT: 353800, date: '2026-09-14', status: 'confirm', notes: 'Multi-store inventory reconciliation' },
      { id: 'sale_sep_2', monthId: '2026-09', clientName: 'Timerey Horology', projectTitle: 'Vintage Watch Collector Vault', service: 'Web Development', amountUSD: 2100, amountBDT: 256200, date: '2026-09-22', status: 'confirm', notes: 'Provenance verification system' },
      { id: 'sale_sep_3', monthId: '2026-09', clientName: 'BioTech Care Lab', projectTitle: 'Patient Diagnostics & Results Portal', service: 'Web Application', amountUSD: 2500, amountBDT: 305000, date: '2026-09-27', status: 'confirm', notes: 'HIPAA-grade test report viewer' }
    ]
  };

  // Load state from localStorage or default
  var dataState = (0, v.useState)(function() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.months && parsed.items) return parsed;
      }
    } catch(e) {}
    return defaultData;
  });
  var data = dataState[0];
  var setData = dataState[1];

  // Helper to persist
  function persist(nextData) {
    setData(nextData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch(e) {}
  }

  // Active view tab inside sales page: 'ledger' | 'archive'
  var activeTabState = (0, v.useState)('ledger');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];

  // Filter state for status: 'all' | 'proceed' | 'confirm' | 'cancel'
  var filterState = (0, v.useState)('all');
  var filterStatus = filterState[0];
  var setFilterStatus = filterState[1];

  // Search filter
  var searchState = (0, v.useState)('');
  var searchTerm = searchState[0];
  var setSearchTerm = searchState[1];

  // New Sale Form State
  var formClientState = (0, v.useState)('');
  var formClient = formClientState[0];
  var setFormClient = formClientState[1];

  var formProjectState = (0, v.useState)('');
  var formProject = formProjectState[0];
  var setFormProject = formProjectState[1];

  var formServiceState = (0, v.useState)('Web Development');
  var formService = formServiceState[0];
  var setFormService = formServiceState[1];

  var formAmountState = (0, v.useState)('');
  var formAmount = formAmountState[0];
  var setFormAmount = formAmountState[1];

  var formCurrencyState = (0, v.useState)('USD');
  var formCurrency = formCurrencyState[0];
  var setFormCurrency = formCurrencyState[1];

  var formStatusState = (0, v.useState)('proceed');
  var formStatus = formStatusState[0];
  var setFormStatus = formStatusState[1];

  var formDateState = (0, v.useState)(function() {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  });
  var formDate = formDateState[0];
  var setFormDate = formDateState[1];

  var formNotesState = (0, v.useState)('');
  var formNotes = formNotesState[0];
  var setFormNotes = formNotesState[1];

  // Modal for Month Finalize confirmation
  var showCloseModalState = (0, v.useState)(false);
  var showCloseModal = showCloseModalState[0];
  var setShowCloseModal = showCloseModalState[1];

  var rollOverProceedState = (0, v.useState)(true);
  var rollOverProceed = rollOverProceedState[0];
  var setRollOverProceed = rollOverProceedState[1];

  // Currently selected month
  var currentMonth = data.months.find(function(m) { return m.id === data.selectedMonthId; }) || data.months[0];

  // Items for selected month
  var monthItems = data.items.filter(function(item) {
    return item.monthId === currentMonth.id;
  });

  // Filtered items by search & status
  var displayItems = monthItems.filter(function(item) {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchTerm) {
      var q = searchTerm.toLowerCase();
      return (item.clientName && item.clientName.toLowerCase().includes(q)) ||
             (item.projectTitle && item.projectTitle.toLowerCase().includes(q)) ||
             (item.service && item.service.toLowerCase().includes(q)) ||
             (item.notes && item.notes.toLowerCase().includes(q));
    }
    return true;
  });

  // Calculate totals for currently selected month
  var totalAmountUSD = 0;
  var totalAmountBDT = 0;
  var confirmedUSD = 0;
  var confirmedBDT = 0;
  var proceedUSD = 0;
  var proceedBDT = 0;
  var cancelUSD = 0;
  var cancelBDT = 0;

  var confirmedCount = 0;
  var proceedCount = 0;
  var cancelCount = 0;

  monthItems.forEach(function(item) {
    var u = Number(item.amountUSD) || 0;
    var b = Number(item.amountBDT) || Math.round(u * RATE);
    totalAmountUSD += u;
    totalAmountBDT += b;

    if (item.status === 'confirm') {
      confirmedUSD += u;
      confirmedBDT += b;
      confirmedCount++;
    } else if (item.status === 'proceed') {
      proceedUSD += u;
      proceedBDT += b;
      proceedCount++;
    } else if (item.status === 'cancel') {
      cancelUSD += u;
      cancelBDT += b;
      cancelCount++;
    }
  });

  var winRate = (confirmedCount + proceedCount + cancelCount) > 0 
    ? Math.round((confirmedCount / (confirmedCount + proceedCount + cancelCount)) * 100) 
    : 0;

  // Format amount helpers
  function fmtMoney(usd, bdt) {
    if (globalCurrency === 'BDT') {
      return '৳' + (bdt || Math.round(usd * RATE)).toLocaleString('en-IN');
    }
    return '$' + Number(usd).toLocaleString('en-US');
  }

  function fmtDual(usd, bdt) {
    var b = bdt || Math.round(usd * RATE);
    return '$' + Number(usd).toLocaleString('en-US') + ' / ৳' + Number(b).toLocaleString('en-IN');
  }

  // Handle Quick Status Change: Proceed, Confirm, Cancel
  function handleStatusChange(itemId, newStatus) {
    var nextItems = data.items.map(function(item) {
      if (item.id === itemId) {
        return Object.assign({}, item, { status: newStatus });
      }
      return item;
    });

    var targetItem = data.items.find(function(i) { return i.id === itemId; });
    var statusLabels = {
      proceed: 'Proceed (চলমান)',
      confirm: 'Confirm (কনফার্মড)',
      cancel: 'Cancel (বাতিল)'
    };

    persist(Object.assign({}, data, { items: nextItems }));

    if (addToast) {
      addToast({
        type: newStatus === 'confirm' ? 'success' : newStatus === 'cancel' ? 'error' : 'info',
        title: 'Status Updated: ' + statusLabels[newStatus],
        message: '"' + (targetItem ? targetItem.clientName : 'Project') + '" marked as ' + statusLabels[newStatus] + '. Monthly calculations updated.'
      });
    }
  }

  // Handle Add New Sale
  function handleAddSale(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!formClient.trim() || !formAmount || Number(formAmount) <= 0) {
      if (addToast) {
        addToast({
          type: 'error',
          title: 'Missing Details',
          message: 'Please enter client name and a valid sales amount.'
        });
      }
      return;
    }

    var enteredAmt = Number(formAmount);
    var u = formCurrency === 'USD' ? enteredAmt : Math.round(enteredAmt / RATE);
    var b = formCurrency === 'BDT' ? enteredAmt : Math.round(enteredAmt * RATE);

    var newItem = {
      id: 'sale_' + Date.now(),
      monthId: currentMonth.id,
      clientName: formClient.trim(),
      projectTitle: formProject.trim() || 'Appiex Engineering & Growth SOW',
      service: formService,
      amountUSD: u,
      amountBDT: b,
      currency: formCurrency,
      date: formDate,
      status: formStatus,
      notes: formNotes.trim()
    };

    var nextItems = [newItem].concat(data.items);
    persist(Object.assign({}, data, { items: nextItems }));

    // Reset form inputs
    setFormClient('');
    setFormProject('');
    setFormAmount('');
    setFormNotes('');
    setFormStatus('proceed');

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Sale Added Successfully',
        message: '"' + newItem.clientName + '" added to ' + currentMonth.name + ' (' + fmtMoney(u, b) + ').'
      });
    }
  }

  // Handle Delete Sale
  function handleDeleteSale(itemId) {
    if (!confirm('Are you sure you want to delete this sale entry?')) return;
    var nextItems = data.items.filter(function(i) { return i.id !== itemId; });
    persist(Object.assign({}, data, { items: nextItems }));
    if (addToast) {
      addToast({
        type: 'info',
        title: 'Entry Deleted',
        message: 'Sale record has been removed from ledger.'
      });
    }
  }

  // Handle Finalize & Close Month (মাস সম্পন্ন করুন)
  function handleFinalizeMonth() {
    var nowStr = new Date().toISOString().split('T')[0];

    // Compute next month info
    var parts = currentMonth.id.split('-');
    var yr = parseInt(parts[0], 10);
    var mo = parseInt(parts[1], 10);
    var nextMo = mo + 1;
    var nextYr = yr;
    if (nextMo > 12) {
      nextMo = 1;
      nextYr += 1;
    }
    var nextMoStr = (nextMo < 10 ? '0' : '') + nextMo;
    var nextMonthId = nextYr + '-' + nextMoStr;

    var monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var nextMonthName = monthNames[nextMo] + ' ' + nextYr;

    // Update current month to closed
    var updatedMonths = data.months.map(function(m) {
      if (m.id === currentMonth.id) {
        return Object.assign({}, m, { status: 'closed', closedAt: nowStr });
      }
      return m;
    });

    // Check if next month exists in list, else prepend
    var nextMonthExists = updatedMonths.some(function(m) { return m.id === nextMonthId; });
    if (!nextMonthExists) {
      updatedMonths.unshift({
        id: nextMonthId,
        name: nextMonthName,
        status: 'active',
        closedAt: null,
        notes: 'Opened after closing ' + currentMonth.name
      });
    }

    // Handle rollover of 'proceed' items if checked
    var updatedItems = data.items.slice();
    if (rollOverProceed) {
      var currentProceedItems = monthItems.filter(function(i) { return i.status === 'proceed'; });
      currentProceedItems.forEach(function(item) {
        updatedItems.push(Object.assign({}, item, {
          id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          monthId: nextMonthId,
          notes: (item.notes ? item.notes + ' · ' : '') + 'Rolled over from ' + currentMonth.name
        }));
      });
    }

    persist(Object.assign({}, data, {
      selectedMonthId: nextMonthId,
      months: updatedMonths,
      items: updatedItems
    }));

    setShowCloseModal(false);

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Month Finalized & Archived! 🎯',
        message: currentMonth.name + ' successfully closed with ' + confirmedCount + ' confirmed projects (' + fmtMoney(confirmedUSD, confirmedBDT) + '). New active month: ' + nextMonthName + '.'
      });
    }
  }

  // Export Month to CSV
  function handleExportCSV() {
    var headers = ['Month', 'Date', 'Client Name', 'Project Title', 'Service Category', 'Status', 'Amount USD', 'Amount BDT', 'Notes'];
    var rows = monthItems.map(function(i) {
      return [
        '"' + currentMonth.name + '"',
        '"' + (i.date || '') + '"',
        '"' + (i.clientName || '').replace(/"/g, '""') + '"',
        '"' + (i.projectTitle || '').replace(/"/g, '""') + '"',
        '"' + (i.service || '').replace(/"/g, '""') + '"',
        '"' + (i.status || '').toUpperCase() + '"',
        i.amountUSD || 0,
        i.amountBDT || Math.round((i.amountUSD || 0) * RATE),
        '"' + (i.notes || '').replace(/"/g, '""') + '"'
      ].join(',');
    });
    var csvContent = headers.join(',') + '\\n' + rows.join('\\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Appiex_Sales_' + currentMonth.id + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (0, F.jsxs)('div', {
    className: 'space-y-6 animate-in fade-in duration-300 pb-12',
    children: [
      // 1. Top Header Banner & Navigation Tabs
      (0, F.jsxs)('div', {
        className: 'flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-[#12161D] border border-slate-800 shadow-xl relative overflow-hidden',
        children: [
          (0, F.jsx)('div', {
            className: 'absolute top-0 right-0 w-96 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none'
          }),
          (0, F.jsxs)('div', {
            className: 'space-y-1.5 relative z-10',
            children: [
              (0, F.jsxs)('div', {
                className: 'flex items-center gap-2',
                children: [
                  (0, F.jsx)('span', {
                    className: 'px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30',
                    children: 'Appiex Financial OS'
                  }),
                  currentMonth.status === 'active' 
                    ? (0, F.jsxs)('span', {
                        className: 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                        children: [
                          (0, F.jsx)('span', { className: 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' }),
                          'Active Month'
                        ]
                      })
                    : (0, F.jsx)('span', {
                        className: 'px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700',
                        children: '✓ Finalized Month'
                      })
                ]
              }),
              (0, F.jsxs)('h1', {
                className: 'text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2',
                children: [
                  'Monthly Sales & Accounts Ledger',
                  (0, F.jsx)('span', { className: 'text-slate-500 text-lg font-medium', children: '(মাসিক বিক্রয় হিসাব)' })
                ]
              }),
              (0, F.jsx)('p', {
                className: 'text-xs text-slate-400 max-w-2xl leading-relaxed',
                children: 'Track project sales, update deal progress (Proceed, Confirm, Cancel), view live month totals, and automatically archive confirmed projects when closing each month.'
              })
            ]
          }),

          // Action Buttons: Finalize Month, Export CSV, View Switch
          (0, F.jsxs)('div', {
            className: 'flex flex-wrap items-center gap-2 relative z-10',
            children: [
              (0, F.jsxs)('div', {
                className: 'flex p-1 rounded-xl bg-slate-900/90 border border-slate-800',
                children: [
                  (0, F.jsx)('button', {
                    onClick: function() { setActiveTab('ledger'); },
                    className: 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + 
                      (activeTab === 'ledger' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                    children: '📊 Active Ledger'
                  }),
                  (0, F.jsxs)('button', {
                    onClick: function() { setActiveTab('archive'); },
                    className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + 
                      (activeTab === 'archive' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                    children: [
                      '🏛️ Monthly Archive (হিসাব রেকর্ড)',
                      (0, F.jsx)('span', {
                        className: 'px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300',
                        children: data.months.length
                      })
                    ]
                  })
                ]
              }),
              (0, F.jsxs)('button', {
                onClick: handleExportCSV,
                className: 'px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors',
                title: 'Export current month to CSV',
                children: [
                  (0, F.jsx)('span', { children: '📥' }),
                  'Export CSV'
                ]
              }),
              currentMonth.status === 'active' && (0, F.jsxs)('button', {
                onClick: function() { setShowCloseModal(true); },
                className: 'px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20 transition-all',
                title: 'Finalize and close this month, archive confirmed projects',
                children: [
                  (0, F.jsx)('span', { children: '🔒' }),
                  'মাস শেষ করুন (Finalize Month)'
                ]
              })
            ]
          })
        ]
      }),

      // 2. Month Selector Pills Bar
      (0, F.jsxs)('div', {
        className: 'flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#12161D] border border-slate-800/80',
        children: [
          (0, F.jsx)('span', {
            className: 'text-xs font-bold text-slate-400 uppercase tracking-wider px-2',
            children: 'Select Month (মাস নির্বাচন):'
          }),
          data.months.map(function(m) {
            var isSel = m.id === currentMonth.id;
            return (0, F.jsxs)('button', {
              key: m.id,
              onClick: function() {
                persist(Object.assign({}, data, { selectedMonthId: m.id }));
              },
              className: 'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + 
                (isSel 
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10 dark:bg-rose-600 dark:text-white dark:shadow-rose-600/20' 
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'),
              children: [
                (0, F.jsx)('span', { children: m.name }),
                m.status === 'active' 
                  ? (0, F.jsx)('span', { className: 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse' })
                  : (0, F.jsx)('span', { className: 'text-[10px] text-slate-400', children: '✓' })
              ]
            });
          })
        ]
      }),

      // 3. Four Top Executive KPI Cards (Total, Confirmed, Proceed, Cancel)
      (0, F.jsxs)('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        children: [
          // Total Month Volume (মোট হিসাব)
          (0, F.jsxs)('div', {
            className: 'p-5 rounded-2xl bg-[#12161D] border border-slate-800 shadow-lg relative overflow-hidden',
            children: [
              (0, F.jsx)('div', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Total Monthly Sales (মোট হিসাব)' }),
              (0, F.jsx)('div', { className: 'text-2xl font-black text-white mt-1.5', children: fmtMoney(totalAmountUSD, totalAmountBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80',
                children: [
                  (0, F.jsxs)('span', { children: [monthItems.length, ' total entries'] }),
                  (0, F.jsx)('span', { className: 'font-mono text-slate-300', children: fmtDual(totalAmountUSD, totalAmountBDT) })
                ]
              })
            ]
          }),

          // Confirmed Revenue (কনফার্মড প্রজেক্ট সেল)
          (0, F.jsxs)('div', {
            className: 'p-5 rounded-2xl bg-[#12161D] border border-emerald-500/30 shadow-lg relative overflow-hidden',
            children: [
              (0, F.jsx)('div', { className: 'absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none' }),
              (0, F.jsx)('div', { className: 'text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5', children: [
                (0, F.jsx)('span', { className: 'w-2 h-2 rounded-full bg-emerald-400' }),
                'Confirmed Revenue (কনফার্মড)'
              ] }),
              (0, F.jsx)('div', { className: 'text-2xl font-black text-emerald-400 mt-1.5', children: fmtMoney(confirmedUSD, confirmedBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-xs text-emerald-300/80 mt-2 pt-2 border-t border-slate-800/80',
                children: [
                  (0, F.jsxs)('span', { className: 'font-bold', children: ['✓ ', confirmedCount, ' Confirmed Projects'] }),
                  (0, F.jsx)('span', { className: 'font-mono', children: fmtDual(confirmedUSD, confirmedBDT) })
                ]
              })
            ]
          }),

          // In-Pipeline Proceed (চলমান / পাইপলাইন)
          (0, F.jsxs)('div', {
            className: 'p-5 rounded-2xl bg-[#12161D] border border-blue-500/30 shadow-lg relative overflow-hidden',
            children: [
              (0, F.jsx)('div', { className: 'absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none' }),
              (0, F.jsx)('div', { className: 'text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5', children: [
                (0, F.jsx)('span', { className: 'w-2 h-2 rounded-full bg-blue-400' }),
                'In Pipeline (চলমান / Proceed)'
              ] }),
              (0, F.jsx)('div', { className: 'text-2xl font-black text-blue-400 mt-1.5', children: fmtMoney(proceedUSD, proceedBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-xs text-blue-300/80 mt-2 pt-2 border-t border-slate-800/80',
                children: [
                  (0, F.jsxs)('span', { className: 'font-bold', children: ['⏳ ', proceedCount, ' In Progress'] }),
                  (0, F.jsx)('span', { className: 'font-mono', children: fmtDual(proceedUSD, proceedBDT) })
                ]
              })
            ]
          }),

          // Cancelled Deals (বাতিল)
          (0, F.jsxs)('div', {
            className: 'p-5 rounded-2xl bg-[#12161D] border border-rose-500/20 shadow-lg relative overflow-hidden',
            children: [
              (0, F.jsx)('div', { className: 'text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5', children: [
                (0, F.jsx)('span', { className: 'w-2 h-2 rounded-full bg-rose-400' }),
                'Cancelled (বাতিল)'
              ] }),
              (0, F.jsx)('div', { className: 'text-2xl font-black text-rose-400 mt-1.5', children: fmtMoney(cancelUSD, cancelBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-xs text-rose-300/80 mt-2 pt-2 border-t border-slate-800/80',
                children: [
                  (0, F.jsxs)('span', { children: ['✕ ', cancelCount, ' Dropped'] }),
                  (0, F.jsxs)('span', { className: 'font-bold text-slate-300', children: ['Win Rate: ', winRate, '%'] })
                ]
              })
            ]
          })
        ]
      }),

      // TAB 1: ACTIVE LEDGER & ADD SALE FORM
      activeTab === 'ledger' && (0, F.jsxs)('div', {
        className: 'grid grid-cols-1 xl:grid-cols-3 gap-6',
        children: [
          // Left 2 Columns: Project Ledger Table
          (0, F.jsxs)('div', {
            className: 'xl:col-span-2 space-y-4',
            children: [
              // Search & Filter Toolbar
              (0, F.jsxs)('div', {
                className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12161D] border border-slate-800',
                children: [
                  // Filter Buttons
                  (0, F.jsxs)('div', {
                    className: 'flex items-center gap-1.5',
                    children: [
                      [
                        { id: 'all', label: 'All Deals (' + monthItems.length + ')' },
                        { id: 'confirm', label: '✓ Confirmed (' + confirmedCount + ')' },
                        { id: 'proceed', label: '⏳ Proceed (' + proceedCount + ')' },
                        { id: 'cancel', label: '✕ Cancel (' + cancelCount + ')' }
                      ].map(function(btn) {
                        var active = filterStatus === btn.id;
                        return (0, F.jsx)('button', {
                          key: btn.id,
                          onClick: function() { setFilterStatus(btn.id); },
                          className: 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + 
                            (active ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'),
                          children: btn.label
                        });
                      })
                    ]
                  }),

                  // Search Box
                  (0, F.jsx)('input', {
                    type: 'text',
                    value: searchTerm,
                    onChange: function(e) { setSearchTerm(e.target.value); },
                    placeholder: 'Search client, project, service...',
                    className: 'px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500'
                  })
                ]
              }),

              // Items Table / Card List
              displayItems.length === 0 
                ? (0, F.jsxs)('div', {
                    className: 'p-12 text-center rounded-2xl bg-[#12161D] border border-slate-800/80 space-y-2',
                    children: [
                      (0, F.jsx)('div', { className: 'text-3xl', children: '📝' }),
                      (0, F.jsx)('h3', { className: 'text-sm font-bold text-white', children: 'No sales found for this filter' }),
                      (0, F.jsx)('p', { className: 'text-xs text-slate-400', children: 'Add your first sale using the form on the right.' })
                    ]
                  })
                : (0, F.jsx)('div', {
                    className: 'space-y-3',
                    children: displayItems.map(function(item) {
                      var isConfirmed = item.status === 'confirm';
                      var isProceed = item.status === 'proceed';
                      var isCancel = item.status === 'cancel';

                      return (0, F.jsxs)('div', {
                        key: item.id,
                        className: 'p-4 rounded-2xl bg-[#12161D] border transition-all duration-200 ' + 
                          (isConfirmed 
                            ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 to-[#12161D]' 
                            : isProceed 
                              ? 'border-blue-500/30 bg-gradient-to-r from-blue-950/20 to-[#12161D]' 
                              : 'border-slate-800/80 opacity-75'),
                        children: [
                          (0, F.jsxs)('div', {
                            className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                            children: [
                              // Left: Client Name, Project, Service Tag, Date
                              (0, F.jsxs)('div', {
                                className: 'space-y-1 min-w-0',
                                children: [
                                  (0, F.jsxs)('div', {
                                    className: 'flex items-center gap-2 flex-wrap',
                                    children: [
                                      (0, F.jsx)('h3', {
                                        className: 'font-bold text-white text-base',
                                        children: item.clientName
                                      }),
                                      (0, F.jsx)('span', {
                                        className: 'px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700',
                                        children: item.service
                                      }),
                                      (0, F.jsx)('span', {
                                        className: 'text-[11px] text-slate-500 font-mono',
                                        children: item.date
                                      })
                                    ]
                                  }),
                                  (0, F.jsx)('p', {
                                    className: 'text-xs text-slate-300 font-medium',
                                    children: item.projectTitle
                                  }),
                                  item.notes && (0, F.jsxs)('p', {
                                    className: 'text-[11px] text-slate-400 italic',
                                    children: ['Note: ', item.notes]
                                  })
                                ]
                              }),

                              // Right: Amount and Action Buttons
                              (0, F.jsxs)('div', {
                                className: 'flex flex-col sm:items-end gap-2 shrink-0',
                                children: [
                                  (0, F.jsxs)('div', {
                                    className: 'text-right',
                                    children: [
                                      (0, F.jsx)('div', {
                                        className: 'text-lg font-black font-mono ' + 
                                          (isConfirmed ? 'text-emerald-400' : isProceed ? 'text-blue-400' : 'text-slate-400 line-through'),
                                        children: fmtMoney(item.amountUSD, item.amountBDT)
                                      }),
                                      (0, F.jsx)('div', {
                                        className: 'text-[10px] text-slate-400 font-mono',
                                        children: fmtDual(item.amountUSD, item.amountBDT)
                                      })
                                    ]
                                  }),

                                  // Three Action Buttons: Proceed, Confirm, Cancel (Requested by user)
                                  (0, F.jsxs)('div', {
                                    className: 'flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800',
                                    children: [
                                      // Proceed Button
                                      (0, F.jsx)('button', {
                                        onClick: function() { handleStatusChange(item.id, 'proceed'); },
                                        className: 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ' + 
                                          (isProceed 
                                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30' 
                                            : 'text-blue-400/80 hover:text-blue-300 hover:bg-blue-900/30'),
                                        title: 'Mark as Proceed (In-progress deal)',
                                        children: '⏳ Proceed'
                                      }),

                                      // Confirm Button
                                      (0, F.jsx)('button', {
                                        onClick: function() { handleStatusChange(item.id, 'confirm'); },
                                        className: 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ' + 
                                          (isConfirmed 
                                            ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30' 
                                            : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-900/30'),
                                        title: 'Mark as Confirm (Closed revenue deal)',
                                        children: '✓ Confirm'
                                      }),

                                      // Cancel Button
                                      (0, F.jsx)('button', {
                                        onClick: function() { handleStatusChange(item.id, 'cancel'); },
                                        className: 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ' + 
                                          (isCancel 
                                            ? 'bg-rose-600 text-white shadow-xs shadow-rose-500/30' 
                                            : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-900/30'),
                                        title: 'Mark as Cancel (Dropped deal)',
                                        children: '✕ Cancel'
                                      }),

                                      // Delete Icon Button
                                      (0, F.jsx)('button', {
                                        onClick: function() { handleDeleteSale(item.id); },
                                        className: 'p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer',
                                        title: 'Delete this entry',
                                        children: '🗑️'
                                      })
                                    ]
                                  })
                                ]
                              })
                            ]
                          })
                        ]
                      });
                    })
                  })
            ]
          }),

          // Right Column: Add Sale Form (হিসাব যোগ করার ফর্ম)
          (0, F.jsxs)('div', {
            className: 'space-y-4',
            children: [
              (0, F.jsxs)('form', {
                onSubmit: handleAddSale,
                className: 'p-6 rounded-2xl bg-[#12161D] border border-slate-800 shadow-xl space-y-4 sticky top-20',
                children: [
                  (0, F.jsxs)('div', {
                    className: 'flex items-center justify-between pb-3 border-b border-slate-800',
                    children: [
                      (0, F.jsxs)('h2', {
                        className: 'font-bold text-white text-base flex items-center gap-2',
                        children: [
                          '➕ Add Sale Entry',
                          (0, F.jsx)('span', { className: 'text-slate-400 text-xs font-normal', children: '(নতুন হিসাব যোগ করুন)' })
                        ]
                      }),
                      (0, F.jsx)('span', {
                        className: 'text-xs text-rose-400 font-mono font-bold',
                        children: currentMonth.name
                      })
                    ]
                  }),

                  // Client Name
                  (0, F.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Client / Brand Name *' }),
                      (0, F.jsx)('input', {
                        type: 'text',
                        value: formClient,
                        onChange: function(e) { setFormClient(e.target.value); },
                        placeholder: 'e.g. Mamun WiFi, Watch 24 BD, Apex Ltd',
                        required: true,
                        className: 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500'
                      })
                    ]
                  }),

                  // Project Scope / Title
                  (0, F.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Project / Deliverable Title' }),
                      (0, F.jsx)('input', {
                        type: 'text',
                        value: formProject,
                        onChange: function(e) { setFormProject(e.target.value); },
                        placeholder: 'e.g. E-Commerce Redesign + Payment Gateway',
                        className: 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500'
                      })
                    ]
                  }),

                  // Service Category
                  (0, F.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Service Category' }),
                      (0, F.jsxs)('select', {
                        value: formService,
                        onChange: function(e) { setFormService(e.target.value); },
                        className: 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-rose-500',
                        children: [
                          (0, F.jsx)('option', { value: 'Web Development', children: 'Web Development & Next.js' }),
                          (0, F.jsx)('option', { value: '3D & Motion UI', children: '3D & Motion UI (Three.js/WebGL)' }),
                          (0, F.jsx)('option', { value: 'Full-Stack E-Commerce', children: 'Full-Stack E-Commerce' }),
                          (0, F.jsx)('option', { value: 'AI Automation & Agents', children: 'AI Automation & Agents' }),
                          (0, F.jsx)('option', { value: 'SEO & Growth Retainer', children: 'SEO & Growth Retainer' }),
                          (0, F.jsx)('option', { value: 'Custom Web Application', children: 'Custom Web Application' }),
                          (0, F.jsx)('option', { value: 'Creative Design', children: 'Creative UI/UX Design' })
                        ]
                      })
                    ]
                  }),

                  // Amount & Currency
                  (0, F.jsxs)('div', {
                    className: 'grid grid-cols-3 gap-2',
                    children: [
                      (0, F.jsxs)('div', {
                        className: 'col-span-2 space-y-1',
                        children: [
                          (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Amount (মূল্য) *' }),
                          (0, F.jsx)('input', {
                            type: 'number',
                            value: formAmount,
                            onChange: function(e) { setFormAmount(e.target.value); },
                            placeholder: formCurrency === 'USD' ? '1500' : '180000',
                            required: true,
                            min: '1',
                            className: 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono font-bold focus:outline-hidden focus:border-rose-500'
                          })
                        ]
                      }),
                      (0, F.jsxs)('div', {
                        className: 'space-y-1',
                        children: [
                          (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Currency' }),
                          (0, F.jsxs)('select', {
                            value: formCurrency,
                            onChange: function(e) { setFormCurrency(e.target.value); },
                            className: 'w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-hidden focus:border-rose-500',
                            children: [
                              (0, F.jsx)('option', { value: 'USD', children: 'USD ($)' }),
                              (0, F.jsx)('option', { value: 'BDT', children: 'BDT (৳)' })
                            ]
                          })
                        ]
                      })
                    ]
                  }),

                  // Initial Status Selector
                  (0, F.jsxs)('div', {
                    className: 'space-y-1.5',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Initial Status (প্রারম্ভিক অবস্থা)' }),
                      (0, F.jsxs)('div', {
                        className: 'grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-700',
                        children: [
                          (0, F.jsx)('button', {
                            type: 'button',
                            onClick: function() { setFormStatus('proceed'); },
                            className: 'py-1.5 rounded-lg text-xs font-bold transition-all ' + 
                              (formStatus === 'proceed' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                            children: 'Proceed'
                          }),
                          (0, F.jsx)('button', {
                            type: 'button',
                            onClick: function() { setFormStatus('confirm'); },
                            className: 'py-1.5 rounded-lg text-xs font-bold transition-all ' + 
                              (formStatus === 'confirm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                            children: 'Confirm'
                          }),
                          (0, F.jsx)('button', {
                            type: 'button',
                            onClick: function() { setFormStatus('cancel'); },
                            className: 'py-1.5 rounded-lg text-xs font-bold transition-all ' + 
                              (formStatus === 'cancel' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                            children: 'Cancel'
                          })
                        ]
                      })
                    ]
                  }),

                  // Date
                  (0, F.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Date (তারিখ)' }),
                      (0, F.jsx)('input', {
                        type: 'date',
                        value: formDate,
                        onChange: function(e) { setFormDate(e.target.value); },
                        className: 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-rose-500'
                      })
                    ]
                  }),

                  // Notes
                  (0, F.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider', children: 'Notes / Deal Milestones' }),
                      (0, F.jsx)('textarea', {
                        value: formNotes,
                        onChange: function(e) { setFormNotes(e.target.value); },
                        placeholder: 'e.g. 50% advance received, balance on delivery',
                        rows: 2,
                        className: 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500'
                      })
                    ]
                  }),

                  // Submit Button
                  (0, F.jsxs)('button', {
                    type: 'submit',
                    className: 'w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-900/30 transition-all',
                    children: [
                      (0, F.jsx)('span', { children: '＋' }),
                      'Save Sale Entry (হিসাব সংরক্ষণ করুন)'
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      // TAB 2: MONTHLY COMPLETED HISTORY & CONFIRMED PROJECTS ARCHIVE (পাশে মাস শেষ হলে কনফার্ম প্রজেক্ট সহ মাস যুক্ত হওয়া অংশ)
      activeTab === 'archive' && (0, F.jsxs)('div', {
        className: 'space-y-6',
        children: [
          (0, F.jsxs)('div', {
            className: 'p-6 rounded-2xl bg-[#12161D] border border-slate-800 space-y-2',
            children: [
              (0, F.jsxs)('h2', {
                className: 'text-xl font-black text-white flex items-center gap-2',
                children: [
                  '🏛️ Monthly Completed History & Confirmed Projects Archive',
                  (0, F.jsx)('span', { className: 'text-slate-400 text-xs font-normal', children: '(মাস ভিত্তিক সম্পন্ন হিসাব ও প্রজেক্ট রেকর্ড)' })
                ]
              }),
              (0, F.jsx)('p', {
                className: 'text-xs text-slate-400',
                children: 'Whenever a month closes ("মাস শেষ হলে"), all confirmed projects and exact revenue totals are permanently archived and recorded here with individual project breakdowns.'
              })
            ]
          }),

          // Grid of All Months with their confirmed projects
          (0, F.jsx)('div', {
            className: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
            children: data.months.map(function(m) {
              var mItems = data.items.filter(function(i) { return i.monthId === m.id; });
              var mConfirmed = mItems.filter(function(i) { return i.status === 'confirm'; });
              var mProceed = mItems.filter(function(i) { return i.status === 'proceed'; });
              var mCancel = mItems.filter(function(i) { return i.status === 'cancel'; });

              var mConfUSD = mConfirmed.reduce(function(sum, i) { return sum + (Number(i.amountUSD) || 0); }, 0);
              var mConfBDT = mConfirmed.reduce(function(sum, i) { return sum + (Number(i.amountBDT) || Math.round((Number(i.amountUSD) || 0) * RATE)); }, 0);

              var isSelected = m.id === currentMonth.id;

              return (0, F.jsxs)('div', {
                key: m.id,
                className: 'p-6 rounded-2xl bg-[#12161D] border shadow-xl relative overflow-hidden space-y-4 ' + 
                  (m.status === 'active' 
                    ? 'border-emerald-500/40 bg-gradient-to-br from-[#12161D] to-emerald-950/20' 
                    : 'border-slate-800 bg-[#12161D]'),
                children: [
                  // Month Header
                  (0, F.jsxs)('div', {
                    className: 'flex items-center justify-between pb-3 border-b border-slate-800',
                    children: [
                      (0, F.jsxs)('div', {
                        className: 'space-y-1',
                        children: [
                          (0, F.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, F.jsx)('h3', { className: 'text-lg font-black text-white', children: m.name }),
                              m.status === 'active' 
                                ? (0, F.jsx)('span', { className: 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', children: '● Active Cycle' })
                                : (0, F.jsx)('span', { className: 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700', children: '✓ Finalized' })
                            ]
                          }),
                          (0, F.jsx)('p', { className: 'text-[11px] text-slate-400', children: m.notes || ('Closed on ' + m.closedAt) })
                        ]
                      }),
                      (0, F.jsxs)('div', {
                        className: 'text-right',
                        children: [
                          (0, F.jsx)('div', { className: 'text-xl font-black text-emerald-400 font-mono', children: fmtMoney(mConfUSD, mConfBDT) }),
                          (0, F.jsx)('div', { className: 'text-[10px] text-slate-400 font-mono', children: fmtDual(mConfUSD, mConfBDT) })
                        ]
                      })
                    ]
                  }),

                  // Summary Badges (Confirmed, Proceed, Cancelled)
                  (0, F.jsxs)('div', {
                    className: 'grid grid-cols-3 gap-2 text-center text-xs',
                    children: [
                      (0, F.jsxs)('div', {
                        className: 'p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20',
                        children: [
                          (0, F.jsx)('div', { className: 'text-[10px] font-bold text-emerald-400 uppercase', children: 'Confirmed' }),
                          (0, F.jsxs)('div', { className: 'text-sm font-bold text-emerald-300', children: [mConfirmed.length, ' Projects'] })
                        ]
                      }),
                      (0, F.jsxs)('div', {
                        className: 'p-2 rounded-xl bg-blue-500/10 border border-blue-500/20',
                        children: [
                          (0, F.jsx)('div', { className: 'text-[10px] font-bold text-blue-400 uppercase', children: 'Proceed' }),
                          (0, F.jsxs)('div', { className: 'text-sm font-bold text-blue-300', children: [mProceed.length, ' In Progress'] })
                        ]
                      }),
                      (0, F.jsxs)('div', {
                        className: 'p-2 rounded-xl bg-rose-500/10 border border-rose-500/20',
                        children: [
                          (0, F.jsx)('div', { className: 'text-[10px] font-bold text-rose-400 uppercase', children: 'Cancelled' }),
                          (0, F.jsxs)('div', { className: 'text-sm font-bold text-rose-300', children: [mCancel.length, ' Dropped'] })
                        ]
                      })
                    ]
                  }),

                  // Confirmed Projects List (কনফার্মড প্রজেক্ট সমূহ)
                  (0, F.jsxs)('div', {
                    className: 'space-y-2',
                    children: [
                      (0, F.jsxs)('div', {
                        className: 'text-xs font-bold text-slate-300 flex items-center justify-between',
                        children: [
                          (0, F.jsx)('span', { children: '📋 Confirmed Projects (কনফার্মড প্রজেক্টসমূহ):' }),
                          (0, F.jsxs)('span', { className: 'text-[11px] text-emerald-400 font-mono', children: [mConfirmed.length, ' closed'] })
                        ]
                      }),
                      mConfirmed.length === 0 
                        ? (0, F.jsx)('div', { className: 'text-xs text-slate-500 italic p-3 rounded-lg bg-slate-900/60 border border-slate-800', children: 'No confirmed projects for this month yet.' })
                        : (0, F.jsx)('div', {
                            className: 'space-y-1.5 max-h-48 overflow-y-auto pr-1',
                            children: mConfirmed.map(function(item) {
                              return (0, F.jsxs)('div', {
                                key: item.id,
                                className: 'flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs',
                                children: [
                                  (0, F.jsxs)('div', {
                                    className: 'flex items-center gap-2 truncate',
                                    children: [
                                      (0, F.jsx)('span', { className: 'text-emerald-400 font-bold', children: '✓' }),
                                      (0, F.jsx)('span', { className: 'font-bold text-white truncate', children: item.clientName }),
                                      (0, F.jsx)('span', { className: 'text-[10px] text-slate-400 truncate hidden sm:inline', children: '· ' + item.projectTitle })
                                    ]
                                  }),
                                  (0, F.jsx)('span', {
                                    className: 'font-mono font-bold text-emerald-400 shrink-0 ml-2',
                                    children: fmtMoney(item.amountUSD, item.amountBDT)
                                  })
                                ]
                              });
                            })
                          })
                    ]
                  }),

                  // Action: Switch to this month in Ledger
                  (0, F.jsxs)('div', {
                    className: 'pt-2 border-t border-slate-800/80 flex items-center justify-between',
                    children: [
                      (0, F.jsx)('span', { className: 'text-[11px] text-slate-500', children: isSelected ? '● Currently viewing' : 'Archived month record' }),
                      (0, F.jsx)('button', {
                        onClick: function() {
                          persist(Object.assign({}, data, { selectedMonthId: m.id }));
                          setActiveTab('ledger');
                        },
                        className: 'px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors',
                        children: 'Open Month Ledger →'
                      })
                    ]
                  })
                ]
              });
            })
          })
        ]
      }),

      // 4. Modal: Finalize Month Confirmation (মাস শেষ করার কনফার্মেশন মোডাল)
      showCloseModal && (0, F.jsx)('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in',
        children: (0, F.jsxs)('div', {
          className: 'w-full max-w-lg rounded-2xl bg-[#14181E] border border-slate-700 shadow-2xl p-6 space-y-4 animate-in zoom-in-95',
          children: [
            (0, F.jsxs)('div', {
              className: 'flex items-center gap-2.5 text-emerald-400 font-bold text-base',
              children: [
                (0, F.jsx)('span', { className: 'text-2xl', children: '🔒' }),
                (0, F.jsxs)('span', { children: ['Finalize & Close ', currentMonth.name, ' (মাস শেষ করুন)'] })
              ]
            }),
            (0, F.jsxs)('p', {
              className: 'text-xs text-slate-300 leading-relaxed',
              children: [
                'Are you ready to close the sales cycle for ',
                (0, F.jsx)('strong', { className: 'text-white', children: currentMonth.name }),
                '? All ',
                (0, F.jsx)('strong', { className: 'text-emerald-400', children: confirmedCount + ' confirmed projects' }),
                ' (' + fmtMoney(confirmedUSD, confirmedBDT) + ') will be permanently archived into monthly history.'
              ]
            }),

            // Rollover Option
            (0, F.jsxs)('label', {
              className: 'flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 cursor-pointer select-none',
              children: [
                (0, F.jsx)('input', {
                  type: 'checkbox',
                  checked: rollOverProceed,
                  onChange: function(e) { setRollOverProceed(e.target.checked); },
                  className: 'mt-0.5 rounded text-rose-600 focus:ring-0 cursor-pointer'
                }),
                (0, F.jsxs)('div', {
                  className: 'text-xs space-y-0.5',
                  children: [
                    (0, F.jsx)('div', { className: 'font-bold text-white', children: 'Roll over unconfirmed "Proceed" projects to next month' }),
                    (0, F.jsxs)('div', { className: 'text-slate-400', children: [proceedCount, ' in-progress deals will automatically transfer to the new active month.'] })
                  ]
                })
              ]
            }),

            // Summary Breakdown
            (0, F.jsxs)('div', {
              className: 'p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5',
              children: [
                (0, F.jsxs)('div', { className: 'flex justify-between text-slate-400', children: [(0, F.jsx)('span', { children: 'Confirmed Deals:' }), (0, F.jsx)('span', { className: 'font-mono text-emerald-400 font-bold', children: fmtMoney(confirmedUSD, confirmedBDT) })] }),
                (0, F.jsxs)('div', { className: 'flex justify-between text-slate-400', children: [(0, F.jsx)('span', { children: 'In Progress (Proceed):' }), (0, F.jsx)('span', { className: 'font-mono text-blue-400', children: fmtMoney(proceedUSD, proceedBDT) })] }),
                (0, F.jsxs)('div', { className: 'flex justify-between text-slate-400', children: [(0, F.jsx)('span', { children: 'Cancelled Deals:' }), (0, F.jsx)('span', { className: 'font-mono text-rose-400', children: fmtMoney(cancelUSD, cancelBDT) })] })
              ]
            }),

            // Modal Actions
            (0, F.jsxs)('div', {
              className: 'flex items-center justify-end gap-2 pt-2 border-t border-slate-800',
              children: [
                (0, F.jsx)('button', {
                  type: 'button',
                  onClick: function() { setShowCloseModal(false); },
                  className: 'px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 cursor-pointer',
                  children: 'Cancel'
                }),
                (0, F.jsx)('button', {
                  type: 'button',
                  onClick: handleFinalizeMonth,
                  className: 'px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-900/40',
                  children: 'Confirm & Archive Month'
                })
              ]
            })
          ]
        })
      })
    ]
  });
}
`;
}
