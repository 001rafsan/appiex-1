import fs from 'node:fs';
import path from 'node:path';

export function getMonthlySalesViewCode() {
  return `
function MonthlySalesView() {
  var ctx = I();
  var addToast = ctx.addToast;
  var globalCurrency = ctx.currency;

  var STORAGE_KEY = 'appiex_monthly_sales_v2';
  var RATE = 122; // 1 USD = 122 BDT

  // Clean initial state with all amounts starting at 0
  var defaultData = {
    selectedMonthId: '2026-11',
    months: [
      { id: '2026-11', name: 'November 2026', status: 'active', closedAt: null, notes: 'Active sales cycle' }
    ],
    items: []
  };

  // Load state from localStorage or default
  var dataState = (0, v.useState)(function() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.months && Array.isArray(parsed.items)) return parsed;
      }
    } catch(e) {}
    return defaultData;
  });
  var data = dataState[0];
  var setData = dataState[1];

  function persist(nextData) {
    setData(nextData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch(e) {}
  }

  // Active view tab: 'ledger' | 'archive'
  var activeTabState = (0, v.useState)('ledger');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];

  // Status Filter: 'all' | 'proceed' | 'confirm' | 'cancel'
  var filterState = (0, v.useState)('all');
  var filterStatus = filterState[0];
  var setFilterStatus = filterState[1];

  // Search filter
  var searchState = (0, v.useState)('');
  var searchTerm = searchState[0];
  var setSearchTerm = searchState[1];

  // Form states
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

  // Month Finalize Confirmation Modal
  var showCloseModalState = (0, v.useState)(false);
  var showCloseModal = showCloseModalState[0];
  var setShowCloseModal = showCloseModalState[1];

  var rollOverProceedState = (0, v.useState)(true);
  var rollOverProceed = rollOverProceedState[0];
  var setRollOverProceed = rollOverProceedState[1];

  // Currently selected month
  var currentMonth = data.months.find(function(m) { return m.id === data.selectedMonthId; }) || data.months[0] || { id: '2026-11', name: 'November 2026', status: 'active' };

  // Items for selected month
  var monthItems = data.items.filter(function(item) {
    return item.monthId === currentMonth.id;
  });

  // Filtered items
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

  // Calculate totals
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
        title: 'Status: ' + statusLabels[newStatus],
        message: '"' + (targetItem ? targetItem.clientName : 'Project') + '" marked as ' + statusLabels[newStatus]
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
          message: 'Please enter client name and a valid amount.'
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

    setFormClient('');
    setFormProject('');
    setFormAmount('');
    setFormNotes('');
    setFormStatus('proceed');

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Sale Added',
        message: '"' + newItem.clientName + '" added (' + fmtMoney(u, b) + ').'
      });
    }
  }

  // Handle Delete Sale
  function handleDeleteSale(itemId) {
    if (!confirm('Delete this entry?')) return;
    var nextItems = data.items.filter(function(i) { return i.id !== itemId; });
    persist(Object.assign({}, data, { items: nextItems }));
    if (addToast) {
      addToast({
        type: 'info',
        title: 'Entry Deleted',
        message: 'Sale record has been removed.'
      });
    }
  }

  // Handle Finalize & Close Month
  function handleFinalizeMonth() {
    var nowStr = new Date().toISOString().split('T')[0];
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

    var updatedMonths = data.months.map(function(m) {
      if (m.id === currentMonth.id) {
        return Object.assign({}, m, { status: 'closed', closedAt: nowStr });
      }
      return m;
    });

    var nextMonthExists = updatedMonths.some(function(m) { return m.id === nextMonthId; });
    if (!nextMonthExists) {
      updatedMonths.unshift({
        id: nextMonthId,
        name: nextMonthName,
        status: 'active',
        closedAt: null,
        notes: 'Active cycle'
      });
    }

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
        title: 'Month Closed & Archived',
        message: currentMonth.name + ' archived. Active month is now ' + nextMonthName + '.'
      });
    }
  }

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
    link.setAttribute('download', 'Sales_' + currentMonth.id + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (0, F.jsxs)('div', {
    className: 'space-y-3.5 animate-in fade-in duration-200 pb-8 text-xs',
    children: [
      // 1. Top Header Banner - Borderless, compact, clean
      (0, F.jsxs)('div', {
        className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0e1217] relative overflow-hidden',
        children: [
          (0, F.jsxs)('div', {
            className: 'space-y-1 relative z-10',
            children: [
              (0, F.jsxs)('div', {
                className: 'flex items-center gap-2',
                children: [
                  (0, F.jsx)('span', {
                    className: 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400',
                    children: 'Appiex Financial OS'
                  }),
                  currentMonth.status === 'active' 
                    ? (0, F.jsxs)('span', {
                        className: 'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400',
                        children: [
                          (0, F.jsx)('span', { className: 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' }),
                          'Active Month'
                        ]
                      })
                    : (0, F.jsx)('span', {
                        className: 'px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400',
                        children: '✓ Finalized'
                      })
                ]
              }),
              (0, F.jsxs)('h1', {
                className: 'text-lg font-bold text-white tracking-tight flex items-center gap-1.5',
                children: [
                  'Monthly Sales & Accounts',
                  (0, F.jsx)('span', { className: 'text-slate-400 text-xs font-normal', children: '(মাসিক বিক্রয় হিসাব)' })
                ]
              })
            ]
          }),

          // Header Actions
          (0, F.jsxs)('div', {
            className: 'flex flex-wrap items-center gap-1.5 relative z-10',
            children: [
              (0, F.jsxs)('div', {
                className: 'flex p-0.5 rounded-lg bg-[#141922]',
                children: [
                  (0, F.jsx)('button', {
                    onClick: function() { setActiveTab('ledger'); },
                    className: 'px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ' + 
                      (activeTab === 'ledger' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                    children: 'Active Ledger'
                  }),
                  (0, F.jsxs)('button', {
                    onClick: function() { setActiveTab('archive'); },
                    className: 'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ' + 
                      (activeTab === 'archive' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                    children: [
                      'Archive (হিসাব রেকর্ড)',
                      (0, F.jsx)('span', {
                        className: 'px-1 rounded bg-slate-800 text-[9px] text-slate-300 font-mono',
                        children: data.months.length
                      })
                    ]
                  })
                ]
              }),
              (0, F.jsx)('button', {
                onClick: handleExportCSV,
                className: 'px-2.5 py-1 rounded-lg bg-[#141922] hover:bg-slate-800 text-slate-300 text-[11px] font-semibold cursor-pointer transition-colors',
                children: '📥 CSV'
              }),
              currentMonth.status === 'active' && (0, F.jsx)('button', {
                onClick: function() { setShowCloseModal(true); },
                className: 'px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer shadow-xs transition-all',
                children: '🔒 মাস শেষ করুন (Finalize)'
              })
            ]
          })
        ]
      }),

      // 2. Month Selector - Borderless, clear contrast (No pure white box bug)
      (0, F.jsxs)('div', {
        className: 'flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#0e1217]',
        children: [
          (0, F.jsx)('span', {
            className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1.5',
            children: 'Month:'
          }),
          data.months.map(function(m) {
            var isSel = m.id === currentMonth.id;
            return (0, F.jsxs)('button', {
              key: m.id,
              onClick: function() {
                persist(Object.assign({}, data, { selectedMonthId: m.id }));
              },
              className: 'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ' + 
                (isSel 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-[#141922] text-slate-300 hover:text-white hover:bg-slate-800'),
              children: [
                (0, F.jsx)('span', { children: m.name }),
                m.status === 'active' 
                  ? (0, F.jsx)('span', { className: 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' })
                  : (0, F.jsx)('span', { className: 'text-[9px] text-slate-300', children: '✓' })
              ]
            });
          })
        ]
      }),

      // 3. Four Top Executive KPI Cards - Borderless, compact size
      (0, F.jsxs)('div', {
        className: 'grid grid-cols-2 lg:grid-cols-4 gap-2.5',
        children: [
          // Total Monthly Sales (মোট হিসাব)
          (0, F.jsxs)('div', {
            className: 'p-3 rounded-xl bg-[#0e1217] space-y-1',
            children: [
              (0, F.jsx)('div', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Total Sales (মোট হিসাব)' }),
              (0, F.jsx)('div', { className: 'text-xl font-bold text-white font-mono', children: fmtMoney(totalAmountUSD, totalAmountBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-[10px] text-slate-400 pt-1',
                children: [
                  (0, F.jsxs)('span', { children: [monthItems.length, ' entries'] }),
                  (0, F.jsx)('span', { className: 'font-mono text-slate-400', children: fmtDual(totalAmountUSD, totalAmountBDT) })
                ]
              })
            ]
          }),

          // Confirmed Revenue (কনফার্মড)
          (0, F.jsxs)('div', {
            className: 'p-3 rounded-xl bg-[#0e1217] space-y-1',
            children: [
              (0, F.jsx)('div', { className: 'text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1', children: [
                (0, F.jsx)('span', { className: 'w-1.5 h-1.5 rounded-full bg-emerald-400' }),
                'Confirmed (কনফার্মড)'
              ] }),
              (0, F.jsx)('div', { className: 'text-xl font-bold text-emerald-400 font-mono', children: fmtMoney(confirmedUSD, confirmedBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-[10px] text-emerald-400/80 pt-1',
                children: [
                  (0, F.jsxs)('span', { className: 'font-bold', children: ['✓ ', confirmedCount, ' Confirmed'] }),
                  (0, F.jsx)('span', { className: 'font-mono', children: fmtDual(confirmedUSD, confirmedBDT) })
                ]
              })
            ]
          }),

          // In Pipeline (চলমান / Proceed)
          (0, F.jsxs)('div', {
            className: 'p-3 rounded-xl bg-[#0e1217] space-y-1',
            children: [
              (0, F.jsx)('div', { className: 'text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1', children: [
                (0, F.jsx)('span', { className: 'w-1.5 h-1.5 rounded-full bg-blue-400' }),
                'In Pipeline (চলমান)'
              ] }),
              (0, F.jsx)('div', { className: 'text-xl font-bold text-blue-400 font-mono', children: fmtMoney(proceedUSD, proceedBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-[10px] text-blue-400/80 pt-1',
                children: [
                  (0, F.jsxs)('span', { className: 'font-bold', children: ['⏳ ', proceedCount, ' Proceeding'] }),
                  (0, F.jsx)('span', { className: 'font-mono', children: fmtDual(proceedUSD, proceedBDT) })
                ]
              })
            ]
          }),

          // Cancelled (বাতিল)
          (0, F.jsxs)('div', {
            className: 'p-3 rounded-xl bg-[#0e1217] space-y-1',
            children: [
              (0, F.jsx)('div', { className: 'text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1', children: [
                (0, F.jsx)('span', { className: 'w-1.5 h-1.5 rounded-full bg-rose-400' }),
                'Cancelled (বাতিল)'
              ] }),
              (0, F.jsx)('div', { className: 'text-xl font-bold text-rose-400 font-mono', children: fmtMoney(cancelUSD, cancelBDT) }),
              (0, F.jsxs)('div', {
                className: 'flex items-center justify-between text-[10px] text-rose-400/80 pt-1',
                children: [
                  (0, F.jsxs)('span', { children: ['✕ ', cancelCount, ' Dropped'] }),
                  (0, F.jsxs)('span', { className: 'font-bold text-slate-400', children: ['Win: ', winRate, '%'] })
                ]
              })
            ]
          })
        ]
      }),

      // TAB 1: ACTIVE LEDGER & ADD SALE FORM
      activeTab === 'ledger' && (0, F.jsxs)('div', {
        className: 'grid grid-cols-1 lg:grid-cols-3 gap-3.5',
        children: [
          // Left 2 Columns: Deal Items List
          (0, F.jsxs)('div', {
            className: 'lg:col-span-2 space-y-2.5',
            children: [
              // Search & Filter Toolbar - Borderless
              (0, F.jsxs)('div', {
                className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0e1217]',
                children: [
                  // Filter Buttons
                  (0, F.jsxs)('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      [
                        { id: 'all', label: 'All (' + monthItems.length + ')' },
                        { id: 'confirm', label: '✓ Confirmed (' + confirmedCount + ')' },
                        { id: 'proceed', label: '⏳ Proceed (' + proceedCount + ')' },
                        { id: 'cancel', label: '✕ Cancel (' + cancelCount + ')' }
                      ].map(function(btn) {
                        var active = filterStatus === btn.id;
                        return (0, F.jsx)('button', {
                          key: btn.id,
                          onClick: function() { setFilterStatus(btn.id); },
                          className: 'px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ' + 
                            (active ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white bg-[#141922]'),
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
                    placeholder: 'Search client, project...',
                    className: 'px-2.5 py-1 rounded-lg bg-[#141922] text-[11px] text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500'
                  })
                ]
              }),

              // Items List
              displayItems.length === 0 
                ? (0, F.jsxs)('div', {
                    className: 'p-8 text-center rounded-xl bg-[#0e1217] space-y-1',
                    children: [
                      (0, F.jsx)('div', { className: 'text-2xl', children: '📝' }),
                      (0, F.jsx)('h3', { className: 'text-xs font-bold text-white', children: 'No sales added yet ($0)' }),
                      (0, F.jsx)('p', { className: 'text-[11px] text-slate-400', children: 'Use the form on the right to add your first client project deal.' })
                    ]
                  })
                : (0, F.jsx)('div', {
                    className: 'space-y-2',
                    children: displayItems.map(function(item) {
                      var isConfirmed = item.status === 'confirm';
                      var isProceed = item.status === 'proceed';
                      var isCancel = item.status === 'cancel';

                      return (0, F.jsxs)('div', {
                        key: item.id,
                        className: 'p-3 rounded-xl bg-[#0e1217] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5',
                        children: [
                          // Left Details with Visible Status Tag
                          (0, F.jsxs)('div', {
                            className: 'space-y-1 min-w-0',
                            children: [
                              (0, F.jsxs)('div', {
                                className: 'flex items-center gap-1.5 flex-wrap',
                                children: [
                                  // Distinct Status Tag (Always Visible)
                                  isConfirmed && (0, F.jsx)('span', {
                                    className: 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40',
                                    children: '✓ Confirmed'
                                  }),
                                  isProceed && (0, F.jsx)('span', {
                                    className: 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40',
                                    children: '⏳ Proceed'
                                  }),
                                  isCancel && (0, F.jsx)('span', {
                                    className: 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40',
                                    children: '✕ Cancelled'
                                  }),
                                  (0, F.jsx)('h3', {
                                    className: 'font-bold text-white text-sm',
                                    children: item.clientName
                                  }),
                                  (0, F.jsx)('span', {
                                    className: 'px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#141922] text-slate-300',
                                    children: item.service
                                  }),
                                  (0, F.jsx)('span', {
                                    className: 'text-[10px] text-slate-500 font-mono',
                                    children: item.date
                                  })
                                ]
                              }),
                              (0, F.jsx)('p', {
                                className: 'text-[11px] text-slate-300',
                                children: item.projectTitle
                              }),
                              item.notes && (0, F.jsxs)('p', {
                                className: 'text-[10px] text-slate-400 italic',
                                children: ['Note: ', item.notes]
                              })
                            ]
                          }),

                          // Right: Amount + Distinct 3 Action Buttons (Proceed, Confirm, Cancel)
                          (0, F.jsxs)('div', {
                            className: 'flex flex-col sm:items-end gap-1.5 shrink-0',
                            children: [
                              (0, F.jsxs)('div', {
                                className: 'text-left sm:text-right',
                                children: [
                                  (0, F.jsx)('div', {
                                    className: 'text-base font-bold font-mono ' + 
                                      (isConfirmed ? 'text-emerald-400' : isProceed ? 'text-blue-400' : 'text-slate-400 line-through'),
                                    children: fmtMoney(item.amountUSD, item.amountBDT)
                                  }),
                                  (0, F.jsx)('div', {
                                    className: 'text-[9px] text-slate-400 font-mono',
                                    children: fmtDual(item.amountUSD, item.amountBDT)
                                  })
                                ]
                              }),

                              // High-contrast, easily visible action buttons
                              (0, F.jsxs)('div', {
                                className: 'flex items-center gap-1 p-0.5 rounded-lg bg-[#141922]',
                                children: [
                                  // Proceed Button (Clear mark)
                                  (0, F.jsxs)('button', {
                                    type: 'button',
                                    onClick: function() { handleStatusChange(item.id, 'proceed'); },
                                    className: 'px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ' + 
                                      (isProceed 
                                        ? 'bg-blue-600 text-white ring-1 ring-blue-300 shadow-sm' 
                                        : 'text-blue-400 hover:text-white hover:bg-blue-900/40'),
                                    children: [
                                      (0, F.jsx)('span', { children: isProceed ? '●' : '⏳' }),
                                      'Proceed'
                                    ]
                                  }),

                                  // Confirm Button (Clear mark)
                                  (0, F.jsxs)('button', {
                                    type: 'button',
                                    onClick: function() { handleStatusChange(item.id, 'confirm'); },
                                    className: 'px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ' + 
                                      (isConfirmed 
                                        ? 'bg-emerald-600 text-white ring-1 ring-emerald-300 shadow-sm' 
                                        : 'text-emerald-400 hover:text-white hover:bg-emerald-900/40'),
                                    children: [
                                      (0, F.jsx)('span', { children: '✓' }),
                                      'Confirm'
                                    ]
                                  }),

                                  // Cancel Button (Clear mark)
                                  (0, F.jsxs)('button', {
                                    type: 'button',
                                    onClick: function() { handleStatusChange(item.id, 'cancel'); },
                                    className: 'px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ' + 
                                      (isCancel 
                                        ? 'bg-rose-600 text-white ring-1 ring-rose-300 shadow-sm' 
                                        : 'text-rose-400 hover:text-white hover:bg-rose-900/40'),
                                    children: [
                                      (0, F.jsx)('span', { children: '✕' }),
                                      'Cancel'
                                    ]
                                  }),

                                  // Delete
                                  (0, F.jsx)('button', {
                                    type: 'button',
                                    onClick: function() { handleDeleteSale(item.id); },
                                    className: 'p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer',
                                    children: '🗑️'
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

          // Right Column: Add Sale Form - Borderless, compact size
          (0, F.jsxs)('div', {
            className: 'space-y-3',
            children: [
              (0, F.jsxs)('form', {
                onSubmit: handleAddSale,
                className: 'p-3.5 rounded-xl bg-[#0e1217] space-y-2.5 sticky top-20',
                children: [
                  (0, F.jsxs)('div', {
                    className: 'flex items-center justify-between pb-2 border-b border-slate-800/80',
                    children: [
                      (0, F.jsxs)('h2', {
                        className: 'font-bold text-white text-xs flex items-center gap-1.5',
                        children: [
                          '➕ Add Sale Entry',
                          (0, F.jsx)('span', { className: 'text-slate-400 text-[10px] font-normal', children: '(হিসাব যোগ করুন)' })
                        ]
                      }),
                      (0, F.jsx)('span', {
                        className: 'text-[10px] text-rose-400 font-mono font-bold',
                        children: currentMonth.name
                      })
                    ]
                  }),

                  // Client Name
                  (0, F.jsxs)('div', {
                    className: 'space-y-0.5',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Client / Brand Name *' }),
                      (0, F.jsx)('input', {
                        type: 'text',
                        value: formClient,
                        onChange: function(e) { setFormClient(e.target.value); },
                        placeholder: 'e.g. Mamun WiFi, Watch 24 BD',
                        required: true,
                        className: 'w-full px-2.5 py-1.5 rounded-lg bg-[#141922] text-[11px] text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500'
                      })
                    ]
                  }),

                  // Project Scope
                  (0, F.jsxs)('div', {
                    className: 'space-y-0.5',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Project / Scope' }),
                      (0, F.jsx)('input', {
                        type: 'text',
                        value: formProject,
                        onChange: function(e) { setFormProject(e.target.value); },
                        placeholder: 'e.g. Web Development & Portal',
                        className: 'w-full px-2.5 py-1.5 rounded-lg bg-[#141922] text-[11px] text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500'
                      })
                    ]
                  }),

                  // Service Category
                  (0, F.jsxs)('div', {
                    className: 'space-y-0.5',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Service' }),
                      (0, F.jsxs)('select', {
                        value: formService,
                        onChange: function(e) { setFormService(e.target.value); },
                        className: 'w-full px-2 py-1.5 rounded-lg bg-[#141922] text-[11px] text-white focus:outline-hidden focus:ring-1 focus:ring-rose-500',
                        children: [
                          (0, F.jsx)('option', { value: 'Web Development', children: 'Web Development' }),
                          (0, F.jsx)('option', { value: '3D & Motion UI', children: '3D & Motion UI' }),
                          (0, F.jsx)('option', { value: 'Full-Stack E-Commerce', children: 'Full-Stack E-Commerce' }),
                          (0, F.jsx)('option', { value: 'AI Automation', children: 'AI Automation' }),
                          (0, F.jsx)('option', { value: 'SEO Retainer', children: 'SEO Retainer' }),
                          (0, F.jsx)('option', { value: 'Custom Web Application', children: 'Custom Web Application' }),
                          (0, F.jsx)('option', { value: 'Creative Design', children: 'Creative UI/UX Design' })
                        ]
                      })
                    ]
                  }),

                  // Amount & Currency
                  (0, F.jsxs)('div', {
                    className: 'grid grid-cols-3 gap-1.5',
                    children: [
                      (0, F.jsxs)('div', {
                        className: 'col-span-2 space-y-0.5',
                        children: [
                          (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Amount (টাকা / ডলার) *' }),
                          (0, F.jsx)('input', {
                            type: 'number',
                            value: formAmount,
                            onChange: function(e) { setFormAmount(e.target.value); },
                            placeholder: '0',
                            required: true,
                            min: '1',
                            className: 'w-full px-2.5 py-1.5 rounded-lg bg-[#141922] text-[11px] text-white placeholder-slate-500 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-rose-500'
                          })
                        ]
                      }),
                      (0, F.jsxs)('div', {
                        className: 'space-y-0.5',
                        children: [
                          (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Currency' }),
                          (0, F.jsxs)('select', {
                            value: formCurrency,
                            onChange: function(e) { setFormCurrency(e.target.value); },
                            className: 'w-full px-1.5 py-1.5 rounded-lg bg-[#141922] text-[11px] text-white font-bold focus:outline-hidden focus:ring-1 focus:ring-rose-500',
                            children: [
                              (0, F.jsx)('option', { value: 'USD', children: 'USD ($)' }),
                              (0, F.jsx)('option', { value: 'BDT', children: 'BDT (৳)' })
                            ]
                          })
                        ]
                      })
                    ]
                  }),

                  // Initial Status
                  (0, F.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Initial Status' }),
                      (0, F.jsxs)('div', {
                        className: 'grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#141922]',
                        children: [
                          (0, F.jsx)('button', {
                            type: 'button',
                            onClick: function() { setFormStatus('proceed'); },
                            className: 'py-1 rounded text-[10px] font-bold cursor-pointer transition-all ' + 
                              (formStatus === 'proceed' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                            children: 'Proceed'
                          }),
                          (0, F.jsx)('button', {
                            type: 'button',
                            onClick: function() { setFormStatus('confirm'); },
                            className: 'py-1 rounded text-[10px] font-bold cursor-pointer transition-all ' + 
                              (formStatus === 'confirm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                            children: 'Confirm'
                          }),
                          (0, F.jsx)('button', {
                            type: 'button',
                            onClick: function() { setFormStatus('cancel'); },
                            className: 'py-1 rounded text-[10px] font-bold cursor-pointer transition-all ' + 
                              (formStatus === 'cancel' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'),
                            children: 'Cancel'
                          })
                        ]
                      })
                    ]
                  }),

                  // Date
                  (0, F.jsxs)('div', {
                    className: 'space-y-0.5',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Date' }),
                      (0, F.jsx)('input', {
                        type: 'date',
                        value: formDate,
                        onChange: function(e) { setFormDate(e.target.value); },
                        className: 'w-full px-2.5 py-1.5 rounded-lg bg-[#141922] text-[11px] text-white focus:outline-hidden focus:ring-1 focus:ring-rose-500'
                      })
                    ]
                  }),

                  // Notes
                  (0, F.jsxs)('div', {
                    className: 'space-y-0.5',
                    children: [
                      (0, F.jsx)('label', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Notes' }),
                      (0, F.jsx)('input', {
                        type: 'text',
                        value: formNotes,
                        onChange: function(e) { setFormNotes(e.target.value); },
                        placeholder: 'e.g. 50% advance received',
                        className: 'w-full px-2.5 py-1.5 rounded-lg bg-[#141922] text-[11px] text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500'
                      })
                    ]
                  }),

                  // Submit Button
                  (0, F.jsx)('button', {
                    type: 'submit',
                    className: 'w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-all',
                    children: '+ Add Sale (হিসাব সংরক্ষণ করুন)'
                  })
                ]
              })
            ]
          })
        ]
      }),

      // TAB 2: ARCHIVE OF PAST MONTHS & CONFIRMED PROJECTS
      activeTab === 'archive' && (0, F.jsxs)('div', {
        className: 'space-y-3.5',
        children: [
          (0, F.jsxs)('div', {
            className: 'p-3.5 rounded-xl bg-[#0e1217] space-y-1',
            children: [
              (0, F.jsxs)('h2', {
                className: 'text-sm font-bold text-white flex items-center gap-1.5',
                children: [
                  '🏛️ Monthly Archive & Confirmed Projects',
                  (0, F.jsx)('span', { className: 'text-slate-400 text-[11px] font-normal', children: '(মাস ভিত্তিক সম্পন্ন হিসাব ও রেকর্ড)' })
                ]
              }),
              (0, F.jsx)('p', {
                className: 'text-[11px] text-slate-400',
                children: 'Every month closed has its confirmed projects and total revenue archived here.'
              })
            ]
          }),

          (0, F.jsx)('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-3.5',
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
                className: 'p-4 rounded-xl bg-[#0e1217] space-y-3',
                children: [
                  (0, F.jsxs)('div', {
                    className: 'flex items-center justify-between pb-2 border-b border-slate-800/80',
                    children: [
                      (0, F.jsxs)('div', {
                        className: 'space-y-0.5',
                        children: [
                          (0, F.jsxs)('div', {
                            className: 'flex items-center gap-1.5',
                            children: [
                              (0, F.jsx)('h3', { className: 'text-sm font-bold text-white', children: m.name }),
                              m.status === 'active' 
                                ? (0, F.jsx)('span', { className: 'px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400', children: '● Active' })
                                : (0, F.jsx)('span', { className: 'px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#141922] text-slate-400', children: '✓ Finalized' })
                            ]
                          }),
                          (0, F.jsx)('p', { className: 'text-[10px] text-slate-400', children: m.notes || ('Closed on ' + m.closedAt) })
                        ]
                      }),
                      (0, F.jsxs)('div', {
                        className: 'text-right',
                        children: [
                          (0, F.jsx)('div', { className: 'text-base font-bold text-emerald-400 font-mono', children: fmtMoney(mConfUSD, mConfBDT) }),
                          (0, F.jsx)('div', { className: 'text-[9px] text-slate-400 font-mono', children: fmtDual(mConfUSD, mConfBDT) })
                        ]
                      })
                    ]
                  }),

                  // Badges
                  (0, F.jsxs)('div', {
                    className: 'grid grid-cols-3 gap-1.5 text-center text-[10px]',
                    children: [
                      (0, F.jsxs)('div', {
                        className: 'p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 font-bold',
                        children: [mConfirmed.length, ' Confirmed']
                      }),
                      (0, F.jsxs)('div', {
                        className: 'p-1.5 rounded-lg bg-blue-500/10 text-blue-300 font-bold',
                        children: [mProceed.length, ' Proceed']
                      }),
                      (0, F.jsxs)('div', {
                        className: 'p-1.5 rounded-lg bg-rose-500/10 text-rose-300 font-bold',
                        children: [mCancel.length, ' Cancelled']
                      })
                    ]
                  }),

                  // Confirmed Projects List
                  (0, F.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, F.jsx)('div', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider', children: 'Confirmed Projects:' }),
                      mConfirmed.length === 0 
                        ? (0, F.jsx)('div', { className: 'text-[11px] text-slate-500 italic p-2 rounded bg-[#141922]', children: 'No confirmed projects yet.' })
                        : (0, F.jsx)('div', {
                            className: 'space-y-1 max-h-36 overflow-y-auto pr-1',
                            children: mConfirmed.map(function(item) {
                              return (0, F.jsxs)('div', {
                                key: item.id,
                                className: 'flex items-center justify-between p-1.5 rounded-lg bg-[#141922] text-[11px]',
                                children: [
                                  (0, F.jsxs)('div', {
                                    className: 'flex items-center gap-1.5 truncate',
                                    children: [
                                      (0, F.jsx)('span', { className: 'text-emerald-400 font-bold', children: '✓' }),
                                      (0, F.jsx)('span', { className: 'font-semibold text-white truncate', children: item.clientName }),
                                      (0, F.jsx)('span', { className: 'text-[10px] text-slate-400 truncate hidden sm:inline', children: '· ' + item.projectTitle })
                                    ]
                                  }),
                                  (0, F.jsx)('span', {
                                    className: 'font-mono font-bold text-emerald-400 shrink-0 ml-2 text-[10px]',
                                    children: fmtMoney(item.amountUSD, item.amountBDT)
                                  })
                                ]
                              });
                            })
                          })
                    ]
                  }),

                  // Open month button
                  (0, F.jsxs)('div', {
                    className: 'pt-2 border-t border-slate-800/80 flex items-center justify-between',
                    children: [
                      (0, F.jsx)('span', { className: 'text-[10px] text-slate-500', children: isSelected ? '● Viewing' : 'Archived' }),
                      (0, F.jsx)('button', {
                        onClick: function() {
                          persist(Object.assign({}, data, { selectedMonthId: m.id }));
                          setActiveTab('ledger');
                        },
                        className: 'px-2.5 py-1 rounded bg-[#141922] hover:bg-slate-800 text-white text-[10px] font-semibold cursor-pointer',
                        children: 'Open Ledger →'
                      })
                    ]
                  })
                ]
              });
            })
          })
        ]
      }),

      // 4. Modal: Finalize Month Confirmation
      showCloseModal && (0, F.jsx)('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in',
        children: (0, F.jsxs)('div', {
          className: 'w-full max-w-md rounded-xl bg-[#14181E] p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 text-xs',
          children: [
            (0, F.jsxs)('div', {
              className: 'flex items-center gap-2 text-emerald-400 font-bold text-sm',
              children: [
                (0, F.jsx)('span', { className: 'text-xl', children: '🔒' }),
                (0, F.jsxs)('span', { children: ['Finalize ', currentMonth.name, ' (মাস শেষ করুন)'] })
              ]
            }),
            (0, F.jsxs)('p', {
              className: 'text-slate-300 leading-relaxed text-[11px]',
              children: [
                'Close sales for ',
                (0, F.jsx)('strong', { className: 'text-white', children: currentMonth.name }),
                '? All ',
                (0, F.jsx)('strong', { className: 'text-emerald-400', children: confirmedCount + ' confirmed projects' }),
                ' (' + fmtMoney(confirmedUSD, confirmedBDT) + ') will be archived.'
              ]
            }),

            (0, F.jsxs)('label', {
              className: 'flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0e1217] cursor-pointer select-none text-[11px]',
              children: [
                (0, F.jsx)('input', {
                  type: 'checkbox',
                  checked: rollOverProceed,
                  onChange: function(e) { setRollOverProceed(e.target.checked); },
                  className: 'mt-0.5 rounded text-rose-600 focus:ring-0 cursor-pointer'
                }),
                (0, F.jsxs)('div', {
                  className: 'space-y-0.5',
                  children: [
                    (0, F.jsx)('div', { className: 'font-bold text-white', children: 'Roll over unconfirmed "Proceed" deals to next month' }),
                    (0, F.jsxs)('div', { className: 'text-slate-400 text-[10px]', children: [proceedCount, ' in-progress deals will move to the next month.'] })
                  ]
                })
              ]
            }),

            (0, F.jsxs)('div', {
              className: 'flex items-center justify-end gap-2 pt-2 border-t border-slate-800',
              children: [
                (0, F.jsx)('button', {
                  type: 'button',
                  onClick: function() { setShowCloseModal(false); },
                  className: 'px-3 py-1.5 rounded-lg text-slate-300 font-semibold text-[11px] hover:bg-slate-800 cursor-pointer',
                  children: 'Cancel'
                }),
                (0, F.jsx)('button', {
                  type: 'button',
                  onClick: handleFinalizeMonth,
                  className: 'px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer shadow-xs',
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
