# Canonical templates

Copy these shapes when scaffolding. They encode R1–R12 — matching them is the fastest way to conform.

## Contents

- Theme
- Presentational component folder (4 files)
- Screen folder (5 files)
- API client and types
- Slice
- Selectors
- Store
- Typed hooks
- Navigation

---

## Theme

### `theme/theme.type.ts` and `theme/theme.ts`

No template — **read the live files**. `src/theme/theme.type.ts` and
`src/theme/theme.ts` are the canonical token set, and they have grown past what
a snippet here can track: `colors`, `spacing`, `radius`, `fontSize`,
`fontWeight`, `text` (R12b role variants), `shadow` (R12c elevation levels) and
`size` (R13 touch targets). A copy in this file would go stale on the next
token and get pasted over a richer theme.

Adding a token means editing both files together — the value in `theme.ts`, its
type in `theme.type.ts`, and an export from `theme/index.ts` if it introduces a
new group (R12a).

Spacing, radius and size are numbers, not pre-formatted strings, so they stay
usable in arithmetic and in props that take raw numbers (`hitSlop`, `Image`
dimensions, `FlatList` offsets). Styles add the unit at the interpolation site.

### `theme/styled.d.ts`

```ts
import 'styled-components/native';
import type { AppTheme } from './theme.type';

declare module 'styled-components/native' {
  export interface DefaultTheme extends AppTheme {}
}
```

Augment `styled-components/native`, **not** `styled-components`. v6 declares `DefaultTheme` once and re-exports it per entry point; augmenting the root entry leaves the native entry's copy empty, and every `props.theme` access silently degrades to `any` instead of erroring.

### `theme/index.ts`

```ts
export { theme } from './theme';
export type { AppTheme } from './theme.type';
```

---

## Presentational component folder

### `components/ProductCard/ProductCard.type.ts`

```ts
export interface ProductCardProps {
  title: string;
  price: number;
  category: string;
  imageUrl: string;
  onPress: () => void;
  onAddToCart: () => void;
}
```

Primitives and callbacks only. No `Product`, no `ProductDTO`, no `RootState`.

### `components/ProductCard/ProductCard.style.ts`

```ts
import styled from 'styled-components/native';

export const Card = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const Thumbnail = styled.Image`
  width: 100%;
  height: 140px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
`;

export const Title = styled.Text`
  margin-top: ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.body}px;
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const Meta = styled.Text`
  margin-top: ${({ theme }) => theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.caption}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
```

R12: no literal colors, spacing, radii, or font sizes. The only literals left are genuinely layout-intrinsic ones (`width: 100%`, a fixed thumbnail height, `1px` hairline borders).

### `components/ProductCard/ProductCard.component.tsx`

```tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { ProductCardProps } from './ProductCard.type';
import { Card, Thumbnail, Title, Meta } from './ProductCard.style';

export const ProductCard = ({
  title,
  price,
  category,
  imageUrl,
  onPress,
  onAddToCart,
}: ProductCardProps) => (
  <Pressable onPress={onPress}>
    <Card>
      <Thumbnail source={{ uri: imageUrl }} resizeMode="contain" />
      <Title numberOfLines={2}>{title}</Title>
      <Meta>
        ${price.toFixed(2)} · {category}
      </Meta>
      <Pressable onPress={onAddToCart} accessibilityRole="button">
        <Text>Add to cart</Text>
      </Pressable>
    </Card>
  </Pressable>
);
```

No `react-redux` import. No `useNavigation`. No inline styles.

### `components/ProductCard/index.ts`

```ts
export { ProductCard } from './ProductCard.component';
export type { ProductCardProps } from './ProductCard.type';
```

---

## Screen folder

### `screens/ProductList/ProductList.type.ts`

```ts
import { FetchStatus } from '../../api/fakeStoreApi.type';

export interface ProductListItem {
  id: number;
  title: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface ProductListProps {
  products: ProductListItem[];
  status: FetchStatus;
  error: string | null;
  onRetry: () => void;
  onSelectProduct: (id: number) => void;
  onAddToCart: (id: number) => void;
}
```

