import {createSelector} from '@reduxjs/toolkit';
import type {RootState} from '../../app/store';
import type {Product} from '../../api/fakeStoreApi.type';

const selectItems = (state: RootState) => state.products.items;
const selectCategory = (state: RootState) => state.products.selectedCategory;
const selectSearch = (state: RootState) => state.products.searchTerm;

/**
 * Plain accessors, not createSelector: nothing is derived, so memoizing would
 * add a cache for a field read. They exist so containers branch on status (R9)
 * without reaching into the state shape themselves.
 */
export const selectProductsStatus = (state: RootState) =>
  state.products.status;
export const selectProductsError = (state: RootState) => state.products.error;

export const selectCategories = createSelector([selectItems], items =>
  Array.from(new Set(items.map(item => item.category))),
);

/**
 * Category and search are applied here, over the already-cached list. This is
 * the whole reason neither one issues a request (R8).
 */
export const selectVisibleProducts = createSelector(
  [selectItems, selectCategory, selectSearch],
  (items, category, search) => {
    const term = search.trim().toLowerCase();

    return items.filter(
      item =>
        (!category || item.category === category) &&
        (!term || item.title.toLowerCase().includes(term)),
    );
  },
);

/**
 * The by-id lookup is memoized once as a map rather than exposed as a
 * selector factory. A `selectProductById(id)` factory would build a fresh
 * createSelector on every render, giving each instance a cache of one that is
 * discarded immediately — memoization in name only.
 */
const selectProductsById = createSelector([selectItems], items =>
  items.reduce<Record<number, Product>>((byId, item) => {
    byId[item.id] = item;
    return byId;
  }, {}),
);

/**
 * What lets ProductDetail render from cache instead of firing a second
 * request. Returns null while the catalogue is still loading.
 */
export const selectProductById = (
  state: RootState,
  id: number,
): Product | null => selectProductsById(state)[id] ?? null;
