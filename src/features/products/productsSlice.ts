import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import {getProducts} from '../../api/fakeStoreApi';
import type {FetchStatus, Product} from '../../api/fakeStoreApi.type';

export interface ProductsState {
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

/**
 * The app's only thunk. Dispatched once from the ProductList container behind
 * an `if (status === 'idle')` guard (R8) — the catalogue is ~20 items that
 * already include `description`, so nothing else ever needs to refetch.
 */
export const fetchProducts = createAsyncThunk('products/fetchProducts', () =>
  getProducts(),
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
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => {
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

export const {setCategory, setSearchTerm} = productsSlice.actions;
export default productsSlice.reducer;
