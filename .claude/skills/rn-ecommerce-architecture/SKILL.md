---
name: rn-ecommerce-architecture
description: Mandatory architecture and file-convention enforcement for the React Native mini e-commerce technical exam project (Fake Store API, Redux Toolkit, styled-components, Container/Presentational split). ALWAYS use this skill whenever writing, scaffolding, reviewing, refactoring, or debugging ANY file in this project — components, screens, containers, slices, selectors, API clients, types, styles, navigation, or store setup. Trigger even when the user only asks for a small snippet, a single component, a bug fix, or "just make it work", and even when they do not mention architecture, folder structure, Redux, or conventions. Also trigger when reviewing AI-generated code for this project, since generated code routinely violates these conventions. Do not fall back on generic React Native defaults (StyleSheet.create, inline fetch in components, useState for shared state, one-file components) when this skill is available.
---

# React Native e-commerce — architecture enforcement

This project is a technical exam submission. It is graded on *technical judgment and validation of generated code*, not just on whether the app runs. Architectural consistency is therefore part of the deliverable, and drift is a scored defect rather than a style nitpick.

Your job when this skill is active has two halves:

1. **Write new code that already conforms.** Never produce a first draft that violates the rules and then fix it — generate it correct.
2. **Police existing code.** Whenever you read, edit, or are shown a file in this project, check it against the rules below. If it deviates, say so and repair it in the same response. Do not silently pass over a violation because the user asked about something else.

## The stack (non-negotiable)

- React Native + TypeScript
- Redux Toolkit (`configureStore`, `createSlice`, `createAsyncThunk`) — thunks are the async middleware
- `react-redux` with typed hooks
- `styled-components/native` for all styling
- `@react-navigation/native-stack` for navigation
- `redux-persist` + `@react-native-async-storage/async-storage`, cart reducer only

Do not introduce Zustand, MobX, Context-as-state-store, RTK Query, `StyleSheet.create`, NativeWind, or any other alternative. If one appears in code you are handed, flag it and convert it.

## Folder layout

```
src/
  app/store.ts
  theme/
    theme.ts
    theme.type.ts
    styled.d.ts
    index.ts
  api/
    fakeStoreApi.ts
    fakeStoreApi.type.ts
  features/
    products/{productsSlice.ts, selectors.ts}
    cart/{cartSlice.ts, selectors.ts}
  components/<Name>/
    <Name>.component.tsx
    <Name>.style.ts
    <Name>.type.ts
    index.ts
  screens/<Name>/
    <Name>.container.tsx
    <Name>.component.tsx
    <Name>.style.ts
    <Name>.type.ts
    index.ts
```

`theme/` holds the design tokens every `*.style.ts` reads from.
`components/` holds presentational leaves: `ProductCard`, `CartItem`, `QuantityStepper`, `Loader`, `ErrorView`.
`screens/` holds `ProductList`, `ProductDetail`, `Cart`.

## The rules

### R1 — Layer purity

Files under `components/` and `features/` must never import `react-redux`, `@react-navigation/*`, or `../../app/store`. A presentational component receives everything through props; a slice or selector knows nothing about the view.

This is what makes the presentational layer testable and previewable without a `<Provider>`, and it is the single most valuable thing to be able to point at in the writeup.

### R2 — Containers are the only connected layer

`useSelector`, `useDispatch`, `useNavigation`, and `useRoute` appear only in `*.container.tsx`. A container maps state to props and dispatch to callbacks, then renders its `*.component.tsx`. It contains no JSX layout of its own beyond that single element.

One exception: `src/navigation/RootNavigator.tsx` reads the store, because navigation chrome (the header `ThemeToggle`) has no screen container to live in. It is the only non-`*.container.tsx` file allowed to.

Only screens get containers. `ProductCard`, `CartItem`, `QuantityStepper`, `Loader`, `ErrorView` and `ThemeToggle` never get one — a container around a leaf that only forwards props is indirection with no payoff, and per-row Redux subscriptions cause needless re-renders.

**List rows are memoized, and their callbacks take an id.** `ProductCard` and `CartItem` are wrapped in `React.memo`. That only pays off if the screen hands them stable props, so their callbacks are typed `(id: number) => void` rather than pre-bound `() => void`. A pre-bound callback forces `renderItem` to build a fresh closure per row on every render, and the memo stops mattering; the id-taking shape lets the container hold one `useCallback` and share it across every row. Leaf children of a memoized row (`QuantityStepper` inside `CartItem`) are not memoized — binding the id there costs nothing because the parent already gates the re-render.

`__tests__/components/memoization.test.tsx` holds the evidence: identical props do not re-render, a changed quantity does, and a fresh callback identity does. It fails if the `React.memo` wrapper is removed.

### R3 — Derived state lives in selectors

