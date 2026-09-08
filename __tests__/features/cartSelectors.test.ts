import {
  selectCartLines,
  selectTotalItems,
  selectTotalPrice,
} from '../../src/features/cart/selectors';
import type {RootState} from '../../src/app/store';
import type {Product} from '../../src/api/fakeStoreApi.type';

const product = (id: number, price: number, title: string): Product => ({
  id,
  title,
  price,
  description: 'desc',
  category: 'misc',
  imageUrl: `https://example.test/${id}.jpg`,
});

const backpack = product(1, 10.5, 'Backpack');
const laptop = product(2, 100, 'Laptop');

const state = (
  quantities: Record<number, number>,
  items: Product[] = [backpack, laptop],
): RootState =>
  ({
    products: {
      items,
      status: 'succeeded',
      error: null,
      selectedCategory: null,
      searchTerm: '',
    },
    cart: {quantities},
  } as RootState);

describe('cart selectors', () => {
  it('builds a line per product in the cart, with a line total', () => {
    expect(selectCartLines(state({1: 2}))).toEqual([
      {
        id: 1,
        title: 'Backpack',
        price: 10.5,
        imageUrl: 'https://example.test/1.jpg',
        quantity: 2,
        lineTotal: 21,
      },
    ]);
  });

  it('returns no lines for an empty cart', () => {
    expect(selectCartLines(state({}))).toEqual([]);
  });

  it('sums quantities and prices across lines', () => {
    const current = state({1: 2, 2: 1});

    expect(selectTotalItems(current)).toBe(3);
    expect(selectTotalPrice(current)).toBe(121);
  });

  it('reports an empty cart as zero, not NaN', () => {
    expect(selectTotalItems(state({}))).toBe(0);
    expect(selectTotalPrice(state({}))).toBe(0);
  });

  /**
   * The cold-start case. redux-persist rehydrates the cart before the products
   * fetch resolves, so for a moment quantities reference ids the catalogue has
   * not loaded. The badge must already be right; the rows may not be.
   */
  describe('rehydrated cart with no catalogue yet', () => {
    it('counts persisted quantities before products load', () => {
      expect(selectTotalItems(state({1: 2}, []))).toBe(2);
    });

    it('renders no lines and a zero price until products arrive', () => {
      expect(selectCartLines(state({1: 2}, []))).toEqual([]);
      expect(selectTotalPrice(state({1: 2}, []))).toBe(0);
    });
  });

  // Keys come back from storage as strings after the JSON round-trip. Numeric
  // property access coerces, so lines still resolve — pinned because the cart
  // is the one slice that survives a cold start.
  it('resolves lines from a JSON-round-tripped quantities map', () => {
    const rehydrated = JSON.parse(JSON.stringify({1: 2})) as Record<
      number,
      number
    >;

    expect(selectCartLines(state(rehydrated))).toHaveLength(1);
    expect(selectTotalItems(state(rehydrated))).toBe(2);
  });
});
