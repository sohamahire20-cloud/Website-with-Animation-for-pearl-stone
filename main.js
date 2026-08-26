/**
 * PEARLSTONE VILLA — MASTER FRONT-END SCRIPT
 * 100% Landing Gate Scrub Controller, Cinematic Unlock Transition,
 * Global Scroll Progress, Scroll Reveals, Animated Counters, Lightbox & Concierge Chat.
 */

// Global Configuration
const TOTAL_FRAMES = 300;
const FRAME_PATH = (index) => `/frames/ezgif-frame-${String(index).padStart(3, '0')}.jpg`;

// State
const state = {
  images: new Array(TOTAL_FRAMES),
  currentFrame: 0,
  targetFrame: 0,
  canvasWidth: 0,
  canvasHeight: 0,
  dpr: 1,
  galleryIndex: 0,
  isUnlocked: false,
  touchStartY: 0
};

// Gallery Items
const galleryData = [
  { src: "/images/whatsapp_image_2026_08_23_at_11.18.48_am_1.jpeg_screen.png", caption: "Pearlstone Villa — Waterfront Horizon & Travertine Terrace" },
  { src: "/images/whatsapp_image_2026_08_23_at_11.18.46_am.jpeg_screen.png", caption: "Private Lakefront Master Suite — Sunrise Vista" },
  { src: "/images/whatsapp_image_2026_08_23_at_11.18.47_am.jpeg_screen.png", caption: "Open Living Salon with Panoramic Acoustic Glazing" },
  { src: "/images/twilight_photo_of_a_white_minimalist_villa_in_nashik_india._illuminated_black_screen.png", caption: "25m Heated Saltwater Infinity Pool at Twilight" },
  { src: "/images/a_high_end_architectural_photograph_of_a_luxury_2_level_minimalist_villa_in_screen.png", caption: "Full Estate Grounds, Palm Canopies & Architecture" }
];

// DOM References
const landingGate = document.getElementById('landingGate');
const canvas = document.getElementById('sequenceCanvas');
const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
const cornerPercent = document.getElementById('cornerPercent');
const gateUnlockContainer = document.getElementById('gateUnlockContainer');
const unlockBtn = document.getElementById('unlockBtn');
const gateScrollHint = document.getElementById('gateScrollHint');
const gateContent = document.getElementById('gateContent');

const globalProgressBar = document.getElementById('globalProgressBar');
const siteHeader = document.getElementById('siteHeader');
const actionDock = document.getElementById('actionDock');

const mobileNavOverlay = document.getElementById('mobileNavOverlay');
const openMobileNav = document.getElementById('openMobileNav');
const closeMobileNav = document.getElementById('closeMobileNav');

const conciergePanel = document.getElementById('conciergePanel');
const openChatbotBtn = document.getElementById('openChatbotBtn');
const closeChatbotBtn = document.getElementById('closeChatbotBtn');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

const lightboxModal = document.getElementById('lightboxModal');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const closeLightboxBtn = document.getElementById('closeLightboxBtn');
const prevLightboxBtn = document.getElementById('prevLightboxBtn');
const nextLightboxBtn = document.getElementById('nextLightboxBtn');
const openLightboxAllBtn = document.getElementById('openLightboxAllBtn');

/* ==========================================================================
   1. CANVAS SCROLL ANIMATION & 100% GATE SCRUB
   ========================================================================== */

