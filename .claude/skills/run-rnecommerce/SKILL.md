---
name: run-rnecommerce
description: Build, run, drive and screenshot the RnEcommerce React Native app on the iOS simulator. Use when asked to run, start, build, launch, test, screenshot, tap through, or check dark mode of the app, or when a build / pod install / simulator fails.
---

React Native 0.81 app (Fake Store API) driven on the **iOS simulator** via
`.claude/skills/run-rnecommerce/driver.sh` — boots a simulator, builds with
`xcodebuild`, installs, launches against Metro, then taps and screenshots through
AppleScript. macOS + Xcode only; there is no Linux path for this app. All paths are
relative to the repo root.

## Prerequisites

Verified on macOS 26 (Darwin 25.6), Xcode 26.6 (clang 21), iOS 26.5 runtime.

```bash
# 1. Xcode.app from the App Store, opened once. No sudo needed if you export:
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
# 2. Xcode 26 ships WITHOUT the iOS platform. ~8.5 GB, 40-90 min, no sudo:
xcodebuild -downloadPlatform iOS
# 3. CocoaPods must run under Homebrew Ruby (system Ruby 2.6 cannot build gems on macOS 26):
brew install ruby
# 4. Taps need Accessibility for the app that HOSTS this session (WebStorm, Terminal, Claude.app…),
#    not for `osascript`: System Settings → Privacy & Security → Accessibility → enable it.
# 5. cliclick posts the press (Homebrew core, trusted tap):
brew install cliclick
```

`driver.sh doctor` checks every line above and prints what is missing.

## Setup

```bash
npm install                                              # postinstall applies patches/ (fmt 12.1.0 — see Gotchas)
.claude/skills/run-rnecommerce/driver.sh pods            # bundle install + pod install under Homebrew Ruby
```

## Run (agent path)

```bash
D=.claude/skills/run-rnecommerce/driver.sh
$D doctor      # toolchain, runtime, device, pods, metro, accessibility — read this first
$D up          # sim + metro + build + install + launch + screenshot 00-up.png (first build ≈ 5-8 min)
$D smoke       # relaunch → add to cart → cart → checkout → confirm → done → dark list → dark detail → header toggle, 9 screenshots
$D verify      # smoke + compare every step against goldens/ (9 steps, ≤1% pixels differ, status bar excluded); exit 1 on drift
```

`smoke` starts with `reset` (reinstall, persisted cart wiped) so runs are deterministic. `verify` is the correctness check `smoke` alone is not: `smoke` proves each tap changed the screen, `verify` proves it
changed to the *committed* screen. After an intentional visual change, re-run `smoke`, eyeball the shots, then `$D golden`
to re-snapshot and commit `goldens/`. The comparator is `imgdiff.swift` (CoreGraphics, compiled once into
`/tmp/rnecommerce-logs/imgdiff`); tolerance via `GOLDEN_TOLERANCE=<percent>`.

Screenshots -> `/tmp/rnecommerce-shots/`. Logs -> `/tmp/rnecommerce-logs/` (`xcodebuild.log`, `pod.log`, `metro.log`).
**Look at the screenshots** — a tap that did not register leaves the previous screen in place.

