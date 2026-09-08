import React from 'react';
import {formatPrice} from '../../utils';
import type {ProductCardProps} from './ProductCard.type';
import {
  AddButton,
  AddLabel,
  Card,
  Category,
  Price,
  Thumbnail,
  Title,
} from './ProductCard.style';

const ProductCardBase = ({
  id,
  title,
  price,
  category,
  imageUrl,
  onPress,
  onAddToCart,
}: ProductCardProps) => (
  <Card
    onPress={() => onPress(id)}
    accessibilityRole="button"
    accessibilityLabel={title}>
    <Thumbnail source={{uri: imageUrl}} resizeMode="contain" />
    <Title numberOfLines={2}>{title}</Title>
    <Price>{formatPrice(price)}</Price>
    <Category>{category}</Category>
    <AddButton
      onPress={() => onAddToCart(id)}
      accessibilityRole="button"
      accessibilityLabel={`Add ${title} to cart`}>
      <AddLabel>Add to cart</AddLabel>
    </AddButton>
  </Card>
);

/**
 * Memoized because this is a list row. It only pays off if the screen passes
 * stable callbacks — see ProductCard.type.ts.
 */
export const ProductCard = React.memo(ProductCardBase);
ProductCard.displayName = 'ProductCard';
