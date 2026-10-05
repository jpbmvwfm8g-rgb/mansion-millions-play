/**
 * City-tour board definition — Jason's Place / estate landmarks.
 * Space types: go | city | ride | chance | bonus | jam
 * Cities support staged builds (0–3) and stamp-book postcards.
 * cutscene: slot id for modular video-style landing moments (swap assets later).
 */
(function (global) {
  const CITIES = [
    { id: "jasons-place", name: "Jason's Place", emoji: "🏰", landmark: "Grand Gates", builds: ["Lawn", "Fountain", "Chandelier"], flavor: "Home base of the tour." },
    { id: "townline", name: "Townline Gate", emoji: "🚪", landmark: "Iron Arch", builds: ["Lanterns", "Banner", "Bell"], flavor: "Where the path begins." },
    { id: "arqs-plaza", name: "ARQS Plaza", emoji: "💠", landmark: "Crystal Spire", builds: ["Kiosk", "Marquee", "Observatory"], flavor: "Bright ideas under glass." },
    { id: "fountain-court", name: "Fountain Court", emoji: "⛲", landmark: "Gold Splash", builds: ["Basin", "Cherubs", "Rainbow Mist"], flavor: "Coins glint in the spray." },
    { id: "greenhouse", name: "Rose Greenhouse", emoji: "🌹", landmark: "Glass Dome", builds: ["Trellis", "Orchid Wall", "Butterfly Net"], flavor: "Pink blooms everywhere." },
    { id: "library-hall", name: "Library Hall", emoji: "📚", landmark: "Midnight Atlas", builds: ["Ladder", "Globe", "Secret Shelf"], flavor: "Stories stacked to the rafters." },
    { id: "ballroom", name: "Gold Ballroom", emoji: "💃", landmark: "Mirror Floor", builds: ["Bandstand", "Chandelier", "Confetti Machine"], flavor: "Spin until the floor shines." },
    { id: "kitchen-wing", name: "Kitchen Wing", emoji: "🍰", landmark: "Feast Table", builds: ["Oven", "Pastry Cart", "Banquet"], flavor: "Sweet rewards baking." },
    { id: "secret-garden", name: "Secret Garden", emoji: "🌿", landmark: "Hidden Gate", builds: ["Hedge Maze", "Stone Bench", "Fireflies"], flavor: "Cypress and magenta roses." },
    { id: "sky-dome", name: "Sky Dome", emoji: "🌌", landmark: "Star Map", builds: ["Telescope", "Planet Ring", "Aurora"], flavor: "Roll under the stars." },
    { id: "bell-tower", name: "Bell Tower", emoji: "🔔", landmark: "Bronze Bell", builds: ["Stairs", "Clock Face", "Peal"], flavor: "Hear the hour of luck." },
    { id: "portrait-gallery", name: "Portrait Gallery", emoji: "🖼️", landmark: "Family Wall", builds: ["Frame", "Spotlight", "Living Likeness"], flavor: "Friends watching from gold frames." },
    { id: "storm-balcony", name: "Storm Balcony", emoji: "⚡", landmark: "Lightning Rod", builds: ["Rail", "Weather Vane", "Thunder Seat"], flavor: "Dramatic views, bigger tips." },
    { id: "candle-hall", name: "Candle Hall", emoji: "🕯️", landmark: "Thousand Flames", builds: ["Sconce", "Candelabra", "Wax River"], flavor: "Warm light, warm pockets." },
    { id: "midnight-garage", name: "Midnight Garage", emoji: "🚗", landmark: "Touring Car", builds: ["Keys", "Chrome", "Night Drive"], flavor: "Ready for the next city." },
    { id: "vault-night", name: "Vault Night", emoji: "💎", landmark: "Amethyst Vault", builds: ["Lock", "Gem Pedestal", "Crown Room"], flavor: "The glittering finale stop." }
  ];

  const RIDES = [
    { id: "ferry", name: "Harbor Ferry", emoji: "⛴️", verb: "Sail", rewards: [800, 1500, 3000, 5000] },
    { id: "train", name: "Garden Express", emoji: "🚂", verb: "Ride", rewards: [1000, 2000, 3500, 6000] },
    { id: "balloon", name: "Sky Balloon", emoji: "🎈", verb: "Float", rewards: [1200, 2500, 4000, 8000] },
    { id: "carriage", name: "Gold Carriage", emoji: "马车".length ? "馬車" : "🐴", verb: "Trot", rewards: [900, 1800, 3200, 5500] }
  ];
  // Fix carriage emoji — use horse carriage
  RIDES[3].emoji = "🐴";

  const CHANCE_CARDS = [
    { id: "butler-tip", text: "The ghost butler tips his hat — a gift for polite guests.", coins: 2000, dice: 0 },
    { id: "shortcut", text: "A garden shortcut! Advance to the next City.", advanceToNext: "city" },
    { id: "postcard", text: "You find a blank postcard — stamp any City you already visited.", stampBonus: true },
    { id: "double-coins", text: "Confetti rain! Double your next City payout.", flag: "doubleNext" },
    { id: "extra-die", text: "Lucky pocket-watch — +2 dice rolls today.", dice: 2 },
    { id: "traffic", text: "Road work ahead. Skip your next turn (traffic jam).", jam: 1 },
    { id: "goblet", text: "Crystal goblet overflows — catch the coins!", coins: 3500 },
    { id: "friend-wave", text: "Jason waves from a balcony. Collect a cheer bonus.", coins: 1500, dice: 1 },
    { id: "back-three", text: "Wrong turn down the hedge maze — go back 3 spaces.", steps: -3 },
    { id: "forward-two", text: "Hot-air gust pushes you forward 2 spaces.", steps: 2 }
  ];

  /** 32-space loop — positions computed as rounded rectangle path */
  const SPACES = [
    { type: "go", name: "Tour Start", emoji: "⭐", payout: 2000, cutscene: "go-payout" },
    { type: "city", cityId: "jasons-place", cutscene: "city-reveal" },
    { type: "bonus", name: "Coin Shower", emoji: "🪙", coins: 500, cutscene: "bonus-coins" },
    { type: "city", cityId: "townline", cutscene: "city-reveal" },
    { type: "ride", rideId: "ferry", cutscene: "ride-event" },
    { type: "city", cityId: "fountain-court", cutscene: "city-reveal" },
    { type: "chance", name: "Event Card", emoji: "🎴", cutscene: "chance-card" },
    { type: "city", cityId: "greenhouse", cutscene: "city-reveal" },
    { type: "bonus", name: "Garden Tip", emoji: "🌸", coins: 750, cutscene: "bonus-coins" },
    { type: "city", cityId: "arqs-plaza", cutscene: "city-reveal" },
    { type: "ride", rideId: "train", cutscene: "ride-event" },
    { type: "city", cityId: "library-hall", cutscene: "city-reveal" },
    { type: "jam", name: "Traffic Jam", emoji: "🚦", skip: 1, cutscene: "traffic-jam" },
    { type: "city", cityId: "ballroom", cutscene: "city-reveal" },
    { type: "chance", name: "Event Card", emoji: "🎴", cutscene: "chance-card" },
    { type: "city", cityId: "kitchen-wing", cutscene: "city-reveal" },
    { type: "bonus", name: "Pastry Coins", emoji: "🧁", coins: 1000, cutscene: "bonus-coins" },
    { type: "city", cityId: "secret-garden", cutscene: "city-reveal" },
    { type: "ride", rideId: "balloon", cutscene: "ride-event" },
    { type: "city", cityId: "sky-dome", cutscene: "city-reveal" },
    { type: "chance", name: "Event Card", emoji: "🎴", cutscene: "chance-card" },
    { type: "city", cityId: "bell-tower", cutscene: "city-reveal" },
    { type: "bonus", name: "Amethyst Find", emoji: "💜", coins: 1500, cutscene: "bonus-coins" },
    { type: "city", cityId: "portrait-gallery", cutscene: "city-reveal" },
    { type: "ride", rideId: "carriage", cutscene: "ride-event" },
    { type: "city", cityId: "storm-balcony", cutscene: "city-reveal" },
    { type: "jam", name: "Parade Hold", emoji: "🚧", skip: 1, cutscene: "traffic-jam" },
    { type: "city", cityId: "candle-hall", cutscene: "city-reveal" },
    { type: "chance", name: "Event Card", emoji: "🎴", cutscene: "chance-card" },
    { type: "city", cityId: "midnight-garage", cutscene: "city-reveal" },
    { type: "bonus", name: "Vault Spill", emoji: "✨", coins: 2500, cutscene: "bonus-coins" },
    { type: "city", cityId: "vault-night", cutscene: "city-reveal" }
  ];

  function enrich(space, index) {
    const s = Object.assign({ index }, space);
    if (s.type === "city") {
      const c = CITIES.find((x) => x.id === s.cityId);
      s.name = c.name;
      s.emoji = c.emoji;
      s.city = c;
    } else if (s.type === "ride") {
      const r = RIDES.find((x) => x.id === s.rideId);
      s.name = r.name;
      s.emoji = r.emoji;
      s.ride = r;
    }
    return s;
  }

  const BOARD = SPACES.map(enrich);

  /** Rounded-rect path positions (percent) for token/layout */
  function boardPositions(n) {
    // Perimeter of rounded rectangle: top, right, bottom, left
    const positions = [];
    const inset = 8;
    const w = 100 - inset * 2;
    const h = 100 - inset * 2;
    const peri = 2 * (w + h);
    for (let i = 0; i < n; i++) {
      const d = (i / n) * peri;
      let x, y;
      if (d < w) {
        x = inset + d;
        y = inset;
      } else if (d < w + h) {
        x = inset + w;
        y = inset + (d - w);
      } else if (d < 2 * w + h) {
        x = inset + w - (d - w - h);
        y = inset + h;
      } else {
        x = inset;
        y = inset + h - (d - 2 * w - h);
      }
      positions.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
    return positions;
  }

  const POSITIONS = boardPositions(BOARD.length);

  global.MMBoard = {
    CITIES,
    RIDES,
    CHANCE_CARDS,
    BOARD,
    POSITIONS,
    DAILY_DICE: 12,
    DAILY_LOGIN: 1500,
    GO_PAYOUT: 2000,
    MAX_BUILD: 3,
    STORAGE_KEY: "mm-tour-v1"
  };
})(typeof window !== "undefined" ? window : global);
