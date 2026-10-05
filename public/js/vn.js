(function (global) {
  "use strict";

  var LOC = {
    entry: "玄关",
    living: "客厅",
    kitchen: "厨房",
    player_room: "次卧",
    her_room: "她的房",
    bath: "浴室",
    laundry: "洗衣",
    street: "楼下",
    black: " "
  };

  var el = {};
  var beats = {};
  var curId = "";
  var busy = false;
  var enabled = true;
  var playerName = "同学";
  var onEnd = null;
  var lastHeroine = "";

  // Dynamic stat accumulation for trust/lust inside dialogues
  var accumulatedTrust = 0;
  var accumulatedLust = 0;

  function locOf(bg) {
    if (!bg) return "";
    var s = String(bg);
    if (s.indexOf("player_room") === 0) return LOC.player_room;
    if (s.indexOf("her_room") === 0) return LOC.her_room;
    var key = s.split("_")[0];
    return LOC[key] || "";
  }

  function timeOf(bg) {
    if (!bg || bg === "black") return "";
    if (/night/.test(bg)) return "夜";
    if (/day/.test(bg)) return "日";
    return "";
  }

  function fill(text) {
    return String(text || "").replace(/\{0\}/g, playerName);
  }

  function nameOf(speaker) {
    if (speaker === "wanqing") return "晚晴";
    return "";
  }

  function resolveBeatChar(beat) {
    if (beat.char != null) {
      if (beat.char !== "none" && !(window.Stage && Stage.isPlayerChar && Stage.isPlayerChar(beat.char))) {
        lastHeroine = beat.char;
      }
      return beat.char;
    }
    if (beat.speaker === "player") return "player_talk";
    if (beat.speaker === "wanqing" && lastHeroine) return lastHeroine;
    return undefined;
  }

  function paint(beat) {
    // Accumulate beat-level stat gains if specified
    if (beat.trustGain) accumulatedTrust += beat.trustGain;
    if (beat.trust) accumulatedTrust += beat.trust;
    if (beat.lustGain) accumulatedLust += beat.lustGain;
    if (beat.lust) accumulatedLust += beat.lust;

    if (window.Stage) {
      var char = resolveBeatChar(beat);
      var apply = {
        bg: beat.bg,
        dim: beat.bg !== "black"
      };
      if (char !== undefined) apply.char = char;
      Stage.applyBeat(apply);
    }
    if (el.loc) {
      var loc = beat.loc || locOf(beat.bg);
      if (loc && loc.trim()) el.loc.textContent = loc;
    }
    if (el.time && beat.time) el.time.textContent = beat.time;
    else if (el.time && beat.bg) {
      var t = timeOf(beat.bg);
      if (t) el.time.textContent = t;
    }
    el.name.textContent = beat.name != null ? beat.name : nameOf(beat.speaker);
    el.text.textContent = fill(beat.text);
    clearChoices();
    if (beat.choices && beat.choices.length) {
      if (el.hint) el.hint.hidden = true;
      busy = true;
      beat.choices.forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.textContent = fill(c.text);
        b.addEventListener("click", function (ev) {
          ev.stopPropagation();
          // Accumulate choice-level stat gains if specified
          if (c.trust) accumulatedTrust += c.trust;
          if (c.trustGain) accumulatedTrust += c.trustGain;
          if (c.lust) accumulatedLust += c.lust;
          if (c.lustGain) accumulatedLust += c.lustGain;
          go(c.next);
        });
        el.choices.appendChild(b);
      });
    } else if (el.hint) {
      el.hint.hidden = false;
    }
  }

  function clearChoices() {
    el.choices.innerHTML = "";
    busy = false;
  }

  function applyGainsToState() {
    if (accumulatedTrust === 0 && accumulatedLust === 0) return;
    try {
      var slgState = global.Slg && global.Slg.getState && global.Slg.getState();
      if (slgState && slgState.wanqing) {
        var oldTrust = slgState.wanqing.trust || 0;
        var oldLust = slgState.wanqing.lust || 0;
        
        slgState.wanqing.trust = Math.max(0, Math.min(100, oldTrust + accumulatedTrust));
        slgState.wanqing.lust = Math.max(0, Math.min(100, oldLust + accumulatedLust));
        
        // Save the updated state to persistent local storage
        var SAVE_KEY = "hezu_slg_v1";
        localStorage.setItem(SAVE_KEY, JSON.stringify(slgState));
        if (window.dzmm && dzmm.kv && dzmm.kv.put) {
          dzmm.kv.put(SAVE_KEY, JSON.stringify(slgState), { flush: true });
        }
        
        console.log("VN End: Applied Trust +" + accumulatedTrust + " and Lust +" + accumulatedLust);
        
        // If there's an element like #fx-heart in the DOM, let's pop it for visual feedback!
        var fxHeart = document.getElementById("fx-heart");
        if (fxHeart) {
          var parts = [];
          if (accumulatedTrust > 0) parts.push("❤ 信赖 +" + accumulatedTrust);
          if (accumulatedLust > 0) parts.push("🔥 欲望 +" + accumulatedLust);
          if (parts.length > 0) {
            fxHeart.hidden = false;
            fxHeart.innerHTML = parts.join(" | ");
            fxHeart.classList.add("is-on");
            window.setTimeout(function () {
              fxHeart.classList.remove("is-on");
              fxHeart.hidden = true;
            }, 2500);
          }
        }
      }
    } catch (e) {
      console.error("Error applying VN gains:", e);
    }
  }

  function go(id) {
    if (!id || id === "end") {
      // Calculate and apply accumulated trust and lust at the end of the dialogue script!
      applyGainsToState();
      
      if (typeof onEnd === "function") onEnd();
      return;
    }
    var beat = beats[id];
    if (!beat) return;
    curId = id;
    paint(beat);
  }

  function next() {
    if (!enabled) return;
    if (busy) return;
    var beat = beats[curId];
    if (!beat) return;
    go(beat.next || "end");
  }

  function load(data, startId) {
    enabled = true;
    beats = {};
    accumulatedTrust = 0;
    accumulatedLust = 0;
    
    var list = [];
    if (Array.isArray(data)) {
      // Multi-stage dialogue scripts array! Chain their transitions sequentially.
      for (var i = 0; i < data.length; i++) {
        var stage = data[i];
        var stageBeats = (stage && stage.beats) || [];
        if (stageBeats.length > 0) {
          if (i > 0 && list.length > 0) {
            var prevLastBeat = list[list.length - 1];
            if (!prevLastBeat.next || prevLastBeat.next === "end") {
              prevLastBeat.next = stageBeats[0].id;
            }
          }
          list = list.concat(stageBeats);
        }
      }
      playerName = (data[0] && data[0].playerName) || "同学";
    } else {
      playerName = (data && data.playerName) || "同学";
      list = (data && data.beats) || [];
    }

    list.forEach(function (b) {
      if (b && b.id) beats[b.id] = b;
    });
    lastHeroine = "";
    go(startId || (data && data.start) || (list[0] && list[0].id));
  }

  function bind(nodes, endFn) {
    el = nodes;
    onEnd = endFn || null;
    if (el.panel) {
      el.panel.addEventListener("click", function (ev) {
        if (ev.target && ev.target.classList && ev.target.classList.contains("choice")) return;
        next();
      });
    }
  }

  global.Vn = {
    bind: bind,
    load: load,
    next: next,
    go: go,
    setEnabled: function (on) {
      enabled = !!on;
    }
  };
})(window);
