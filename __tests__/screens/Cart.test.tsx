import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {Cart} from '../../src/screens/Cart';
import type {Product} from '../../src/api/fakeStoreApi.type';

const product = (id: number, title: string, price: number): Product => ({
  id,
  title,
  price,
  description: 'desc',
  category: 'misc',
  imageUrl: `https://example.test/${id}.jpg`,
});

const items = [product(1, 'Backpack', 10.5), product(2, 'Laptop', 100)];

const withCart = (quantities: Record<number, number>) => ({
  products: {
    items,
    status: 'succeeded' as const,
    error: null,
    selectedCategory: null,
    searchTerm: '',
  },
  cart: {quantities},
});

const press = async (label: string) => {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
};

describe('Cart', () => {
  it('shows an empty message when nothing is in the cart', () => {
    renderWithProviders(<Cart />, {preloadedState: withCart({})});

    expect(screen.getByText('Your cart is empty.')).toBeOnTheScreen();
  });

  it('renders a row per line with totals for count and price', () => {
    renderWithProviders(<Cart />, {preloadedState: withCart({1: 2, 2: 1})});

    expect(screen.getByText('Backpack')).toBeOnTheScreen();
    expect(screen.getByText('Laptop')).toBeOnTheScreen();
    expect(screen.getByText('Items: 3')).toBeOnTheScreen();
    expect(screen.getByText('Total: $121.00')).toBeOnTheScreen();
  });

  describe('quantity controls', () => {
    it('increases a quantity', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 2}),
      });

      await press('Increase quantity');

      expect(store.getState().cart.quantities).toEqual({1: 3});
      expect(screen.getByText('Items: 3')).toBeOnTheScreen();
    });

    it('decreases a quantity', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 2}),
      });

      await press('Decrease quantity');

      expect(store.getState().cart.quantities).toEqual({1: 1});
    });

    /**
     * R13.3. The reducer still drops a line at zero — that is covered in
     * __tests__/features/cartSlice.test.ts — but the minus button can no longer
     * reach it, because a decrement that empties a line is removal, and removal
     * already has an explicit, labelled control. Two entrances to the same
     * destructive action, one of them looking like an ordinary quantity change,
     * is the thing being prevented here.
     */
    it('blocks the decrement at a quantity of one instead of emptying the line', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 1}),
      });

      expect(screen.getByLabelText('Decrease quantity')).toBeDisabled();

      await press('Decrease quantity');

      expect(store.getState().cart.quantities).toEqual({1: 1});
      expect(screen.getByText('Backpack')).toBeOnTheScreen();
    });

    it('leaves Remove as the way to clear the last of a line', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 1}),
      });

      await press('Remove Backpack');

      expect(store.getState().cart.quantities).toEqual({});
      expect(screen.getByText('Your cart is empty.')).toBeOnTheScreen();
    });

    it('removes a line outright', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 2, 2: 1}),
      });

      await press('Remove Backpack');

      expect(store.getState().cart.quantities).toEqual({2: 1});
      expect(screen.queryByText('Backpack')).toBeNull();
    });
  });

  /**
   * The simulated checkout required by the brief: a summary, a confirmation
   * step, and a cart that is empty afterwards.
   */
  // R13.3: a control that looks live but does nothing reads as broken. The
  // empty cart is the case the rule names.
  describe('checkout is unavailable with an empty cart', () => {
    it('disables the checkout button', () => {
      renderWithProviders(<Cart />, {preloadedState: withCart({})});

      expect(screen.getByLabelText('Checkout').props.accessibilityState).toEqual(
        expect.objectContaining({disabled: true}),
      );
    });

    it('does not open the summary when pressed', async () => {
      renderWithProviders(<Cart />, {preloadedState: withCart({})});

      await press('Checkout');

      expect(screen.queryByText('Order summary')).toBeNull();
    });

    it('enables checkout as soon as the cart has a line', () => {
      renderWithProviders(<Cart />, {preloadedState: withCart({1: 1})});

      expect(
        screen.getByLabelText('Checkout').props.accessibilityState,
      ).toEqual(expect.objectContaining({disabled: false}));
    });
  });

  describe('simulated checkout', () => {
    it('shows a summary of the order before confirming', async () => {
      renderWithProviders(<Cart />, {preloadedState: withCart({1: 2, 2: 1})});

      await press('Checkout');

      expect(screen.getByText('Order summary')).toBeOnTheScreen();
      expect(screen.getByText('2 × Backpack — $21.00')).toBeOnTheScreen();
      expect(screen.getByText('1 × Laptop — $100.00')).toBeOnTheScreen();
    });

    it('does not touch the cart until the purchase is confirmed', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 2}),
      });

      await press('Checkout');

      expect(store.getState().cart.quantities).toEqual({1: 2});
    });

    it('can be cancelled, leaving the cart intact', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 2}),
      });

      await press('Checkout');
      await press('Cancel checkout');

      expect(screen.queryByText('Order summary')).toBeNull();
      expect(store.getState().cart.quantities).toEqual({1: 2});
    });

    it('clears the cart and confirms when the purchase goes through', async () => {
      const {store} = renderWithProviders(<Cart />, {
        preloadedState: withCart({1: 2, 2: 1}),
      });

      await press('Checkout');
      await press('Confirm purchase');

      expect(screen.getByText('Order confirmed')).toBeOnTheScreen();
      expect(store.getState().cart.quantities).toEqual({});
    });

    it('returns to an empty cart after dismissing the confirmation', async () => {
      renderWithProviders(<Cart />, {preloadedState: withCart({1: 2})});

      await press('Checkout');
      await press('Confirm purchase');
      await press('Done');

      expect(screen.getByText('Your cart is empty.')).toBeOnTheScreen();
    });
  });
});
