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
      version: 2,
      coins: 0,
      dice: 1,
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
      lifetimeDailyRolls: 0,
      streak: 0,
      lastRollDay: null,
      token: localStorage.getItem("mm-token") || "Jace",
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
      s.dice = 1;
      s.loginClaimed = false;
      s.rollsToday = 0;
      s.skipTurns = 0;
      s.flags = {};
    }
  }

  function recordDailyRoll(s) {
    applyDaily(s);
    if ((s.rollsToday || 0) === 0) {
      const d = new Date(); d.setDate(d.getDate() - 1);
      const prev = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
      s.streak = s.lastRollDay === prev ? (s.streak || 0) + 1 : 1;
      s.lastRollDay = todayKey();
      s.lifetimeDailyRolls = (s.lifetimeDailyRolls || 0) + 1;
      localStorage.setItem("mm-daily-rolls", String(s.lifetimeDailyRolls));
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
    recordDailyRoll,
    cityPayout,
    buildCost
  };
})(typeof window !== "undefined" ? window : global);
