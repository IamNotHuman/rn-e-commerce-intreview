import React from 'react';
import {Image} from 'react-native';
import {fireEvent, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {ProductCard} from '../../src/components/ProductCard';

const setup = () => {
  const onPress = jest.fn();
  const onAddToCart = jest.fn();

  renderWithProviders(
    <ProductCard
      id={7}
      title="Leather Backpack"
      price={109.9}
      category="men's clothing"
      imageUrl="https://example.test/7.jpg"
      onPress={onPress}
      onAddToCart={onAddToCart}
    />,
  );

  return {onPress, onAddToCart};
};

describe('ProductCard', () => {
  it('renders title, formatted price and category', () => {
    setup();

    expect(screen.getByText('Leather Backpack')).toBeOnTheScreen();
    // Price and category are separate nodes so the price can carry the
    // theme.text.price variant (R12b) rather than sharing a caption line.
    expect(screen.getByText('$109.90')).toBeOnTheScreen();
    expect(screen.getByText("men's clothing")).toBeOnTheScreen();
  });

  // An image source is not reachable through any user-facing query, so this
  // reaches for the node type directly. It is the one assertion here that is
  // coupled to the render tree rather than to what a user perceives.
  it('renders the mapped image url', () => {
    setup();

    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({
      uri: 'https://example.test/7.jpg',
    });
  });

  // The callbacks take the id so the screen can share one handler across rows.
  it('reports its own id when pressed', () => {
    const {onPress, onAddToCart} = setup();

    fireEvent.press(screen.getByLabelText('Leather Backpack'));

    expect(onPress).toHaveBeenCalledWith(7);
    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it('reports its own id when adding to cart', () => {
    const {onPress, onAddToCart} = setup();

    fireEvent.press(screen.getByLabelText('Add Leather Backpack to cart'));

    expect(onAddToCart).toHaveBeenCalledWith(7);
    expect(onPress).not.toHaveBeenCalled();
  });
});
