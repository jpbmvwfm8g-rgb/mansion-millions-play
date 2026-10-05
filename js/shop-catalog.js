/**
 * In-game shop — cars, houses, upgrades. Play coins only. No real money.
 */
(function (global) {
  const CARS = [
    { id: "pony-cart", name: "Garden Pony Cart", emoji: "🐴", price: 2500, video: null, blurb: "Clip-clop around the hedges." },
    { id: "pearl-cruiser", name: "Pearl Cruiser", emoji: "🚗", price: 8000, video: "assets/video/mansion-millions-porsche-pearl-white-10s.mp4", blurb: "Shiny ride from city to mansion." },
    { id: "blue-lightning", name: "Blue Lightning", emoji: "🏎️", price: 12000, video: "assets/video/mansion-millions-lamborghini-blue-10s.mp4", blurb: "Zoom the garden path!" },
    { id: "night-bolt", name: "Night Bolt", emoji: "🚙", price: 18000, video: "assets/video/mansion-millions-bugatti-15s.mp4", blurb: "A legendary tour car." }
  ];

  const HOUSES = [
    { id: "cozy-cottage", name: "Cozy Cottage", emoji: "🏠", price: 5000, blurb: "A sweet starter home." },
    { id: "garden-villa", name: "Garden Villa", emoji: "🏡", price: 15000, blurb: "Roses at every window." },
    { id: "sky-chateau", name: "Sky Chateau", emoji: "🏰", price: 40000, blurb: "The dream mansion on the hill." },
    { id: "amethyst-manor", name: "Amethyst Manor", emoji: "🏯", price: 75000, blurb: "Purple velvet rooms and gold trim." }
  ];

  const UPGRADES = [
    { id: "extra-roll", name: "Extra Daily Dice +3", emoji: "🎲", price: 3000, effect: "dailyDiceBonus", value: 3, blurb: "Three more rolls every day." },
    { id: "fast-token", name: "Speedy Top Hat", emoji: "🎩", price: 4500, effect: "fastToken", value: 1, blurb: "Token hops faster between spots." },
    { id: "garden-theme", name: "Sunny Garden Theme", emoji: "🌸", price: 6000, effect: "theme", value: "garden", blurb: "Pink blooms on the board." },
    { id: "velvet-theme", name: "Velvet Night Theme", emoji: "💜", price: 6000, effect: "theme", value: "velvet", blurb: "Deep purple board glow." },
    { id: "double-stamp", name: "Double Stamp Chance", emoji: "📮", price: 9000, effect: "stampBoost", value: 1, blurb: "Easier postcard finds." }
  ];

  const CINEMATICS = {
    default: "assets/video/mansion-arrival-cinematic-15s.mp4",
    arrival: "assets/video/mansion-arrival-cinematic-15s.mp4",
    resort: "assets/video/downtowntan-resort-arrival-15s-h264.mp4",
    car: "assets/video/mansion-millions-porsche-pearl-white-10s.mp4",
    go: "assets/video/mansion-arrival-cinematic-15s.mp4",
    ride: "assets/video/mansion-millions-lamborghini-blue-10s.mp4",
    city: "assets/video/mansion-arrival-cinematic-15s.mp4",
    vault: "assets/video/mansion-millions-bugatti-15s.mp4"
  };

  global.MMShop = { CARS, HOUSES, UPGRADES, CINEMATICS };
})(typeof window !== "undefined" ? window : global);
