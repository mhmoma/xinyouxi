(function (global) {
  "use strict";

  var bgEl = null;
  var charEl = null;
  var dimEl = null;
  var currentBg = "";
  var currentChar = "";

  var BG_BASE = "assets/bg/";
  var CHAR_BASE = "assets/char/wanqing/";
  var PLAYER_BASE = "assets/char/player/";

  var CHAR_FILE = {
    standing: "normal.png",
    home_idle: "normal.png",
    home_smile: "s1.png",
    home_awkward: "e1.png",
    home_angry: "a1.png",
    home_drunk: "n_s1.png"
  };

  var PLAYER_FILE = {
    player_suitcase: "open-01-back-suitcase.png",
    player_phone: "open-02-back-phone.png",
    player_call: "open-03-answer-call.png",
    player_talk: "talk-stand.png"
  };

  function isInside(el, selector) {
    if (!el) return false;
    if (el.closest) return !!el.closest(selector);
    while (el) {
      if (el.matches && el.matches(selector)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function ensure() {
    if (bgEl && charEl) return;
    bgEl = document.getElementById("layer-bg");
    charEl = document.getElementById("layer-char");
    dimEl = document.getElementById("layer-dim");

    if (charEl) {
      charEl.style.pointerEvents = "none";
    }

    if (bgEl && !bgEl.querySelector("img")) {
      var img = document.createElement("img");
      img.alt = "";
      img.draggable = false;
      img.className = "stage-bg-img";
      bgEl.appendChild(img);
    }

    if (charEl && !charEl.querySelector("img")) {
      var c = document.createElement("img");
      c.alt = "";
      c.draggable = false;
      c.className = "stage-char-img";
      c.style.pointerEvents = "auto";
      c.style.cursor = "pointer";

      c.addEventListener("load", function () {
        if (window.Hitmap && Hitmap.syncFromCharImg) Hitmap.syncFromCharImg(c);
      });

      c.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (window.Slg && window.Slg.onCharClick) {
          window.Slg.onCharClick();
        }
      });

      charEl.appendChild(c);
    }
  }

  // Outside click listener: hide #actions-panel when clicking non-sprite area
  document.addEventListener("click", function (ev) {
    var target = ev.target;
    if (!target) return;

    var isCharImg = target.classList && target.classList.contains("stage-char-img");
    var inActionsPanel = isInside(target, "#actions-panel");
    var inNpcPanel = isInside(target, "#npc-panel");
    var inModal = isInside(target, ".modal-sheet");
    var inRibbon = isInside(target, ".phone-floating-ribbon");

    if (!isCharImg && !inActionsPanel && !inNpcPanel && !inModal && !inRibbon) {
      if (window.Slg && window.Slg.hideActionsPanel) {
        window.Slg.hideActionsPanel();
      }
    }
  });

  function isPlayerChar(id) {
    return !!(id && PLAYER_FILE[id]);
  }

  function resolveCharSrc(id) {
    if (!id) return "";
    if (PLAYER_FILE[id]) return PLAYER_BASE + PLAYER_FILE[id];
    if (id.indexOf(".") >= 0) {
      if (id.indexOf("/") >= 0) return "assets/char/" + id;
      return CHAR_BASE + id;
    }
    if (CHAR_FILE[id]) return CHAR_BASE + CHAR_FILE[id];
    return CHAR_BASE + id + ".png";
  }

  function setBg(id) {
    ensure();
    if (!id || id === "none") {
      currentBg = "";
      if (bgEl) {
        var img = bgEl.querySelector("img");
        if (img) img.removeAttribute("src");
      }
      return;
    }
    if (id === currentBg) return;
    currentBg = id;
    var img = bgEl.querySelector("img");
    var file = id.indexOf(".") >= 0 ? id : id + ".webp";
    img.src = BG_BASE + file;
  }

  function setChar(id) {
    ensure();
    var img = charEl.querySelector("img");
    if (!id || id === "none") {
      currentChar = "";
      img.classList.add("is-hide");
      img.classList.remove("is-player");
      img.removeAttribute("src");
      return;
    }
    var src = resolveCharSrc(id);
    img.classList.remove("is-hide");
    if (isPlayerChar(id)) img.classList.add("is-player");
    else img.classList.remove("is-player");
    if (id === currentChar) return;
    currentChar = id;
    img.src = src;
  }

  function setDim(on) {
    ensure();
    if (!dimEl) return;
    if (on) dimEl.classList.add("is-on");
    else dimEl.classList.remove("is-on");
  }

  function applyBeat(beat) {
    if (!beat) return;
    if (beat.bg != null) setBg(beat.bg);
    if (beat.char != null) setChar(beat.char);
    if (beat.dim != null) setDim(!!beat.dim);
  }

  global.Stage = {
    setBg: setBg,
    setChar: setChar,
    setDim: setDim,
    applyBeat: applyBeat,
    resolveCharSrc: resolveCharSrc,
    isPlayerChar: isPlayerChar
  };
})(window);
