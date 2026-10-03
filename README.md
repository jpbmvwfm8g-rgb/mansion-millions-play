# Mansion Millions

A playable web adventure from Jason's Place, with Jason, Juno, Juni, Sly, Ella, and Lumi. This release has eleven rooms and twelve collectible cards across two floors, a three-part midnight puzzle, fictional Mansion Dollars, six purchasable game assets, and a daily reward.

## Run

No build or server-side dependency is required. Serve this directory with any static web host. For local play, run `python3 -m http.server 8080 --bind 127.0.0.1` from this directory, then open `http://127.0.0.1:8080/` in a browser.

Production: https://mansion-millions-play.vercel.app/

Source: https://github.com/jpbmvwfm8g-rgb/mansion-millions-play

## Install and offline play

HTTPS or localhost is required for the service worker. After a full online visit, solo play is cached for offline use. The manifest, icons, background, and PeerJS client are included locally. The app supports deployment at the domain root or under a directory ending in `/`.

On iPhone or iPad, open the game in Safari and use Share → Add to Home Screen. This is a web app; this package contains no App Store submission or native iOS binary. Physical Safari installation is a separate device check.

## Progress and rewards

Progress stays in this browser's local storage. Existing saves using `mansion-millions-shared-state-v1` are migrated and checked before use. Clearing browser data clears progress. If browser storage is blocked, play continues for the current tab with a visible warning.

Each new card advances the clock by one hour. Wrong answers advance seven minutes, except the one forgiven miss earned at eleven. Completing a room again does not award duplicate cards, cash, or XP. Daily rewards use the device's local calendar date. Mansion Dollars have no cash value and cannot be withdrawn.

## Play together

One host opens a four-letter code, and one guest joins with that code. Keep the host tab open and share codes with someone you know. Companions, unlocked cards, and the clock are shared. Wallets, daily rewards, and purchases remain on each device. Only known characters, cards, and valid times are accepted from peers.

PeerJS 1.5.4 is bundled in `vendor/peerjs-1.5.4.min.js`, with its MIT license. Client source: https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js. Internet access to PeerJS's public signaling service is required for shared play. Network restrictions and NAT behavior can prevent connections; the app handles errors and timeouts and offers solo play. There is no hosted account database, chat, payment checkout, or prize system in this package.

## Deployment

The existing GitHub repository's `main` branch is connected to the existing Vercel project `mansion-millions-play`. `vercel.json` retains clean URLs and supplies cache and content-type headers for installation assets. Deploy the static source at the root. Keep `sw.js`, the manifest, icons, background, and `vendor/` together with `index.html`.

`jasons-place.html` is the existing auxiliary entrance preview from the repository, preserved as supplied. Its external Jason's Place and Shopify routes are outside this game release's QA scope.

## QA

From `tests/`, run `npm ci`, then `npm test`. Node 24 or later is supported by the pinned QA browser dependency. Test dependencies and the browser are for QA only and are not required to run or deploy the game. Test results are written to `qa/` by default, or to `ARQS_QA_OUTPUT` when set.

Checks cover all six companions, a complete twelve-card playthrough, room gates, wrong-answer timing, duplicate purchases and replays, daily calendar boundaries, malformed or blocked storage, phone/tablet/desktop overflow, offline root and nested installation, isolated app caches, unavailable multiplayer, and a pair of real browser WebRTC connections against a real local PeerServer. The live public signaling service is checked separately. Physical iPhone Safari installation and connections across two physical networks remain device checks.

Powered by ARQS Software Intelligence Systems 2026.
