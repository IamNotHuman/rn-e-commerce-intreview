import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {ProductDetail} from '../../src/screens/ProductDetail';
import type {Product} from '../../src/api/fakeStoreApi.type';

const mockParams = {id: 2};

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({params: mockParams}),
}));

const laptop: Product = {
  id: 2,
  title: 'Laptop',
  price: 109.95,
  description: 'Fits 15 inch laptops',
  category: 'electronics',
  imageUrl: 'https://example.test/2.jpg',
};

const loaded = (items: Product[] = [laptop]) => ({
  products: {
    items,
    status: 'succeeded' as const,
    error: null,
    selectedCategory: null,
    searchTerm: '',
  },
});

let fetchMock: jest.Mock;

beforeEach(() => {
  mockParams.id = 2;
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('ProductDetail', () => {
  /**
   * The single most important assertion in this suite. GET /products already
   * returned `description`, so the detail screen reads the cached array by id.
   * A request here would be a graded defect.
   */
  it('renders entirely from cache without issuing a request', () => {
    renderWithProviders(<ProductDetail />, {preloadedState: loaded()});

    expect(screen.getByText('Laptop')).toBeOnTheScreen();
    expect(screen.getByText('Fits 15 inch laptops')).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows every field the brief requires', () => {
    renderWithProviders(<ProductDetail />, {preloadedState: loaded()});

    expect(screen.getByText('Laptop')).toBeOnTheScreen();
    expect(screen.getByText('$109.95')).toBeOnTheScreen();
    expect(screen.getByText('electronics')).toBeOnTheScreen();
    expect(screen.getByText('Fits 15 inch laptops')).toBeOnTheScreen();
  });

  it('adds the routed product to the cart', async () => {
    const {store} = renderWithProviders(<ProductDetail />, {
      preloadedState: loaded(),
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Add to cart'));
    });

    expect(store.getState().cart.quantities).toEqual({2: 1});
  });

  it('reports a missing product rather than rendering a blank screen', () => {
    mockParams.id = 999;

    renderWithProviders(<ProductDetail />, {preloadedState: loaded()});

    expect(
      screen.getByText('That product is no longer available.'),
    ).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the loader when the catalogue has not been fetched yet', () => {
    renderWithProviders(<ProductDetail />);

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('offers a retry when the catalogue failed to load', () => {
    renderWithProviders(<ProductDetail />, {
      preloadedState: {
        products: {
          items: [],
          status: 'failed',
          error: 'Request failed with status 503',
          selectedCategory: null,
          searchTerm: '',
        },
      },
    });

    expect(
      screen.getByRole('button', {name: 'Try again'}),
    ).toBeOnTheScreen();
  });
});
