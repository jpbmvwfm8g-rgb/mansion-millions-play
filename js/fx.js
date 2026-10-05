/**
 * Juice FX — dice tumble into goblet, coin bursts, confetti, cut-scene card reveals.
 * Cut-scene slots are modular: playCutscene(id, payload) can later swap in short videos.
 */
(function (global) {
  const reduced = () =>
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cssMs(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!v) return fallback;
    if (v.endsWith("ms")) return parseFloat(v);
    if (v.endsWith("s")) return parseFloat(v) * 1000;
    return fallback;
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 80) : ms));
  }

  function spawnCoins(layer, count) {
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const c = document.createElement("span");
      c.className = "fx-coin";
      c.textContent = "🪙";
      c.style.left = 40 + Math.random() * 20 + "%";
      c.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      c.style.setProperty("--dy", (-80 - Math.random() * 120) + "px");
      c.style.animationDelay = Math.random() * 0.2 + "s";
      layer.appendChild(c);
      setTimeout(() => c.remove(), cssMs("--mm-coin-ms", 800) + 300);
    }
  }

  function confetti(layer, n) {
    if (!layer) return;
    const colors = ["#f0c14b", "#9b59b6", "#e85d9a", "#5eb3e8", "#fff8ea", "#52b788"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "fx-confetti";
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--rot", Math.random() * 360 + "deg");
      p.style.animationDelay = Math.random() * 0.3 + "s";
      layer.appendChild(p);
      setTimeout(() => p.remove(), cssMs("--mm-confetti-ms", 1600) + 200);
    }
  }

  function sparkles(el) {
    if (!el) return;
    el.classList.add("fx-sparkle");
    setTimeout(() => el.classList.remove("fx-sparkle"), 700);
  }

  /**
   * Animated dice roll into crystal goblet.
   * @returns {Promise<number>} face 1–6
   */
  async function rollDice(overlay, face) {
    const n = face || 1 + Math.floor(Math.random() * 6);
    if (!overlay) return n;
    overlay.classList.add("on");
    overlay.setAttribute("aria-hidden", "false");
    const die = overlay.querySelector(".fx-die");
    const goblet = overlay.querySelector(".fx-goblet");
    const burst = overlay.querySelector(".fx-burst");
    if (die) {
      die.textContent = "🎲";
      die.classList.add("tumbling");
    }
    await wait(cssMs("--mm-dice-ms", 900));
    if (die) {
      die.classList.remove("tumbling");
      die.textContent = String(n);
      die.classList.add("landed");
    }
    if (goblet) goblet.classList.add("catch");
    if (burst) {
      burst.classList.add("on");
      spawnCoins(burst, 10);
    }
    sparkles(die);
    await wait(500);
    overlay.classList.remove("on");
    overlay.setAttribute("aria-hidden", "true");
    if (die) die.classList.remove("landed");
    if (goblet) goblet.classList.remove("catch");
    if (burst) burst.classList.remove("on");
    return n;
  }

  /**
   * Ornate framed card reveal (cut-scene slot).
   * payload: { title, body, emoji, kind, coins?, videoSrc? }
   * If videoSrc set later, slot can play a short clip instead of emoji art.
   */
  async function playCutscene(host, payload) {
    if (!host) return;
    const slot = host;
    slot.innerHTML = "";
    slot.className = "cutscene mm-frame on kind-" + (payload.kind || "generic");
    slot.setAttribute("role", "dialog");
    slot.setAttribute("aria-live", "polite");

    const gem = document.createElement("div");
    gem.className = "mm-frame__gem";
    slot.appendChild(gem);
    ["tl", "tr", "bl", "br"].forEach((c) => {
      const d = document.createElement("div");
      d.className = "mm-corner " + c;
      slot.appendChild(d);
    });

    const art = document.createElement("div");
    art.className = "cutscene__art";
    if (payload.imageSrc) {
      art.classList.add("has-image");
      const img = document.createElement("img");
      img.src = payload.imageSrc;
      img.alt = "";
      img.className = "cutscene__img kenburns";
      art.appendChild(img);
    } else if (payload.videoSrc) {
      const v = document.createElement("video");
      v.src = payload.videoSrc;
      v.autoplay = true;
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      art.appendChild(v);
    } else {
      art.innerHTML = '<span class="cutscene__emoji">' + (payload.emoji || "✨") + "</span>";
    }
    slot.appendChild(art);

    const butler = document.createElement("div");
    butler.className = "cutscene__butler";
    butler.innerHTML =
      '<img src="assets/ghost-butler.svg" alt="" width="64" height="64">' +
      '<p class="cutscene__line">' +
      (payload.butlerLine || "Right this way…") +
      "</p>";
    slot.appendChild(butler);

    const title = document.createElement("h2");
    title.className = "cutscene__title";
    title.textContent = payload.title || "";
    slot.appendChild(title);

    const body = document.createElement("p");
    body.className = "cutscene__body";
    body.textContent = payload.body || "";
    slot.appendChild(body);

    if (payload.coins) {
      const pop = document.createElement("div");
      pop.className = "cutscene__coins";
      pop.textContent = "+" + payload.coins.toLocaleString() + " 🪙";
      slot.appendChild(pop);
      spawnCoins(slot, 8);
    }

    if (payload.confetti) confetti(slot, 28);

    const ms = payload.duration || cssMs("--mm-cutscene-ms", 1400);
    await wait(ms);
    slot.classList.remove("on");
    slot.innerHTML = "";
    slot.className = "cutscene";
  }

  function floatText(root, text, cls) {
    const el = document.createElement("div");
    el.className = "fx-float " + (cls || "");
    el.textContent = text;
    (root || document.body).appendChild(el);
    requestAnimationFrame(() => el.classList.add("up"));
    setTimeout(() => el.remove(), 900);
  }

  function highlightSpace(el) {
    if (!el) return;
    el.classList.add("space--flash");
    setTimeout(() => el.classList.remove("space--flash"), 600);
  }


  /**
   * Full-screen cinematic beat: muted autoplay clip with pan/zoom particles.
   * Kids can tap Skip. durationMs caps play (default 3200).
   */
  async function playCinematic(host, opts) {
    opts = opts || {};
    if (!host) return;
    host.innerHTML = "";
    host.className = "cinematic on";
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-label", opts.title || "Scene");
    const stage = document.createElement("div");
    stage.className = "cinematic__stage";
    const media = document.createElement(opts.posterOnly ? "img" : "video");
    if (opts.posterOnly) {
      media.src = opts.poster || opts.src || "assets/style-hero.jpg";
      media.alt = "";
      media.className = "kenburns";
    } else {
      media.src = opts.src;
      media.autoplay = true;
      media.muted = true;
      media.playsInline = true;
      media.loop = true;
      media.setAttribute("playsinline", "");
      media.className = "cinematic__video";
    }
    stage.appendChild(media);
    const veil = document.createElement("div");
    veil.className = "cinematic__veil";
    veil.innerHTML = "<h2>" + (opts.title || "") + "</h2><p>" + (opts.subtitle || "") + "</p>";
    stage.appendChild(veil);
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "cinematic__skip";
    skip.textContent = "Skip ▶";
    host.appendChild(stage);
    host.appendChild(skip);
    spawnCoins(host, 6);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      host.classList.remove("on");
      host.innerHTML = "";
      host.className = "cinematic";
    };
    skip.onclick = finish;
    const ms = opts.durationMs || (reduced() ? 400 : 3200);
    await Promise.race([wait(ms), new Promise((r) => { skip.addEventListener("click", r, { once: true }); })]);
    finish();
  }

  /** Arrival toast then cinematic then summary card */
  async function arrivalFlow(hosts, payload) {
    const { toastHost, cineHost, summaryHost } = hosts;
    if (toastHost) {
      toastHost.className = "arrival-toast on";
      toastHost.innerHTML = "<p>You arrived in <b>" + (payload.place || "a new spot") + "!</b></p>";
      await wait(reduced() ? 200 : 900);
      toastHost.classList.remove("on");
    }
    await playCinematic(cineHost, {
      src: payload.video,
      title: payload.place,
      subtitle: payload.cineLine || "Look around…",
      durationMs: payload.cineMs || 3000,
      posterOnly: !payload.video,
      poster: payload.imageSrc
    });
    // summary card via playCutscene
    await playCutscene(summaryHost, {
      kind: payload.kind || "city",
      title: payload.summaryTitle || ("Visit: " + (payload.place || "")),
      body: payload.summaryBody || "",
      emoji: payload.emoji || "✨",
      butlerLine: payload.butlerLine || "What a find!",
      imageSrc: payload.imageSrc,
      coins: payload.coins,
      confetti: payload.confetti,
      duration: payload.summaryMs || 1600
    });
  }

  global.MMFx = {
    wait,
    rollDice,
    playCutscene,
    playCinematic,
    arrivalFlow,
    spawnCoins,
    confetti,
    floatText,
    highlightSpace,
    sparkles
  };
})(typeof window !== "undefined" ? window : global);
