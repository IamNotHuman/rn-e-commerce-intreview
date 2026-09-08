import React from 'react';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {CartItem} from '../../src/components/CartItem';
import {ProductCard} from '../../src/components/ProductCard';

/**
 * List rows are memoized, which only pays off if the screen hands them stable
 * props. That is why the callbacks take an id instead of being pre-bound: one
 * useCallback on the screen, shared by every row, rather than a fresh closure
 * per row per render.
 *
 * Render counts are read through a stubbed QuantityStepper — CartItem's only
 * child component, and a public folder import, so nothing here reaches into
 * another folder's internals.
 */
const mockStepperRender = jest.fn();

jest.mock('../../src/components/QuantityStepper', () => ({
  QuantityStepper: ({quantity}: {quantity: number}) => {
    mockStepperRender(quantity);
    return null;
  },
}));

const onIncrement = jest.fn();
const onDecrement = jest.fn();
const onRemove = jest.fn();

const props = {
  id: 4,
  title: 'Laptop',
  imageUrl: 'https://example.test/4.jpg',
  quantity: 2,
  lineTotal: 219.8,
  onIncrement,
  onDecrement,
  onRemove,
};

beforeEach(() => {
  mockStepperRender.mockClear();
});

describe('list rows are memoized', () => {
  it('exports ProductCard as a memo component', () => {
    expect(ProductCard).toHaveProperty('$$typeof', Symbol.for('react.memo'));
  });

  it('exports CartItem as a memo component', () => {
    expect(CartItem).toHaveProperty('$$typeof', Symbol.for('react.memo'));
  });
});

describe('CartItem re-render behaviour', () => {
  it('does not re-render when re-rendered with identical props', () => {
    const {rerender} = renderWithProviders(<CartItem {...props} />);
    expect(mockStepperRender).toHaveBeenCalledTimes(1);

    rerender(<CartItem {...props} />);

    expect(mockStepperRender).toHaveBeenCalledTimes(1);
  });

  it('re-renders when its own quantity changes', () => {
    const {rerender} = renderWithProviders(<CartItem {...props} />);

    rerender(<CartItem {...props} quantity={3} />);

    expect(mockStepperRender).toHaveBeenCalledTimes(2);
    expect(mockStepperRender).toHaveBeenLastCalledWith(3);
  });

  /**
   * The failure mode the id-taking callback shape exists to prevent. A screen
   * that writes `onIncrement={() => dispatch(...)}` inside renderItem hands
   * every row a new function on every render, and the memo above stops
   * mattering. This test is the evidence for that claim.
   */
  it('re-renders when handed a fresh callback identity, defeating the memo', () => {
    const {rerender} = renderWithProviders(<CartItem {...props} />);
    expect(mockStepperRender).toHaveBeenCalledTimes(1);

    rerender(<CartItem {...props} onIncrement={() => {}} />);

    expect(mockStepperRender).toHaveBeenCalledTimes(2);
  });
});
