#!/bin/bash
# Agent driver for RnEcommerce on the iOS simulator. Every command here was run
# from this repo on macOS 26 / Xcode 26.6 / iOS 26.5 runtime. Usage:
#   .claude/skills/run-rnecommerce/driver.sh <command> [args]
# Run with no args for the command list. Screenshots land in $SHOTS.
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
RUBY_BIN=/opt/homebrew/opt/ruby/bin
SHOTS="${SHOTS:-/tmp/rnecommerce-shots}"; mkdir -p "$SHOTS"
LOGS="${LOGS:-/tmp/rnecommerce-logs}"; mkdir -p "$LOGS"
DERIVED="${DERIVED:-/tmp/rnecommerce-derived}"
BID=org.reactjs.native.example.RnEcommerce
SIM_NAME="${SIM_NAME:-iPhone 17 Pro}"
# device pixel size of screenshots for the default device; tap() maps these onto the window
DEV_W=1206; DEV_H=2622

udid() {
  xcrun simctl list devices available -j | python3 -c "
import json,sys; name='$SIM_NAME'
d=json.load(sys.stdin)['devices']
ds=[x for k,v in d.items() if 'iOS' in k for x in v if x['name']==name]
print(ds[0]['udid'] if ds else '')"
}
osa() { # AppleScript with a hard timeout: an un-granted Accessibility prompt hangs osascript forever
  ( osascript -e "$1" > "$LOGS/osa.out" 2>&1 & p=$!; sleep "${2:-8}"; kill $p 2>/dev/null && echo HUNG >> "$LOGS/osa.out" ); cat "$LOGS/osa.out"
}

cmd_doctor() {
  echo "developer dir : $(xcode-select -p) (DEVELOPER_DIR=$DEVELOPER_DIR)"
  xcodebuild -version 2>&1 | head -1
  echo "runtimes      : $(xcrun simctl runtime list 2>&1 | grep -E 'iOS .*Ready' | head -1 || echo 'NONE — see SKILL.md')"
  echo "device        : $SIM_NAME -> ${U:=$(udid)}"
  echo "ruby/pod      : $($RUBY_BIN/ruby -v 2>/dev/null | cut -d' ' -f1-2) / pod $(cd "$ROOT" && $RUBY_BIN/bundle exec pod --version 2>/dev/null)"
  echo "pods          : $([ -d "$ROOT/ios/Pods" ] && echo installed || echo MISSING)  fmt=$(grep -m1 -oE 'FMT_VERSION [0-9]+' "$ROOT/ios/Pods/fmt/include/fmt/base.h" 2>/dev/null | cut -d' ' -f2)"
  echo "screens       : $(node -p "require('$ROOT/node_modules/react-native-screens/package.json').version" 2>/dev/null)"
  echo "metro         : $(curl -s -m 3 http://localhost:8081/status || echo down)"
  echo "cliclick      : $(command -v cliclick || echo 'MISSING — brew install cliclick')"
  echo "accessibility : $(osa 'tell application "System Events" to get name of first application process' 3 | grep -qE 'HUNG|not allowed' && echo 'NOT granted (taps will fail)' || echo ok)"
}
cmd_pods() { cd "$ROOT" && $RUBY_BIN/bundle install >"$LOGS/bundle.log" 2>&1 && cd ios && $RUBY_BIN/bundle exec pod install >"$LOGS/pod.log" 2>&1 && grep -E "Pod installation complete" "$LOGS/pod.log" || { grep -E "\[!\]" "$LOGS/pod.log" | head -3; return 1; }; }
cmd_sim() {
  U=$(udid); [ -n "$U" ] || { echo "no '$SIM_NAME' simulator — see SKILL.md Prerequisites"; return 1; }
  xcrun simctl boot "$U" >/dev/null 2>&1; xcrun simctl bootstatus "$U" -b >/dev/null 2>&1
  open -a Simulator --args -CurrentDeviceUDID "$U"; sleep 4
  xcrun simctl list devices booted | grep -q "$U" && echo "booted $SIM_NAME ($U)" || { echo "boot failed"; return 1; }
}
cmd_metro() {
  if curl -s -m 3 http://localhost:8081/status >/dev/null; then echo "metro already running"; return 0; fi
  (cd "$ROOT" && nohup npx react-native start --reset-cache >"$LOGS/metro.log" 2>&1 &)
  for i in $(seq 1 60); do curl -s -m 2 http://localhost:8081/status | grep -q running && { echo "metro ready"; return 0; }; sleep 1; done
  echo "metro did not come up — $LOGS/metro.log"; return 1
}
cmd_build() {
  U=$(udid); cd "$ROOT/ios" && xcodebuild -workspace RnEcommerce.xcworkspace -scheme RnEcommerce -configuration Debug \
    -destination "platform=iOS Simulator,id=$U" -derivedDataPath "$DERIVED" CODE_SIGNING_ALLOWED=NO ${1:-} build >"$LOGS/xcodebuild.log" 2>&1
  grep -E "\*\* BUILD (SUCCEEDED|FAILED)" "$LOGS/xcodebuild.log" | tail -1; grep -E " error:" "$LOGS/xcodebuild.log" | head -3
  ls -d "$DERIVED/Build/Products/Debug-iphonesimulator/RnEcommerce.app" >/dev/null 2>&1
}
cmd_install() { U=$(udid); xcrun simctl install "$U" "$DERIVED/Build/Products/Debug-iphonesimulator/RnEcommerce.app" && echo installed; }
cmd_launch()  { U=$(udid); xcrun simctl launch --terminate-running-process "$U" $BID; sleep "${1:-6}"; cmd_settle; }
# wait until two consecutive screenshots (below the status bar) are identical — product images stream in
# for several seconds after launch and a tap during that window can miss or be mis-verified
cmd_settle() {
  U=$(udid); P="$LOGS/settle-prev.png"; C="$LOGS/settle-cur.png"; stable=0
  xcrun simctl io "$U" screenshot "$P" >/dev/null 2>&1
  for i in $(seq 1 30); do sleep 1; xcrun simctl io "$U" screenshot "$C" >/dev/null 2>&1
    sips -c $((DEV_H-130)) $DEV_W --cropOffset 130 0 "$P" --out "$P.b.png" >/dev/null 2>&1; sips -c $((DEV_H-130)) $DEV_W --cropOffset 130 0 "$C" --out "$C.b.png" >/dev/null 2>&1
    if cmp -s "$P.b.png" "$C.b.png"; then stable=$((stable+1)); else stable=0; fi
    # three identical consecutive frames: a momentarily stalled image download can fake one
    [ $stable -ge 3 ] && { echo "settled after ${i}s"; return 0; }; mv "$C" "$P"; done; echo "still changing after 30s"; return 1; }