### `screens/ProductList/ProductList.component.tsx`

```tsx
import React from 'react';
import { FlatList } from 'react-native';
import { ProductCard } from '../../components/ProductCard';
import { Loader } from '../../components/Loader';
import { ErrorView } from '../../components/ErrorView';
import { ProductListProps } from './ProductList.type';
import { Screen } from './ProductList.style';

export const ProductListComponent = ({
  products,
  status,
  error,
  onRetry,
  onSelectProduct,
  onAddToCart,
}: ProductListProps) => {
  if (status === 'loading') return <Loader />;
  if (status === 'failed') {
    return <ErrorView message={error ?? 'Something went wrong'} onRetry={onRetry} />;
  }

  return (
    <Screen>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        initialNumToRender={8}
        renderItem={({ item }) => (
          <ProductCard
            title={item.title}
            price={item.price}
            category={item.category}
            imageUrl={item.imageUrl}
            onPress={() => onSelectProduct(item.id)}
            onAddToCart={() => onAddToCart(item.id)}
          />
        )}
      />
    </Screen>
  );
};
```

### `screens/ProductList/ProductList.container.tsx`

```tsx
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchProducts } from '../../features/products/productsSlice';
import { selectVisibleProducts } from '../../features/products/selectors';
import { addItem } from '../../features/cart/cartSlice';
import { ProductListComponent } from './ProductList.component';

export const ProductListContainer = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const products = useAppSelector(selectVisibleProducts);
  const status = useAppSelector((state) => state.products.status);
  const error = useAppSelector((state) => state.products.error);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProducts());
  }, [status, dispatch]);

  return (
    <ProductListComponent
      products={products}
      status={status}
      error={error}
      onRetry={() => dispatch(fetchProducts())}
      onSelectProduct={(id) => navigation.navigate('ProductDetail', { id })}
      onAddToCart={(id) => dispatch(addItem({ id, qty: 1 }))}
    />
  );
};
```

Maps state to props, dispatch to callbacks, renders one element. Nothing else.

### `screens/ProductList/index.ts`

```ts
export { ProductListContainer as ProductList } from './ProductList.container';
```

---

## API client and types

### `api/fakeStoreApi.type.ts`

```ts
export interface ProductDTO {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

export type FetchStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
```

### `api/fakeStoreApi.ts`

```ts
import { Product, ProductDTO } from './fakeStoreApi.type';

const BASE_URL = 'https://fakestoreapi.com';

const toProduct = (dto: ProductDTO): Product => ({
  id: dto.id,
  title: dto.title,
  price: dto.price,
  description: dto.description,
  category: dto.category,
  imageUrl: dto.image,
});

export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${BASE_URL}/products`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data: ProductDTO[] = await response.json();
  return data.map(toProduct);
};
```

The mapper is the boundary. `image` never escapes this file.

---

## Slice

### `features/products/productsSlice.ts`

```ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getProducts } from '../../api/fakeStoreApi';
import { FetchStatus, Product } from '../../api/fakeStoreApi.type';

interface ProductsState {
  items: Product[];
  status: FetchStatus;
  error: string | null;
  selectedCategory: string | null;
  searchTerm: string;
}

const initialState: ProductsState = {
  items: [],
  status: 'idle',
  error: null,
  selectedCategory: null,
  searchTerm: '',
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => getProducts(),
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unable to load products';
      });
  },
});

