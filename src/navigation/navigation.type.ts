import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

/**
 * Lives here rather than in App.tsx so containers can type useNavigation and
 * useRoute without importing from App — App imports every screen, so a screen
 * importing back from App would close the loop. Type-only, so it would never
 * be a runtime cycle, but the direction of the dependency would still be wrong.
 */
export type RootStackParamList = {
  ProductList: undefined;
  ProductDetail: {id: number};
  Cart: undefined;
};

export type RootStackNavigation =
  NativeStackNavigationProp<RootStackParamList>;

export type ProductDetailRoute = RouteProp<RootStackParamList, 'ProductDetail'>;
