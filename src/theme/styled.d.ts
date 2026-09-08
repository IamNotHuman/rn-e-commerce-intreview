/**
 * Types `props.theme` across every styled-component in the app.
 *
 * The augmentation must target 'styled-components/native', not
 * 'styled-components'. v6 declares DefaultTheme in dist/models/ThemeProvider
 * and each entry point re-exports it; augmenting the root entry leaves the
 * native entry's DefaultTheme empty, so `theme.spacing` silently fails to
 * resolve. Verified both directions: valid tokens typecheck, and a bogus one
 * ("theme.spacing.nope") is rejected as not existing on ThemeSpacing.
 */
import 'styled-components/native';
import type {AppTheme} from './theme.type';

declare module 'styled-components/native' {
  export interface DefaultTheme extends AppTheme {}
}
