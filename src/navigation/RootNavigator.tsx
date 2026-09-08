import React, { useCallback, useMemo } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from 'styled-components/native';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { ThemeToggle } from '../components/ThemeToggle';
import { toggleScheme } from '../features/theme/themeSlice';
import { selectEffectiveScheme } from '../features/theme/selectors';
import { Cart } from '../screens/Cart';
import { ProductDetail } from '../screens/ProductDetail';
import { ProductList } from '../screens/ProductList';
import { getTheme } from '../theme';
import type { RootStackParamList } from './navigation.type';
import { toNavigationTheme } from './navigationTheme';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Everything below the store: theme resolution, the styled-components and
 * navigation providers, the stack, and the header toggle. It has to sit inside
 * <Provider> because the effective scheme is read from the store, which is
 * why App.tsx no longer holds the navigator itself.
 *
 * This is the one non-screen file that reads the store (rule 2 amendment):
 * navigation chrome has no container of its own, and a header button that
 * dispatches has nowhere else conforming to live.
 */
export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const osScheme = useColorScheme();
  const scheme = useAppSelector(state =>
    selectEffectiveScheme(state, osScheme),
  );
  const theme = getTheme(scheme);
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);

  const onToggle = useCallback(() => {
    dispatch(toggleScheme(scheme));
  }, [dispatch, scheme]);

  // headerRight is called by the navigator on every header render; a stable
  // element factory keeps it from remounting the toggle each time.
  const headerRight = useCallback(
    () => <ThemeToggle scheme={scheme} onToggle={onToggle} />,
    [scheme, onToggle],
  );

  return (
    <ThemeProvider theme={theme}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName="ProductList"
          screenOptions={{ headerRight }}
        >
          <Stack.Screen
            name="ProductList"
            component={ProductList}
            options={{ title: 'Products' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetail}
            options={{ title: 'Detail' }}
          />
          <Stack.Screen
            name="Cart"
            component={Cart}
            options={{ title: 'Cart' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
};
