import React from 'react';
import {ErrorView} from '../../components/ErrorView';
import {Loader} from '../../components/Loader';
import type {ProductDetailProps} from './ProductDetail.type';
import {
  AddButton,
  AddLabel,
  Category,
  Content,
  Description,
  Hero,
  NotFound,
  Price,
  Screen,
  Title,
} from './ProductDetail.style';

export const ProductDetailComponent = ({
  product,
  status,
  error,
  onAddToCart,
  onRetry,
}: ProductDetailProps) => {
  if (status === 'loading' || status === 'idle') {
    return <Loader label="Loading product" />;
  }

  if (status === 'failed') {
    return (
      <ErrorView message={error ?? 'Something went wrong'} onRetry={onRetry} />
    );
  }

  if (!product) {
    return (
      <Screen>
        <Content>
          <NotFound>That product is no longer available.</NotFound>
        </Content>
      </Screen>
    );
  }

  return (
    <Screen>
      <Content>
        <Hero source={{uri: product.imageUrl}} resizeMode="contain" />
        <Title>{product.title}</Title>
        <Price>{`$${product.price.toFixed(2)}`}</Price>
        <Category>{product.category}</Category>
        <Description>{product.description}</Description>
        <AddButton
          onPress={onAddToCart}
          accessibilityRole="button"
          accessibilityLabel="Add to cart">
          <AddLabel>Add to cart</AddLabel>
        </AddButton>
      </Content>
    </Screen>
  );
};