| command | what it does |
|---|---|
| `sim` | boot `iPhone 17 Pro` (override with `SIM_NAME=`) and open the Simulator window |
| `metro` | start Metro with `--reset-cache` unless :8081 already answers |
| `build [clean]` | `xcodebuild` Debug for the simulator into `/tmp/rnecommerce-derived` |
| `install` / `launch` | `simctl install` / `simctl launch --terminate-running-process`, then `settle` |
| `settle` | wait for 3 identical consecutive frames (30 s max) — product images stream in for seconds after launch |
| `reset` | terminate + uninstall + install: wipes the persisted cart so every smoke starts from `Cart · 0` |
| `shot <name>` | `simctl io screenshot` -> `/tmp/rnecommerce-shots/<name>.png` |
| `tap <px> <py>` | click at **device-pixel** coords read off a screenshot (1206×2622); self-verifying — polls for a persisted screen change, retries once, exits 1 if nothing changed |
| `appearance light\|dark` | flip the OS scheme — the app follows `useColorScheme()` |
| `bounds` | device-screen frame `{x y w h}` (the window's `AXGroup`); fails loudly if Accessibility is missing |
| `golden` | snapshot the last smoke's 9 screenshots into `goldens/` |
| `verify` | `smoke`, then per-step pixel diff against `goldens/`; prints `%` and PASS/FAIL, exit 1 on any FAIL |
| `test` | `npm run check` (tsc + eslint + jest) |
| `stop` | terminate the app and Metro |

Useful tap targets on the default device (device px): first card **Add to cart** `601 1564`,
first card title (→ Detail) `601 1240`, bottom bar (**Cart · N** on list, **Checkout** on cart) `601 2504`,
**Confirm purchase** `601 2297`, **Done** `601 841`, header **back** `230 252`.

## Run (human path)

```bash
npm start -- --reset-cache        # Metro, keep running
npx react-native run-ios          # needs DEVELOPER_DIR exported, pods installed, runtime present
```

## Test

```bash
npm run check    # tsc --noEmit && eslint --max-warnings 0 && jest --coverage; 26 suites / 173 tests
```

## Gotchas

- **`react-native-screens` is pinned exact `4.24.0`.** 4.25+ declares `peer react-native >= 0.82` and types codegen commands as `React.ComponentRef<>`, which RN 0.81's codegen rejects — once in Metro (`SearchBarNativeComponent.ts … must be of type React.ElementRef<>`), again in `pod install`'s codegen pass. `tsc` and jest pass either way; only bundling/pods fail.
- **fmt 11.0.2 does not compile under Xcode 26.6** (`format-inl.h: call to consteval function … is not a constant expression`). Every RN 0.81.x and 0.82.1 ship the same fmt; RN 0.83 moved to 12.1.0. `patches/react-native+0.81.0.patch` does the same (fmt + RCT-Folly podspecs) via `postinstall`. After it applies you need `pod update fmt RCT-Folly --no-repo-update` once — plain `pod install` keeps the locked RCT-Folly demanding 11.0.2. A `-DFMT_USE_CONSTEVAL=0` define does **not** work: fmt's `base.h` hard-sets that macro.
- **Ruby 4.0 dropped `nkf`**; CocoaPods still requires it (`LoadError -- kconv` mid-install). It is in the Gemfile.
- **Download the iOS runtime from exactly one place.** Xcode's Components pane and `xcodebuild -downloadPlatform` both go through `mobileassetd`; running both ends as `Duplicate of <id>` with an Unusable 8 GB twin. And never `simctl runtime delete` the Ready image expecting to re-add it — the `.dmg` `runtime list -v` reports is purged after registration; you are back to a full download.
- **Xcode's Components pane can show iOS 26.5 "installed" while `simctl runtime list` says 0 images.** Trust `simctl`. Until it lists the runtime, every `xcodebuild` destination (even `generic/platform=iOS Simulator`) is refused with "iOS 26.5 is not installed" — the build cannot be pre-warmed.
- **`launchctl remove com.apple.CoreSimulator.CoreSimulatorService`** (a common "fix") shut the booted device down here; `driver.sh sim` re-boots it.
- **A `Pressable` needs real press duration.** AppleScript's `click at` posts mouse-down/up with no gap and RN drops it — add-to-cart silently did nothing while navigation taps sometimes worked, which looked like flakiness for hours. `driver.sh tap` uses `cliclick dd … w:120 du` (a 120 ms held press, `PRESS_MS` to change); with it every tap landed first try.
- **After `reset` (reinstall) the image cache is cold** — product images stream in for seconds, and a tap or a "screen changed" check during that window is meaningless. `settle` waits for 3 identical consecutive frames (30 s ceiling) and runs before every tap's "before" frame.
- **Eyeball the screenshots before `golden`.** `verify` only proves the app matches what was captured; the run is deterministic, so a golden captured from a mis-landed tap will match itself at 0.000% forever. Look at all 8 first.
- **Tap coordinates must be mapped onto the Simulator window's `AXGroup`, not the window frame.** Simulator 26's window has a 52 pt `AXToolbar` above the device view and a bezel margin around it; the device screen is the `AXGroup` child (here 356×774 pt inside a 404×868 window). Estimating a title bar instead put taps ~50 pt low at the top of the screen and ~0 at the bottom — bottom buttons landed, the header back button and `Done` never did. `driver.sh bounds` reads the real frame.
- **A screenshot taken right after a click can predate the repaint**, and a `Pressable`'s pressed-state flash also differs from the "before" frame. `driver.sh tap` polls up to 5 s and requires the change to persist across two captures before declaring success; retrying on a stale capture clicks whatever button appeared in the same spot (Checkout → Confirm → Done all share a column).
- **The status-bar clock changes between screenshots** — the verifier crops the top 130 px (`sips`) before comparing.
- **Two agents in one `ios/` tree corrupt each other** — CocoaPods has no locking; concurrent Podfile edits produced spurious "could not find compatible versions for pod fmt" failures.

## Troubleshooting

- **`xcode-select: error: tool 'xcodebuild' requires Xcode`**: developer dir is Command Line Tools. `export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` (or `sudo xcode-select -s /Applications/Xcode.app`).
- **`Unable to boot device because we cannot determine the runtime bundle` / device `available: False, runtime profile not found`**: no runtime, or a registered-but-unmounted one. `xcrun simctl runtime list`; if 0 images, `xcodebuild -downloadPlatform iOS`.
- **`Download failed due to there being no Internet connection` from `mobileassetd`**: transient; rerun. Progress is written with `\r` — read the log with `tr '\r' '\n'`. The transfer runs in `simdiskimaged`, so `nettop` on `xcodebuild` shows zero bytes while healthy. If the byte count is flat for 3 min it has stalled: kill by **pid** (a `pkill -f downloadPlatform` also kills your own watcher shells) and restart — it does not resume.
- **`Gem::Ext::BuildError … ruby/config.h file not found`**: system Ruby. Use `/opt/homebrew/opt/ruby/bin/bundle`.
- **`[!] CocoaPods could not find compatible versions for pod "fmt"`** after the patch: `cd ios && bundle exec pod update fmt RCT-Folly --no-repo-update`.
- **`osascript` hangs forever / `not allowed assistive access (-1719)`**: Accessibility not granted to the hosting app (see Prerequisites). `driver.sh` wraps every AppleScript call in a timeout so it fails instead of hanging.
- **`Can't get window 1 of process "Simulator"`**: Simulator.app running with no device window. `pkill -x Simulator; driver.sh sim`.
- **App launches to "could not connect to Metro"**: `driver.sh metro`; the user's own Metro may have died.
