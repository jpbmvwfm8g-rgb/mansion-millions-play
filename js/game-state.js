/**
 * Persist tour progress — daily dice refill, login reward, stamp book.
 */
(function (global) {
  const B = () => global.MMBoard;

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function defaultState() {
    const cities = {};
    B().CITIES.forEach((c) => {
      cities[c.id] = { build: 0, stamped: false, visits: 0 };
    });
    return {
      version: 1,
      coins: 5000,
      dice: B().DAILY_DICE,
      pos: 0,
      skipTurns: 0,
      flags: {},
      cities,
      stamps: 0,
      laps: 0,
      day: todayKey(),
      loginClaimed: false,
      sound: false,
      rollsToday: 0,
      butlerMood: "welcome",
      ownedCars: [],
      ownedHouses: [],
      upgrades: {},
      activeCar: null,
      activeHouse: null,
      theme: "default"
    };
  }

  function load() {
    let raw;
    try {
      raw = JSON.parse(localStorage.getItem(B().STORAGE_KEY) || "null");
    } catch (e) {
      raw = null;
    }
    const s = Object.assign(defaultState(), raw || {});
    // migrate cities
    B().CITIES.forEach((c) => {
      if (!s.cities[c.id]) s.cities[c.id] = { build: 0, stamped: false, visits: 0 };
    });
    applyDaily(s);
    return s;
  }

  function applyDaily(s) {
    const t = todayKey();
    if (s.day !== t) {
      s.day = t;
      s.dice = B().DAILY_DICE;
      s.loginClaimed = false;
      s.rollsToday = 0;
      s.skipTurns = 0;
      s.flags = {};
    }
  }

  function claimLogin(s) {
    applyDaily(s);
    if (s.loginClaimed) return { ok: false, amount: 0 };
    s.loginClaimed = true;
    s.coins += B().DAILY_LOGIN;
    return { ok: true, amount: B().DAILY_LOGIN };
  }

  function save(s) {
    try {
      localStorage.setItem(B().STORAGE_KEY, JSON.stringify(s));
      return true;
    } catch (e) {
      return false;
    }
  }

  function cityPayout(s, cityId) {
    const st = s.cities[cityId] || { build: 0 };
    const base = 400;
    const mult = 1 + (st.build || 0) * 0.75;
    let pay = Math.round(base * mult);
    if (s.flags.doubleNext) {
      pay *= 2;
      s.flags.doubleNext = false;
    }
    return pay;
  }

  function buildCost(buildLevel) {
    return [0, 800, 2000, 4500][buildLevel + 1] || 99999;
  }

  global.MMState = {
    todayKey,
    defaultState,
    load,
    save,
    applyDaily,
    claimLogin,
    cityPayout,
    buildCost
  };
})(typeof window !== "undefined" ? window : global);
