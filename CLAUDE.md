# CLAUDE.md

React Native mini e-commerce built against the Fake Store API. This is a technical exam submission graded on **technical judgment and validation of generated code**, not just on whether the app runs — see `CONTEXT.md` for the full brief and the reasoning behind the decisions below.

## Commands

```bash
npm start -- --reset-cache     # Metro
npx react-native run-ios         # needs Xcode selected + pods: see iOS toolchain below
npx react-native run-android
npx tsc --noEmit               # run after every group of files
npm test
```

## iOS toolchain

CocoaPods must run under **Homebrew Ruby**, not the system one: macOS's bundled Ruby 2.6 cannot build native gems against the macOS 26 SDK (`ruby/config.h: file not found` from `json`'s extconf). `brew install ruby` once, then always invoke through it:

```bash
/opt/homebrew/opt/ruby/bin/bundle install
cd ios && /opt/homebrew/opt/ruby/bin/bundle exec pod install
```

The Gemfile carries `nkf` alongside the Ruby 3.4 shims (`bigdecimal`, `logger`, …): Ruby 4.0 removed it from the standard library and CocoaPods still `require`s its `kconv`, which otherwise surfaces mid-`pod install` as `LoadError - cannot load such file -- kconv`.

`xcode-select -p` must point at `/Applications/Xcode.app/Contents/Developer`; with Command Line Tools selected, `pod install`, `xcodebuild` and `simctl` all fail before reaching the project. Switching it needs `sudo xcode-select -s /Applications/Xcode.app`. Without sudo, `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` in the environment overrides it per process and is what every command in this section assumes.

Xcode 26 ships without the iOS platform. `xcodebuild -downloadPlatform iOS` (~8.5 GB, no sudo, ~90 min at 1.5 MB/s) installs the simulator runtime; until it finishes `simctl list devices` shows no available iPhones and every `xcodebuild` destination — including `generic/platform=iOS Simulator` — is refused with "iOS 26.5 is not installed". So the native build cannot be pre-warmed either; the download is the whole critical path.

Three runtime traps, all hit once:

- **Download it from exactly one place.** Xcode's Settings → Components downloader and `xcodebuild -downloadPlatform` both go through `mobileassetd`; run both and the second finishes as `Duplicate of <id>` — an Unusable image eating a second 8 GB. Delete the *Unusable* one only.
- **Never `simctl runtime delete` the Ready image expecting to re-add it.** `runtime list -v` prints an Image Path under `/System/Library/AssetsV2/…`, but `mobileassetd` purges that `.dmg` after registration, so `runtime add` has nothing to add and the only way back is the full download again.
- **"Download failed due to there being no Internet connection"** from `mobileassetd` is transient (network was fine); just rerun.

`xcodebuild -downloadPlatform` writes progress with `\r`, so read its log with `tr '\r' '\n'`. The transfer runs in `simdiskimaged`, not the `xcodebuild` process — `nettop` on the latter shows zero bytes while the download is healthy.

## Stack

TypeScript · Redux Toolkit (`createSlice` / `createAsyncThunk`) · react-redux · styled-components/native · @react-navigation/native-stack · redux-persist + AsyncStorage

**`fmt` is patched to 12.1.0** via `patches/react-native+0.81.0.patch` (applied by the `postinstall` → `patch-package` hook). RN 0.81.0 vendors fmt 11.0.2, which does not compile under Xcode 26.6 / Apple clang 21 — `format-inl.h: call to consteval function … is not a constant expression`, 5 errors in that one file. Every 0.81.x through 0.81.6 and even 0.82.1 ship the identical fmt podspec, so no patch-bump fixes it; RN 0.83 is where upstream moved to fmt 12.1.0, and RN 0.81's own C++ builds cleanly against it. Two routes were ruled out before this one: a `-DFMT_USE_CONSTEVAL=0` define (fmt's `base.h` hard-sets that macro from compiler feature checks with no override guard, so the header wins) and compiling only the fmt target as C++17 (inline-function ODR mismatch against every C++20 consumer). The patch touches `third-party-podspecs/fmt.podspec` (version + tag) and `RCT-Folly.podspec` (its `fmt` dependency pin); after applying it, `pod update fmt RCT-Folly --no-repo-update` is required — plain `pod install` keeps the locked RCT-Folly demanding 11.0.2. Drop the patch when upgrading to RN ≥ 0.83.