if (canvas && ctx && landingGate) {
  state.loadedStatus = new Uint8Array(TOTAL_FRAMES);

  function setupCanvas() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.canvasWidth = window.innerWidth;
    state.canvasHeight = window.innerHeight;

    canvas.width = Math.floor(state.canvasWidth * state.dpr);
    canvas.height = Math.floor(state.canvasHeight * state.dpr);
    canvas.style.width = `${state.canvasWidth}px`;
    canvas.style.height = `${state.canvasHeight}px`;

    ctx.scale(state.dpr, state.dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    renderCurrentFrame();
  }

  // Priority-based image loader
  const loadingSet = new Set();
  function loadSingleFrame(index, priority = false) {
    if (index < 0 || index >= TOTAL_FRAMES) return;
    if (state.images[index] || loadingSet.has(index)) return;

    loadingSet.add(index);
    const img = new Image();
    if (priority) {
      img.fetchPriority = 'high';
    }
    img.src = FRAME_PATH(index + 1);
    img.onload = () => {
      state.images[index] = img;
      state.loadedStatus[index] = 1;
      loadingSet.delete(index);
      if (Math.round(state.currentFrame) === index) {
        renderCurrentFrame();
      }
    };
    img.onerror = () => {
      loadingSet.delete(index);
    };
  }

  // Progressive frame buffering window
  function requestNearbyFrames(targetIndex) {
    const start = Math.max(0, Math.floor(targetIndex) - 5);
    const end = Math.min(TOTAL_FRAMES - 1, Math.floor(targetIndex) + 25);
    for (let i = start; i <= end; i++) {
      loadSingleFrame(i, i === Math.floor(targetIndex));
    }
  }

  function preloadFrames() {
    // 1. Load the initial frame immediately with highest priority
    const firstImg = new Image();
    firstImg.fetchPriority = 'high';
    firstImg.src = FRAME_PATH(1);
    firstImg.onload = () => {
      state.images[0] = firstImg;
      state.loadedStatus[0] = 1;
      setupCanvas();
      renderFrame(0);

      // 2. Buffer the first 30 frames for immediate smooth start
      for (let i = 0; i < Math.min(35, TOTAL_FRAMES); i++) {
        loadSingleFrame(i);
      }

      // 3. Buffer key milestone frames across the timeline (every 10th frame)
      for (let i = 40; i < TOTAL_FRAMES; i += 10) {
        loadSingleFrame(i);
      }

      // 4. Background queue for remaining frames
      let bgIndex = 0;
      function idleLoadNextBatch() {
        let loadedInBatch = 0;
        while (bgIndex < TOTAL_FRAMES && loadedInBatch < 4) {
          if (!state.images[bgIndex]) {
            loadSingleFrame(bgIndex);
            loadedInBatch++;
          }
          bgIndex++;
        }
        if (bgIndex < TOTAL_FRAMES) {
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(idleLoadNextBatch, { timeout: 200 });
          } else {
            setTimeout(idleLoadNextBatch, 80);
          }
        }
      }
      setTimeout(idleLoadNextBatch, 200);
    };
  }

  function drawCoverImage(image) {
    if (!image || !image.complete || image.naturalWidth === 0) return;

    const canvasW = state.canvasWidth;
    const canvasH = state.canvasHeight;
    const imgW = image.naturalWidth;
    const imgH = image.naturalHeight;

    const scale = Math.max(canvasW / imgW, canvasH / imgH);
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    const offsetX = (canvasW - scaledW) / 2;
    const offsetY = (canvasH - scaledH) / 2;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(image, offsetX, offsetY, scaledW, scaledH);
  }

  function getBestAvailableFrame(index) {
    if (state.images[index] && state.loadedStatus[index]) {
      return state.images[index];
    }
    // Search outwards for nearest loaded frame to eliminate any flash/gap
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = index - offset;
      if (prev >= 0 && state.images[prev] && state.loadedStatus[prev]) {
        return state.images[prev];
      }
      const next = index + offset;
      if (next < TOTAL_FRAMES && state.images[next] && state.loadedStatus[next]) {
        return state.images[next];
      }
    }
    return state.images[0] || null;
  }

  function renderFrame(index) {
    const safeIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(index)));
    const img = getBestAvailableFrame(safeIndex);
    if (img) {
      drawCoverImage(img);
    }
  }

  function renderCurrentFrame() {
    renderFrame(state.currentFrame);
  }

  let lastDrawnFrame = -1;
  function startRenderLoop() {
    function tick() {
      const diff = state.targetFrame - state.currentFrame;
      if (Math.abs(diff) > 0.01) {
        state.currentFrame += diff * 0.18; // responsive lerp
      } else {
        state.currentFrame = state.targetFrame;
      }

      const frameToDraw = Math.round(state.currentFrame);
      if (frameToDraw !== lastDrawnFrame) {
        renderFrame(frameToDraw);
        lastDrawnFrame = frameToDraw;
      }

      // Update corner percentage text
      const progress = state.currentFrame / (TOTAL_FRAMES - 1);
      const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
      if (cornerPercent) {
        cornerPercent.textContent = `${percent}%`;
      }

      // Check for completion
      if (percent >= 99 && !state.isUnlocked) {
        if (gateUnlockContainer) gateUnlockContainer.classList.add('active');
        if (gateScrollHint) gateScrollHint.style.opacity = '0';
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Scrub controller for mouse wheel & trackpad
  function handleWheel(e) {
    if (state.isUnlocked) {
      // If at top of site and scrolling upward, re-engage landing gate naturally
      if (window.scrollY <= 0 && e.deltaY < -15) {
        state.isUnlocked = false;
        landingGate.classList.remove('unlocked');
        document.body.classList.add('landing-locked');
        state.targetFrame = TOTAL_FRAMES - 1;
        state.currentFrame = TOTAL_FRAMES - 1;
        if (gateUnlockContainer) gateUnlockContainer.classList.add('active');
        if (gateScrollHint) gateScrollHint.style.opacity = '0';
        if (gateContent) gateContent.style.opacity = '0.15';
        renderFrame(TOTAL_FRAMES - 1);
      }
      return;
    }

    e.preventDefault();
    const delta = e.deltaY;
    const step = delta > 0 ? 2.5 : -2.5;
    state.targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, state.targetFrame + step));
    requestNearbyFrames(state.targetFrame);

    // Fade brand text slightly as user scrubs
    if (gateContent) {
      const progress = state.targetFrame / (TOTAL_FRAMES - 1);
      gateContent.style.opacity = String(Math.max(0.15, 1 - progress * 1.5));
    }
  }

  // Touch gesture scrub for mobile devices
  function handleTouchStart(e) {
    state.touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    const currentY = e.touches[0].clientY;
    const diffY = state.touchStartY - currentY;

    if (state.isUnlocked) {
      // On mobile at top of page, swiping down (diffY < -20) returns to landing gate
      if (window.scrollY <= 0 && diffY < -20) {
        state.isUnlocked = false;
        landingGate.classList.remove('unlocked');
        document.body.classList.add('landing-locked');
        state.targetFrame = TOTAL_FRAMES - 1;
        state.currentFrame = TOTAL_FRAMES - 1;
        if (gateUnlockContainer) gateUnlockContainer.classList.add('active');
        if (gateScrollHint) gateScrollHint.style.opacity = '0';
        if (gateContent) gateContent.style.opacity = '0.15';
        renderFrame(TOTAL_FRAMES - 1);
        state.touchStartY = currentY;
      }
      return;
    }

    state.touchStartY = currentY;
    const step = diffY * 0.45;
    state.targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, state.targetFrame + step));
    requestNearbyFrames(state.targetFrame);

    if (gateContent) {
      const progress = state.targetFrame / (TOTAL_FRAMES - 1);
      gateContent.style.opacity = String(Math.max(0.15, 1 - progress * 1.5));
    }
  }

  // UNLOCK TRANSITION: Elevate gate and reveal main website
  function unlockWebsite() {
    if (state.isUnlocked) return;
    state.isUnlocked = true;

    // Transition gate
    landingGate.classList.add('unlocked');
    document.body.classList.remove('landing-locked');

    // Reveal dock and initialize scroll triggers
    setTimeout(() => {
      if (actionDock) actionDock.classList.add('dock-revealed');
      setupScrollReveals();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 600);
  }

  if (unlockBtn) {
    unlockBtn.addEventListener('click', unlockWebsite);
  }

  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('resize', setupCanvas);

  preloadFrames();
  startRenderLoop();
} else {
  // If on interior pages (The Villa, Stay)
  document.body.classList.remove('landing-locked');
  if (actionDock) actionDock.classList.add('dock-revealed');
}

