(function (global) {
  "use strict";

  var canvas = null;
  var ctx = null;
  var catcher = null;
  var enabled = false;
  var onHit = null;
  var lastSrc = "";

  function ensure() {
    if (canvas) return;
    try {
      canvas = document.createElement("canvas");
      ctx = canvas.getContext ? canvas.getContext("2d", { willReadFrequently: true }) : null;
    } catch (e) {
      ctx = null;
    }
    catcher = document.getElementById("hit-catcher");
    if (catcher) {
      catcher.addEventListener("pointerdown", onPointer, { passive: false });
    }
  }

  function syncFromCharImg(img) {
    ensure();
    if (!ctx || !img || !img.naturalWidth) return;
    if (img.src === lastSrc && canvas.width === img.naturalWidth) return;
    lastSrc = img.src;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }

  function alphaAtDisplay(img, clientX, clientY) {
    if (!ctx || !img || !img.naturalWidth) return 0;
    var rect = img.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return 0;
    var nx = (clientX - rect.left) / rect.width;
    var ny = (clientY - rect.top) / rect.height;
    if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return 0;
    syncFromCharImg(img);
    var x = Math.floor(nx * canvas.width);
    var y = Math.floor(ny * canvas.height);
    try {
      return ctx.getImageData(x, y, 1, 1).data[3];
    } catch (e) {
      return 0;
    }
  }

  function onPointer(ev) {
    if (!enabled) return;
    var img = document.querySelector("#layer-char .stage-char-img");
    if (!img || img.classList.contains("is-hide")) return;
    var a = alphaAtDisplay(img, ev.clientX, ev.clientY);
    if (a < 16) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (typeof onHit === "function") onHit({ alpha: a });
  }

  function setEnabled(on) {
    ensure();
    enabled = !!on;
    if (catcher) {
      catcher.style.pointerEvents = enabled ? "auto" : "none";
    }
  }

  global.Hitmap = {
    setEnabled: setEnabled,
    bind: function (fn) { onHit = fn || null; },
    syncFromCharImg: syncFromCharImg
  };
})(window);
