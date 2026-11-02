// Firebase Configuration & Service for APPIEX (Project: appiex)
// Supports Firebase 10+ Web SDK & Local Fallback

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: localStorage.getItem('appiex_firebase_apiKey') || "AIzaSyAppiexFreeTierKey2026LiveKey",
  authDomain: "appiex.firebaseapp.com",
  projectId: "appiex",
  storageBucket: "appiex.appspot.com",
  messagingSenderId: "982348271032",
  appId: "1:982348271032:web:appiex94821a8"
};

class FirebaseAppiexService {
  constructor() {
    this.config = { ...DEFAULT_FIREBASE_CONFIG };
    this.isInitialized = false;
    this.storageQuotaMB = 5120; // 5 GB Free Tier
    this.usedStorageMB = 0;
    this.init();
  }

  init() {
    try {
      // Check if Firebase Compat SDK or Modular SDK is loaded
      if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(this.config);
        } else {
          this.app = firebase.app();
        }
        if (firebase.firestore) this.db = firebase.firestore();
        if (firebase.storage) this.storage = firebase.storage();
        this.isInitialized = true;
        console.log("⚡ Firebase connected to project: appiex");
      } else {
        console.log("ℹ️ Firebase SDK ready in local fallback mode (appiex).");
      }
    } catch (err) {
      console.warn("Firebase initialization notice:", err);
    }
  }

  updateConfig(customConfig) {
    if (customConfig.apiKey) localStorage.setItem('appiex_firebase_apiKey', customConfig.apiKey);
    if (customConfig.storageBucket) localStorage.setItem('appiex_firebase_storageBucket', customConfig.storageBucket);
    Object.assign(this.config, customConfig);
    this.init();
  }

  // Save Referral Lead to Database
  async saveReferralLead(leadData) {
    const timestamp = new Date().toISOString();
    const lead = {
      ...leadData,
      id: 'lead_' + Date.now(),
      status: 'Pending',
      createdAt: timestamp,
      commissionTiers: '10%-15%'
    };

    // 1. Try Firebase Firestore
    if (this.db) {
      try {
        await this.db.collection('referral_leads').add(lead);
        console.log("✅ Lead saved to Firebase Firestore (appiex)");
      } catch (e) {
        console.warn("Firestore write skipped, storing locally:", e);
      }
    }

    // 2. Always persist to localStorage for instant admin access
    const localLeads = JSON.parse(localStorage.getItem('appiex_referral_leads') || '[]');
    localLeads.unshift(lead);
    localStorage.setItem('appiex_referral_leads', JSON.stringify(localLeads));
    return lead;
  }

  // Get Referral Leads
  async getReferralLeads() {
    if (this.db) {
      try {
        const snap = await this.db.collection('referral_leads').orderBy('createdAt', 'desc').limit(50).get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          return list;
        }
      } catch (e) {
        console.warn("Firestore read failed, falling back to local:", e);
      }
    }
    return JSON.parse(localStorage.getItem('appiex_referral_leads') || '[]');
  }
}

window.appiexFirebase = new FirebaseAppiexService();
