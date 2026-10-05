/**
 * Shop + Garage UI and arrival landing override helpers.
 */
(function () {
  const Shop = window.MMShop;
  const State = window.MMState;
  const Fx = window.MMFx;
  const Board = window.MMBoard;
  const $ = (id) => document.getElementById(id);

  function money(n) {
    return Math.round(n).toLocaleString();
  }

  function getG() {
    return window.MMTour.getState();
  }

  function persist() {
    State.save(getG());
    window.MMTour.refresh && window.MMTour.refresh();
  }

  function openShop(focus) {
    const modal = $("shopModal");
    if (!modal) return;
    modal.classList.add("on");
    renderShop(focus || "cars");
  }

  function closeShop() {
    $("shopModal").classList.remove("on");
  }

  function renderShop(tab) {
    const G = getG();
    const body = $("shopBody");
    const tabs = ["cars", "houses", "upgrades"];
    $("shopTabs").innerHTML = tabs
      .map(
        (t) =>
          '<button type="button" class="chip' +
          (t === tab ? " on" : "") +
          '" data-shop="' +
          t +
          '">' +
          (t === "cars" ? "🚗 Cars" : t === "houses" ? "🏠 Homes" : "✨ Upgrades") +
          "</button>"
      )
      .join("");
    $("shopTabs").onclick = (e) => {
      const b = e.target.closest("[data-shop]");
      if (b) renderShop(b.dataset.shop);
    };

    let items = tab === "cars" ? Shop.CARS : tab === "houses" ? Shop.HOUSES : Shop.UPGRADES;
    body.innerHTML = items
      .map((it) => {
        const owned =
          tab === "cars"
            ? G.ownedCars.includes(it.id)
            : tab === "houses"
              ? G.ownedHouses.includes(it.id)
              : !!(G.upgrades && G.upgrades[it.id]);
        return (
          '<article class="shop-card mm-frame">' +
          '<div class="mm-frame__gem"></div>' +
          "<div class=\"shop-card__emoji\">" +
          it.emoji +
          "</div>" +
          "<h3>" +
          it.name +
          "</h3>" +
          "<p>" +
          it.blurb +
          "</p>" +
          "<p class=\"price\">" +
          money(it.price) +
          " 🪙</p>" +
          (owned
            ? '<button type="button" class="btn" disabled>Owned ✓</button>'
            : '<button type="button" class="btn btn-gold" data-buy="' +
              tab +
              ":" +
              it.id +
              '">Buy with coins</button>') +
          "</article>"
        );
      })
      .join("");
    body.onclick = (e) => {
      const b = e.target.closest("[data-buy]");
      if (!b) return;
      buy(b.dataset.buy);
    };
    $("shopCoins").textContent = money(G.coins);
  }

  function buy(key) {
    const G = getG();
    const [tab, id] = key.split(":");
    const list = tab === "cars" ? Shop.CARS : tab === "houses" ? Shop.HOUSES : Shop.UPGRADES;
    const item = list.find((x) => x.id === id);
    if (!item) return;
    if (G.coins < item.price) {
      Fx.floatText($("shopModal"), "Need more play coins!", "fx-float--warn");
      return;
    }
    G.coins -= item.price;
    if (tab === "cars") {
      if (!G.ownedCars.includes(id)) G.ownedCars.push(id);
      G.activeCar = id;
    } else if (tab === "houses") {
      if (!G.ownedHouses.includes(id)) G.ownedHouses.push(id);
      G.activeHouse = id;
    } else {
      G.upgrades[id] = item;
      applyUpgrade(G, item);
    }
    Fx.confetti($("fxLayer"), 20);
    Fx.floatText($("shopModal"), "Yay! Bought " + item.name, "fx-float--gold");
    persist();
    renderShop(tab);
    renderGarage();
  }

  function applyUpgrade(G, item) {
    if (item.effect === "theme") {
      G.theme = item.value;
      document.documentElement.dataset.theme = item.value;
    }
    if (item.effect === "fastToken") {
      document.documentElement.style.setProperty("--mm-step-ms", "140ms");
    }
    if (item.effect === "dailyDiceBonus") {
      // applied on daily reset
      G._dailyDiceBonus = (G._dailyDiceBonus || 0) + item.value;
    }
  }

  function renderGarage() {
    const G = getG();
    const el = $("garageGrid");
    if (!el) return;
    const cars = Shop.CARS.filter((c) => G.ownedCars.includes(c.id));
    const houses = Shop.HOUSES.filter((h) => G.ownedHouses.includes(h.id));
    if (!cars.length && !houses.length) {
      el.innerHTML = "<p class=\"muted\">Your garage is empty — visit the shop after a landing!</p>";
      return;
    }
    el.innerHTML =
      cars
        .map(
          (c) =>
            '<div class="garage-item' +
            (G.activeCar === c.id ? " active" : "") +
            '" data-equip="car:' +
            c.id +
            '"><span>' +
            c.emoji +
            "</span><b>" +
            c.name +
            "</b></div>"
        )
        .join("") +
      houses
        .map(
          (h) =>
            '<div class="garage-item' +
            (G.activeHouse === h.id ? " active" : "") +
            '" data-equip="house:' +
            h.id +
            '"><span>' +
            h.emoji +
            "</span><b>" +
            h.name +
            "</b></div>"
        )
        .join("");
    el.onclick = (e) => {
      const n = e.target.closest("[data-equip]");
      if (!n) return;
      const [kind, id] = n.dataset.equip.split(":");
      if (kind === "car") G.activeCar = id;
      else G.activeHouse = id;
      persist();
      renderGarage();
    };
  }

  function cinematicFor(space) {
    if (space.type === "ride") return Shop.CINEMATICS.ride;
    if (space.type === "go") return Shop.CINEMATICS.go;
    if (space.cityId === "vault-night") return Shop.CINEMATICS.vault;
    if (space.type === "city") return Shop.CINEMATICS.city;
    return Shop.CINEMATICS.arrival;
  }

  /** Used by tour-game after hop */
  async function playLandingSequence(payload) {
    const G = getG();
    await Fx.arrivalFlow(
      { toastHost: $("arrivalToast"), cineHost: $("cinematic"), summaryHost: $("cutscene") },
      payload
    );
    // Summary shop prompt bar
    const prompt = $("shopPrompt");
    if (prompt) {
      prompt.classList.add("on");
      prompt.innerHTML =
        "<p>Want a new car or house?</p>" +
        '<button type="button" class="btn btn-gold" id="openShopFromPrompt">Open Shop</button> ' +
        '<button type="button" class="btn" id="dismissShopPrompt">Keep exploring</button>';
      $("openShopFromPrompt").onclick = () => {
        prompt.classList.remove("on");
        openShop("cars");
      };
      $("dismissShopPrompt").onclick = () => prompt.classList.remove("on");
      clearTimeout(prompt._hide);
      prompt._hide = setTimeout(() => prompt.classList.remove("on"), 4500);
    }
  }

  window.MMTourShop = {
    openShop,
    closeShop,
    renderGarage,
    playLandingSequence,
    cinematicFor,
    money
  };

  function bootShop() {
    const s = $("shopBtn");
    if (s) s.onclick = () => openShop("cars");
    const c = $("shopClose");
    if (c) c.onclick = () => closeShop();
    const tryG = () => {
      if (!window.MMTour || !window.MMTour.getState) return false;
      renderGarage();
      const G = getG();
      if (G && G.theme) document.documentElement.dataset.theme = G.theme;
      if (G && G.upgrades && G.upgrades["fast-token"]) {
        document.documentElement.style.setProperty("--mm-step-ms", "140ms");
      }
      return true;
    };
    if (!tryG()) setTimeout(tryG, 0);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootShop);
  else bootShop();
})();