/* ==========================================================================
   2. GLOBAL SCROLL PROGRESS & REVEALS
   ========================================================================== */

function updateGlobalScrollProgress() {
  if (!globalProgressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight > 0) {
    const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
    globalProgressBar.style.width = `${progress}%`;
  }
}

window.addEventListener('scroll', updateGlobalScrollProgress, { passive: true });

function setupScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-fade, .reveal-scale, .reveal-line');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.12
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));

  // Animate Number Counters
  const counterElements = document.querySelectorAll('.meta-num[data-target]');
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetNum = parseInt(el.dataset.target, 10);
        animateCounter(el, targetNum);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counterElements.forEach(el => counterObserver.observe(el));
}

function animateCounter(element, target) {
  let start = 0;
  const duration = 1600;
  const startTime = performance.now();
  const originalText = element.textContent;
  const isFootage = originalText.includes('FT');
  const isMeters = originalText.includes('M');

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
    const currentVal = Math.floor(easeProgress * target);

    if (isFootage) {
      element.textContent = `${currentVal} FT`;
    } else if (isMeters) {
      element.textContent = `${currentVal} M`;
    } else {
      element.textContent = String(currentVal).padStart(2, '0');
    }

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }

  requestAnimationFrame(updateCounter);
}

document.addEventListener('DOMContentLoaded', () => {
  setupScrollReveals();
});

/* ==========================================================================
   3. MOBILE NAVIGATION MENU
   ========================================================================== */

