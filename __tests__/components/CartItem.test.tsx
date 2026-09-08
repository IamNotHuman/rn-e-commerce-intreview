import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {CartItem} from '../../src/components/CartItem';

const setup = (quantity = 2) => {
  const onIncrement = jest.fn();
  const onDecrement = jest.fn();
  const onRemove = jest.fn();

  renderWithProviders(
    <CartItem
      id={4}
      title="Laptop"
      imageUrl="https://example.test/4.jpg"
      quantity={quantity}
      lineTotal={219.8}
      onIncrement={onIncrement}
      onDecrement={onDecrement}
      onRemove={onRemove}
    />,
  );

  return {onIncrement, onDecrement, onRemove};
};

describe('CartItem', () => {
  it('renders the title, quantity and formatted line total', () => {
    setup(3);

    expect(screen.getByText('Laptop')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('$219.80')).toBeOnTheScreen();
  });

  it('reports its id on increment', () => {
    const {onIncrement} = setup();

    fireEvent.press(screen.getByLabelText('Increase quantity'));

    expect(onIncrement).toHaveBeenCalledWith(4);
  });

  it('reports its id on decrement', () => {
    const {onDecrement} = setup();

    fireEvent.press(screen.getByLabelText('Decrease quantity'));

    expect(onDecrement).toHaveBeenCalledWith(4);
  });

  it('reports its id on remove', () => {
    const {onRemove, onIncrement, onDecrement} = setup();

    fireEvent.press(screen.getByLabelText('Remove Laptop'));

    expect(onRemove).toHaveBeenCalledWith(4);
    expect(onIncrement).not.toHaveBeenCalled();
    expect(onDecrement).not.toHaveBeenCalled();
  });
});
