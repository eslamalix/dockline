/**
 * Dockline — Live Interactive Windows 11 Desktop Sandbox
 * Pure Vanilla JavaScript (Zero external dependencies)
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    activeEdge: 'right',
    activeMode: 'work',
    activePanel: null,
    isLightTheme: false,
    glassStrength: 50,
    media: {
      isPlaying: false,
      trackIndex: 0,
      currentTime: 42,
      duration: 212,
      volume: 80,
      timerId: null,
      tracks: [
        { title: 'Resonance', artist: 'HOME', album: 'Odyssey', duration: 212, cover: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)' },
        { title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: 243, cover: 'linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)' },
        { title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', album: 'Starboy', duration: 230, cover: 'linear-gradient(135deg, #ef4444, #f97316, #eab308)' }
      ]
    },
    focus: {
      isRunning: false,
      totalSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      timerId: null
    },
    nightLight: {
      enabled: false,
      warmth: 45
    },
    system: {
      cpu: 18,
      ram: 42
    },
    quickActions: {
      caffeine: false,
      mute: false
    }
  };

  // --- Mode Tile Mappings ---
  const modeWidgets = {
    work: ['clock', 'system', 'battery', 'media', 'actions'],
    focus: ['focus', 'media', 'clock'],
    gaming: ['system', 'media', 'actions'],
    evening: ['nightlight', 'radio', 'clock']
  };

  // --- DOM Elements ---
  const desktopViewport = document.getElementById('desktop-viewport');
  const dockContainer = document.getElementById('dockline-bar-container');
  const nightLightOverlay = document.getElementById('night-light-overlay');
  const modeToast = document.getElementById('mode-feedback-toast');
  const toastText = document.getElementById('toast-mode-name');

  // Flyout Panels
  const panels = {
    media: document.getElementById('panel-media'),
    focus: document.getElementById('panel-focus'),
    nightlight: document.getElementById('panel-nightlight'),
    battery: document.getElementById('panel-battery'),
    system: document.getElementById('panel-system'),
    radio: document.getElementById('panel-radio'),
    actions: document.getElementById('panel-actions')
  };

  // --- Clock Init ---
  function updateClocks() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${minutes}`;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

    const tileTime = document.getElementById('tile-time-display');
    const tileDate = document.getElementById('tile-date-display');
    const trayClock = document.getElementById('tray-clock-time');

    if (tileTime) tileTime.textContent = timeStr;
    if (tileDate) tileDate.textContent = dateStr;
    if (trayClock) trayClock.textContent = `${timeStr} ${ampm}`;
  }
  setInterval(updateClocks, 1000);
  updateClocks();

  // --- Panel Toggling ---
  function togglePanel(panelName) {
    if (state.activePanel === panelName) {
      closeAllPanels();
    } else {
      openPanel(panelName);
    }
  }

  function openPanel(panelName) {
    closeAllPanels();
    state.activePanel = panelName;
    const targetPanel = panels[panelName];
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
    const tile = document.querySelector(`.dock-tile[data-widget="${panelName}"]`);
    if (tile) {
      tile.classList.add('active-panel');
    }
  }

  function closeAllPanels() {
    state.activePanel = null;
    Object.values(panels).forEach(p => {
      if (p) p.classList.remove('active');
    });
    document.querySelectorAll('.dock-tile').forEach(t => t.classList.remove('active-panel'));
  }

  // --- Edge Switcher ---
  function setDockEdge(edge) {
    state.activeEdge = edge;
    dockContainer.className = 'dockline-bar-container edge-' + edge;

    // Update buttons
    document.querySelectorAll('[data-edge-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-edge-btn') === edge);
    });
  }

  // --- Mode Switcher ---
  function setDockMode(mode) {
    state.activeMode = mode;
    const activeTiles = modeWidgets[mode] || modeWidgets.work;

    // Filter tiles with smooth transition
    document.querySelectorAll('.dock-tile[data-widget]').forEach(tile => {
      const widget = tile.getAttribute('data-widget');
      if (activeTiles.includes(widget)) {
        tile.style.display = 'flex';
        setTimeout(() => { tile.style.opacity = '1'; tile.style.transform = 'scale(1)'; }, 10);
      } else {
        tile.style.opacity = '0';
        tile.style.transform = 'scale(0.8)';
        setTimeout(() => { tile.style.display = 'none'; }, 200);
      }
    });

    // Update mode buttons
    document.querySelectorAll('[data-mode-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode-btn') === mode);
    });

    // Close any panel that might not belong to this mode
    if (state.activePanel && !activeTiles.includes(state.activePanel)) {
      closeAllPanels();
    }

    // Feedback Toast
    const titles = { work: 'Work Mode', focus: 'Focus Mode', gaming: 'Gaming Mode', evening: 'Evening Mode' };
    if (toastText && modeToast) {
      toastText.textContent = titles[mode] || mode;
      modeToast.classList.add('show');
      setTimeout(() => { modeToast.classList.remove('show'); }, 2000);
    }
  }

  // --- Wallpaper Theme Switcher ---
  function setTheme(isLight) {
    state.isLightTheme = isLight;
    if (isLight) {
      desktopViewport.classList.add('light-theme');
    } else {
      desktopViewport.classList.remove('light-theme');
    }

    document.querySelectorAll('[data-wall-btn]').forEach(btn => {
      const btnMode = btn.getAttribute('data-wall-btn');
      btn.classList.toggle('active', (btnMode === 'light' && isLight) || (btnMode === 'dark' && !isLight));
    });
  }

  // --- Glass Strength Slider ---
  function updateGlassStrength(strength) {
    state.glassStrength = strength;
    const alpha = 0.35 + (strength / 100) * 0.45;
    const blur = 16 + (strength / 100) * 20;
    dockContainer.style.setProperty('--glass-shelf-bg', `rgba(18, 24, 38, ${alpha})`);
    dockContainer.style.setProperty('--glass-blur', `blur(${blur}px) saturate(180%)`);
  }

  // ==========================================================================
  // NOW PLAYING WIDGET LOGIC
  // ==========================================================================
  function formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateMediaUI() {
    const curTrack = state.media.tracks[state.media.trackIndex];
    const albumArt = document.getElementById('media-art');
    const titleEl = document.getElementById('media-title');
    const artistEl = document.getElementById('media-artist');
    const scrubberFill = document.getElementById('media-scrubber-fill');
    const curTimeEl = document.getElementById('media-time-current');
    const totalTimeEl = document.getElementById('media-time-total');
    const playBtn = document.getElementById('btn-media-play');
    const tileMedia = document.getElementById('tile-media');

    if (albumArt) albumArt.style.background = curTrack.cover;
    if (titleEl) titleEl.textContent = curTrack.title;
    if (artistEl) artistEl.textContent = `${curTrack.artist} • ${curTrack.album}`;
    if (curTimeEl) curTimeEl.textContent = formatSeconds(state.media.currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatSeconds(curTrack.duration);

    const pct = (state.media.currentTime / curTrack.duration) * 100;
    if (scrubberFill) scrubberFill.style.width = `${pct}%`;

    if (state.media.isPlaying) {
      if (tileMedia) tileMedia.classList.add('playing');
      if (playBtn) playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>';
    } else {
      if (tileMedia) tileMedia.classList.remove('playing');
      if (playBtn) playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
    }
  }

  function togglePlayMedia() {
    state.media.isPlaying = !state.media.isPlaying;
    if (state.media.isPlaying) {
      state.media.timerId = setInterval(() => {
        const curTrack = state.media.tracks[state.media.trackIndex];
        state.media.currentTime++;
        if (state.media.currentTime >= curTrack.duration) {
          nextTrack();
        }
        updateMediaUI();
      }, 1000);
    } else {
      clearInterval(state.media.timerId);
    }
    updateMediaUI();
  }

  function nextTrack() {
    state.media.trackIndex = (state.media.trackIndex + 1) % state.media.tracks.length;
    state.media.currentTime = 0;
    updateMediaUI();
  }

  function prevTrack() {
    state.media.trackIndex = (state.media.trackIndex - 1 + state.media.tracks.length) % state.media.tracks.length;
    state.media.currentTime = 0;
    updateMediaUI();
  }

  // ==========================================================================
  // FOCUS TIMER (POMODORO) LOGIC
  // ==========================================================================
  function updateFocusUI() {
    const minutes = Math.floor(state.focus.remainingSeconds / 60);
    const seconds = state.focus.remainingSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const digitsEl = document.getElementById('focus-digits');
    const tileMinEl = document.getElementById('tile-focus-min');
    const startBtn = document.getElementById('btn-focus-start');
    const bigRing = document.getElementById('focus-big-ring-progress');
    const miniRing = document.getElementById('tile-focus-ring-progress');

    if (digitsEl) digitsEl.textContent = formatted;
    if (tileMinEl) tileMinEl.textContent = `${minutes}m`;

    const progress = (state.focus.totalSeconds - state.focus.remainingSeconds) / state.focus.totalSeconds;

    // Big ring circumference = 2 * PI * 60 ≈ 377
    const bigOffset = 377 * (1 - progress);
    if (bigRing) bigRing.style.strokeDashoffset = bigOffset;

    // Mini ring circumference = 2 * PI * 12 ≈ 75.4
    const miniOffset = 75.4 * (1 - progress);
    if (miniRing) miniRing.style.strokeDashoffset = miniOffset;

    if (startBtn) {
      if (state.focus.isRunning) {
        startBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Session';
      } else {
        startBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg> Start Session';
      }
    }
  }

  function toggleFocusTimer() {
    state.focus.isRunning = !state.focus.isRunning;
    if (state.focus.isRunning) {
      state.focus.timerId = setInterval(() => {
        if (state.focus.remainingSeconds > 0) {
          state.focus.remainingSeconds--;
          updateFocusUI();
        } else {
          clearInterval(state.focus.timerId);
          state.focus.isRunning = false;
          alert('Focus session complete! Take a break.');
          updateFocusUI();
        }
      }, 1000);
    } else {
      clearInterval(state.focus.timerId);
    }
    updateFocusUI();
  }

  function resetFocusTimer(durationMinutes) {
    clearInterval(state.focus.timerId);
    state.focus.isRunning = false;
    const mins = durationMinutes || 25;
    state.focus.totalSeconds = mins * 60;
    state.focus.remainingSeconds = mins * 60;
    updateFocusUI();
  }

  // ==========================================================================
  // NIGHT LIGHT REAL-TIME LOGIC
  // ==========================================================================
  function updateNightLightUI() {
    const warmth = state.nightLight.enabled ? state.nightLight.warmth : 0;
    const warmthText = document.getElementById('nl-warmth-val');
    const toggleInput = document.getElementById('nl-toggle-input');
    const warmthSlider = document.getElementById('nl-warmth-slider');

    if (warmthText) warmthText.textContent = `${state.nightLight.warmth}%`;
    if (toggleInput) toggleInput.checked = state.nightLight.enabled;
    if (warmthSlider) warmthSlider.value = state.nightLight.warmth;

    // Apply real-time desktop tint filter
    if (state.nightLight.enabled) {
      const alpha = (state.nightLight.warmth / 100) * 0.45;
      if (nightLightOverlay) {
        nightLightOverlay.style.backgroundColor = `rgba(255, 135, 15, ${alpha})`;
      }
      desktopViewport.style.filter = `sepia(${state.nightLight.warmth * 0.45}%) saturate(${100 + state.nightLight.warmth * 0.25}%)`;
    } else {
      if (nightLightOverlay) {
        nightLightOverlay.style.backgroundColor = 'transparent';
      }
      desktopViewport.style.filter = 'none';
    }
  }

  // ==========================================================================
  // SYSTEM ACTIVITY SIMULATOR
  // ==========================================================================
  function simulateSystemFluctuation() {
    // Subtle realistic fluctuations
    state.system.cpu = Math.floor(16 + Math.random() * 12); // 16 - 28%
    state.system.ram = Math.floor(40 + Math.random() * 4);  // 40 - 44%

    const fillCpuMini = document.getElementById('sys-cpu-fill-mini');
    const fillRamMini = document.getElementById('sys-ram-fill-mini');
    const fillCpuLarge = document.getElementById('sys-cpu-fill-large');
    const fillRamLarge = document.getElementById('sys-ram-fill-large');
    const textCpu = document.getElementById('sys-cpu-val');
    const textRam = document.getElementById('sys-ram-val');

    if (fillCpuMini) fillCpuMini.style.width = `${state.system.cpu}%`;
    if (fillRamMini) fillRamMini.style.width = `${state.system.ram}%`;
    if (fillCpuLarge) fillCpuLarge.style.width = `${state.system.cpu}%`;
    if (fillRamLarge) fillRamLarge.style.width = `${state.system.ram}%`;
    if (textCpu) textCpu.textContent = `${state.system.cpu}%`;
    if (textRam) textRam.textContent = `${state.system.ram}%`;
  }
  setInterval(simulateSystemFluctuation, 2200);

  // ==========================================================================
  // EVENT LISTENERS BINDING
  // ==========================================================================
  function bindEvents() {
    // Widget Tile Clicks
    document.querySelectorAll('.dock-tile[data-widget]').forEach(tile => {
      tile.addEventListener('click', (e) => {
        e.stopPropagation();
        const widget = tile.getAttribute('data-widget');
        togglePanel(widget);
      });
    });

    // Panel Close Buttons
    document.querySelectorAll('.panel-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllPanels();
      });
    });

    // Click Outside Panel to Close
    desktopViewport.addEventListener('click', (e) => {
      if (!e.target.closest('.flyout-panel') && !e.target.closest('.dock-tile')) {
        closeAllPanels();
      }
    });

    // Edge Switcher Buttons
    document.querySelectorAll('[data-edge-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        setDockEdge(btn.getAttribute('data-edge-btn'));
      });
    });

    // Mode Switcher Buttons
    document.querySelectorAll('[data-mode-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        setDockMode(btn.getAttribute('data-mode-btn'));
      });
    });

    // Wallpaper Switcher Buttons
    document.querySelectorAll('[data-wall-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        setTheme(btn.getAttribute('data-wall-btn') === 'light');
      });
    });

    // Glass Strength Slider
    const glassSlider = document.getElementById('glass-strength-input');
    if (glassSlider) {
      glassSlider.addEventListener('input', (e) => {
        updateGlassStrength(Number(e.target.value));
      });
    }

    // Media Controls
    const playBtn = document.getElementById('btn-media-play');
    if (playBtn) playBtn.addEventListener('click', togglePlayMedia);

    const nextBtn = document.getElementById('btn-media-next');
    if (nextBtn) nextBtn.addEventListener('click', nextTrack);

    const prevBtn = document.getElementById('btn-media-prev');
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);

    // Focus Controls
    const focusStartBtn = document.getElementById('btn-focus-start');
    if (focusStartBtn) focusStartBtn.addEventListener('click', toggleFocusTimer);

    const focusResetBtn = document.getElementById('btn-focus-reset');
    if (focusResetBtn) focusResetBtn.addEventListener('click', () => resetFocusTimer(25));

    document.querySelectorAll('[data-focus-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-focus-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mins = Number(btn.getAttribute('data-focus-preset'));
        resetFocusTimer(mins);
      });
    });

    // Night Light Controls
    const nlToggle = document.getElementById('nl-toggle-input');
    if (nlToggle) {
      nlToggle.addEventListener('change', (e) => {
        state.nightLight.enabled = e.target.checked;
        updateNightLightUI();
      });
    }

    const nlSlider = document.getElementById('nl-warmth-slider');
    if (nlSlider) {
      nlSlider.addEventListener('input', (e) => {
        state.nightLight.warmth = Number(e.target.value);
        state.nightLight.enabled = true;
        updateNightLightUI();
      });
    }

    // Quick Actions Pills
    document.querySelectorAll('.qa-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const action = tile.getAttribute('data-action');
        if (action === 'caffeine') {
          state.quickActions.caffeine = !state.quickActions.caffeine;
          tile.classList.toggle('active', state.quickActions.caffeine);
        } else if (action === 'snip') {
          // Snip screen flash animation
          const flash = document.createElement('div');
          flash.style.position = 'absolute';
          flash.style.inset = '0';
          flash.style.backgroundColor = 'rgba(255,255,255,0.7)';
          flash.style.zIndex = '999';
          flash.style.pointerEvents = 'none';
          flash.style.transition = 'opacity 0.4s ease';
          desktopViewport.appendChild(flash);
          setTimeout(() => { flash.style.opacity = '0'; }, 50);
          setTimeout(() => { flash.remove(); }, 450);
        } else if (action === 'mute') {
          state.quickActions.mute = !state.quickActions.mute;
          tile.classList.toggle('active', state.quickActions.mute);
        } else if (action === 'nightlight') {
          state.nightLight.enabled = !state.nightLight.enabled;
          updateNightLightUI();
        }
      });
    });

    // Radio Presets
    document.querySelectorAll('.btn-station').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-station').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const stationName = btn.textContent.trim();
        const curStationLabel = document.getElementById('current-radio-station');
        if (curStationLabel) curStationLabel.textContent = stationName;
      });
    });
  }

  // --- Initial Setup ---
  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    setDockMode('work');
    updateMediaUI();
    updateFocusUI();
    updateNightLightUI();
    simulateSystemFluctuation();
    
    // Auto-open Now Playing panel on load so visitors immediately see the live glass panel
    setTimeout(() => {
      openPanel('media');
    }, 150);
  });

})();
