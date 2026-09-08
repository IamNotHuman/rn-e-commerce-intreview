# Project context — RN mini e-commerce technical exam

Paste this into Claude Code (or keep it at the repo root) before running any build prompts. It covers what the exam asks for, what was already decided and why, and what has already been done.

---

## 1. The exam

Build a mini e-commerce module in React Native against the public Fake Store API (`https://fakestoreapi.com`).

**AI use is explicitly permitted**, but the submission must include:
- the prompts used
- why each prompt was chosen
- an analysis of the generated result
- any manual corrections made

The stated grading criterion is **technical judgment and validation of generated code** — not merely whether the app runs. This is the single most important framing decision: a working app with unexamined generated code scores worse than a working app with a documented correction trail.

### Required features

**Product list** — image, title, price, category per item. Actions: view detail, add to cart.

**Detail screen** — image, title, price, category, description. Actions: add to cart, back to list.

**Cart** — increase quantity, decrease quantity, remove item. Displays total item count and total price.

**Checkout (simulated)** — button that shows a cart summary, simulates confirming the purchase, and clears the cart afterward. No real payment integration.

### Technical requirements

- **Loader** while API data is being fetched
- **Error handling** — show a message on API failure, allow retry
- **Optimization** — avoid unnecessary API calls. Explicitly named as valid: correct `useEffect` handling, caching in state, avoiding needless refetch

### Bonus (optional)

- Category filter
- Search by name
- Cart persistence (AsyncStorage)

---

## 2. API shape

`GET https://fakestoreapi.com/products` returns an array of:

```json
{
  "id": 1,
  "title": "...",
  "price": 109.95,
  "description": "...",
  "category": "men's clothing",
  "image": "https://..."
}
```

~20 items total.

**Key consequence:** the list endpoint already returns `description`. The detail screen must therefore select from the cached array by id and must **not** call `GET /products/:id`. Same for category filter and search — memoized selectors over the cached list, never `/products/category/:cat` and never a refetch. This is the main thing the "avoid unnecessary API calls" requirement is testing.

Other endpoints exist (`/products/categories`, `/products/category/:name`) but are deliberately unused.

---

## 3. Stack decisions and rationale

Each of these was a deliberate choice. The reasoning matters more than the choice for the writeup.

| Decision | Rationale |
|---|---|
| Redux Toolkit + `createAsyncThunk` | The target codebase uses Flux/Redux with thunk middleware. RTK *is* thunk — the middleware ships enabled by default — so this demonstrates the same async pattern without the hand-rolled boilerplate (manual action types, switch reducers, immutability bugs). Worth stating in the writeup as a considered modernization, not a deviation. |
| Redux over Context | Cart mutations (qty +/-, remove, totals) are pure reducer logic. The slice `status` field is also what satisfies the caching requirement for free. |
| `styled-components/native` | Keeps all styling out of component files, which is what makes the presentational layer cleanly separable. |
| Container/Presentational split | Presentational files never import `react-redux` or navigation, so they can be tested or previewed without a `<Provider>`. This is the most visible evidence of separation of concerns for a reviewer. |
| DTO → domain mapper at the API boundary | The API returns `image`; it is mapped to `imageUrl` in `fakeStoreApi.ts` so the view layer never depends on vendor field naming. |
| `redux-persist`, cart reducer only | Products should refetch on cold start; only the cart is worth persisting. |
| No runtime schema validation (zod) | Deliberate: stable, unauthenticated public API with a fixed shape. `res.ok` + the mapper is proportional. Note it as a considered tradeoff in the writeup, don't silently omit it. |
| No image caching library | Deliberate: 20 static demo images. Plain `<Image>` is proportional. Same — note it. |

---

## 4. Architecture

```
src/
  app/
    store.ts              configureStore, persist wiring, RootState/AppDispatch
    hooks.ts              useAppSelector / useAppDispatch typed wrappers
  api/
    fakeStoreApi.ts       fetch + DTO→domain mapper
    fakeStoreApi.type.ts  ProductDTO, Product, FetchStatus
  features/
    products/
      productsSlice.ts    items, status, error, selectedCategory, searchTerm + fetchProducts thunk
      selectors.ts        selectVisibleProducts, selectCategories, selectProductById
    cart/
      cartSlice.ts        quantities: Record<number, number>
      selectors.ts        selectCartLines, selectTotalItems, selectTotalPrice
  components/<Name>/      presentational only — never import redux or navigation
    <Name>.component.tsx
    <Name>.style.ts
    <Name>.type.ts
    index.ts
  screens/<Name>/         container + component
    <Name>.container.tsx  the ONLY place useSelector/useDispatch/useNavigation appear
    <Name>.component.tsx
    <Name>.style.ts
    <Name>.type.ts
    index.ts
```

