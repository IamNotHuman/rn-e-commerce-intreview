import {combineReducers, configureStore} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistReducer,
  persistStore,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import productsReducer from '../features/products/productsSlice';
import cartReducer from '../features/cart/cartSlice';
import themeReducer from '../features/theme/themeSlice';

/**
 * R11: the cart and the theme preference are persisted; products are not.
 * Products are refetched on a cold start — caching a catalogue that the app
 * re-requests once per launch anyway would only add a staleness problem. The
 * theme override is a user choice, and a choice that resets on relaunch is
 * indistinguishable from a bug.
 */
const cartPersistConfig = {key: 'cart', storage: AsyncStorage};
const themePersistConfig = {key: 'theme', storage: AsyncStorage};

const rootReducer = combineReducers({
  products: productsReducer,
  cart: persistReducer(cartPersistConfig, cartReducer),
  theme: persistReducer(themePersistConfig, themeReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // redux-persist's lifecycle actions carry non-serializable payloads.
      // Without this exemption every rehydrate logs a serializability warning.
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
