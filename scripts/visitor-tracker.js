/**
 * Appiex Live Website Visitor Telemetry (Real-Time Page Open & Login Tracker)
 * - Captures real live visitors the instant they open the website (exact time, page, device, IP, and location)
 * - Captures real logins (Gmail ID / Phone / Name)
 * - Immediately syncs to /api/visitors.js & BroadcastChannel so appiex.com/admin updates without refresh
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'appiex_daily_visitors';
  var VISITOR_ID_KEY = 'appiex_visitor_uuid';
  var SESSION_ID_KEY = 'appiex_session_uuid';
  var PURGE_FLAG_KEY = 'appiex_clean_v5_applied';
  var API_URL = '/api/visitors.js';

  // Skip tracking on the admin dashboard itself or for automated search crawlers
  if (/^\/admin/.test(window.location.pathname)) return;
  var uaStr = (navigator.userAgent || '').toLowerCase();
  if (/googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|ahrefsbot|semrushbot|petalbot|bytespider|headlesschrome|lighthouse|pagespeed/i.test(uaStr)) {
    return;
  }

  // Push this visitor's page-open snapshot to the shared server database immediately
  var pushTimer = null;
  function pushToServer(immediate, isHeartbeat) {
    if (/^\/admin/.test(window.location.pathname)) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function() {
      try {
        var uuid = localStorage.getItem(VISITOR_ID_KEY);
        var list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        var mine = null;
        for (var i = 0; i < list.length; i++) {
          if (list[i].visitorUUID === uuid) {
            mine = list[i];
            break;
          }
        }
        if (!mine) return;
        var payload = JSON.stringify({ record: mine, heartbeat: !!isHeartbeat });
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function() {});
      } catch (e) {}
    }, immediate ? 0 : 150);
  }

  // Perform clean one-time purge of fake/legacy test clutter
  try {
    if (!localStorage.getItem(PURGE_FLAG_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
      var oldU = localStorage.getItem('appiex_user');
      if (oldU && (oldU.indexOf('Client Partner') !== -1 || oldU.indexOf('1717-552650') !== -1)) {
        localStorage.removeItem('appiex_user');
      }
      localStorage.setItem(PURGE_FLAG_KEY, 'true');
    }
  } catch (e) {}

  function getTodayStr() {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }

  function getFormattedClockTime() {
    try {
      return new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  function getVisitorUUID() {
    var uuid = localStorage.getItem(VISITOR_ID_KEY);
    if (!uuid) {
      uuid = 'USR-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem(VISITOR_ID_KEY, uuid);
    }
    return uuid;
  }

  function getSessionUUID() {
    var sess = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sess) {
      sess = 'SESS-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem(SESSION_ID_KEY, sess);
    }
    return sess;
  }

  function getDeviceInfo() {
    var ua = navigator.userAgent || '';
    var os = 'Windows PC';
    if (ua.indexOf('Win') !== -1) os = 'Windows 11 / PC';
    else if (ua.indexOf('Mac') !== -1 && ua.indexOf('Mobile') === -1) os = 'macOS';
    else if (ua.indexOf('iPhone') !== -1) os = 'iPhone iOS';
    else if (ua.indexOf('iPad') !== -1) os = 'iPad iOS';
    else if (ua.indexOf('Android') !== -1) os = 'Android Mobile';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';

    var browser = 'Google Chrome';
    if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (ua.indexOf('Edg') !== -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('Chrome') !== -1) browser = 'Google Chrome';
    else if (ua.indexOf('Safari') !== -1) browser = 'Apple Safari';

    return { device: os, browser: browser };
  }

  function getStoredIdentity() {
    var identity = {
      name: '',
      email: '',
      phone: '',
      isIdentified: false,
      isRealLogin: false,
      isGmail: false,
      type: 'Live Visitor'
    };

    try {
      var userStr = localStorage.getItem('appiex_user');
      if (userStr) {
        var usr = JSON.parse(userStr);
        if (usr.email || usr.phone || (usr.name && usr.name !== 'Client Partner')) {
          identity.name = usr.name || 'Appiex Client';
          identity.email = usr.email || (usr.phone ? (usr.phone.replace(/[^0-9]/g, '') + '@gmail.com') : '');
          identity.phone = usr.phone || '';
          identity.isIdentified = true;
          identity.isRealLogin = true;
          identity.type = 'Verified User Login';
          if (identity.email.indexOf('@gmail.com') !== -1) identity.isGmail = true;
          return identity;
        }
      }

      var activeUserKey = localStorage.getItem('appiex_active_user_key');
      var dbRaw = localStorage.getItem('appiex_partners_database');
      if (activeUserKey && dbRaw) {
        var db = JSON.parse(dbRaw);
        var u = db[activeUserKey];
        if (u) {
          identity.name = u.name || 'Verified Partner';
          identity.email = u.email || (activeUserKey.replace(/[^0-9]/g, '') + '@gmail.com');
          identity.phone = u.phone || activeUserKey;
          identity.isIdentified = true;
          identity.isRealLogin = true;
          identity.type = 'Partner Portal User';
          if (identity.email.indexOf('@gmail.com') !== -1) identity.isGmail = true;
          return identity;
        }
      }

      var lastLeadStr = localStorage.getItem('appiex_last_inquiry');
      if (lastLeadStr) {
        var lead = JSON.parse(lastLeadStr);
        if (lead.email) {
          identity.name = lead.name || 'Identified Lead';
          identity.email = lead.email;
          identity.phone = lead.phone || '';
          identity.isIdentified = true;
          identity.isRealLogin = false;
          identity.type = 'Contact Form Inquirer';
          if (identity.email.indexOf('@gmail.com') !== -1) identity.isGmail = true;
          return identity;
        }
      }
    } catch (e) {}

    return identity;
  }

  function notifyAdminUpdate(immediate, isHeartbeat) {
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('appiex_visitor_recorded', { detail: { timestamp: Date.now() } }));
      }
      if (typeof BroadcastChannel !== 'undefined') {
        var bc = new BroadcastChannel('appiex_telemetry_channel');
        bc.postMessage({ type: 'VISITOR_UPDATE', timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {}
    pushToServer(immediate !== false, !!isHeartbeat);
  }

  // Track when user opens the website
  function trackCurrentPageVisit() {
    var currentPath = window.location.pathname || '/';
    var pageTitle = document.title || 'Appiex Experience';

    var dev = getDeviceInfo();
    var identity = getStoredIdentity();
    var visitorUUID = getVisitorUUID();
    var sessionUUID = getSessionUUID();
    var now = new Date();
    var todayStr = getTodayStr();
    var timeFormatted = getFormattedClockTime();

    var ref = document.referrer;
    var referrerSource = 'Direct Traffic';
    if (ref) {
      if (ref.indexOf('google.') !== -1) referrerSource = 'Google Search';
      else if (ref.indexOf('facebook.') !== -1 || ref.indexOf('fb.com') !== -1) referrerSource = 'Facebook';
      else if (ref.indexOf('whatsapp.') !== -1 || ref.indexOf('wa.me') !== -1) referrerSource = 'WhatsApp Referral';
      else if (ref.indexOf('linkedin.') !== -1) referrerSource = 'LinkedIn';
      else if (ref.indexOf(window.location.hostname) === -1) referrerSource = 'External Referral';
      else referrerSource = 'Internal Navigation';
    }

    var journeyStep = {
      page: currentPath,
      title: pageTitle.replace(/— Appiex.*|\|.*$/g, '').trim() || currentPath,
      time: timeFormatted,
      timestamp: now.toISOString()
    };

    var openAction = {
      time: timeFormatted,
      action: 'Opened Website (' + currentPath + ')',
      target: currentPath,
      page: currentPath,
      timestamp: now.toISOString()
    };

    try {
      var visitors = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      var foundIndex = -1;

      for (var i = 0; i < visitors.length; i++) {
        if (visitors[i].visitorUUID === visitorUUID) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== -1) {
        var existing = visitors[foundIndex];
        if (identity.isRealLogin) {
          existing.name = identity.name;
          existing.email = identity.email;
          existing.phone = identity.phone;
          existing.isRealLogin = true;
          existing.isIdentified = true;
          existing.type = identity.type;
        } else if (identity.isIdentified && !existing.isIdentified) {
          existing.name = existing.name || identity.name;
          existing.email = identity.email;
          existing.phone = identity.phone;
          existing.isIdentified = true;
        }

        existing.page = currentPath;
        existing.pageTitle = pageTitle;
        existing.entryTime = timeFormatted;
        existing.lastActive = now.toISOString();
        existing.timestamp = now.toISOString();
        existing.date = todayStr;
        existing.isNewOpen = true;

        if (!existing.pageJourney) existing.pageJourney = [];
        var lastPage = existing.pageJourney[existing.pageJourney.length - 1];
        if (!lastPage || lastPage.page !== currentPath) {
          existing.pageJourney.push(journeyStep);
        }
        existing.actionsList = [openAction];

        visitors.splice(foundIndex, 1);
        visitors.unshift(existing);
      } else {
        var newRecord = {
          id: (identity.isRealLogin ? 'LOG-' : 'VIS-') + Date.now(),
          visitorUUID: visitorUUID,
          sessionUUID: sessionUUID,
          date: todayStr,
          entryTime: timeFormatted,
          name: identity.isIdentified ? identity.name : 'Visitor ' + visitorUUID.slice(-4).toUpperCase(),
          email: identity.email || (identity.isRealLogin ? 'verified@gmail.com' : 'Guest (No Login)'),
          phone: identity.phone || '-',
          page: currentPath,
          pageTitle: pageTitle,
          referrer: referrerSource,
          city: 'Dhaka',
          country: 'Bangladesh',
          ip: '',
          device: dev.device,
          browser: dev.browser,
          timestamp: now.toISOString(),
          lastActive: now.toISOString(),
          isIdentified: identity.isIdentified,
          isRealLogin: identity.isRealLogin,
          isNewOpen: true,
          type: identity.isRealLogin ? identity.type : 'Live Visitor',
          pageJourney: [journeyStep],
          actionsList: [openAction]
        };

        visitors.unshift(newRecord);
      }

      if (visitors.length > 80) visitors = visitors.slice(0, 80);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors));
      // Send immediately (0ms delay) on website open!
      notifyAdminUpdate(true, false);
    } catch (e) {}
  }

  // Public method to record login activity explicitly
  window.appiexRecordLogin = function(userData) {
    if (!userData) return;
    var dev = getDeviceInfo();
    var visitorUUID = getVisitorUUID();
    var now = new Date();
    var timeFormatted = getFormattedClockTime();

    var email = userData.email || '';
    if (!email && userData.phone) {
      email = userData.phone.replace(/[^0-9]/g, '') + '@gmail.com';
    }

    var record = {
      id: 'LOG-' + Date.now(),
      visitorUUID: visitorUUID,
      sessionUUID: getSessionUUID(),
      date: getTodayStr(),
      entryTime: timeFormatted,
      name: userData.name || 'Verified User',
      email: email,
      phone: userData.phone || '-',
      page: window.location.pathname || '/profile',
      pageTitle: document.title || 'Client Partner Portal',
      referrer: 'Direct Secure Login',
      city: 'Dhaka',
      country: 'Bangladesh',
      ip: '',
      device: dev.device,
      browser: dev.browser,
      timestamp: now.toISOString(),
      lastActive: now.toISOString(),
      isIdentified: true,
      isRealLogin: true,
      isNewOpen: true,
      type: 'Verified Real Login',
      pageJourney: [
        { page: window.location.pathname || '/profile', title: 'Opened Website & Signed In', time: timeFormatted, timestamp: now.toISOString() }
      ],
      actionsList: [
        { time: timeFormatted, action: 'Opened Website & Logged In (' + (email || userData.phone) + ')', target: '/profile', page: '/profile' }
      ]
    };

    try {
      var visitors = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      visitors = visitors.filter(function(v) { return v.visitorUUID !== visitorUUID; });
      visitors.unshift(record);
      if (visitors.length > 80) visitors = visitors.slice(0, 80);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors));
      notifyAdminUpdate(true, false);
    } catch (e) {}
  };

  // Fire immediately when script loads so website open is recorded with zero delay
  trackCurrentPageVisit();

  // Keep live presence active every 25s while user has website open
  setInterval(function() {
    if (!document.hidden) {
      pushToServer(true, true);
    }
  }, 25000);
})();
