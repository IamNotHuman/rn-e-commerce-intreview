import {
  selectCategories,
  selectProductById,
  selectProductsError,
  selectProductsStatus,
  selectVisibleProducts,
} from '../../src/features/products/selectors';
import type {RootState} from '../../src/app/store';
import type {Product} from '../../src/api/fakeStoreApi.type';

const product = (over: Partial<Product> & {id: number}): Product => ({
  title: 'Backpack',
  price: 10,
  description: 'desc',
  category: "men's clothing",
  imageUrl: 'https://example.test/1.jpg',
  ...over,
});

const backpack = product({id: 1, title: 'Leather Backpack'});
const laptop = product({id: 2, title: 'Laptop', category: 'electronics'});
const ring = product({id: 3, title: 'Gold Ring', category: 'jewelery'});

const state = (over: {
  items?: Product[];
  selectedCategory?: string | null;
  searchTerm?: string;
  status?: RootState['products']['status'];
  error?: string | null;
}): RootState =>
  ({
    products: {
      items: over.items ?? [backpack, laptop, ring],
      status: over.status ?? 'succeeded',
      error: over.error ?? null,
      selectedCategory: over.selectedCategory ?? null,
      searchTerm: over.searchTerm ?? '',
    },
    cart: {quantities: {}},
  } as RootState);

describe('products selectors', () => {
  it('reads status and error', () => {
    expect(selectProductsStatus(state({status: 'loading'}))).toBe('loading');
    expect(selectProductsError(state({error: 'boom'}))).toBe('boom');
  });

  it('derives the distinct category list in first-seen order', () => {
    expect(selectCategories(state({}))).toEqual([
      "men's clothing",
      'electronics',
      'jewelery',
    ]);
  });

  describe('selectVisibleProducts', () => {
    it('returns everything with no filters', () => {
      expect(selectVisibleProducts(state({}))).toHaveLength(3);
    });

    it('filters by category', () => {
      expect(
        selectVisibleProducts(state({selectedCategory: 'electronics'})),
      ).toEqual([laptop]);
    });

    it('filters by case-insensitive title substring', () => {
      expect(selectVisibleProducts(state({searchTerm: 'BACKpack'}))).toEqual([
        backpack,
      ]);
    });

    it('ignores a whitespace-only search term', () => {
      expect(selectVisibleProducts(state({searchTerm: '   '}))).toHaveLength(3);
    });

    it('applies category and search together', () => {
      expect(
        selectVisibleProducts(
          state({selectedCategory: 'electronics', searchTerm: 'ring'}),
        ),
      ).toEqual([]);
    });
  });

  describe('selectProductById', () => {
    it('finds a cached product without touching the network', () => {
      expect(selectProductById(state({}), 2)).toEqual(laptop);
    });

    it('returns null for an unknown id', () => {
      expect(selectProductById(state({}), 999)).toBeNull();
    });

    it('returns null before the catalogue has loaded', () => {
      expect(selectProductById(state({items: []}), 1)).toBeNull();
    });

    // The reason this is a memoized map rather than a selectProductById(id)
    // factory: a factory builds a fresh createSelector per call, so its cache
    // is discarded before it is ever hit.
    it('reuses one memoized lookup across ids and calls', () => {
      const current = state({});

      expect(selectProductById(current, 1)).toBe(backpack);
      expect(selectProductById(current, 2)).toBe(laptop);
      expect(selectProductById(current, 1)).toBe(backpack);
    });
  });
});
