#!/bin/sh
# PostToolUse gate for the RnEcommerce exam project.
#
# Runs the two mechanical checks CLAUDE.md asks for after every write to a
# TypeScript source file: the whole-project typecheck and the architecture +
# code-quality lint rules in .eslintrc.js. Exit 2 hands the output back to
# Claude as blocking feedback so the violation is repaired in the same turn.
#
# --max-warnings 0 is load-bearing. eslint exits 0 when a file produces only
# warnings, and @react-native/eslint-config sets a lot of real rules to warn
# (no-shadow, no-unused-vars, eqeqeq before this config raises it). Without the
# flag every one of those slips through this gate silently.

payload=$(cat)

file=$(printf '%s' "$payload" | python3 -c \
  'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' \
  2>/dev/null)

case "$file" in
  */src/*.ts|*/src/*.tsx|*/App.tsx) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

report=""

if ! tsc_out=$(npx --no-install tsc --noEmit 2>&1); then
  report="TypeScript (npx tsc --noEmit):
$tsc_out
"
fi

if ! lint_out=$(npx --no-install eslint --max-warnings 0 "$file" 2>&1); then
  report="${report}ESLint (architecture rules — see .eslintrc.js and CLAUDE.md):
$lint_out
"
fi

if [ -n "$report" ]; then
  printf '%s\n' "$report" >&2
  exit 2
fi

exit 0
