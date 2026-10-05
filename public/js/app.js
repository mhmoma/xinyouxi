(function (global) {
  "use strict";

  var boot = document.getElementById("boot-loader");
  var bootText = document.getElementById("boot-loader-text");
  var bootBar = document.getElementById("boot-loader-bar");
  var screenTitle = document.getElementById("screen-title");
  var screenGame = document.getElementById("screen-game");
  var btnStart = document.getElementById("btn-start");
  var btnSlg = document.getElementById("btn-slg");
  var btnGalleryOpen = document.getElementById("btn-gallery-open");
  var btnContinue = document.getElementById("btn-continue");
  var btnMenu = document.getElementById("btn-menu");
  var menuSheet = document.getElementById("menu-sheet");
  var menuBack = document.getElementById("menu-back");
  var menuGallery = document.getElementById("menu-gallery");
  var menuTitle = document.getElementById("menu-title");
  var vnHint = document.getElementById("vn-hint");
  var btnSkipVn = document.getElementById("btn-skip-vn");
  var mode = "title";

  // --- Audio System ---
  var audioContext = null;
  function getAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  function playSynth(type) {
    if (audio.muted) return;
    var ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    var now = ctx.currentTime;

    if (type === "ipad") {
      // Rising chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "taobao") {
      // Coin/Cash register
      osc.type = "triangle";
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.05); // E6
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "hit") {
      // Success ping
      osc.type = "sine";
      osc.frequency.setValueAtTime(1500, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }
  global.playSynth = playSynth;

  var audio = {
    bgm: new Audio("assets/audio/bgm_ambient.wav"),
    sfx: {
      click: new Audio("assets/audio/click.wav"),
      confirm: new Audio("assets/audio/confirm.wav"),
      hover: new Audio("assets/audio/hover.wav")
    },
    muted: false
  };
  audio.bgm.loop = true;
  audio.bgm.volume = 0.3;

  function playSfx(name) {
    if (audio.muted) return;
    try {
      var s = audio.sfx[name];
      if (s) {
        var clone = s.cloneNode();
        clone.volume = 0.5;
        clone.play().catch(function() {});
      }
    } catch(e) {}
  }

  function toggleAudio() {
    audio.muted = !audio.muted;
    if (audio.muted) {
      audio.bgm.pause();
    } else {
      audio.bgm.play().catch(function() {});
    }
    var toggleBtn = document.getElementById("title-audio-toggle");
    if (toggleBtn) {
      toggleBtn.querySelector("span").textContent = audio.muted ? "🔇" : "🔊";
    }
  }

  // --- Feedback & Ripple System ---
  function createRipple(event) {
    var app = document.getElementById("app");
    if (!app) return;
    
    var ripple = document.createElement("span");
    ripple.classList.add("ripple");
    app.appendChild(ripple);
    
    // Calculate position relative to #app
    var rect = app.getBoundingClientRect();
    var x = (event.clientX - rect.left) / (rect.width / app.offsetWidth);
    var y = (event.clientY - rect.top) / (rect.height / app.offsetHeight);
    
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    
    ripple.addEventListener("animationend", function() {
      ripple.remove();
    });
  }

  function applyFeedback(el) {
    el.classList.remove("feedback-animate");
    void el.offsetWidth; // Trigger reflow
    el.classList.add("feedback-animate");
  }

  document.addEventListener("mousedown", function(e) {
    createRipple(e);
  });

  // Auto-bind SFX to all buttons
  function bindGlobalSfx() {
    var buttons = document.querySelectorAll("button, .choice, .npc-act, .mmap-room, .ipad-app-icon, .hud-time, .hud-energy, .hud-gold, .hud-study");
    buttons.forEach(function(btn) {
      if (btn._sfxBound) return;
      btn.addEventListener("mouseenter", function() { playSfx("hover"); });
      btn.addEventListener("click", function() { 
        if (btn.classList.contains("ipad-app-icon") || btn.classList.contains("hud-time") || btn.classList.contains("hud-energy") || btn.classList.contains("hud-gold") || btn.classList.contains("hud-study")) {
          applyFeedback(btn);
        }

        if (btn.classList.contains("btn--primary") || btn.id === "btn-start") {
          playSfx("confirm");
        } else {
          playSfx("click");
        }
      });
      btn._sfxBound = true;
    });
  }

  // Start BGM on first interaction (Browser policy)
  document.addEventListener("click", function() {
    if (!audio.muted && audio.bgm.paused) {
      audio.bgm.play().catch(function() {});
    }
  }, { once: true });

  function setBoot(pct, msg) {
    if (bootText) bootText.textContent = msg || "开门中";
    if (bootBar) bootBar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    try {
      if (global.dzmm && dzmm.loading && dzmm.loading.progress) {
        dzmm.loading.progress({
          phase: pct >= 100 ? "boot" : "start",
          message: msg || "",
          percent: Math.round(pct)
        });
      }
    } catch (e) {}
  }

  function readyBoot() {
    if (boot) boot.classList.add("is-done");
    try {
      if (global.dzmm && dzmm.loading && dzmm.loading.ready) dzmm.loading.ready();
    } catch (e) {}
  }

  function setMode(m) {
    mode = m;
    if (global.Hitmap) Hitmap.setEnabled(false);
  }

  function chapterEnd() {
    readyBoot();
    if (screenTitle) screenTitle.classList.add("hidden");
    if (screenGame) {
      screenGame.classList.remove("hidden");
      screenGame.classList.remove("is-vn");
      screenGame.classList.add("is-slg");
    }
    if (global.Vn && Vn.setEnabled) Vn.setEnabled(false);
    setMode("slg");
    if (!global.Slg) return;
    Slg.loadTables()
      .then(function () {
        Slg.bootAfterMoveIn();
      })
      .catch(function () {
        Slg.bootAfterMoveIn();
      });
  }

  function startCh0(data) {
    readyBoot();
    if (screenTitle) screenTitle.classList.add("hidden");
    if (screenGame) {
      screenGame.classList.remove("hidden");
      screenGame.classList.add("is-vn");
      screenGame.classList.remove("is-slg");
      screenGame.classList.remove("is-talk");
    }
    if (vnHint) {
      vnHint.hidden = false;
      vnHint.textContent = "点这里继续";
    }
    setMode("vn");
    if (global.Vn && Vn.setEnabled) Vn.setEnabled(true);
    if (global.Vn) Vn.load(data, data.start);
  }

  function openGame() {
    readyBoot();
    if (global.CH00_DATA) {
      startCh0(global.CH00_DATA);
      return;
    }
    setBoot(60, "读入住");
    fetch("data/script/ch00.json?v=5")
      .then(function (r) {
        if (!r.ok) throw new Error("ch00");
        return r.json();
      })
      .then(startCh0)
      .catch(function () {
        if (screenTitle) screenTitle.classList.add("hidden");
        if (screenGame) screenGame.classList.remove("hidden");
        setMode("vn");
        if (global.Stage) Stage.applyBeat({ bg: "living_day", char: "normal", dim: true });
        var vnName = document.getElementById("vn-name");
        var vnText = document.getElementById("vn-text");
        if (vnName) vnName.textContent = "";
        if (vnText) vnText.textContent = "正在进入日常互动...";
        chapterEnd();
      });
  }

  if (global.Vn) {
    Vn.bind(
      {
        name: document.getElementById("vn-name"),
        text: document.getElementById("vn-text"),
        choices: document.getElementById("vn-choices"),
        hint: vnHint,
        panel: document.getElementById("layer-vn")
      },
      chapterEnd
    );
  }

  function continueGame() {
    readyBoot();
    if (screenTitle) screenTitle.classList.add("hidden");
    if (screenGame) screenGame.classList.remove("hidden");
    if (global.Vn && Vn.setEnabled) Vn.setEnabled(false);
    setMode("slg");
    if (!global.Slg || !Slg.continueFromSave()) {
      var vnText = document.getElementById("vn-text");
      if (vnText) vnText.textContent = "没有能读的进度，直接开启新生活。";
      chapterEnd();
    }
  }

  if (global.Slg) {
    Slg.bind({
      clock: document.getElementById("hud-clock-icon"),
      time: document.getElementById("hud-time"),
      energyFill: document.getElementById("hud-energy-fill"),
      energyNum: document.getElementById("hud-energy-num"),
      gold: document.getElementById("hud-gold"),
      study: document.getElementById("hud-study"),
      name: document.getElementById("vn-name"),
      text: document.getElementById("vn-text"),
      choices: document.getElementById("vn-choices"),
      hint: vnHint,
      panel: document.getElementById("layer-vn"),
      npcPanel: document.getElementById("npc-panel"),
      npcActs: document.getElementById("npc-acts"),
      npcState: document.getElementById("npc-state"),
      npcFace: document.getElementById("npc-face"),
      heartFill: document.getElementById("npc-heart-fill"),
      lustFill: document.getElementById("npc-lust-fill"),
      npcRel: document.getElementById("npc-rel"),
      hot: document.getElementById("layer-hot"),
      mapFab: document.getElementById("btn-map"),
      mapBox: document.getElementById("mini-map"),
      mapGrid: document.getElementById("mini-map-grid"),
      mapClose: document.getElementById("mini-map-close"),
      fxHeart: document.getElementById("fx-heart"),
      sheet: document.getElementById("slg-sheet"),
      sheetTitle: document.getElementById("slg-sheet-title"),
      sheetBody: document.getElementById("slg-sheet-body"),
      sheetClose: document.getElementById("slg-sheet-close")
    });
    Slg.loadTables()
      .then(function () {
        if (btnContinue && Slg.hasSave()) btnContinue.disabled = false;
        if (btnSlg) {
          var isDone = Slg.isPrologueDone && Slg.isPrologueDone();
          btnSlg.disabled = !isDone;
          if (!isDone) {
            var desc = btnSlg.querySelector(".btn-desc");
            if (desc) desc.textContent = "🔒 需先完成一次序章解锁";
          }
        }
      })
      .catch(function () {});
  }

  if (btnStart) btnStart.addEventListener("click", openGame);
  if (btnSlg) {
    btnSlg.addEventListener("click", function () {
      chapterEnd();
    });
  }
  if (btnGalleryOpen) {
    btnGalleryOpen.addEventListener("click", function () {
      if (global.Slg && Slg.openGallery) {
        Slg.openGallery("all");
      }
    });
  }
  if (btnContinue) btnContinue.addEventListener("click", continueGame);
  
  var audioToggle = document.getElementById("title-audio-toggle");
  if (audioToggle) audioToggle.addEventListener("click", toggleAudio);

  // Re-bind SFX when UI changes
  setInterval(bindGlobalSfx, 1000);
  bindGlobalSfx();

  if (btnSkipVn) {
    btnSkipVn.addEventListener("click", function () {
      chapterEnd();
    });
  }

  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      if (menuSheet) menuSheet.classList.remove("hidden");
    });
  }
  if (menuBack) {
    menuBack.addEventListener("click", function () {
      if (menuSheet) menuSheet.classList.add("hidden");
    });
  }
  if (menuGallery) {
    menuGallery.addEventListener("click", function () {
      if (menuSheet) menuSheet.classList.add("hidden");
      if (global.Slg && Slg.openGallery) {
        Slg.openGallery("all");
      }
    });
  }
  if (menuTitle) {
    menuTitle.addEventListener("click", function () {
      if (menuSheet) menuSheet.classList.add("hidden");
      if (screenGame) screenGame.classList.add("hidden");
      if (screenTitle) screenTitle.classList.remove("hidden");
      setMode("title");
    });
  }

  // Embedded smartphone listeners
  var btnPhoneShop = document.getElementById("btn-phone-shop");
  var btnPhoneMonitor = document.getElementById("btn-phone-monitor");
  var btnPhoneSns = document.getElementById("btn-phone-sns");
  var btnPhoneGallery = document.getElementById("btn-phone-gallery");

  if (btnPhoneShop) {
    btnPhoneShop.addEventListener("click", function () {
      if (global.Slg && Slg.openTaobaoModal) Slg.openTaobaoModal();
      else if (global.Slg && Slg.openSheet) Slg.openSheet("shop");
    });
  }
  if (btnPhoneMonitor) {
    btnPhoneMonitor.addEventListener("click", function () {
      if (global.Slg && Slg.openCctvModal) Slg.openCctvModal();
      else if (global.Slg && Slg.execAction) Slg.execAction("monitor");
    });
  }
  if (btnPhoneSns) {
    btnPhoneSns.addEventListener("click", function () {
      if (global.Slg && Slg.openIpadModal) Slg.openIpadModal();
      else if (global.Slg && Slg.execAction) Slg.execAction("sns");
    });
  }
  if (btnPhoneGallery) {
    btnPhoneGallery.addEventListener("click", function () {
      if (global.Slg && Slg.openGallery) Slg.openGallery("all");
    });
  }

  // Fast boot
  readyBoot();

  // --- Responsive Proportional Scaling (Adaptive 1:1 Zoom for Mobile/Web) ---
  var appContainer = document.getElementById("app");
  var DESIGN_W = 1280;
  var DESIGN_H = 720;

  function updateAppScale() {
    if (!appContainer) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    
    // Scale factor to fit inside the viewport
    var scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    
    // Apply the scale transform centered
    appContainer.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
    
    // Optional: Force scroll to top on some mobile browsers
    if (vw < vh) {
        // If portrait, we might want to warn or just keep scaling.
        // For now, keep scaling as requested.
    }
  }

  window.addEventListener("resize", updateAppScale);
  window.addEventListener("orientationchange", updateAppScale);
  updateAppScale();

  // --- Game Heartbeat (Autonomous NPC Living) ---
  setInterval(function() {
    if (mode === "slg" && global.Slg && global.Slg.heartbeat) {
      global.Slg.heartbeat();
    }
  }, 10000); // Check every 10 seconds for potential NPC movement

  global.openGame = openGame;
  global.chapterEnd = chapterEnd;
  global.startCh0 = startCh0;
  global.continueGame = continueGame;
})(window);