`react-native-screens` is pinned **exact** at `4.24.0` — the last release whose peer range allows RN 0.81. From 4.25.0 it declares `peer react-native >= 0.82.0` and its codegen specs switch to `React.ComponentRef<>`, which RN 0.81.0's `@react-native/babel-plugin-codegen` rejects (`The first argument of method … must be of type React.ElementRef<>`). It bites in two places with different visibility: `npx react-native bundle` (iOS specs only) and `pod install`'s codegen pass (all specs, Android included) — `tsc` and jest pass either way. Lift the pin when upgrading RN, not before.

Do not introduce Zustand, MobX, Context-as-store, RTK Query, `StyleSheet.create`, or NativeWind. If you think one is warranted, say so and wait — don't switch unilaterally.

## Layout

```
src/
  app/        store.ts, hooks.ts
  theme/      theme.ts, theme.type.ts, styled.d.ts, index.ts
  api/        fakeStoreApi.ts, fakeStoreApi.type.ts
  features/   products/{productsSlice,selectors}.ts, cart/{cartSlice,selectors}.ts, theme/{themeSlice,selectors}.ts
  components/ <Name>/{<Name>.component.tsx,<Name>.style.ts,<Name>.type.ts,index.ts}
  screens/    <Name>/{<Name>.container.tsx,<Name>.component.tsx,<Name>.style.ts,<Name>.type.ts,index.ts}
```

`components/`: ProductCard, CartItem, QuantityStepper, Loader, ErrorView, ThemeToggle
`screens/`: ProductList, ProductDetail, Cart

## Rules

Full versions and canonical templates live in `.claude/skills/rn-ecommerce-architecture/`. Consult it when scaffolding.

1. `components/` and `features/` never import `react-redux`, `@react-navigation/*`, or `app/store`
2. `useSelector` / `useDispatch` / `useNavigation` appear only in `*.container.tsx` — plus `src/navigation/RootNavigator.tsx`, the one non-screen file that reads the store, because navigation chrome (the header theme toggle) has no container of its own. Only screens get containers — leaf components receive props and callbacks
2b. List rows (`ProductCard`, `CartItem`) are `React.memo`'d and their callbacks take an id — `(id: number) => void`, never a pre-bound `() => void`. A pre-bound callback makes `renderItem` build a fresh closure per row per render and defeats the memo; the id shape lets the container share one `useCallback` across every row
3. Derived state (totals, filters, by-id lookup) belongs in `features/*/selectors.ts` via `createSelector`, never inline in a component
4. `.tsx` for files returning JSX, `.ts` for style/type/slice/selector files
5. `index.ts` is a folder's only public entrance — import folder paths, never inner files
6. All styling in `*.style.ts` as styled-components
7. Component prop types are resolved primitives and callbacks — never `Product`, `ProductDTO`, or `RootState`
8. All network access via `api/`. Products fetch once, guarded by `if (status === 'idle')`
9. `status: 'idle' | 'loading' | 'succeeded' | 'failed'` plus `error: string | null`; `ErrorView` takes `onRetry`
10. `FlatList` with `keyExtractor`, never `ScrollView` + `.map`
11. Persist the cart reducer and the theme preference only — never the catalogue
12. No hardcoded colors, spacing, radii, or font sizes in `*.style.ts` — read them off `props.theme`. `ThemeProvider` wraps the app in `App.tsx`
13. Interaction and state coverage: 44pt touch targets (`theme.size.touchTarget`, or `theme.size.hitSlop` via `.attrs` in the style file); `accessibilityRole` + label on every pressable; `ListEmptyComponent` on every list, since empty is a fourth state alongside loading/error/content; disabled controls both blocked and styled from `theme.colors.disabled`; remote images with fixed dimensions and a placeholder background; the search input configured with `keyboardShouldPersistTaps="handled"` on the list below it; prices formatted by one `formatPrice` in `src/utils`
14. Test coverage is specified as behaviours, not as a percentage. Every reducer case, every selector's memoization identity, every pressable's enabled *and* disabled branch, and all four list states (loading / error / empty / content) get a test. A number is deliberately not the rule here: `*.style.ts` coverage measures whether a file was mounted rather than whether it was tested, so a percentage target is satisfied by a smoke render — which is the opposite of the incentive worth having. The one place a number is enforced is the ratchet below, on the three layers where it means something

