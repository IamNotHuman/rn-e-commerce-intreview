import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

/**
 * Quantities keyed by product id, not copies of the products themselves.
 *
 * The products slice stays the single source of product data; the cart only
 * records how many of each. That keeps the two from drifting, and keeps the
 * persisted payload tiny — the only reducer that survives a cold start (R11).
 */
export interface CartState {
  quantities: Record<number, number>;
}

const initialState: CartState = {quantities: {}};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{id: number; qty: number}>) {
      const {id, qty} = action.payload;
      state.quantities[id] = (state.quantities[id] ?? 0) + qty;
    },
    incrementItem(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.quantities[id] = (state.quantities[id] ?? 0) + 1;
    },
    decrementItem(state, action: PayloadAction<number>) {
      const id = action.payload;
      const next = (state.quantities[id] ?? 0) - 1;

      if (next <= 0) {
        delete state.quantities[id];
      } else {
        state.quantities[id] = next;
      }
    },
    removeItem(state, action: PayloadAction<number>) {
      delete state.quantities[action.payload];
    },
    clearCart(state) {
      state.quantities = {};
    },
  },
});

export const {addItem, incrementItem, decrementItem, removeItem, clearCart} =
  cartSlice.actions;
export default cartSlice.reducer;
