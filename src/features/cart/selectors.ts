import {createSelector} from '@reduxjs/toolkit';
import type {RootState} from '../../app/store';

export interface CartLine {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  lineTotal: number;
}

const selectQuantities = (state: RootState) => state.cart.quantities;
const selectProductItems = (state: RootState) => state.products.items;

/**
 * Lines are built by walking the products list, not the quantity keys, so the
 * cart can only ever render items the catalogue actually knows about.
 *
 * The consequence is deliberate and worth knowing: on a cold start the cart is
 * rehydrated from storage before products have loaded, so lines is briefly
 * empty while selectTotalItems already reports the persisted count. The badge
 * is correct immediately; the rows fill in when the fetch resolves.
 */
export const selectCartLines = createSelector(
  [selectQuantities, selectProductItems],
  (quantities, products): CartLine[] =>
    products
      .filter(product => quantities[product.id] > 0)
      .map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantities[product.id],
        lineTotal: product.price * quantities[product.id],
      })),
);

/**
 * Reads quantities directly rather than summing lines, so the badge survives a
 * cold start before the catalogue arrives.
 */
export const selectTotalItems = createSelector([selectQuantities], quantities =>
  Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
);

export const selectTotalPrice = createSelector([selectCartLines], lines =>
  lines.reduce((sum, line) => sum + line.lineTotal, 0),
);
