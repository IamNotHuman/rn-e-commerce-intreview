import {configureStore} from '@reduxjs/toolkit';
import reducer, {
  fetchProducts,
  setCategory,
  setSearchTerm,
} from '../../src/features/products/productsSlice';
import type {ProductsState} from '../../src/features/products/productsSlice';
import type {Product} from '../../src/api/fakeStoreApi.type';

const product: Product = {
  id: 1,
  title: 'Backpack',
  price: 109.95,
  description: 'Fits 15 inch laptops',
  category: "men's clothing",
  imageUrl: 'https://fakestoreapi.com/img/backpack.jpg',
};

const initial = (): ProductsState =>
  reducer(undefined, {type: '@@INIT'} as never);

describe('productsSlice', () => {
  it('starts idle with nothing loaded and no filters applied', () => {
    expect(initial()).toEqual({
      items: [],
      status: 'idle',
      error: null,
      selectedCategory: null,
      searchTerm: '',
    });
  });

  describe('fetchProducts lifecycle', () => {
    it('moves to loading and clears any previous error on pending', () => {
      const failed: ProductsState = {
        ...initial(),
        status: 'failed',
        error: 'Request failed with status 503',
      };

      const state = reducer(failed, {type: fetchProducts.pending.type});

      expect(state.status).toBe('loading');
      expect(state.error).toBeNull();
    });

    // A retry should not blank the list mid-flight; keeping the previous items
    // is what lets ErrorView sit over stale content instead of a flash of empty.
    it('keeps already-loaded items while a refetch is pending', () => {
      const loaded: ProductsState = {...initial(), items: [product]};

      const state = reducer(loaded, {type: fetchProducts.pending.type});

      expect(state.items).toEqual([product]);
    });

    it('stores the payload and succeeds on fulfilled', () => {
      const state = reducer(initial(), {
        type: fetchProducts.fulfilled.type,
        payload: [product],
      });

      expect(state.status).toBe('succeeded');
      expect(state.items).toEqual([product]);
      expect(state.error).toBeNull();
    });

    it('surfaces the thrown message on rejected', () => {
      const state = reducer(initial(), {
        type: fetchProducts.rejected.type,
        error: {message: 'Request failed with status 503'},
      });

      expect(state.status).toBe('failed');
      expect(state.error).toBe('Request failed with status 503');
    });

    // R9: never swallow a failure into an empty list — status must say failed
    // and error must be renderable even when the error carries no message.
    it('falls back to a readable message when the error has none', () => {
      const state = reducer(initial(), {
        type: fetchProducts.rejected.type,
        error: {},
      });

      expect(state.status).toBe('failed');
      expect(state.error).toBe('Unable to load products');
    });
  });

  describe('filter criteria', () => {
    it('records the selected category and clears it with null', () => {
      const chosen = reducer(initial(), setCategory('electronics'));
      expect(chosen.selectedCategory).toBe('electronics');

      expect(reducer(chosen, setCategory(null)).selectedCategory).toBeNull();
    });

    it('records the search term', () => {
      expect(reducer(initial(), setSearchTerm('bag')).searchTerm).toBe('bag');
    });

    // The whole point of holding these in state: they are filter criteria over
    // the cached list, never request parameters. Changing them must not touch
    // status, which is what a refetch would do.
    it('leaves status and items untouched when filters change', () => {
      const loaded: ProductsState = {
        ...initial(),
        items: [product],
        status: 'succeeded',
      };

      const filtered = reducer(
        reducer(loaded, setCategory('electronics')),
        setSearchTerm('bag'),
      );

      expect(filtered.status).toBe('succeeded');
      expect(filtered.items).toEqual([product]);
    });
  });

  // Integration: the thunk actually reaches the api layer and the mapped
  // domain objects land in state. Everything above drives the reducer with
  // synthetic actions, which would still pass if the thunk were wired wrong.
  describe('integration with the api layer', () => {
    const makeStore = () => configureStore({reducer: {products: reducer}});

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('fetches once and stores mapped products', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 1,
            title: 'Backpack',
            price: 109.95,
            description: 'Fits 15 inch laptops',
            category: "men's clothing",
            image: 'https://fakestoreapi.com/img/backpack.jpg',
          },
        ],
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const store = makeStore();
      await store.dispatch(fetchProducts());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(store.getState().products).toMatchObject({
        status: 'succeeded',
        error: null,
        items: [product],
      });
    });

    it('lands in failed with the status message when the request fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => null,
      }) as unknown as typeof fetch;

      const store = makeStore();
      await store.dispatch(fetchProducts());

      expect(store.getState().products).toMatchObject({
        status: 'failed',
        error: 'Request failed with status 503',
        items: [],
      });
    });
  });
});
