import reducer, {
  addItem,
  clearCart,
  decrementItem,
  incrementItem,
  removeItem,
} from '../../src/features/cart/cartSlice';
import type {CartState} from '../../src/features/cart/cartSlice';

const initial = (): CartState => reducer(undefined, {type: '@@INIT'} as never);
const withQuantities = (quantities: Record<number, number>): CartState => ({
  quantities,
});

describe('cartSlice', () => {
  it('starts empty', () => {
    expect(initial()).toEqual({quantities: {}});
  });

  describe('addItem', () => {
    it('adds a new line', () => {
      const state = reducer(initial(), addItem({id: 1, qty: 2}));
      expect(state.quantities).toEqual({1: 2});
    });

    it('accumulates onto an existing line rather than replacing it', () => {
      const state = reducer(
        withQuantities({1: 2}),
        addItem({id: 1, qty: 3}),
      );
      expect(state.quantities).toEqual({1: 5});
    });
  });

  describe('incrementItem', () => {
    it('bumps an existing line', () => {
      expect(
        reducer(withQuantities({1: 2}), incrementItem(1)).quantities,
      ).toEqual({1: 3});
    });

    it('creates the line when it is absent', () => {
      expect(reducer(initial(), incrementItem(7)).quantities).toEqual({7: 1});
    });
  });

  describe('decrementItem', () => {
    it('reduces an existing line', () => {
      expect(
        reducer(withQuantities({1: 3}), decrementItem(1)).quantities,
      ).toEqual({1: 2});
    });

    // Dropping to zero must remove the key, not leave a 0-quantity line that
    // the cart would then render as an empty row.
    it('removes the line when it reaches zero', () => {
      expect(
        reducer(withQuantities({1: 1, 2: 4}), decrementItem(1)).quantities,
      ).toEqual({2: 4});
    });

    it('never creates a negative line for an id that is not in the cart', () => {
      expect(reducer(initial(), decrementItem(99)).quantities).toEqual({});
    });
  });

  it('removes a line outright', () => {
    expect(
      reducer(withQuantities({1: 5, 2: 1}), removeItem(1)).quantities,
    ).toEqual({2: 1});
  });

  it('is a no-op when removing an id that is not in the cart', () => {
    expect(reducer(withQuantities({2: 1}), removeItem(99)).quantities).toEqual({
      2: 1,
    });
  });

  it('empties the cart', () => {
    expect(reducer(withQuantities({1: 5, 2: 1}), clearCart()).quantities).toEqual(
      {},
    );
  });

  // redux-persist round-trips through JSON, which turns numeric keys into
  // strings. Object property access coerces either way, so a rehydrated cart
  // still resolves — but selectors reading Object.keys() get strings and must
  // convert. Pinned here so that conversion is not forgotten.
  it('survives a JSON round-trip the way redux-persist rehydrates it', () => {
    const persisted = JSON.parse(
      JSON.stringify(withQuantities({1: 2})),
    ) as CartState;

    expect(Object.keys(persisted.quantities)).toEqual(['1']);

    const state = reducer(persisted, incrementItem(1));
    expect(state.quantities[1]).toBe(3);
  });
});
