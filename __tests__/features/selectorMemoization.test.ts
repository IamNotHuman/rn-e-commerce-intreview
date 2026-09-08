import type {RootState} from '../../src/app/store';
import type {Product} from '../../src/api/fakeStoreApi.type';

/**
 * createSelector degrades silently: a selector that rebuilds its result on
 * every call still returns correct values, so the functional tests stay green
 * while every consumer re-renders. These assertions are the only thing that
 * notices.
 *
 * Selectors are re-required per test rather than reset in place. `clearCache()`
 * only clears the arguments memoize — the result function's own cache survives
 * it, so a call after clearCache() returns the stale cached value without ever
 * running the result function. `recomputations()` then reports 0 and every
 * "does not recompute" assertion passes without measuring anything.
 */
type ProductSelectors = typeof import('../../src/features/products/selectors');
type CartSelectors = typeof import('../../src/features/cart/selectors');

const load = (): ProductSelectors & CartSelectors => {
  jest.resetModules();

  return {
    ...(require('../../src/features/products/selectors') as ProductSelectors),
    ...(require('../../src/features/cart/selectors') as CartSelectors),
  };
};

const product = (id: number, category: string, title: string): Product => ({
  id,
  title,
  price: 10,
  description: 'desc',
  category,
  imageUrl: `https://example.test/${id}.jpg`,
});

// Referentially stable across calls to state(); a fresh literal each time would
// look like a real change to the input selectors and mask what is measured.
const ITEMS = [
  product(1, "men's clothing", 'Leather Backpack'),
  product(2, 'electronics', 'Laptop'),
];
const QUANTITIES: Record<number, number> = {1: 2};

const state = (
  over: Partial<{
    items: Product[];
    selectedCategory: string | null;
    searchTerm: string;
    quantities: Record<number, number>;
  }> = {},
): RootState =>
  ({
    products: {
      items: over.items ?? ITEMS,
      status: 'succeeded',
      error: null,
      selectedCategory: over.selectedCategory ?? null,
      searchTerm: over.searchTerm ?? '',
    },
    cart: {quantities: over.quantities ?? QUANTITIES},
  } as RootState);

describe('selectVisibleProducts', () => {
  it('computes once for repeated calls on the same state', () => {
    const {selectVisibleProducts} = load();
    const current = state();

    selectVisibleProducts(current);
    selectVisibleProducts(current);
    selectVisibleProducts(current);

    expect(selectVisibleProducts.recomputations()).toBe(1);
  });

  // Referential stability is the point. A fresh array each call would hand
  // FlatList a new `data` prop on every unrelated render.
  it('returns the identical array reference across calls', () => {
    const {selectVisibleProducts} = load();
    const current = state();

    expect(selectVisibleProducts(current)).toBe(selectVisibleProducts(current));
  });

  it('does not recompute across distinct states with the same inputs', () => {
    const {selectVisibleProducts} = load();

    selectVisibleProducts(state());
    selectVisibleProducts(state());

    expect(selectVisibleProducts.recomputations()).toBe(1);
  });

  it('does not recompute when only the cart changes', () => {
    const {selectVisibleProducts} = load();

    selectVisibleProducts(state({quantities: {1: 1}}));
    selectVisibleProducts(state({quantities: {1: 9}}));

    expect(selectVisibleProducts.recomputations()).toBe(1);
  });

  it('recomputes when the search term changes', () => {
    const {selectVisibleProducts} = load();

    selectVisibleProducts(state());
    selectVisibleProducts(state({searchTerm: 'laptop'}));

    expect(selectVisibleProducts.recomputations()).toBe(2);
  });

  it('recomputes when the category changes', () => {
    const {selectVisibleProducts} = load();

    selectVisibleProducts(state());
    selectVisibleProducts(state({selectedCategory: 'electronics'}));

    expect(selectVisibleProducts.recomputations()).toBe(2);
  });
});

describe('selectCategories', () => {
  it('does not recompute while the catalogue is unchanged', () => {
    const {selectCategories} = load();

    selectCategories(state({searchTerm: 'anything'}));
    selectCategories(state({selectedCategory: 'electronics'}));

    expect(selectCategories.recomputations()).toBe(1);
  });
});

describe('selectCartLines', () => {
  it('does not recompute when an unrelated products field changes', () => {
    const {selectCartLines} = load();

    selectCartLines(state({searchTerm: ''}));
    selectCartLines(state({searchTerm: 'laptop'}));

    expect(selectCartLines.recomputations()).toBe(1);
  });

  it('recomputes when a quantity changes', () => {
    const {selectCartLines} = load();

    selectCartLines(state({quantities: {1: 2}}));
    selectCartLines(state({quantities: {1: 3}}));

    expect(selectCartLines.recomputations()).toBe(2);
  });

  it('returns the identical array reference across calls', () => {
    const {selectCartLines} = load();
    const current = state();

    expect(selectCartLines(current)).toBe(selectCartLines(current));
  });
});

describe('selectTotalPrice', () => {
  // Composed on top of selectCartLines: if that upstream selector loses its
  // memoization this one recomputes too, so it doubles as an early warning.
  it('does not recompute while its upstream lines are stable', () => {
    const {selectTotalPrice} = load();

    selectTotalPrice(state({searchTerm: ''}));
    selectTotalPrice(state({searchTerm: 'laptop'}));

    expect(selectTotalPrice.recomputations()).toBe(1);
  });
});
