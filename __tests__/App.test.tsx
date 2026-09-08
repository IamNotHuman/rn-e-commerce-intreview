import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {lightTheme as theme} from '../src/theme';

/**
 * App pulls in src/app/store, which calls persistStore() at module scope and
 * arms a 5s rehydrate timeout redux-persist never clears. Fake timers must be
 * installed before the module loads, which means require() rather than a
 * hoisted import. Same reasoning as __tests__/app/store.test.ts.
 */
jest.useFakeTimers();

const App = require('../App').default as React.ComponentType;

const dto = {
  id: 1,
  title: 'Leather Backpack',
  price: 109.95,
  description: 'Fits 15 inch laptops',
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/backpack.jpg',
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [dto],
  }) as unknown as typeof fetch;
});

afterAll(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('App', () => {
  it('renders the product list once the cart has rehydrated and products load', async () => {
    render(<App />);

    expect(await screen.findByText('Leather Backpack')).toBeOnTheScreen();
  });

  it('starts on ProductList, with the other routes unmounted', async () => {
    render(<App />);
    await screen.findByText('Leather Backpack');

    expect(screen.queryByText('Your cart is empty.')).toBeNull();
    expect(screen.queryByLabelText('Add to cart')).toBeNull();
  });

  // Proves ThemeProvider is mounted around the navigator: a missing provider
  // would throw at render rather than fall back to unstyled text.
  it('supplies the theme to screens rendered by the navigator', async () => {
    render(<App />);

    expect(await screen.findByText('Leather Backpack')).toHaveStyle({
      color: theme.colors.text,
    });
  });

  /**
   * Not covered: the null-render window before PersistGate opens. The persistor
   * is a module-scope singleton, so by the second test in a file it has already
   * bootstrapped and the gate is open. Isolating it with jest.isolateModules
   * loads a second copy of React into the fresh registry while render() still
   * holds the outer one, which crashes on a null hooks dispatcher.
   */
});
