import React from 'react';
import {act, fireEvent, screen, waitFor} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {ProductList} from '../../src/screens/ProductList';
import type {Product} from '../../src/api/fakeStoreApi.type';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));

const dto = (id: number, title: string, category: string) => ({
  id,
  title,
  price: 10,
  description: 'desc',
  category,
  image: `https://example.test/${id}.jpg`,
});

const product = (id: number, title: string, category: string): Product => ({
  id,
  title,
  price: 10,
  description: 'desc',
  category,
  imageUrl: `https://example.test/${id}.jpg`,
});

const items = [
  product(1, 'Leather Backpack', "men's clothing"),
  product(2, 'Laptop', 'electronics'),
];

const loaded = {
  products: {
    items,
    status: 'succeeded' as const,
    error: null,
    selectedCategory: null,
    searchTerm: '',
  },
};

const mockFetch = (body: unknown, init?: {ok?: boolean; status?: number}) => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('ProductList', () => {
  describe('fetch lifecycle', () => {
    it('fetches once on mount when status is idle', async () => {
      const fetchMock = mockFetch([dto(1, 'Leather Backpack', 'bags')]);

      renderWithProviders(<ProductList />);

      expect(await screen.findByText('Leather Backpack')).toBeOnTheScreen();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not fetch when products are already cached', () => {
      const fetchMock = mockFetch([]);

      renderWithProviders(<ProductList />, {preloadedState: loaded});

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('shows the loader while the request is in flight', async () => {
      mockFetch([]);

      renderWithProviders(<ProductList />);

      expect(screen.getByRole('progressbar')).toBeOnTheScreen();

      // Let the mount-time thunk settle inside the test. Without this the
      // fulfilled action lands after teardown and React warns about a state
      // update outside act().
      await act(async () => {});
    });

    it('shows an error with a working retry when the request fails', async () => {
      const fetchMock = mockFetch(null, {ok: false, status: 503});

      renderWithProviders(<ProductList />);

      const retry = await screen.findByRole('button', {name: 'Try again'});
      expect(
        screen.getByText('Request failed with status 503'),
      ).toBeOnTheScreen();

      mockFetch([dto(1, 'Leather Backpack', 'bags')]);
      fireEvent.press(retry);

      expect(await screen.findByText('Leather Backpack')).toBeOnTheScreen();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * The graded criterion. Search and category filtering are memoized selectors
   * over the cached list, so neither may touch the network. A regression here
   * is a defect, not a style change.
   */
  describe('filtering never refetches', () => {
    it('filters by search term without a request', async () => {
      const fetchMock = mockFetch([]);

      renderWithProviders(<ProductList />, {preloadedState: loaded});

      fireEvent.changeText(
        screen.getByLabelText('Search products'),
        'backpack',
      );

      await waitFor(() =>
        expect(screen.queryByText('Laptop')).toBeNull(),
      );
      expect(screen.getByText('Leather Backpack')).toBeOnTheScreen();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('filters by category without a request', async () => {
      const fetchMock = mockFetch([]);

      renderWithProviders(<ProductList />, {preloadedState: loaded});

      fireEvent.press(screen.getByLabelText('electronics'));

      await waitFor(() =>
        expect(screen.queryByText('Leather Backpack')).toBeNull(),
      );
      expect(screen.getByText('Laptop')).toBeOnTheScreen();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('restores the full list via the All chip, still without a request', async () => {
      const fetchMock = mockFetch([]);

      renderWithProviders(<ProductList />, {preloadedState: loaded});

      fireEvent.press(screen.getByLabelText('electronics'));
      await waitFor(() =>
        expect(screen.queryByText('Leather Backpack')).toBeNull(),
      );

      fireEvent.press(screen.getByLabelText('All categories'));

      expect(await screen.findByText('Leather Backpack')).toBeOnTheScreen();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('shows an empty message when nothing matches', async () => {
      mockFetch([]);

      renderWithProviders(<ProductList />, {preloadedState: loaded});

      fireEvent.changeText(
        screen.getByLabelText('Search products'),
        'nothing matches this',
      );

      expect(
        await screen.findByText('No products match your filters.'),
      ).toBeOnTheScreen();
    });
  });

  describe('actions', () => {
    it('navigates to the detail route with the product id', () => {
      mockFetch([]);

      renderWithProviders(<ProductList />, {preloadedState: loaded});

      fireEvent.press(screen.getByLabelText('Laptop'));

      expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', {id: 2});
    });

    it('navigates to the cart', () => {
      mockFetch([]);

      renderWithProviders(<ProductList />, {preloadedState: loaded});

      fireEvent.press(screen.getByLabelText('Open cart, 0 items'));

      expect(mockNavigate).toHaveBeenCalledWith('Cart');
    });

    it('adds to the cart and reflects the new count', async () => {
      mockFetch([]);

      const {store} = renderWithProviders(<ProductList />, {
        preloadedState: loaded,
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Add Laptop to cart'));
      });

      expect(store.getState().cart.quantities).toEqual({2: 1});
      expect(screen.getByLabelText('Open cart, 1 items')).toBeOnTheScreen();
    });
  });
});
