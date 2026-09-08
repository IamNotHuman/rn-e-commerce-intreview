import React, {useCallback, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {addItem} from '../../features/cart/cartSlice';
import {selectTotalItems} from '../../features/cart/selectors';
import {
  fetchProducts,
  setCategory,
  setSearchTerm,
} from '../../features/products/productsSlice';
import {
  selectCategories,
  selectProductsError,
  selectProductsStatus,
  selectVisibleProducts,
} from '../../features/products/selectors';
import type {RootStackNavigation} from '../../navigation';
import {ProductListComponent} from './ProductList.component';

export const ProductListContainer = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigation>();

  const products = useAppSelector(selectVisibleProducts);
  const categories = useAppSelector(selectCategories);
  const selectedCategory = useAppSelector(
    state => state.products.selectedCategory,
  );
  const searchTerm = useAppSelector(state => state.products.searchTerm);
  const cartCount = useAppSelector(selectTotalItems);
  const status = useAppSelector(selectProductsStatus);
  const error = useAppSelector(selectProductsError);

  /**
   * R8: the catalogue is fetched exactly once. Category and search are applied
   * by selectors over the cached list, so neither this effect nor any handler
   * below ever refetches.
   */
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  /**
   * Every handler is a stable useCallback so the rows keep their memo. An
   * inline arrow here would hand FlatList a new renderItem on each render and
   * re-render every ProductCard (rule 2b).
   */
  const onRetry = useCallback(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const onSelectProduct = useCallback(
    (id: number) => navigation.navigate('ProductDetail', {id}),
    [navigation],
  );

  const onAddToCart = useCallback(
    (id: number) => {
      dispatch(addItem({id, qty: 1}));
    },
    [dispatch],
  );

  const onSelectCategory = useCallback(
    (category: string | null) => {
      dispatch(setCategory(category));
    },
    [dispatch],
  );

  const onSearch = useCallback(
    (term: string) => {
      dispatch(setSearchTerm(term));
    },
    [dispatch],
  );

  const onOpenCart = useCallback(
    () => navigation.navigate('Cart'),
    [navigation],
  );

  return (
    <ProductListComponent
      products={products}
      categories={categories}
      selectedCategory={selectedCategory}
      searchTerm={searchTerm}
      cartCount={cartCount}
      status={status}
      error={error}
      onRetry={onRetry}
      onSelectProduct={onSelectProduct}
      onAddToCart={onAddToCart}
      onSelectCategory={onSelectCategory}
      onSearch={onSearch}
      onOpenCart={onOpenCart}
    />
  );
};