Cart totals, filtered lists, search results, and product-by-id lookups belong in `features/*/selectors.ts` using `createSelector`. Never compute them inline in a container, a component, or a `useMemo` in the view layer. Business logic that lives in a component can only be tested through a component tree.

### R4 — Extensions

`.tsx` for anything returning JSX (`*.component.tsx`, `*.container.tsx`). `.ts` for `*.style.ts`, `*.type.ts`, slices, selectors, and the API client. A `*.component.ts` is always wrong.

### R5 — index.ts is the only public entrance

Every component and screen folder exports through `index.ts`. Imports from outside the folder use the folder path (`from '../../components/ProductCard'`), never the inner file. Screens export their container as the folder's default surface, so the navigator never learns the split exists.

### R6 — Styling

Every styled component lives in `*.style.ts` and is imported by the `.component.tsx`. No `StyleSheet.create`, no inline `style={{ }}` objects for anything beyond a genuinely dynamic one-off value, no styled definitions inside the component file.

### R7 — Types split by role

- `api/fakeStoreApi.type.ts` holds `ProductDTO` (raw wire shape) and `Product` (domain shape).
- `*.type.ts` in a component folder holds props only: resolved primitives and callbacks.

Props interfaces must not reference `ProductDTO`, `RootState`, `AppDispatch`, or thunk types. A component takes `title`, `price`, `imageUrl` — not a whole `Product`, and never a raw DTO. The API returns `image`; the mapper in `fakeStoreApi.ts` renames it to `imageUrl` so the view layer never depends on vendor naming.

### R8 — Fetching and caching

All network access goes through `api/fakeStoreApi.ts`. No `fetch` or `axios` call in a component, container, or slice reducer.

Products are fetched once. The thunk is dispatched from a container's `useEffect` guarded on status:

```ts
useEffect(() => {
  if (status === 'idle') dispatch(fetchProducts());
}, [status, dispatch]);
```

`GET /products` already returns `description`, so `ProductDetail` selects from the cached array by id and must not issue its own request. Category filter and search operate as memoized selectors over the cached list — never as `/products/category/:cat` calls or refetches. Avoiding unnecessary API calls is an explicit exam requirement, so any code path that refetches is a graded defect.

### R9 — Status and errors

`productsSlice` carries `status: 'idle' | 'loading' | 'succeeded' | 'failed'` and `error: string | null`, set in the thunk's `pending`/`fulfilled`/`rejected` cases. The component branches on status to render `Loader`, `ErrorView`, or the list. `ErrorView` takes an `onRetry` callback; the container wires it to re-dispatch the same thunk. Never swallow an error into an empty list.

### R10 — Lists

Use `FlatList` with `keyExtractor={item => String(item.id)}`. Never `ScrollView` + `.map`. Row press and add-to-cart handlers are passed down from the screen container as props.

### R11 — Persistence

The cart reducer and the theme preference (`features/theme`) are wrapped in `persistReducer`; products are refetched on cold start. `PersistGate` wraps the app inside `<Provider>`.

### R12 — Theme tokens

`src/theme/` is the single source of design values: `colors`, `spacing`, `radius`, `fontSize`, `fontWeight`, `text`, `shadow`, `size`. `App.tsx` mounts `<ThemeProvider theme={theme}>` inside `PersistGate` and outside `NavigationContainer`.

No literal colors, spacing, radii, or font sizes in `*.style.ts` — read them off `props.theme`. Layout-intrinsic literals (`width: 100%`, a fixed image height, a `1px` hairline border) are fine; a hex color or a `12px` padding is not.

Two mechanics that bite:

- `theme/styled.d.ts` must augment `styled-components/native`, **not** `styled-components`. v6 declares `DefaultTheme` once and re-exports it per entry point, so augmenting the root entry leaves the native one empty and every token access silently becomes `any` instead of erroring.
- Spacing and radius tokens are numbers. Styles add the unit at the interpolation site: `${({theme}) => theme.spacing.md}px`. In tests, remember styled-components expands shorthand `padding` into the four longhand properties.

### R12a — Extending the theme is the only escape hatch

R12 is easy to satisfy while a token exists and easy to abandon the moment one
does not. When a style needs a value the theme has no token for — a shadow
colour, a letter spacing, an opacity — the answer is never a literal in the
`*.style.ts`. Add the token to `theme.ts` **and** its type to `theme.type.ts`,
export it from `index.ts` if it introduces a new group, then read it off
`props.theme`.

This is the rule that actually gets broken, because inlining `#00000014` passes
every mechanical check in the project: ESLint sees a legal string and `tsc`
sees a valid style. Nothing but this rule stops the design system leaking one
value at a time.

The exception stays what R12 already says: layout-intrinsic values
(`flex: 1`, `width: 100%`, a `1px` hairline, a fixed image aspect ratio) are
not design decisions and do not become tokens.