if (openMobileNav && mobileNavOverlay && closeMobileNav) {
  openMobileNav.addEventListener('click', () => {
    mobileNavOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  closeMobileNav.addEventListener('click', () => {
    mobileNavOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });

  const mobileLinks = mobileNavOverlay.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNavOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ==========================================================================
   4. ASK PEARLSTONE CONCIERGE CHATBOT (Verified Real Data)
   ========================================================================== */

function getVerifiedResponse(query) {
  const q = query.toLowerCase();

  if (q.includes('bedroom') || q.includes('room') || q.includes('bhk') || q.includes('suites') || q.includes('how many')) {
    return "Pearlstone Villa features 5 expansive en-suite master suites, all offering floor-to-ceiling glass and panoramic lake views.";
  }
  if (q.includes('pool') || q.includes('swim') || q.includes('swimming')) {
    return "The villa features an exclusive 25-meter temperature-controlled saltwater infinity pool overlooking the lake.";
  }
  if (q.includes('location') || q.includes('where') || q.includes('nashik') || q.includes('address') || q.includes('reach')) {
    return "Pearlstone Villa is located on a private lakefront peninsula in Nashik, Maharashtra, India. Directions are accessible via Google Maps.";
  }
  if (q.includes('book') || q.includes('reserve') || q.includes('availability') || q.includes('dates') || q.includes('airbnb')) {
    return "You can check verified live availability and book securely on Airbnb, or message our team directly on WhatsApp (+91 99700 01554).";
  }
  if (q.includes('event') || q.includes('wedding') || q.includes('celebration') || q.includes('party')) {
    return "Selected intimate private gatherings and milestone celebrations can be hosted upon prior arrangement. Please message us on WhatsApp with your event details.";
  }
  if (q.includes('contact') || q.includes('call') || q.includes('phone') || q.includes('whatsapp') || q.includes('number')) {
    return "You can reach Pearlstone Villa directly on WhatsApp or Call at +91 99700 01554.";
  }
  if (q.includes('about') || q.includes('villa') || q.includes('estate') || q.includes('property')) {
    return "Pearlstone Villa is a contemporary 5 BHK private waterfront estate set amidst 12,800 sq ft of lush greenery and lake shoreline in Nashik.";
  }

  // Graceful fallback for unverified specifics
  return "I don’t want to give you incorrect information. Please contact Pearlstone Villa directly at +91 99700 01554 or via WhatsApp, and our team will confirm that for you.";
}

function appendMessage(text, sender = 'assistant') {
  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${sender}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (openChatbotBtn && conciergePanel && closeChatbotBtn) {
  openChatbotBtn.addEventListener('click', () => {
    conciergePanel.classList.toggle('open');
  });

  closeChatbotBtn.addEventListener('click', () => {
    conciergePanel.classList.remove('open');
  });

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      appendMessage(userText, 'user');
      chatInput.value = '';

      setTimeout(() => {
        const response = getVerifiedResponse(userText);
        appendMessage(response, 'assistant');
      }, 350);
    });
  }

  const chips = document.querySelectorAll('.chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      appendMessage(query, 'user');
      setTimeout(() => {
        const response = getVerifiedResponse(query);
        appendMessage(response, 'assistant');
      }, 300);
    });
  });
}

/* ==========================================================================
   5. GALLERY LIGHTBOX
   ========================================================================== */

function openLightbox(index) {
  state.galleryIndex = (index + galleryData.length) % galleryData.length;
  const item = galleryData[state.galleryIndex];
  if (lightboxImage && lightboxCaption && lightboxModal) {
    lightboxImage.src = item.src;
    lightboxCaption.textContent = item.caption;
    lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  if (lightboxModal) {
    lightboxModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

const galleryItems = document.querySelectorAll('.gallery-item');
galleryItems.forEach(item => {
  item.addEventListener('click', () => {
    const idx = parseInt(item.dataset.index || '0', 10);
    openLightbox(idx);
  });
});

if (openLightboxAllBtn) {
  openLightboxAllBtn.addEventListener('click', () => openLightbox(0));
}

if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closeLightbox);
if (prevLightboxBtn) prevLightboxBtn.addEventListener('click', () => openLightbox(state.galleryIndex - 1));
if (nextLightboxBtn) nextLightboxBtn.addEventListener('click', () => openLightbox(state.galleryIndex + 1));

/* ==========================================================================
   6. FAQ ACCORDIONS (Stay Page)
   ========================================================================== */

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const btn = item.querySelector('.faq-question-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  }
});

/* ==========================================================================
   7. KEYBOARD ACCESSIBILITY
   ========================================================================== */

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    if (conciergePanel) conciergePanel.classList.remove('open');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('open');
  } else if (lightboxModal && lightboxModal.classList.contains('open')) {
    if (e.key === 'ArrowLeft') openLightbox(state.galleryIndex - 1);
    if (e.key === 'ArrowRight') openLightbox(state.galleryIndex + 1);
  }
});