`components/`: `ProductCard`, `CartItem`, `QuantityStepper`, `Loader`, `ErrorView`
`screens/`: `ProductList`, `ProductDetail`, `Cart`

### Rules (enforced by the installed skill)

1. `components/` and `features/` never import `react-redux`, `@react-navigation/*`, or `app/store`
2. `useSelector`/`useDispatch`/`useNavigation` only in `*.container.tsx`; only screens get containers
3. Derived state (totals, filters, by-id lookup) lives in `features/*/selectors.ts` via `createSelector` — never inline in a component
4. `.tsx` for JSX files, `.ts` for style/type/slice/selector files
5. `index.ts` is the only public entrance to a folder; import folder paths, never inner files
6. All styling in `*.style.ts`; no `StyleSheet.create`, no inline style objects
7. Component prop types are resolved primitives and callbacks — never `Product`, `ProductDTO`, or `RootState`
8. All network access via `api/`; products fetched once, guarded by `if (status === 'idle')`
9. `status: 'idle' | 'loading' | 'succeeded' | 'failed'` + `error: string | null`; `ErrorView` takes `onRetry`
10. `FlatList` with `keyExtractor`, never `ScrollView` + `.map`
11. Persist cart only

The skill at `.claude/skills/rn-ecommerce-architecture/` contains these rules plus `references/templates.md` with canonical file templates for every file type. It should auto-trigger on coding prompts in this repo.

### Cart state shape

`quantities: Record<number, number>` — ids to counts. Product data is *not* duplicated into the cart; `selectCartLines` joins quantities against `products.items`. Single source of truth for product data.

---

## 5. State already reached

Done:
- `npx @react-native-community/cli@latest init RnEcommerce` (TypeScript is the default template since RN 0.71 — no `--template` flag needed)
- Installed: `@reduxjs/toolkit react-redux styled-components`, `@react-navigation/native @react-navigation/native-stack`, `react-native-screens react-native-safe-area-context`, `redux-persist @react-native-async-storage/async-storage`, `-D @types/styled-components-react-native`
- `pod install`

Not yet done:
- Verifying the blank app boots (`npm start -- --reset-cache`, then `npx react-native run-ios`) — **do this before writing any code**, so a dependency problem doesn't get tangled up with application code
- Stripping the RN template demo body out of `App.tsx`
- Any application code

### Build order

Bottom-up, so every import resolves when written. Run `npx tsc --noEmit` after each group.

1. `api/fakeStoreApi.type.ts`
2. `api/fakeStoreApi.ts`
3. `features/products/productsSlice.ts`, `features/cart/cartSlice.ts`
4. `app/store.ts`, `app/hooks.ts`
5. `features/*/selectors.ts` (needs `RootState`)
6. `App.tsx` — Provider + PersistGate + NavigationContainer, screens stubbed
7. `components/` — `Loader` and `ErrorView` first (smallest)
8. `screens/` — `ProductList`, then `ProductDetail`, then `Cart`

### Known gotchas

- `@types/styled-components-react-native` is required or `styled.View` is untyped and every `.style.ts` goes red
- If navigation crashes on first push, add `enableScreens()` from `react-native-screens` at the top of `App.tsx`
- `redux-persist` needs its internal actions exempted from RTK's `serializableCheck` or every rehydrate logs warnings

---

## 6. Writeup obligations

Keep a running log as you build — this is a graded deliverable, not an afterthought.

For each prompt used, record: the prompt, why it was phrased that way, what came back, and what was wrong with it. **A correction made silently cannot be shown as evidence of judgment.**

Generated code for this task reliably fails in the same ways. Watch for and log these specifically:

| Symptom | Why it's wrong |
|---|---|
| `useSelector` inside `ProductCard`/`CartItem` | Per-row store subscriptions; breaks presentational purity |
| `ProductDetail` calling `/products/:id` | Redundant request — data is already cached |
| Search or category filter triggering a refetch | Same; violates the stated optimization requirement |
| `StyleSheet.create` at the bottom of a component | Wrong styling layer for this project |
| `const total = items.reduce(...)` in the Cart view | Business logic in the view; belongs in a selector |
| Props typed as `product: Product` | Couples the component to the domain model |
| `image` used directly in the view | Bypasses the DTO mapper boundary |
| `ScrollView` + `.map` | Wrong list primitive |
| Plain `createStore` + manual `redux-thunk` | RTK includes thunk by default |

Also document the deliberate omissions (no zod, no image caching library) as considered tradeoffs rather than gaps.
