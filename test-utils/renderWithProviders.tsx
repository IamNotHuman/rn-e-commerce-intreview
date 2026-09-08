import React from 'react';
import type {PropsWithChildren, ReactElement} from 'react';
import {render} from '@testing-library/react-native';
import type {RenderOptions} from '@testing-library/react-native';
import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import {ThemeProvider} from 'styled-components/native';
import productsReducer from '../src/features/products/productsSlice';
import type {ProductsState} from '../src/features/products/productsSlice';
import cartReducer from '../src/features/cart/cartSlice';
import type {CartState} from '../src/features/cart/cartSlice';
import themeReducer from '../src/features/theme/themeSlice';
import type {ThemeState} from '../src/features/theme/themeSlice';
import {lightTheme} from '../src/theme';
import type {AppTheme} from '../src/theme';

/**
 * Test stores are built from the raw slice reducers rather than imported from
 * src/app/store, deliberately. That module constructs a singleton and calls
 * persistStore() at import time, so pulling it into a test would share state
 * across suites and leave redux-persist's rehydrate timer pending. Tests get a
 * fresh, unpersisted store instead; persistence itself is covered directly in
 * __tests__/app/store.test.ts.
 */
export interface TestState {
  products: ProductsState;
  cart: CartState;
  theme: ThemeState;
}

const testRootReducer = combineReducers({
  products: productsReducer,
  cart: cartReducer,
  theme: themeReducer,
});

export const createTestStore = (preloadedState?: Partial<TestState>) =>
  configureStore({reducer: testRootReducer, preloadedState});

export type TestStore = ReturnType<typeof createTestStore>;

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<TestState>;
  store?: TestStore;
  /** Defaults to light; pass darkTheme to assert a component under dark. */
  theme?: AppTheme;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    theme = lightTheme,
    ...options
  }: RenderWithProvidersOptions = {},
) => {
  const Wrapper = ({children}: PropsWithChildren) => (
    <Provider store={store}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </Provider>
  );

  return {store, ...render(ui, {wrapper: Wrapper, ...options})};
};
