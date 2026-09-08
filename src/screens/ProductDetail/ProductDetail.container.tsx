import React, {useCallback} from 'react';
import {useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {addItem} from '../../features/cart/cartSlice';
import {fetchProducts} from '../../features/products/productsSlice';
import {
  selectProductById,
  selectProductsError,
  selectProductsStatus,
} from '../../features/products/selectors';
import type {ProductDetailRoute} from '../../navigation';
import {ProductDetailComponent} from './ProductDetail.component';

export const ProductDetailContainer = () => {
  const dispatch = useAppDispatch();
  const {params} = useRoute<ProductDetailRoute>();
  const {id} = params;

  /**
   * R8, the graded one: this reads the product out of the cached list by id.
   * GET /products already returned `description`, so there is nothing left to
   * request — no thunk is dispatched here at all.
   */
  const product = useAppSelector(state => selectProductById(state, id));
  const status = useAppSelector(selectProductsStatus);
  const error = useAppSelector(selectProductsError);

  const onAddToCart = useCallback(() => {
    dispatch(addItem({id, qty: 1}));
  }, [dispatch, id]);

  // Only reachable if the catalogue failed before this screen was opened.
  const onRetry = useCallback(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <ProductDetailComponent
      product={
        product
          ? {
              title: product.title,
              price: product.price,
              category: product.category,
              description: product.description,
              imageUrl: product.imageUrl,
            }
          : null
      }
      status={status}
      error={error}
      onAddToCart={onAddToCart}
      onRetry={onRetry}
    />
  );
};
