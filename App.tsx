import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { persistor, store } from './src/app/store';
import { RootNavigator } from './src/navigation';

/**
 * Provider order is load-bearing:
 *
 * SafeAreaProvider outermost, because navigation headers read insets from it.
 * PersistGate inside Provider, since it needs the store it is gating on.
 * RootNavigator inside both — it reads the effective colour scheme from the
 * store and mounts ThemeProvider + NavigationContainer from there.
 *
 * `loading={null}` renders nothing for the moment the persisted slices are
 * rehydrating from AsyncStorage — a spinner would flash for less time than it
 * takes to read.
 */
const App = () => (
  <SafeAreaProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RootNavigator />
      </PersistGate>
    </Provider>
  </SafeAreaProvider>
);

export default App;
