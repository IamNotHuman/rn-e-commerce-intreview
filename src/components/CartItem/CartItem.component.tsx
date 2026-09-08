import React from 'react';
import {formatPrice} from '../../utils';
import {QuantityStepper} from '../QuantityStepper';
import type {CartItemProps} from './CartItem.type';
import {
  Details,
  LineTotal,
  RemoveButton,
  RemoveLabel,
  Row,
  Thumbnail,
  Title,
} from './CartItem.style';

const CartItemBase = ({
  id,
  title,
  imageUrl,
  quantity,
  lineTotal,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) => (
  <Row>
    <Thumbnail source={{uri: imageUrl}} resizeMode="contain" />
    <Details>
      <Title numberOfLines={2}>{title}</Title>
      <LineTotal>{formatPrice(lineTotal)}</LineTotal>
      <RemoveButton
        onPress={() => onRemove(id)}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${title}`}>
        <RemoveLabel>Remove</RemoveLabel>
      </RemoveButton>
    </Details>
    <QuantityStepper
      quantity={quantity}
      onIncrement={() => onIncrement(id)}
      onDecrement={() => onDecrement(id)}
    />
  </Row>
);

/**
 * Memoized as a list row. The inline arrows handed to QuantityStepper are
 * deliberate: that child is not memoized, so binding the id here costs nothing
 * and keeps the stepper's own props free of ids.
 */
export const CartItem = React.memo(CartItemBase);
CartItem.displayName = 'CartItem';