## Theme

`src/theme/` holds the design tokens: `colors`, `spacing`, `radius`, `fontSize`, `fontWeight`, `text`, `shadow`, `size`. There are two themes, `lightTheme` and `darkTheme`, which differ **only** in `scheme` and `colors` — every other token lives once in a shared base, and a test asserts the two stay identical outside those keys. `RootNavigator` resolves the scheme with `selectEffectiveScheme(state, useColorScheme())` → `getTheme()`, mounts `<ThemeProvider theme={theme}>`, and hands `toNavigationTheme(theme)` to `NavigationContainer` so the header and transition backgrounds follow the palette rather than staying white. `features/theme` holds the user's override (`null` = follow the OS), persisted; `selectEffectiveScheme(state, osScheme)` resolves it, and the header `ThemeToggle` (a presentational component wired in `RootNavigator`) flips it. Every `*.style.ts` reads colour *roles* off `props.theme`, never a palette, which is what lets one component restyle under either scheme from the theme swap alone; `renderWithProviders` takes a `theme` option to assert that.

`styled.d.ts` augments `DefaultTheme` so `props.theme` is typed. The augmentation targets **`styled-components/native`**, not `styled-components` — v6 declares `DefaultTheme` once and re-exports it per entry point, so augmenting the root entry leaves the native one empty and every token silently resolves to `any`. Both directions are pinned by tests.

Two behaviours worth knowing when writing styles: styled-components expands shorthand `padding` into the four longhand props, so assert on `paddingTop` and friends in tests; and a missing `ThemeProvider` throws at render rather than degrading to unstyled UI, because tokens are dereferenced inside the interpolation.

## The API constraint that shapes everything

`GET /products` already returns `description`, and there are only ~20 items.

- `ProductDetail` selects from the cached array by id. It must **not** call `/products/:id`
- Category filter and search are memoized selectors over the cached list. They must **not** call `/products/category/:name` and must **not** refetch
- The API returns `image`; the mapper in `fakeStoreApi.ts` renames it to `imageUrl`. Raw DTO fields never reach the view layer

Avoiding redundant calls is an explicit grading criterion, so any code path that refetches is a defect, not a style preference.

## Mechanical enforcement

Rules 1, 2, 5, 6 are enforced by `no-restricted-imports` zones in `.eslintrc.js`; the error message names the rule it broke. A `PostToolUse` hook (`.claude/hooks/check-architecture.sh`, wired in `.claude/settings.json`) runs `tsc --noEmit` and `eslint --max-warnings 0 <file>` after every write under `src/` or to `App.tsx`, and blocks on failure.

`--max-warnings 0` is load-bearing in both the hook and `npm run lint`. ESLint exits 0 when a file produces only warnings, and `@react-native/eslint-config` ships a lot of real rules at warn level (`no-shadow`, `no-unused-vars`, and `eqeqeq` before this config raises it) — without the flag every one of them passed the gate silently.

```bash
npm test          # fast, no coverage — the loop to iterate in
npm run check     # typecheck + lint + tests with coverage thresholds
```

`coverageThreshold` in `jest.config.js` holds `src/features/**`, `src/api/**` and `src/utils/**` at 100% on all four counters. It is a ratchet on ground already taken, not a target: those three layers are pure logic, every branch in them is reachable from a plain function call, and they were at 100% before the threshold existed — so it cannot fail today and starts failing the moment a reducer case, a mapper branch or a selector lands untested. Glob keys are enforced per matching file rather than averaged over the group, so one untested new selector cannot hide behind twelve tested ones.

