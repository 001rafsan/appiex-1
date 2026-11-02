// Video Storage & Streaming Engine for APPIEX
// Features: 5GB Cloud Storage Integration + IndexedDB High-Throughput Blob Cache for 0-Lag Smooth Playback

class VideoStorageEngine {
  constructor() {
    this.dbName = 'AppiexMediaDB_v2';
    this.storeName = 'videos';
    this.db = null;
    this.memoryCache = new Map();
    this.ready = this.initDB();
  }

  async initDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, using memory cache');
        return resolve(null);
      }

      try {
        const request = indexedDB.open(this.dbName, 2);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };

        request.onsuccess = (e) => {
          this.db = e.target.result;

          // Double check store exists in case database was opened with outdated schema
          if (!this.db.objectStoreNames.contains(this.storeName)) {
            this.db.close();
            const versionUpgradeReq = indexedDB.open(this.dbName, this.db.version + 1);
            versionUpgradeReq.onupgradeneeded = (evt) => {
              const upgradeDb = evt.target.result;
              if (!upgradeDb.objectStoreNames.contains(this.storeName)) {
                upgradeDb.createObjectStore(this.storeName, { keyPath: 'id' });
              }
            };
            versionUpgradeReq.onsuccess = (evt) => {
              this.db = evt.target.result;
              resolve(this.db);
            };
            versionUpgradeReq.onerror = () => {
              resolve(null);
            };
            return;
          }

          resolve(this.db);
        };

        request.onerror = (e) => {
          console.warn('IndexedDB open error, fallback to memory cache:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB init error:', err);
        resolve(null);
      }
    });
  }

  // Save video file to high-speed local cache and trigger Firebase upload
  async saveVideo(key, fileOrBlob, metadata = {}) {
    await this.ready;
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const mimeType = fileOrBlob.type || 'video/mp4';
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const record = {
      id: key,
      name: metadata.name || fileOrBlob.name || 'custom_video.mp4',
      mimeType: mimeType,
      sizeBytes: fileOrBlob.size,
      updatedAt: new Date().toISOString(),
      blob: blob
    };

    // Store in memory cache for immediate access
    this.memoryCache.set(key, blobUrl);

    // Store in IndexedDB
    if (this.db && this.db.objectStoreNames.contains(this.storeName)) {
      try {
        await new Promise((resolve) => {
          const tx = this.db.transaction([this.storeName], 'readwrite');
          const store = tx.objectStore(this.storeName);
          store.put(record);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch (err) {
        console.warn('IndexedDB save failed, saved in memory instead:', err);
      }
    }

    // Save metadata in localStorage
    localStorage.setItem(`appiex_video_${key}_meta`, JSON.stringify({
      id: key,
      name: record.name,
      sizeBytes: record.sizeBytes,
      updatedAt: record.updatedAt
    }));

    // Trigger Firebase Storage upload in background if available
    this.uploadToFirebaseStorage(key, blob, record.name).catch(() => {});

    return { record, blobUrl };
  }

  // Upload video to Firebase Storage 5GB tier
  async uploadToFirebaseStorage(key, blob, fileName) {
    if (window.appiexFirebase && window.appiexFirebase.storage) {
      try {
        const storageRef = window.appiexFirebase.storage.ref(`videos/${key}_${Date.now()}_${fileName}`);
        const uploadTask = storageRef.put(blob);
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Video upload to Firebase: ${progress.toFixed(1)}%`);
          },
          (error) => {
            console.warn("Firebase storage upload error:", error);
          },
          async () => {
            const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
            localStorage.setItem(`appiex_video_${key}_cloud_url`, downloadUrl);
            console.log("✅ Video successfully uploaded to Firebase Storage:", downloadUrl);
          }
        );
      } catch (err) {
        console.warn("Firebase upload skipped:", err);
      }
    }
  }

  // Get cached video Blob URL for lag-free instant streaming
  async getVideoBlobUrl(key) {
    await this.ready;

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            const url = URL.createObjectURL(req.result.blob);
            this.memoryCache.set(key, url);
            resolve(url);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  // Apply smooth video to a target <video> element (strictly paused until scrolled into section)
  async applyToVideoElement(targetElementOrId, key, fallbackSrc = null) {
    const el = typeof targetElementOrId === 'string' 
      ? document.getElementById(targetElementOrId) 
      : targetElementOrId;
    if (!el) return;

    const defaultMap = {
      'bento_video': './assets/bento-showcase.mp4',
      'proj_video_watch24bd': './assets/watch24bd-showcase.mp4',
      'proj_video_libasnafs': './assets/libasnafs-showcase.mp4',
      'proj_video_mamunwifi': './assets/mamunwifi-showcase.mp4',
      'proj_video_timedune': './assets/watch24bd-showcase.mp4',
      'seo_preview_video': './assets/seo-top-ranking.mp4'
    };

    const resolvedFallback = defaultMap[key] || fallbackSrc;

    // Check local high-speed Blob cache first
    const blobUrl = await this.getVideoBlobUrl(key);
    if (blobUrl) {
      el.src = blobUrl;
      el.preload = (el.dataset.inView === 'true' || el.hasAttribute('autoplay')) ? 'auto' : 'metadata';
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      el.setAttribute('muted', '');
      if (el.dataset.inView === 'true' || el.hasAttribute('autoplay')) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
      return;
    }

    // Check Firebase cloud URL / custom URL
    const cloudUrl = localStorage.getItem(`appiex_video_${key}_cloud_url`);
    if (cloudUrl) {
      el.src = cloudUrl;
      el.preload = (el.dataset.inView === 'true' || el.hasAttribute('autoplay')) ? 'auto' : 'metadata';
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      el.setAttribute('muted', '');
      if (el.dataset.inView === 'true' || el.hasAttribute('autoplay')) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
      return;
    }

    // Fallback to universal MP4 asset so it works on all phones & devices
    if (resolvedFallback) {
      const currentSrc = el.getAttribute('src') || '';
      if (!currentSrc || currentSrc.includes('developer-coding.mp4')) {
        el.src = resolvedFallback;
      }
      el.preload = (el.dataset.inView === 'true' || el.hasAttribute('autoplay')) ? 'auto' : 'metadata';
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      el.setAttribute('muted', '');
      
      const tryPlay = () => {
        const p = el.play();
        if (p !== undefined) {
          p.catch(() => {
            const resumeOnTouch = () => {
              el.play().catch(() => {});
              document.removeEventListener('touchstart', resumeOnTouch);
              document.removeEventListener('scroll', resumeOnTouch);
              document.removeEventListener('click', resumeOnTouch);
            };
            document.addEventListener('touchstart', resumeOnTouch, { passive: true, once: true });
            document.addEventListener('scroll', resumeOnTouch, { passive: true, once: true });
            document.addEventListener('click', resumeOnTouch, { passive: true, once: true });
          });
        }
      };

      if (el.dataset.inView === 'true' || el.hasAttribute('autoplay')) {
        tryPlay();
      } else {
        el.pause();
      }
    }
  }

  // Get storage usage
  async getStorageStats() {
    await this.ready;
    let totalBytes = 0;
    let count = 0;
    if (this.db && this.db.objectStoreNames.contains(this.storeName)) {
      await new Promise((resolve) => {
        try {
          const tx = this.db.transaction([this.storeName], 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.openCursor();
          req.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
              totalBytes += (cursor.value.sizeBytes || 0);
              count++;
              cursor.continue();
            } else {
              resolve();
            }
          };
          req.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });
    }
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const quotaMB = 5120; // 5GB Free Tier
    const percent = ((totalMB / quotaMB) * 100).toFixed(2);
    return { totalMB, quotaMB, percent, count };
  }
}

window.appiexVideoEngine = new VideoStorageEngine();
