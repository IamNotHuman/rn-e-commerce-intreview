import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Persistor} from 'redux-persist';
import type {RootState} from '../../src/app/store';

/**
 * Fake timers are installed before src/app/store is loaded, and the module is
 * pulled in with require() so that ordering actually holds — ES imports would
 * hoist above this call.
 *
 * src/app/store calls persistStore() at module scope, which arms a 5s rehydrate
 * timeout. redux-persist never clears that timer; it guards the callback with a
 * _sealed flag instead (persistReducer.js:78). Under real timers every suite
 * that touches the singleton leaves an open handle and stalls the run for five
 * seconds. The production timeout is left at its default on purpose: it is what
 * lets PersistGate proceed with default state if storage never settles.
 */
jest.useFakeTimers();

const {store, persistor} = require('../../src/app/store') as {
  store: {getState: () => RootState; dispatch: (action: unknown) => unknown};
  persistor: Persistor;
};
import {addItem} from '../../src/features/cart/cartSlice';
import {setSearchTerm} from '../../src/features/products/productsSlice';

/**
 * Exercises the real singleton store, which is the only place the persistence
 * wiring exists. Everything else in the suite builds throwaway stores via
 * test-utils/renderWithProviders.
 */
afterAll(async () => {
  await persistor.flush();
  persistor.pause();
  jest.useRealTimers();
});

describe('store', () => {
  it('exposes both slices', () => {
    const state = store.getState();

    expect(state.products).toMatchObject({items: [], status: 'idle'});
    expect(state.cart).toMatchObject({quantities: {}});
  });

  // R11: cart only. persistReducer stamps a _persist marker onto whatever it
  // wraps, so its presence is a direct read of which reducers are persisted.
  it('persists the cart and the theme preference, never the catalogue', () => {
    const state = store.getState();

    expect(state.cart).toHaveProperty('_persist');
    expect(state.theme).toHaveProperty('_persist');
    expect(state.products).not.toHaveProperty('_persist');
  });

  it('writes cart changes to AsyncStorage', async () => {
    store.dispatch(addItem({id: 1, qty: 2}));
    await persistor.flush();

    const persisted = await AsyncStorage.getItem('persist:cart');

    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted as string)).toMatchObject({
      quantities: JSON.stringify({1: 2}),
    });
  });

  it('never writes the products slice to storage', async () => {
    store.dispatch(setSearchTerm('bag'));
    await persistor.flush();

    await expect(AsyncStorage.getItem('persist:products')).resolves.toBeNull();
    await expect(AsyncStorage.getAllKeys()).resolves.toEqual(
      expect.arrayContaining(['persist:cart']),
    );
    await expect(AsyncStorage.getItem('persist:products')).resolves.toBeNull();
  });

  // redux-persist's own lifecycle actions carry non-serializable payloads. The
  // serializableCheck exemption in store.ts is what keeps them from warning on
  // every rehydrate; this pins that the store accepts them silently.
  it('does not warn about redux-persist lifecycle actions', () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});

    store.dispatch({type: 'persist/REHYDRATE', payload: undefined});

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
