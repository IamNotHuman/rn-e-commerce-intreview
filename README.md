# RnEcommerce

A mini e-commerce module in React Native 0.81 against the public [Fake Store API](https://fakestoreapi.com), built as a technical exam whose stated grading criterion is **technical judgment and validation of generated code** — not just whether the app runs. The correction trail is therefore a first-class deliverable; see [Working with AI](#working-with-ai-the-correction-trail) below.

**Features:** product list with search and category filter · product detail · cart with quantity stepper, remove, item count and total · simulated checkout (summary → confirm → cleared) · cart persisted across launches · loader, error + retry, empty states · light and dark theme — follows the OS, with a header toggle whose choice persists.

## Stack

TypeScript · Redux Toolkit (`createSlice` / `createAsyncThunk`) · react-redux · styled-components/native · @react-navigation/native-stack · redux-persist + AsyncStorage · Jest + @testing-library/react-native.

Deliberately **not** used: RTK Query, Zustand/MobX, `StyleSheet.create`, NativeWind, runtime schema validation (stable public API), an image-caching library (20 static images).

## Architecture in one paragraph

`GET /products` already returns every field including `description`, and there are ~20 items — so the catalogue is fetched **exactly once** into Redux, and everything else is a memoized selector over that cache: detail by id, category filter, search. Nothing ever calls `/products/:id` or `/products/category/:name`; a code path that refetches is treated as a defect, and a repo-wide test enforces it. Screens are split into a `*.container.tsx` (the only files allowed to touch `react-redux` or navigation) and a presentational `*.component.tsx` that receives resolved primitives and callbacks. List rows are `React.memo`'d with id-taking callbacks so one `useCallback` serves every row. All styling lives in `*.style.ts` reading tokens off a typed theme; the dark palette is a second `colors` group behind the same roles, so no component knows which scheme is active.

```
src/
  api/          fakeStoreApi.ts (the one fetch + DTO→domain mapper), fakeStoreApi.type.ts
  app/          store.ts (cart + theme persistence), hooks.ts
  features/     products/{productsSlice,selectors}.ts, cart/{cartSlice,selectors}.ts, theme/{themeSlice,selectors}.ts
  navigation/   RootNavigator (providers, stack, header toggle), RootStackParamList, react-navigation theme mapping
  theme/        light + dark tokens, DefaultTheme augmentation
  utils/        formatPrice
  components/   ProductCard, CartItem, QuantityStepper, Loader, ErrorView, ThemeToggle
  screens/      ProductList, ProductDetail, Cart   (container + component + style + type + index)
```

The full rule set (R1–R14) and canonical file templates live in `.claude/skills/rn-ecommerce-architecture/`; `CLAUDE.md` is the short form.

## Running it

macOS + Xcode only (the iOS toolchain on this machine is Xcode 26.6 / iOS 26.5; Android is not set up).

```bash
npm install                                   # postinstall applies patches/ and installs the git hook
brew install ruby cliclick                    # Homebrew Ruby for CocoaPods, cliclick for the driver
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

D=.claude/skills/run-rnecommerce/driver.sh
$D doctor        # toolchain, runtime, device, pods, Metro, Accessibility — read this first
$D pods          # bundle install + pod install under Homebrew Ruby
$D up            # boot simulator + Metro + xcodebuild + install + launch + screenshot
$D verify        # drive the whole flow and diff every screen against committed goldens
```

`/run-rnecommerce` is a Claude Code skill: an agent asked to run, screenshot or tap through the app loads it automatically. Its `SKILL.md` carries every toolchain trap hit while getting a first build out of Xcode 26.6 — the `react-native-screens` pin, the `fmt` patch, Ruby 4 and `nkf`, the simulator-runtime download — with the exact fix for each. The human path (`npm start`, `npx react-native run-ios`) works too once `doctor` is green.

## Verification

```bash
npm run check    # tsc --noEmit  +  eslint --max-warnings 0  +  jest --coverage
```

- **173 tests in 26 suites**: slices, selectors (including `createSelector` recomputation counts), every component and screen through RNTL, store persistence, theme, and an `architecture.test.ts` that scans source for `fetch` outside `src/api/` and for any `/products/<sub-path>` request.
- **ESLint architecture zones**: `no-restricted-imports` rules that make layer purity, the container/presentational split, and `index.ts`-only imports lint errors, each message naming the rule it enforces.
- **Pre-commit hook** (`.githooks/pre-commit`, installed by `npm install`) runs `npm run check` on any commit touching code.
- **On-device**: `driver.sh verify` builds, installs, taps through add-to-cart → cart → checkout → confirm → done → dark mode → detail, and pixel-diffs each of eight screenshots against `goldens/`.
- **Review agent**: `.claude/agents/architecture-reviewer` covers the judgment rules the linter cannot (derived state in selectors, primitive props, the no-refetch criterion) on a staged diff.

## Working with AI: the correction trail

The exam permits AI and asks for the prompts, why they were chosen, an analysis of the output, and the manual corrections. The approach was to make the *rules* explicit before generating any code (`CLAUDE.md` + the architecture skill), then to build bottom-up (types → api → slices → store → selectors → App → components → screens) with a mechanical gate after every group, so each violation surfaced as a failing check rather than a silent drift. The corrections below are the ones that mattered; each is recorded in the file it changed.

**Generated code that was wrong and why**

- The canonical template's `selectProductById(id)` returned a *new* `createSelector` per call — memoization in name only. Replaced with a memoized id→product map plus `selectProductById(state, id)`.
- The template's list rows took pre-bound `() => void` callbacks, which forces `renderItem` to build a closure per row per render and defeats `React.memo`. Callbacks now take the id; the container shares one `useCallback`. Pinned by a render-count test that fails if the memo is removed.
- Template selectors imported `RootState` as a value from `app/store`, which Rule 1 bans. Rather than pick a side, the lint rule was switched to `@typescript-eslint/no-restricted-imports` with `allowTypeImports`, so a type-only import is legal and a value import still fails.
- The `Loader` carried `accessibilityRole="progressbar"` on a `View` that was not `accessible` — a screen-reader gap no visual check finds. Caught by `getByRole` failing.
- A first draft of the checkout returned early on an empty cart; R13 requires empty to be a list state with the totals visible and Checkout disabled *and* styled from `colors.disabled`.
- `styled.d.ts` originally augmented `styled-components` instead of `styled-components/native` — silently typed every token as `any`. Caught by probing with a bogus token.

**Test and harness code that was wrong and why** — the more interesting class, because these would have passed while proving nothing

- Selector memoization tests used `clearCache()` between cases; it clears only the arguments memoize, so `recomputations()` reported 0 and every "does not recompute" assertion passed vacuously. Fixed by re-requiring the selectors per test, then verified by planting a spread in an input selector and watching the memoization tests fail while the functional ones stayed green.
- The `/products/` refetch guard flagged legitimate module paths (`features/products/…`) twice, first single-line then multi-line imports. Import lines are now stripped before the URL scan; the guard was re-verified against a planted `fetch(\`…/products/${id}\`)`.
- The device driver's taps were mapped onto the Simulator window with a guessed title-bar height; System Events exposes the real device frame (`AXGroup` under a 52 pt toolbar). Then taps still failed intermittently: AppleScript's `click at` has no press duration and React Native's `Pressable` drops it — add-to-cart never registered while navigation sometimes did. A held press via `cliclick` fixed it outright.
- The first set of screenshot goldens matched at 0.000 % and were wrong — the run is deterministic, so a mis-landed tap reproduces itself. Goldens are eyeballed before capture; that is now a written rule.

**Toolchain corrections** (none of them project code, all recorded in `CLAUDE.md`)

- `react-native-screens` pinned exact at 4.24.0: 4.25+ targets RN 0.82 and its codegen specs break both Metro and `pod install` on 0.81, while `tsc` and jest pass — only a real build reveals it.
- RN 0.81's vendored `fmt` 11.0.2 does not compile under Xcode 26.6; every 0.81.x ships the same podspec, so it is patched to 12.1.0 (what RN 0.83 did) via `patch-package`. Two alternative fixes were tried and ruled out for stated reasons.
- CocoaPods under Homebrew Ruby 4 with `nkf` added to the Gemfile; `DEVELOPER_DIR` in place of `sudo xcode-select`; the 8.5 GB simulator runtime downloaded from exactly one place.

**Deliberate omissions, as considered tradeoffs:** no runtime schema validation (stable public API), no image-caching library (20 static images), no `rating` field mapped (nothing in the brief renders it), no Android setup on this machine.
