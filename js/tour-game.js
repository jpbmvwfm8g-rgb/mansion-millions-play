/**
 * City-tour board loop — kid-friendly, unlocks fresh places each lap.
 * Free play only: fictional coins, daily dice, no real-money / gambling.
 */
(function () {
  const Board = window.MMBoard;
  const State = window.MMState;
  const Fx = window.MMFx;

  const $ = (id) => document.getElementById(id);
  const qs = (s, r) => (r || document).querySelector(s);

  let G = State.load();
  let busy = false;
  let lastCardIdx = -1;
  let cardLibrary = [];

  /** Lap unlock: each completed lap opens a new "discovery" destination set */
  const DISCOVERIES = [
    { lap: 0, title: "Estate Tour", blurb: "Start at Jason's Place!" },
    { lap: 1, title: "Townline Trail", blurb: "New path past Townline Gate!" },
    { lap: 2, title: "ARQS Sky Walk", blurb: "Crystal plaza opens!" },
    { lap: 3, title: "Midnight Circuit", blurb: "Night lights and vault glitter!" },
    { lap: 4, title: "Cloud Loop", blurb: "Balloon docks unlock!" },
    { lap: 5, title: "Star Parade", blurb: "Secret rooftop stops!" }
  ];

  function money(n) {
    return Math.round(n).toLocaleString();
  }

  function activeSpaces() {
    // Always full board path, but city "freshness" rotates per lap via variant labels
    return Board.BOARD;
  }

  function spaceLabel(space) {
    const lap = G.laps || 0;
    if (space.type !== "city" || !space.city) return space.name;
    const variants = [
      space.city.name,
      "New: " + space.city.landmark,
      space.city.emoji + " Surprise " + space.city.name.split(" ")[0],
      "Secret " + space.city.builds[Math.min(2, lap % 3)],
      "Festival " + space.city.name
    ];
    return variants[Math.min(lap, variants.length - 1)] || space.city.name;
  }

  function discoveryForLap(lap) {
    return DISCOVERIES[Math.min(lap, DISCOVERIES.length - 1)];
  }

  function loadCardLibrary() {
    // Prefer generated assets/cards/*; fall back to style hero
    const rolls = [];
    const adventures = [];
    for (let i = 1; i <= 12; i++) {
      rolls.push("assets/cards/roll-" + String(i).padStart(2, "0") + ".jpg");
      adventures.push("assets/cards/adventure-" + String(i).padStart(2, "0") + ".jpg");
    }
    cardLibrary = { rolls, adventures, hero: "assets/style-hero.jpg" };
  }

  function pickCard(kind) {
    const list = kind === "roll" ? cardLibrary.rolls : cardLibrary.adventures;
    if (!list || !list.length) return cardLibrary.hero;
    let idx = Math.floor(Math.random() * list.length);
    if (idx === lastCardIdx && list.length > 1) idx = (idx + 1) % list.length;
    lastCardIdx = idx;
    return list[idx];
  }

  function hud() {
    State.applyDaily(G);
    $("coins").textContent = money(G.coins);
    $("diceLeft").textContent = G.dice;
    $("stamps").textContent = G.stamps + "/" + Board.CITIES.length;
    $("lap").textContent = "Lap " + ((G.laps || 0) + 1);
    const disc = discoveryForLap(G.laps || 0);
    $("discovery").textContent = disc.title + " — " + disc.blurb;
    $("loginBtn").disabled = !!G.loginClaimed;
    $("loginBtn").textContent = G.loginClaimed ? "Daily gift claimed ✓" : "Daily gift +" + Board.DAILY_LOGIN;
    const mood = G.butlerMood || "welcome";
    const butler = $("butlerReact");
    if (butler) butler.dataset.mood = mood;
    renderStampBook();
  }

  function renderBoard() {
    const board = $("board");
    board.innerHTML = "";
    const center = document.createElement("div");
    center.className = "board-center";
    center.innerHTML =
      '<img class="board-hero" src="assets/style-hero.jpg" alt="">' +
      '<div class="board-center__label"><b>Mansion Tour</b><span id="centerHint">Roll to explore!</span></div>';
    board.appendChild(center);

    activeSpaces().forEach((space, i) => {
      const pos = Board.POSITIONS[i];
      const el = document.createElement("button");
      el.type = "button";
      el.className = "space space--" + space.type + (i === G.pos ? " space--here" : "");
      el.style.left = pos.x + "%";
      el.style.top = pos.y + "%";
      el.dataset.index = i;
      el.setAttribute("aria-label", spaceLabel(space));
      el.innerHTML = '<span class="space__emoji">' + space.emoji + "</span>";
      if (space.type === "city" && G.cities[space.cityId] && G.cities[space.cityId].stamped) {
        el.classList.add("space--stamped");
      }
      // Locked visual for cities "not yet discovered" this lap arc — kids see unlock sparkles
      const unlockLap = cityUnlockLap(space);
      if (space.type === "city" && (G.laps || 0) < unlockLap) {
        el.classList.add("space--locked");
        el.innerHTML = '<span class="space__emoji">🔒</span>';
      }
      board.appendChild(el);
    });

    placeToken(false);
  }

  function cityUnlockLap(space) {
    if (space.type !== "city") return 0;
    const order = Board.CITIES.findIndex((c) => c.id === space.cityId);
    // First 4 cities open lap 0, next batches unlock each lap
    if (order < 4) return 0;
    if (order < 8) return 1;
    if (order < 12) return 2;
    return 3;
  }

  function isSpacePlayable(space) {
    if (space.type !== "city") return true;
    return (G.laps || 0) >= cityUnlockLap(space);
  }

  function placeToken(animate) {
    let token = $("token");
    if (!token) {
      token = document.createElement("div");
      token.id = "token";
      token.className = "token";
      token.innerHTML =
        '<svg viewBox="0 0 64 64" class="token__hat" aria-hidden="true">' +
        '<ellipse cx="32" cy="52" rx="22" ry="6" fill="#c4921a"/>' +
        '<rect x="18" y="28" width="28" height="22" rx="3" fill="#f0c14b"/>' +
        '<rect x="14" y="24" width="36" height="8" rx="2" fill="#ffe7a0"/>' +
        '<rect x="22" y="10" width="20" height="16" rx="2" fill="#f0c14b"/>' +
        '<rect x="20" y="22" width="24" height="5" fill="#9b59b6"/>' +
        "</svg>";
      $("board").appendChild(token);
    }
    const pos = Board.POSITIONS[G.pos];
    if (animate) token.classList.add("token--hop");
    token.style.left = pos.x + "%";
    token.style.top = pos.y + "%";
    if (animate) setTimeout(() => token.classList.remove("token--hop"), 280);
  }

  async function hopTo(targetIndex) {
    const n = Board.BOARD.length;
    let cur = G.pos;
    let steps = (targetIndex - cur + n) % n;
    if (steps === 0 && targetIndex !== cur) steps = n;
    // if wrapping forward from roll
    const rollSteps = arguments[1];
    if (typeof rollSteps === "number") steps = rollSteps;
    for (let s = 0; s < steps; s++) {
      cur = (cur + 1) % n;
      G.pos = cur;
      placeToken(true);
      const el = qs('.space[data-index="' + cur + '"]');
      Fx.highlightSpace(el);
      // camera: pan board toward token
      const board = $("boardWrap");
      if (board && el) {
        const br = board.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        const cx = er.left + er.width / 2 - (br.left + br.width / 2);
        board.style.setProperty("--pan-x", -cx * 0.15 + "px");
        board.style.setProperty("--pan-y", -(er.top + er.height / 2 - (br.top + br.height / 2)) * 0.15 + "px");
      }
      await Fx.wait(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--mm-step-ms")) || 220);
      if (cur === 0 && s < steps - 1) {
        // passed GO mid-roll
      }
    }
    $("boardWrap").style.setProperty("--pan-x", "0px");
    $("boardWrap").style.setProperty("--pan-y", "0px");
  }

  async function showRollReveal(face) {
    const img = pickCard("roll");
    await Fx.playCutscene($("cutscene"), {
      kind: "roll",
      title: "You rolled a " + face + "!",
      body: "The golden die shines. Off we go!",
      emoji: "🎲",
      butlerLine: cheerLine("roll"),
      imageSrc: img,
      coins: 0,
      confetti: face === 6,
      duration: face === 6 ? 1600 : 1100
    });
  }

  function cheerLine(kind) {
    const lines = {
      roll: ["Marvelous toss!", "Lucky bounce!", "The goblet catches it!", "Sparkles everywhere!"],
      city: ["A brand-new postcard!", "Welcome, explorer!", "Shall we build a little?", "The garden cheers!"],
      ride: ["Hold on tight!", "What a view!", "Adventure ahoy!", "Wheee!"],
      chance: ["A surprise for you!", "Fortune smiles!", "Open the card!"],
      bonus: ["Coins for the album!", "Shiny!", "Treasure pop!"],
      jam: ["Oops — traffic!", "Patience, young traveler.", "Snack break!"],
      go: ["Lap complete — new places await!", "Start bonus!", "The tour continues!"]
    };
    const arr = lines[kind] || lines.roll;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async function land() {
    const space = Board.BOARD[G.pos];
    const playable = isSpacePlayable(space);
    let kind = space.type;
    let title = spaceLabel(space);
    let body = "";
    let coinsGain = 0;
    let confetti = false;
    let emoji = space.emoji;

    if (space.type === "go") {
      coinsGain = Board.GO_PAYOUT;
      G.coins += coinsGain;
      G.laps = (G.laps || 0) + 1;
      G.butlerMood = "celebrate";
      body = "You finished a lap! +" + money(coinsGain) + ". " + discoveryForLap(G.laps).blurb;
      confetti = true;
      // refill a couple dice as lap reward (not real money)
      G.dice += 2;
      await celebrateUnlock();
    } else if (space.type === "city") {
      if (!playable) {
        // Soft land on locked: treat as bonus tease
        coinsGain = 200;
        G.coins += coinsGain;
        title = "Coming soon!";
        body = "This spot unlocks on a later lap. Here's a tiny tip for peeking!";
        kind = "bonus";
        emoji = "🔒";
      } else {
        const st = G.cities[space.cityId];
        st.visits += 1;
        coinsGain = State.cityPayout(G, space.cityId);
        G.coins += coinsGain;
        if (!st.stamped) {
          st.stamped = true;
          G.stamps += 1;
          confetti = true;
          body = "First visit! Postcard stamped. +" + money(coinsGain);
        } else {
          body = space.city.flavor + " +" + money(coinsGain);
        }
        G.butlerMood = "city";
        // Offer build if can afford
        maybeOfferBuild(space);
      }
    } else if (space.type === "ride") {
      const r = space.ride;
      const reward = r.rewards[Math.floor(Math.random() * r.rewards.length)];
      coinsGain = reward;
      G.coins += coinsGain;
      title = r.verb + " the " + r.name + "!";
      body = "What a ride! +" + money(coinsGain);
      confetti = reward >= 4000;
      G.butlerMood = "ride";
    } else if (space.type === "chance") {
      await resolveChance();
      State.save(G);
      hud();
      renderBoard();
      return;
    } else if (space.type === "bonus") {
      coinsGain = space.coins || 500;
      G.coins += coinsGain;
      body = "Bonus coins! +" + money(coinsGain);
      G.butlerMood = "bonus";
    } else if (space.type === "jam") {
      G.skipTurns = Math.max(G.skipTurns, space.skip || 1);
      body = "Traffic jam — skip next roll. Grab a pretend snack!";
      G.butlerMood = "jam";
    }

    const img = pickCard("adventure");
    const video = (window.MMTourShop && window.MMTourShop.cinematicFor)
      ? window.MMTourShop.cinematicFor(space)
      : null;
    const payload = {
      place: title,
      kind: kind,
      emoji: emoji,
      imageSrc: img,
      video: video,
      coins: coinsGain || undefined,
      confetti: confetti,
      butlerLine: cheerLine(kind === "go" ? "go" : kind),
      summaryTitle: title,
      summaryBody: body + (coinsGain ? "" : ""),
      cineLine: "Exploring " + title + "…",
      cineMs: (matchMedia("(prefers-reduced-motion: reduce)").matches ? 400 : 2800),
      summaryMs: (matchMedia("(prefers-reduced-motion: reduce)").matches ? 300 : (confetti ? 1700 : 1400))
    };
    if (window.MMTourShop && window.MMTourShop.playLandingSequence) {
      await window.MMTourShop.playLandingSequence(payload);
    } else {
      await Fx.playCutscene($("cutscene"), {
        kind: kind, title: title, body: body, emoji: emoji,
        butlerLine: payload.butlerLine, imageSrc: img,
        coins: coinsGain || undefined, confetti: confetti, duration: 1400
      });
    }

    State.save(G);
    hud();
    renderBoard();
  }

  async function celebrateUnlock() {
    const disc = discoveryForLap(G.laps);
    Fx.floatText($("boardWrap"), "🔓 " + disc.title, "fx-float--gold");
  }

  function maybeOfferBuild(space) {
    const st = G.cities[space.cityId];
    if (st.build >= Board.MAX_BUILD) return;
    const cost = State.buildCost(st.build);
    const panel = $("buildOffer");
    if (!panel) return;
    panel.classList.add("on");
    panel.innerHTML =
      "<p>Build up <b>" +
      space.city.name +
      "</b>? Stage " +
      (st.build + 1) +
      "/" +
      Board.MAX_BUILD +
      " — " +
      space.city.builds[st.build] +
      "</p>" +
      "<p>Cost " +
      money(cost) +
      " coins (play money)</p>" +
      '<button type="button" class="btn btn-gold" id="doBuild">Build!</button> ' +
      '<button type="button" class="btn" id="skipBuild">Maybe later</button>';
    $("skipBuild").onclick = () => panel.classList.remove("on");
    $("doBuild").onclick = () => {
      if (G.coins < cost) {
        Fx.floatText(panel, "Need more coins", "fx-float--warn");
        return;
      }
      G.coins -= cost;
      st.build += 1;
      if (st.build >= Board.MAX_BUILD) {
        Fx.confetti($("fxLayer"), 24);
        Fx.floatText($("boardWrap"), "🎉 Landmark complete!", "fx-float--gold");
      }
      panel.classList.remove("on");
      State.save(G);
      hud();
      renderBoard();
    };
  }

  async function resolveChance() {
    const card = Board.CHANCE_CARDS[Math.floor(Math.random() * Board.CHANCE_CARDS.length)];
    let body = card.text;
    let coinsGain = card.coins || 0;
    if (card.coins) G.coins += card.coins;
    if (card.dice) G.dice += card.dice;
    if (card.jam) G.skipTurns = Math.max(G.skipTurns, card.jam);
    if (card.flag) G.flags[card.flag] = true;
    if (card.stampBonus) {
      const unstamped = Board.CITIES.find((c) => G.cities[c.id] && !G.cities[c.id].stamped && (G.laps || 0) >= cityUnlockLap({ type: "city", cityId: c.id }));
      // stamp a visited city or first unlocked
      const target = Board.CITIES.find((c) => G.cities[c.id].visits > 0 && !G.cities[c.id].stamped) || unstamped;
      if (target) {
        G.cities[target.id].stamped = true;
        G.stamps += 1;
        body += " Stamped " + target.name + "!";
      }
    }
    await Fx.playCutscene($("cutscene"), {
      kind: "chance",
      title: "Event!",
      body: body,
      emoji: "🎴",
      butlerLine: cheerLine("chance"),
      imageSrc: pickCard("adventure"),
      coins: coinsGain || undefined,
      confetti: !!card.coins,
      duration: 1500
    });
    if (card.steps) {
      const n = Board.BOARD.length;
      let dest = (G.pos + card.steps + n * 3) % n;
      const dist = card.steps > 0 ? card.steps : n + card.steps;
      if (card.steps > 0) await hopTo(dest, card.steps);
      else {
        for (let i = 0; i < Math.abs(card.steps); i++) {
          G.pos = (G.pos - 1 + n) % n;
          placeToken(true);
          await Fx.wait(180);
        }
      }
      await land();
      return;
    }
    if (card.advanceToNext === "city") {
      let i = (G.pos + 1) % Board.BOARD.length;
      let steps = 1;
      while (Board.BOARD[i].type !== "city" || !isSpacePlayable(Board.BOARD[i])) {
        i = (i + 1) % Board.BOARD.length;
        steps++;
        if (steps > Board.BOARD.length) break;
      }
      await hopTo(i, steps);
      await land();
    }
  }

  function renderStampBook() {
    const book = $("stampBook");
    if (!book) return;
    book.innerHTML = Board.CITIES.map((c) => {
      const st = G.cities[c.id];
      const locked = (G.laps || 0) < cityUnlockLap({ type: "city", cityId: c.id });
      const cls = locked ? "stamp locked" : st.stamped ? "stamp got" : "stamp";
      const stars = "★".repeat(st.build) + "☆".repeat(Board.MAX_BUILD - st.build);
      return (
        '<div class="' +
        cls +
        '" title="' +
        c.name +
        '"><span>' +
        (locked ? "🔒" : c.emoji) +
        "</span><b>" +
        (locked ? "???" : c.name.split(" ")[0]) +
        "</b><i>" +
        (locked ? "" : stars) +
        "</i></div>"
      );
    }).join("");
  }

  async function doRoll() {
    if (busy) return;
    const sp = $("shopPrompt"); if (sp) sp.classList.remove("on");
    State.applyDaily(G);
    if (G.skipTurns > 0) {
      G.skipTurns -= 1;
      State.save(G);
      hud();
      await Fx.playCutscene($("cutscene"), {
        kind: "jam",
        title: "Still in traffic",
        body: "Sit tight — next roll will be ready soon!",
        emoji: "🚦",
        butlerLine: cheerLine("jam"),
        imageSrc: pickCard("adventure"),
        duration: 1000
      });
      return;
    }
    if (G.dice <= 0) {
      Fx.floatText($("dock"), "Come back tomorrow for more dice!", "fx-float--warn");
      return;
    }
    busy = true;
    $("rollBtn").disabled = true;
    G.dice -= 1;
    G.rollsToday = (G.rollsToday || 0) + 1;
    hud();

    const face = await Fx.rollDice($("diceOverlay"));
    await showRollReveal(face);

    const start = G.pos;
    const dest = (start + face) % Board.BOARD.length;
    // GO payout if we pass or land on 0
    let passedGo = false;
    for (let s = 1; s <= face; s++) {
      if ((start + s) % Board.BOARD.length === 0) passedGo = true;
    }
    await hopTo(dest, face);
    if (passedGo && dest !== 0) {
      // Passing GO without landing: smaller cheer
      G.coins += Board.GO_PAYOUT;
      G.laps = (G.laps || 0) + 1;
      Fx.floatText($("boardWrap"), "+" + money(Board.GO_PAYOUT) + " Start bonus!", "fx-float--gold");
      G.dice += 2;
      await celebrateUnlock();
      renderBoard();
    }
    await land();
    State.save(G);
    busy = false;
    $("rollBtn").disabled = false;
    hud();
  }

  function claimLogin() {
    const r = State.claimLogin(G);
    if (r.ok) {
      Fx.spawnCoins($("fxLayer"), 12);
      Fx.floatText($("hud"), "+" + money(r.amount) + " daily gift!", "fx-float--gold");
      State.save(G);
      hud();
    }
  }

  function bind() {
    $("rollBtn").onclick = () => doRoll();
    $("loginBtn").onclick = () => claimLogin();
    $("tabPlay").onclick = () => showTab("play");
    $("tabStamps").onclick = () => showTab("stamps");
    $("tabHow").onclick = () => showTab("how");
    const sound = $("soundToggle");
    if (sound) {
      sound.checked = !!G.sound;
      sound.onchange = () => {
        G.sound = sound.checked;
        State.save(G);
      };
    }
  }

  function showTab(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === "panel-" + name));
  }

  // Enhance Fx.playCutscene to support imageSrc backgrounds
  const _play = Fx.playCutscene;
  Fx.playCutscene = async function (host, payload) {
    if (!host) return;
    // Pre-set background image via CSS var for modular art
    if (payload.imageSrc) {
      host.style.setProperty("--cutscene-art", 'url("' + payload.imageSrc + '")');
    } else {
      host.style.removeProperty("--cutscene-art");
    }
    return _play(host, payload);
  };

  function boot() {
    loadCardLibrary();
    bind();
    hud();
    renderBoard();
    // Soft login prompt once
    if (!G.loginClaimed) {
      setTimeout(() => Fx.floatText($("hud"), "Tap Daily gift for free coins!", "fx-float--gold"), 600);
    }
  }

  function refresh(){ hud(); renderBoard(); if(window.MMTourShop) window.MMTourShop.renderGarage(); }
  window.MMTour = {
    boot,
    getState: () => G,
    doRoll,
    refresh,
    cityUnlockLap,
    discoveryForLap,
    spaceLabel
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
