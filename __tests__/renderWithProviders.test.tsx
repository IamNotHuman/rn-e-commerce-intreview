import React from 'react';
import {Text} from 'react-native';
import {useSelector} from 'react-redux';
import styled from 'styled-components/native';
import {act, screen} from '@testing-library/react-native';
import {
  createTestStore,
  renderWithProviders,
} from '../test-utils/renderWithProviders';
import type {TestState} from '../test-utils/renderWithProviders';
import {addItem} from '../src/features/cart/cartSlice';
import {lightTheme as theme} from '../src/theme';

const LineCount = () => {
  const count = useSelector(
    (state: TestState) => Object.keys(state.cart.quantities).length,
  );
  return <Text>{`lines: ${count}`}</Text>;
};

const Themed = styled.Text`
  color: ${({theme: t}) => t.colors.danger};
`;

describe('renderWithProviders', () => {
  it('supplies the redux store', () => {
    renderWithProviders(<LineCount />, {
      preloadedState: {cart: {quantities: {1: 2, 5: 1}}},
    });

    expect(screen.getByText('lines: 2')).toBeOnTheScreen();
  });

  it('supplies the theme', () => {
    renderWithProviders(<Themed>themed</Themed>);

    expect(screen.getByText('themed')).toHaveStyle({
      color: theme.colors.danger,
    });
  });

  it('returns the store so a test can dispatch and assert on re-render', () => {
    const {store} = renderWithProviders(<LineCount />);
    expect(screen.getByText('lines: 0')).toBeOnTheScreen();

    // A dispatch from outside React has to be wrapped in act() or the
    // re-render is not flushed before the assertion. Container tests will hit
    // this constantly, so it is pinned here.
    act(() => {
      store.dispatch(addItem({id: 3, qty: 1}));
    });

    expect(screen.getByText('lines: 1')).toBeOnTheScreen();
  });

  // Each render gets its own store unless one is passed in, so a cart left
  // dirty by one test cannot leak into the next.
  it('isolates state between renders', () => {
    const first = createTestStore();
    first.dispatch(addItem({id: 1, qty: 4}));

    renderWithProviders(<LineCount />);

    expect(screen.getByText('lines: 0')).toBeOnTheScreen();
  });
});