There is deliberately no global key and no threshold on `screens/**` or `*.style.ts`, for the reason given in Rule 14. `npm run check` runs `test:coverage` rather than `test`, because a threshold nothing runs is decorative.

The lint zones are: baseline `src/**` (strictest) → `*.style.ts` and `src/theme/**` may import styled-components → `screens/**/*.container.tsx` may import react-redux and @react-navigation → `src/app/**` may import the store → `src/navigation/**` and `App.tsx` may import all three (they mount `Provider`, `NavigationContainer`, and `ThemeProvider`). Adding a zone means restating its full restriction set — the last matching `overrides` entry replaces `no-restricted-imports` rather than merging into it.

Selector memoization is measured in `__tests__/features/selectorMemoization.test.ts`, and those tests re-`require` the selectors per case via `jest.resetModules()` rather than resetting them in place. `selector.clearCache()` only clears the arguments memoize — the result function's own cache survives it, so a call afterwards returns the cached value without running the result function, `recomputations()` reports 0, and every "does not recompute" assertion passes without measuring anything. Verified by planting a spread in an input selector: the memoization tests fail while all functional selector tests stay green.

`test-utils/renderWithProviders.tsx` wraps a component in `Provider` + `ThemeProvider` and returns the store, with optional `preloadedState`. It builds a fresh unpersisted store from the slice reducers rather than importing `src/app/store` — that module constructs a singleton and calls `persistStore()` at import time, so sharing it would leak state across suites. A dispatch made from outside React must be wrapped in `act()` or the re-render is not flushed.

Anything that does import `src/app/store` needs `jest.useFakeTimers()` installed *before* the module loads (so `require`, not a hoisted `import`). `persistStore()` arms a 5s rehydrate timeout that redux-persist never clears — it guards the callback with a `_sealed` flag instead — so under real timers the suite passes but jest reports an open handle and stalls for five seconds. The production `timeout` is deliberately left at its default; it is what lets `PersistGate` proceed with default state if storage never settles.

`__tests__/architecture.test.ts` covers two things ESLint cannot express, by scanning source text rather than imports: `fetch` (and any http client) appears only under `src/api/`, and no source anywhere requests a sub-path under `/products/`. That second one is the mechanical backing for the graded no-refetch criterion. Both guards are verified to fail on a planted violation and to ignore mentions inside comments.

Rules 3, 7, 9, 10, 13 and the behavioural half of 14 are not mechanically checkable and remain judgment calls under the skill.

## Commit gate and review agent

`.githooks/pre-commit` runs `npm run check` before every commit that stages a `.ts`, `.tsx`, `.js` or `.json` file; docs-only commits skip it. It is versioned rather than living in `.git/hooks`, and the `prepare` script in `package.json` installs it with `git config core.hooksPath .githooks`, so it is active after `npm install`. On a fresh clone before install, run that command once by hand. It checks the working tree, not the index — a partially staged file is validated as it sits on disk. `lint-staged` would close that gap at the cost of a dependency and was not worth it for a single-author exam. Bypass a deliberate WIP commit with `git commit --no-verify`.

`.claude/agents/architecture-reviewer` covers the judgment rules the gate cannot: R2b, R3, R7, R8, R9, R10, R13, R14 and the no-refetch criterion. It is invoked on demand — "use the architecture-reviewer agent on the staged diff" — before a feature commit, not on every commit: it reads whole files rather than hunks because R2b, R3 and R8 are broken across container, component and selector, and a per-commit run on one-file diffs would miss exactly those. It is read-only and reports in a fixed `what / why it matters / fix` shape so each finding drops straight into the writeup's analysis section. The exam grades validation of generated code, which is why the reviewer is something you run and act on rather than a silent automatic gate. Agent files are loaded at session start; a new or edited agent needs a new Claude Code session to appear.

## Code quality