cmd_shot()    { U=$(udid); sleep "${2:-2}"; xcrun simctl io "$U" screenshot "$SHOTS/${1:-shot}.png" >/dev/null 2>&1 && echo "$SHOTS/${1:-shot}.png"; }
cmd_appearance() { U=$(udid); xcrun simctl ui "$U" appearance "${1:-light}" && echo "appearance -> ${1:-light}"; }
# The device screen is the window's AXGroup (Simulator 26 has a 52pt AXToolbar above it and a bezel
# margin around it). Reading that frame is exact; estimating a title bar was off by ~50pt at the top.
cmd_bounds() {
  B=$(osa 'tell application "System Events" to tell process "Simulator" to get {position, size} of (first UI element of window 1 whose role is "AXGroup")')
  echo "$B" | grep -qE "^-?[0-9]+, -?[0-9]+, [0-9]+, [0-9]+$" || { echo "no Simulator device view / no Accessibility: $B"; return 1; }
  echo "$B" | tr -d ' ' | tr ',' ' '
}
# tap <px> <py>: coordinates in DEVICE PIXELS as read off a screenshot (1206x2622 for iPhone 17 Pro).
# Self-verifying: screenshots before/after and re-clicks once if nothing changed — the first click after a
# screen transition is sometimes swallowed (observed on Checkout/Confirm), the second always lands.
cmd_tap() {
  U=$(udid); B="$LOGS/tap-before.png"; A="$LOGS/tap-after.png"
  # compare below the status bar: the clock ticks between screenshots and would read as a change
  body(){ sips -c $((DEV_H-130)) $DEV_W --cropOffset 130 0 "$1" --out "$1.body.png" >/dev/null 2>&1; }
  cmd_settle >/dev/null   # never take the "before" frame while images are still streaming in
  xcrun simctl io "$U" screenshot "$B" >/dev/null 2>&1; body "$B"
  for attempt in 1 2; do
    read WX WY WW WH <<< "$(cmd_bounds)" || return 1
    osa 'tell application "Simulator" to activate' 3 >/dev/null; sleep 1.5
    read SX SY <<< "$(python3 - "$1" "$2" "$WX" "$WY" "$WW" "$WH" <<'PY2'
import sys; px,py,gx,gy,gw,gh=map(float,sys.argv[1:7])
print(int(round(gx+px/1206*gw)), int(round(gy+py/2622*gh)))
PY2
)"
    # A held press, not an instantaneous click: RN's Pressable drops a down/up with no gap (AppleScript
    # `click at`), which is why add-to-cart silently did nothing while navigation taps sometimes worked.
    cliclick "dd:$SX,$SY" "w:${PRESS_MS:-120}" "du:$SX,$SY"
    # poll: the click usually lands on attempt 1 but the repaint can trail the screenshot by seconds;
    # re-clicking too early hits whatever button appeared in the same place (Checkout -> Confirm -> Done)
    for poll in 1 2 3 4 5; do
      sleep 1; xcrun simctl io "$U" screenshot "$A" >/dev/null 2>&1; body "$A"
      if ! cmp -s "$B.body.png" "$A.body.png"; then
        # a Pressable's pressed-state flash also differs from "before"; require the change to persist
        sleep 1; xcrun simctl io "$U" screenshot "$A" >/dev/null 2>&1; body "$A"
        if ! cmp -s "$B.body.png" "$A.body.png"; then sleep "${3:-1}"; echo "tap dev($1,$2) -> screen($SX,$SY) [attempt $attempt, ${poll}s]"; return 0; fi
      fi
    done
  done
  echo "tap dev($1,$2) -> screen($SX,$SY) [NO CHANGE after 2 attempts x 5s]"; return 1
}
# smoke: relaunch -> add to cart -> open cart -> checkout -> confirm -> done, screenshot each step, light then dark
# reset: reinstall the app so persisted state (the redux-persist cart in AsyncStorage) starts empty —
# otherwise a leftover cart makes step 02 read "Cart · 2" and every golden downstream drifts
cmd_reset() { U=$(udid); xcrun simctl terminate "$U" $BID 2>/dev/null; xcrun simctl uninstall "$U" $BID 2>/dev/null; cmd_install >/dev/null && echo "app reinstalled (state cleared)"; }
cmd_smoke() {
  cmd_reset >/dev/null; cmd_appearance light >/dev/null
  cmd_launch >/dev/null; cmd_shot 01-list 0
  cmd_tap 601 1564; cmd_shot 02-added 0            # Add to cart (first card) -> Cart · 1
  cmd_tap 601 2504 3; cmd_shot 03-cart 0           # Cart · N bar -> Cart screen
  cmd_tap 601 2504; cmd_shot 04-summary 0          # Checkout -> Order summary
  cmd_tap 601 2297; cmd_shot 05-confirmed 0        # Confirm purchase -> Order confirmed
  cmd_tap 601 841;  cmd_shot 06-empty 0            # Done -> empty cart, Checkout disabled
  cmd_appearance dark >/dev/null; cmd_launch >/dev/null; cmd_shot 07-dark-list 0
  cmd_tap 601 1240 3; cmd_shot 08-dark-detail 0    # first card -> Detail
  cmd_appearance light >/dev/null; cmd_launch >/dev/null
  cmd_tap 1120 252; cmd_shot 09-toggled-dark 0        # header ThemeToggle: light OS -> dark override
  echo "smoke done -> $SHOTS (look at them: a step that did not register leaves the previous screen)"
}
# Golden screenshots: goldens/<step>.png committed next to this driver. `golden` snapshots the last smoke run;
# `verify` runs smoke and fails if any step differs from its golden by more than GOLDEN_TOLERANCE percent of
# pixels (status bar excluded). Re-run `golden` after an intentional visual change.
GOLDENS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/goldens"; GOLDEN_TOLERANCE="${GOLDEN_TOLERANCE:-1.0}"
imgdiff() { [ -x "$LOGS/imgdiff" ] || swiftc -O -o "$LOGS/imgdiff" "$(dirname "${BASH_SOURCE[0]}")/imgdiff.swift" >/dev/null 2>&1; "$LOGS/imgdiff" "$@"; }
cmd_golden() { mkdir -p "$GOLDENS"; n=0; for f in "$SHOTS"/0[1-9]-*.png; do cp "$f" "$GOLDENS/"; n=$((n+1)); done; echo "$n goldens -> $GOLDENS (commit them)"; }
cmd_verify() {
  cmd_smoke >/dev/null || true; fail=0
  for g in "$GOLDENS"/0[1-9]-*.png; do name=$(basename "$g"); shot="$SHOTS/$name"
    [ -f "$shot" ] || { printf "%-22s MISSING\n" "$name"; fail=1; continue; }
    pct=$(imgdiff "$shot" "$g" 130); ok=$(python3 -c "print('PASS' if float('$pct' or 100) <= $GOLDEN_TOLERANCE else 'FAIL')" 2>/dev/null || echo FAIL)
    printf "%-22s %7s%%  %s\n" "$name" "$pct" "$ok"; [ "$ok" = PASS ] || fail=1; done
  [ $fail -eq 0 ] && echo "verify: all steps match goldens (tolerance ${GOLDEN_TOLERANCE}%)" || { echo "verify: FAILED — compare $SHOTS/<step>.png with $GOLDENS/<step>.png"; return 1; }
}
cmd_stop() { U=$(udid); xcrun simctl terminate "$U" $BID 2>/dev/null; pkill -f "react-native start" 2>/dev/null; echo stopped; }
cmd_test() { cd "$ROOT" && npm run check; }

case "${1:-}" in
  doctor|pods|sim|metro|build|install|launch|settle|reset|shot|appearance|bounds|tap|smoke|golden|verify|stop|test) c=$1; shift; "cmd_$c" "$@";;
  up) cmd_sim && cmd_metro && cmd_build && cmd_install && cmd_launch && cmd_shot 00-up 1;;
  *) sed -n '2,5p' "$0"; echo "commands: doctor | pods | sim | metro | build [clean] | install | launch | settle | reset | up | shot <name> | tap <px> <py> | appearance light|dark | bounds | smoke | golden | verify | test | stop";;
esac
