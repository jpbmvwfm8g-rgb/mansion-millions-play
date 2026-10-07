# Mansion Millions: Golden Tour — ARQS Edition

Module: ARQS-APIN-2026-001683 | Version 1.1.0
Documentation: ARQS-APIN-2026-001685

Original module and wordmark: VIBE. Integration and release QA: SOL.

## Play and deploy

Copy this directory to `golden-tour/` at the root of the existing
`jpbmvwfm8g-rgb/mansion-millions-play` repository. This is a static, standalone
HTML game. No dependencies, build step, environment variables or credentials
are required. The existing Vercel configuration serves `/golden-tour/`.
The optional wordmark is `brand/logo.svg`. The game does not depend on it.

The main game, routes, caches, payment methods and service worker are unchanged.
This expansion is not added to the main game's offline cache or navigation.
Use the direct route to launch it; Return to Mansion Millions opens `/`.

## Game

Roll, move, land, acquire rooms and grow the mansion. The 20-tile board contains
nine purchasable rooms, coin fountains, gem gardens, estate tax and two vaults.
Owned rooms yield fictional rent every four seconds while the page is running.
Coins, gems and vault rewards have no cash value. There are no cash prizes,
paid rolls, checkout, account provisioning or cloud synchronization in this module.

Mansion thresholds: Fixer-Upper 0 rooms; Cozy Estate 2; Grand Villa 5;
Golden Manor 7; Millionaire's Palace all 9. Rooms are acquired automatically
when landed on with enough coins. Passing or landing on the Golden Gate grants
50 coins once per crossing. Tax never makes the balance negative.

Progress uses the isolated localStorage key
`arqs.mansion-millions.golden-tour.v1`. Invalid saves are rejected with a visible
message. Blocked or full browser storage keeps the game playable for the current
session with a warning. Clearing browser data clears progress. No offline income
is calculated. This local-save game is not a tamper-resistant paid economy.

## Changes from the deposited source

The original Drive files remain unchanged. This release corrects the 8-room
counter to 9, makes the formerly impossible 13-room Palace reachable at 9,
adds validated browser persistence, restores the missing gate-crossing reward,
prevents double gate rewards, respects reduced motion, replaces erroneous coin
and ballroom icons, prevents the Palace roof from clipping, and adds APINs,
online artwork attribution and a return link. The violet/amber design is retained.

## Provenance and asset control

- Module / source HTML: ARQS-APIN-2026-001683.
- Clean source wordmark: ARQS-APIN-2026-001684, retained in Drive.
- This README: ARQS-APIN-2026-001685.
- Embedded evolving-mansion SVG renderer: ARQS-APIN-2026-001686.
- Original internal handoff: ARQS-APIN-2026-001687, retained in Drive.
- Release tests and evidence package: ARQS-APIN-2026-001688.
- Online wordmark derivative: ARQS-APIN-2026-001689, parent 001684.

Online artwork carries the exact `ARQS.ca/imaging` attribution at 8% opacity.
The module-specific wordmark does not replace the locked corporate ARQS logo.

## QA at commit time

Seventeen local Chromium regression tests pass. Coverage includes all-room
completion, safe tax, duplicate acquisition, insufficient funds, repeated rolls,
gate crossing and exact gate landing, save restoration, invalid and blocked
storage, 320px header layout, reduced motion and Palace SVG bounds.
The tests first recorded eight source behavior failures and two visual failures.

The local runner blocks browser network navigation. The complete production
HTML was executed with `set_content`; only the storage boundary was substituted.
These tests are not evidence of real deployed reload persistence or physical
Safari behavior. Production-browser results belong in the separate release
confirmation record. No purchase or real transaction was tested.

Original source was supplied as ARQS-authored work. This technical release is
not independent legal clearance of resale or white-label license terms.

Powered by ARQS Software Intelligence Systems 2026.
