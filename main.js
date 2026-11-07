/* =========================================================
   Looping terminal animation + reveal-on-scroll.
   No frameworks. ~3 KB. Plays nicely on phones.
   ========================================================= */

(function () {
  "use strict";

  // ---------- TERMINAL LOOP ----------
  // The script is one full cycle. After the last line, we wait 2.5 s, clear, and start again.
  // No identifying vendor or refinery references anywhere.

  var SCRIPT = [
    { type: "prompt", text: "engineer@laptop:~$ " },
    { type: "user",   text: "ask \"find all vendor emails about the heat exchanger replacement\"" },
    { type: "wait",   ms: 700 },
    { type: "blank" },
    { type: "ai",     text: "reading 47,221 messages plus attachments ..." },
    { type: "wait",   ms: 850 },
    { type: "blank" },
    { type: "kv",     k: "match",  v: "1   score 0.93" },
    { type: "kv",     k: "  subject", v: "performance report 2026_04 (post site visit)" },
    { type: "kv",     k: "  from",    v: "heat-exchanger fabricator" },
    { type: "kv",     k: "  date",    v: "2026-05-11" },
    { type: "kv",     k: "  excerpt", v: "replacement now framed as the most" },
    { type: "kv",     k: "         ", v: "sensible solution, PNA fouling" },
    { type: "kv",     k: "         ", v: "downgraded after site visit." },
    { type: "blank" },
    { type: "kv",     k: "match",  v: "2   score 0.88" },
    { type: "kv",     k: "  subject", v: "site visit minutes of meeting" },
    { type: "kv",     k: "  from",    v: "vendor regional sales" },
    { type: "kv",     k: "  date",    v: "2026-04-13" },
    { type: "blank" },
    { type: "kv",     k: "match",  v: "3   score 0.86" },
    { type: "kv",     k: "  subject", v: "recommendations follow-up" },
    { type: "kv",     k: "  from",    v: "vendor process specialist" },
    { type: "kv",     k: "  date",    v: "2024-10-21" },
    { type: "blank" },
    { type: "meta",   text: "returned 12 messages in 1.4 seconds." },
    { type: "wait",   ms: 2800 },
  ];

  var TYPE_SPEED = 22;     // ms per character for typed user line
  var REVEAL_PAUSE = 70;   // ms between AI lines that appear together
  var CYCLE_PAUSE = 1200;  // ms before clearing and restarting

  var host = document.getElementById("terminal-body");
  if (!host) return;

  // Layout lock (2026-11-07): an invisible copy of the FINISHED output holds the box at its
  // final height at any screen width, and the live animation draws on top of it. Without this
  // the box grew and shrank every cycle and the page below it jumped (bad on phones).
  var ghost = document.createElement("div");
  ghost.className = "terminal-ghost";
  ghost.setAttribute("aria-hidden", "true");
  var body = document.createElement("div");
  body.className = "terminal-live";
  host.innerHTML = "";
  host.appendChild(ghost);
  host.appendChild(body);
  (function renderGhost() {
    var line = null;
    SCRIPT.forEach(function (st) {
      var d;
      if (st.type === "prompt") {
        line = document.createElement("div");
        var ps = document.createElement("span"); ps.className = "prompt"; ps.textContent = st.text;
        line.appendChild(ps); ghost.appendChild(line);
      } else if (st.type === "user") {
        var us = document.createElement("span"); us.className = "user"; us.textContent = st.text + " ";
        (line || ghost).appendChild(us);
      } else if (st.type === "ai" || st.type === "meta") {
        d = document.createElement("div"); d.textContent = st.text; ghost.appendChild(d);
      } else if (st.type === "kv") {
        d = document.createElement("div");
        var k = document.createElement("span"); k.textContent = st.k;
        var v = document.createElement("span"); v.textContent = "  " + st.v;
        d.appendChild(k); d.appendChild(v); ghost.appendChild(d);
      } else if (st.type === "blank") {
        d = document.createElement("div"); d.innerHTML = "&nbsp;"; ghost.appendChild(d);
      }
    });
  })();

  // Pause the loop while the terminal is off screen (no work, no movement, saves battery).
  var onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }).observe(host);
  }
  function whileHidden() {
    return new Promise(function (r) {
      (function chk() { if (onScreen) r(); else setTimeout(chk, 400); })();
    });
  }

  function clear() { body.innerHTML = ""; }

  function appendNode(cls, text) {
    var span = document.createElement("span");
    span.className = cls;
    span.textContent = text;
    body.appendChild(span);
    return span;
  }

  function appendLine(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    body.appendChild(div);
    return div;
  }

  function typeText(text, cls) {
    return new Promise(function (resolve) {
      var span = document.createElement("span");
      span.className = cls || "user";
      body.appendChild(span);
      var i = 0;
      function step() {
        if (i >= text.length) { resolve(); return; }
        span.textContent += text.charAt(i);
        i++;
        setTimeout(step, TYPE_SPEED);
      }
      step();
    });
  }

  function appendKV(k, v) {
    var line = document.createElement("div");
    var keyEl = document.createElement("span");
    keyEl.className = "key";
    keyEl.textContent = k;
    var valEl = document.createElement("span");
    valEl.className = "val";
    valEl.textContent = "  " + v;
    line.appendChild(keyEl);
    line.appendChild(valEl);
    body.appendChild(line);
  }

  function appendAi(text) {
    var line = document.createElement("div");
    line.className = "ai-line";
    line.textContent = text;
    body.appendChild(line);
  }

  function appendMeta(text) {
    var line = document.createElement("div");
    line.className = "meta";
    line.textContent = text;
    body.appendChild(line);
  }

  function appendBlank() {
    var line = document.createElement("div");
    line.innerHTML = "&nbsp;";
    body.appendChild(line);
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function appendCaret() {
    var caret = document.createElement("span");
    caret.className = "caret";
    body.appendChild(caret);
    return caret;
  }

  function removeCaret() {
    var c = body.querySelector(".caret");
    if (c) c.remove();
  }

  async function playCycle() {
    clear();
    var caret = null;
    for (var i = 0; i < SCRIPT.length; i++) {
      var step = SCRIPT[i];
      if (step.type === "prompt") {
        var div = document.createElement("div");
        var ps = document.createElement("span");
        ps.className = "prompt";
        ps.textContent = step.text;
        div.appendChild(ps);
        body.appendChild(div);
        // Move subsequent user-text into this same line.
        // We will append the user span to the LAST div added.
        // Track this by giving the div an id we can grab.
        div.id = "current-prompt-line";
      } else if (step.type === "user") {
        var line = document.getElementById("current-prompt-line");
        var span = document.createElement("span");
        span.className = "user";
        if (line) line.appendChild(span); else body.appendChild(span);
        // Type one char at a time.
        await typeIntoElement(span, step.text);
        line && (line.id = "");
      } else if (step.type === "wait") {
        // Show a blinking caret during the wait so it looks like the AI is thinking.
        removeCaret();
        appendCaret();
        await sleep(step.ms);
        removeCaret();
      } else if (step.type === "ai") {
        appendAi(step.text);
        await sleep(REVEAL_PAUSE);
      } else if (step.type === "kv") {
        appendKV(step.k, step.v);
        await sleep(REVEAL_PAUSE);
      } else if (step.type === "meta") {
        appendMeta(step.text);
        await sleep(REVEAL_PAUSE);
      } else if (step.type === "blank") {
        appendBlank();
      }
    }
    await sleep(CYCLE_PAUSE);
  }

  function typeIntoElement(el, text) {
    return new Promise(function (resolve) {
      var i = 0;
      function step() {
        if (i >= text.length) { resolve(); return; }
        el.textContent += text.charAt(i);
        i++;
        setTimeout(step, TYPE_SPEED);
      }
      step();
    });
  }

  async function loopForever() {
    // Honour reduced-motion users by static-printing once.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await playCycle();
      return;
    }
    while (true) {
      await whileHidden();
      await playCycle();
    }
  }

  // Defer until the hero is visible.
  if ("IntersectionObserver" in window) {
    var heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          heroObs.disconnect();
          loopForever();
        }
      });
    }, { threshold: 0.1 });
    heroObs.observe(host);
  } else {
    loopForever();
  }

  // ---------- REVEAL ON SCROLL ----------
  if ("IntersectionObserver" in window) {
    var revealTargets = document.querySelectorAll(
      ".big-text, .prose, .pillar, .layer-tag, .layer-title, .layer-sub, .story, .case, .filetree, .library-callout, .ai-reply, .pid-figure, .recipe-steps li, .section-heading, .recipe-intro"
    );
    revealTargets.forEach(function (el) { el.classList.add("reveal"); });
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(function (el) { ro.observe(el); });
  }

  // ---------- SMOOTH NAV CLICKS already covered by scroll-behavior ----------
})();