Two palettes, one theme shape. `lightTheme` and `darkTheme` share every
non-colour token through a common base and differ only in `scheme` and
`colors`; `getTheme(useColorScheme())` picks one in `App.tsx`, and
`toNavigationTheme` maps it onto react-navigation's own theme so the header
follows. A `*.style.ts` never knows which scheme is active — it reads
`theme.colors.surface`, not a hex, and that is the entire dark-mode contract.

### R12b — Text uses variants, not loose size/weight pairs

`theme.text` holds role-named `{size, weight}` pairs — `heading`, `title`,
`body`, `caption`, `price`. A styled `Text` reads a variant, not two
independent scales:

```ts
export const Price = styled.Text`
  font-size: ${({theme}) => theme.text.price.size}px;
  font-weight: ${({theme}) => theme.text.price.weight};
  color: ${({theme}) => theme.colors.text};
`;
```

`theme.fontSize` and `theme.fontWeight` remain the underlying scales and stay
available, but reaching for them directly in a component style is the thing to
avoid: it is how the same price ends up `medium` in `ProductCard` and `bold` in
`ProductDetail` with nothing in the codebase declaring which is right.

Colour is not part of a variant, deliberately — size and weight are fixed by
the role, colour changes with context (`text`, `textMuted`, `onPrimary`,
`danger`), so each style sets it separately.

### R12c — Elevation comes from `theme.shadow`

Two levels: `card` (a surface resting in a list) and `raised` (a surface above
the page, e.g. the cart summary bar). React Native has no single shadow
property — iOS reads the `shadow-*` family, Android reads `elevation`, and a
card that sets only one is flat on the other platform. Set all of them:

```ts
export const Card = styled.View`
  background-color: ${({theme}) => theme.colors.surface};
  border-radius: ${({theme}) => theme.radius.md}px;
  shadow-color: ${({theme}) => theme.shadow.card.color};
  shadow-offset: ${({theme}) => theme.shadow.card.offsetX}px
    ${({theme}) => theme.shadow.card.offsetY}px;
  shadow-opacity: ${({theme}) => theme.shadow.card.opacity};
  shadow-radius: ${({theme}) => theme.shadow.card.radius}px;
  elevation: ${({theme}) => theme.shadow.card.elevation};
`;
```

Five interpolations for one shadow is verbose, and that is the accepted cost of
keeping the token in `theme/` as data. The alternative — exporting a prebuilt
`css` fragment from the theme — would put styling in a non-`*.style.ts` file
and break R6, to save four lines in two components.

### R13 — Interaction and state coverage

R1–R12 keep the code well-shaped; R13 covers the handful of things that make a
well-shaped screen still read as broken on a device. These are the ones a
reviewer notices in ten seconds, and generated React Native gets them wrong by
default.

**1. Every pressable is hittable and named.** Minimum 44pt of touch target —
either the box itself is `theme.size.touchTarget`, or a deliberately smaller
box extends itself with `theme.size.hitSlop`. `hitSlop` is a prop, not a CSS
property, so it belongs in the `*.style.ts` via `.attrs` rather than in the
component (R6):

```ts
export const StepButton = styled.Pressable.attrs(({theme}) => ({
  hitSlop: theme.size.hitSlop,
}))`
  width: 32px;
  height: 32px;
`;
```

Every pressable also carries `accessibilityRole="button"` and an
`accessibilityLabel`. A control whose only content is a glyph (`+`, `−`, `×`)
is unusable without one — the label is the only thing a screen reader has.

**2. Four states, not three.** Loading, error, **empty**, content. R9 covers
the first two; empty is the one that gets skipped, and it renders as a blank
screen the reviewer cannot distinguish from a bug. Every `FlatList` passes
`ListEmptyComponent`. The two cases here are an empty cart and a search or
category filter that matches nothing — and they need different copy, because
"your cart is empty" and "no products match" call for different actions.

**3. Disabled controls look disabled and do not fire.** Pass the `disabled`
prop *and* style it from `theme.colors.disabled` / `theme.colors.onDisabled`.
A control that dims but still dispatches, or that blocks but looks live, both
read as broken. The cases are the decrement step at quantity 1 and checkout
with an empty cart.

**4. Remote images get fixed dimensions.** A remote `<Image>` with no height is
zero-tall until the bytes land and then shoves the row open. Set explicit
dimensions (or an `aspect-ratio`), a `resizeMode`, and a
`background-color: ${({theme}) => theme.colors.border}` placeholder so the slot
is visible while it loads. Layout-intrinsic, so the dimensions stay literals
under R12 — the placeholder colour does not.