A second `.eslintrc.js` override, scoped to `src/**` and `App.tsx`, carries a short curated quality set on top of the architecture zones: `no-console` (the RN config leaves it off), `eqeqeq: ['error', 'always']` (raised from the config's warn-level `allow-null`), `curly`, `@typescript-eslint/no-explicit-any`, and `@typescript-eslint/consistent-type-imports`. It sits in its own override because it is a different concern from the import zones and shares no rule name with them, so ordering between the two does not matter. `__tests__/**` is deliberately outside the scope — test files legitimately reach for `any`.

`consistent-type-imports` is the one that earns its place architecturally rather than stylistically: it is the front half of the `storeTypeOnly` / `allowTypeImports` arrangement in the selectors zone. That zone catches a *value* import of `RootState` into `features/*/selectors.ts` after the fact; this rule stops one being written by accident at all. All five are verified to fire against a planted file, the same way the architecture tests are.

**`eslint-config-airbnb` was evaluated and rejected**, and the reason is worth stating because it is not a taste call. Its `import/prefer-default-export` directly contradicts Rule 5 — every `index.ts` here is a named-export barrel and the three screen barrels export exactly one symbol each, so the preset would flag the architecture as written. On top of that it targets React web (its `import/*` resolvers do not know RN's `.ios.tsx` / `.android.tsx` platform extensions), and `airbnb-typescript` requires type-aware linting via `parserOptions.project`, which would put a second full program build inside a hook that already runs `tsc --noEmit` on every write. A preset that has to be half disabled to coexist with the architecture is worth less than five rules that can be defended individually.

`react/jsx-no-bind` was considered as mechanical backing for Rule 2b and also rejected. The inline arrows in `ProductCard` (`onPress={() => onPress(id)}`) are created inside the memoized row, not inside `renderItem`, so they do not defeat the memo — Rule 2b is about the shape of the prop the *container* passes down. The rule cannot distinguish the two cases and would flag correct code. Rule 2b stays a judgment call.

## Test harness

Jest + `@testing-library/react-native` v13 (matchers are built in — no `jest-native`). `jest.setup.js` binds two native-module mocks; both packages ship their mock as an ES default export, so the factory must unwrap `.default` or every named import silently becomes `undefined` and surfaces as "Element type is invalid" at render.

`transformIgnorePatterns` in `jest.config.js` carries an allowlist of deps that ship untranspiled ESM: async-storage v3, the navigation packages, styled-components, redux-persist, and the RTK dependency chain (`immer`, `react-redux`, `redux`, `reselect`, `redux-thunk`). Adding a runtime dep means checking whether it belongs here.

`__tests__/harness.smoke.test.tsx` is the harness's own self-test — it renders through styled-components, asserts both mocks bind, and builds a persisted store. It exists so a transform gap fails there instead of inside the first real feature test.

When `store.ts` gets test coverage, its persist config needs `timeout: 0` under test, otherwise redux-persist's 5s rehydrate `setTimeout` stays pending and jest hangs with an open handle.


## Working style

Build bottom-up so imports resolve as they're written: types → api → slices → store/hooks → selectors → App → components → screens. Run `npx tsc --noEmit` after each group.

Give complete, runnable files rather than fragments or descriptions of edits. When a change spans folders, produce every affected file.

Keep corrections proportionate. A misplaced `useSelector` is a one-file fix — don't rewrite adjacent code that already conforms.

If I ask for something that breaks a rule above, say which rule and what it costs, offer the conforming alternative, then follow my decision.

## Writeup obligation

The exam requires showing prompts used, why, an analysis of what was generated, and manual corrections. When you fix a violation, state in one line what was wrong and why it mattered — those notes become the analysis section. A correction made silently can't be shown as evidence of judgment.

Deliberate omissions to record as considered tradeoffs, not gaps: no runtime schema validation (stable public API), no image caching library (20 static images), no `eslint-config-airbnb` (conflicts with Rule 5 — see Code quality), no `lint-staged` (the pre-commit gate checks the working tree; the index gap is accepted for a single author — see Commit gate).
