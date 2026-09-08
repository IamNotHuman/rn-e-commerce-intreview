import React, {useCallback} from 'react';
import {FlatList} from 'react-native';
import type {ListRenderItemInfo} from 'react-native';
import {ErrorView} from '../../components/ErrorView';
import {Loader} from '../../components/Loader';
import {ProductCard} from '../../components/ProductCard';
import type {ProductListItem, ProductListProps} from './ProductList.type';
import {
  CartBar,
  CartBarLabel,
  CategoryChip,
  CategoryLabel,
  CategoryRow,
  EmptyMessage,
  ListWrapper,
  Screen,
  SearchInput,
  Toolbar,
} from './ProductList.style';

export const ProductListComponent = ({
  products,
  categories,
  selectedCategory,
  searchTerm,
  cartCount,
  status,
  error,
  onRetry,
  onSelectProduct,
  onAddToCart,
  onSelectCategory,
  onSearch,
  onOpenCart,
}: ProductListProps) => {
  /**
   * renderItem and keyExtractor are memoized because a new identity for either
   * makes FlatList re-render every row, which would undo the React.memo on
   * ProductCard. The handlers they close over are stable useCallbacks from the
   * container, so these stay stable too.
   */
  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<ProductListItem>) => (
      <ProductCard
        id={item.id}
        title={item.title}
        price={item.price}
        category={item.category}
        imageUrl={item.imageUrl}
        onPress={onSelectProduct}
        onAddToCart={onAddToCart}
      />
    ),
    [onSelectProduct, onAddToCart],
  );

  const keyExtractor = useCallback(
    (item: ProductListItem) => String(item.id),
    [],
  );

  if (status === 'loading') {
    return <Loader label="Loading products" />;
  }

  if (status === 'failed') {
    return (
      <ErrorView
        message={error ?? 'Something went wrong'}
        onRetry={onRetry}
      />
    );
  }

  return (
    <Screen>
      <Toolbar>
        <SearchInput
          value={searchTerm}
          onChangeText={onSearch}
          placeholder="Search products"
          accessibilityLabel="Search products"
        />
        <CategoryRow>
          <CategoryChip
            selected={selectedCategory === null}
            onPress={() => onSelectCategory(null)}
            accessibilityRole="button"
            accessibilityLabel="All categories">
            <CategoryLabel selected={selectedCategory === null}>
              All
            </CategoryLabel>
          </CategoryChip>
          {categories.map(category => (
            <CategoryChip
              key={category}
              selected={selectedCategory === category}
              onPress={() => onSelectCategory(category)}
              accessibilityRole="button"
              accessibilityLabel={category}>
              <CategoryLabel selected={selectedCategory === category}>
                {category}
              </CategoryLabel>
            </CategoryChip>
          ))}
        </CategoryRow>
      </Toolbar>

      <ListWrapper>
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={8}
          // R13.5: without this the first tap after typing is swallowed
          // dismissing the keyboard, so every product needs two taps.
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyMessage>No products match your filters.</EmptyMessage>
          }
        />
      </ListWrapper>

      <CartBar
        onPress={onOpenCart}
        accessibilityRole="button"
        accessibilityLabel={`Open cart, ${cartCount} items`}>
        <CartBarLabel>{`Cart · ${cartCount}`}</CartBarLabel>
      </CartBar>
    </Screen>
  );
};