**5. Text input is configured for the job.** The search field sets
`autoCorrect={false}`, `autoCapitalize="none"`, `returnKeyType="search"`, and
`clearButtonMode="while-editing"` on iOS. The list beneath it sets
`keyboardShouldPersistTaps="handled"` — without it the first tap after typing
is swallowed dismissing the keyboard, so the user has to tap every product
twice. This one is invisible in a simulator click-through and obvious on a
phone.

**6. Money is formatted in one place.** `formatPrice` lives in
`src/utils/format.ts` behind `src/utils/index.ts` (R5) and every price reads
through it. `` `$${price.toFixed(2)}` `` inlined in a component is the same
class of mistake as a hex literal in a style: it is four copies of a
presentation decision with nothing declaring which is right, and it is what
makes a currency or locale change a hunt instead of an edit.

What R13 deliberately does not cover: animation, gestures, and anything
resembling a component library. Dark mode is covered by R12 rather than here:
it is a second `colors` group behind the same roles, resolved from the OS scheme
in `App.tsx`, and a style that names a role instead of a palette is already
dark-safe. None are exam requirements, and each
would compete for time with the features that are.

## Enforcement protocol

When you touch any file in this project:

1. Check it against R1–R13.
2. If it conforms, proceed with the user's actual request without commentary about the rules. Do not narrate compliance.
3. If it deviates, name the rule, explain in one line what breaks as a result, and supply the corrected file — the whole file, cleaned up and runnable, not a description of the change. If the fix spans folders (e.g. extracting styles into a new `.style.ts`), produce every affected file.
4. If the user explicitly asks for something that violates a rule, say plainly which rule it breaks and what it costs, offer the conforming alternative, and then follow their decision. They own the codebase; your job is that the tradeoff is visible, not to refuse.

Keep the correction proportionate. A misplaced `useSelector` is one file. Do not turn a small fix into an unrequested rewrite of adjacent code that already conforms.

## Common violations to watch for

Generated code fails these repeatedly. Check them first.

| Symptom | Rule | Fix |
|---|---|---|
| `useSelector` in `ProductCard` or `CartItem` | R2 | Lift to the screen container, pass props and callbacks down |
| `StyleSheet.create` at the bottom of a component | R6 | Extract to `*.style.ts` as styled-components |
| `fetch` inside a `useEffect` in a screen | R8 | Move to `api/`, dispatch the thunk |
| `ProductDetail` fetching `/products/:id` | R8 | Select from the cached array by route param id |
| Search or category filter triggering a refetch | R8 | Memoized selector over cached list |
| `const total = items.reduce(...)` in the Cart component | R3 | `createSelector` in `features/cart/selectors.ts` |
| Props typed as `product: Product` | R7 | Destructure into primitive props |
| `image` used directly in the view | R7 | Map to `imageUrl` in the API mapper |
| Hex colors or `12px` literals in a `*.style.ts` | R12 | Read the token off `props.theme` |
| `theme.spacing` typed as `any` / no autocomplete | R12 | `styled.d.ts` augments the wrong entry point — target `styled-components/native` |
| Everything in one `ProductList.tsx` | R4, R5 | Split into the four/five-file folder shape |
| Import from `'./ProductCard.component'` outside the folder | R5 | Import from the folder path |
| `ScrollView` + `.map` over products | R10 | `FlatList` with `keyExtractor` |
| Products included in the persist whitelist | R11 | Persist cart only |
| A 32×32 tap target, or a small `Pressable` with no `hitSlop` | R13 | Size to `theme.size.touchTarget`, or `.attrs` the slop in the `*.style.ts` |
| Glyph-only control (`+`, `−`, `×`) with no `accessibilityLabel` | R13 | Label it — the glyph is not readable |
| `FlatList` with no `ListEmptyComponent` | R13 | Empty is the fourth state, not a blank screen |
| A button that dims but still dispatches, or blocks but looks live | R13 | `disabled` prop *and* `theme.colors.disabled` |
| `price.toFixed(2)` inside a component | R13 | `formatPrice` from `src/utils` |
| Search input above a list with no `keyboardShouldPersistTaps` | R13 | `"handled"` — otherwise the first tap only dismisses the keyboard |
| Remote `<Image>` with no fixed height | R13 | Dimensions + `resizeMode` + placeholder background |
| Plain `createStore` + manual `redux-thunk` wiring | Stack | `configureStore` — thunk middleware is included by default |

## Exam writeup obligations

This exam requires showing the prompts used, why, an analysis of the generated output, and manual corrections. When you fix a violation, keep a one-line note of what was wrong and why it mattered — those notes are the raw material for the analysis section, and a correction that was made silently cannot be shown as evidence of judgment.

When a defensible simplification is made (no runtime schema validation for a stable public API, no image caching library for twenty static images), note it as a considered tradeoff rather than an omission.

See `references/templates.md` for canonical file templates to copy when scaffolding a new component, screen, slice, or selector.
