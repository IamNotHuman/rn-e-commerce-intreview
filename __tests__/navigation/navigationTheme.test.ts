import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import {toNavigationTheme} from '../../src/navigation';
import {darkTheme, lightTheme} from '../../src/theme';

describe('toNavigationTheme', () => {
  it('paints the navigator chrome from the app palette', () => {
    const nav = toNavigationTheme(darkTheme);

    expect(nav.dark).toBe(true);
    expect(nav.colors).toMatchObject({
      primary: darkTheme.colors.primary,
      background: darkTheme.colors.background,
      card: darkTheme.colors.surface,
      text: darkTheme.colors.text,
      border: darkTheme.colors.border,
      notification: darkTheme.colors.danger,
    });
  });

  it('takes fonts from the matching react-navigation preset', () => {
    expect(toNavigationTheme(lightTheme).fonts).toBe(DefaultTheme.fonts);
    expect(toNavigationTheme(darkTheme).fonts).toBe(DarkTheme.fonts);
  });
});