export const { setCategory, setSearchTerm } = productsSlice.actions;
export default productsSlice.reducer;
```

Category and search live in state as filter criteria — they never trigger a request.

### `features/cart/cartSlice.ts`

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  quantities: Record<number, number>;
}

const initialState: CartState = { quantities: {} };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{ id: number; qty: number }>) {
      const { id, qty } = action.payload;
      state.quantities[id] = (state.quantities[id] ?? 0) + qty;
    },
    incrementItem(state, action: PayloadAction<number>) {
      state.quantities[action.payload] = (state.quantities[action.payload] ?? 0) + 1;
    },
    decrementItem(state, action: PayloadAction<number>) {
      const id = action.payload;
      const next = (state.quantities[id] ?? 0) - 1;
      if (next <= 0) delete state.quantities[id];
      else state.quantities[id] = next;
    },
    removeItem(state, action: PayloadAction<number>) {
      delete state.quantities[action.payload];
    },
    clearCart(state) {
      state.quantities = {};
    },
  },
});

export const { addItem, incrementItem, decrementItem, removeItem, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
```

Storing quantities by id rather than duplicating product objects keeps the cart a single source of truth — product data stays in the products slice.

---

## Selectors

### `features/cart/selectors.ts`

```ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

const selectQuantities = (state: RootState) => state.cart.quantities;
const selectProductItems = (state: RootState) => state.products.items;

export const selectCartLines = createSelector(
  [selectQuantities, selectProductItems],
  (quantities, products) =>
    products
      .filter((product) => quantities[product.id] > 0)
      .map((product) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantities[product.id],
        lineTotal: product.price * quantities[product.id],
      })),
);

export const selectTotalItems = createSelector([selectQuantities], (quantities) =>
  Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
);

export const selectTotalPrice = createSelector([selectCartLines], (lines) =>
  lines.reduce((sum, line) => sum + line.lineTotal, 0),
);
```

### `features/products/selectors.ts`

```ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

const selectItems = (state: RootState) => state.products.items;
const selectCategory = (state: RootState) => state.products.selectedCategory;
const selectSearch = (state: RootState) => state.products.searchTerm;

export const selectCategories = createSelector([selectItems], (items) =>
  Array.from(new Set(items.map((item) => item.category))),
);

export const selectVisibleProducts = createSelector(
  [selectItems, selectCategory, selectSearch],
  (items, category, search) => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (!category || item.category === category) &&
        (!term || item.title.toLowerCase().includes(term)),
    );
  },
);

export const selectProductById = (id: number) =>
  createSelector([selectItems], (items) => items.find((item) => item.id === id) ?? null);
```

`selectProductById` is what lets `ProductDetail` render from cache instead of firing a second request.

---

## Store

### `app/store.ts`

```ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import productsReducer from '../features/products/productsSlice';
import cartReducer from '../features/cart/cartSlice';

const cartPersistConfig = { key: 'cart', storage: AsyncStorage };

const rootReducer = combineReducers({
  products: productsReducer,
  cart: persistReducer(cartPersistConfig, cartReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

The `serializableCheck` exemption is required — without it redux-persist's internal actions log warnings on every rehydrate.

### `app/hooks.ts`

```ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

Containers use these, never the raw hooks with an inline `RootState` cast.

---

## Navigation

### `App.tsx`

```tsx
import React, { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from 'styled-components/native';
import { store, persistor } from './src/app/store';
import { getTheme } from './src/theme';
import { toNavigationTheme } from './src/navigation';
import { ProductList } from './src/screens/ProductList';
import { ProductDetail } from './src/screens/ProductDetail';
import { Cart } from './src/screens/Cart';

export type RootStackParamList = {
  ProductList: undefined;
  ProductDetail: { id: number };
  Cart: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const theme = getTheme(useColorScheme());
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);

  return (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ThemeProvider theme={theme}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator initialRouteName="ProductList">
            <Stack.Screen name="ProductList" component={ProductList} options={{ title: 'Products' }} />
            <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ title: 'Detail' }} />
            <Stack.Screen name="Cart" component={Cart} options={{ title: 'Cart' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </PersistGate>
  </Provider>
  );
};

export default App;
```

The navigator imports folder paths only. It has no idea a container/component split exists underneath. `ThemeProvider` sits inside `PersistGate` and outside `NavigationContainer` so every screen and every navigator-rendered header resolves tokens.
