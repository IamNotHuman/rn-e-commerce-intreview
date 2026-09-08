import { darkTheme, getTheme, lightTheme } from '../../src/theme';
import type { ThemeColors } from '../../src/theme';

describe('themes', () => {
  it('differ only in scheme and colors', () => {
    const shared = (theme: typeof lightTheme) =>
      Object.fromEntries(
        Object.entries(theme).filter(
          ([key]) => !['scheme', 'colors'].includes(key),
        ),
      );

    expect(shared(darkTheme)).toEqual(shared(lightTheme));
    expect(lightTheme.scheme).toBe('light');
    expect(darkTheme.scheme).toBe('dark');
  });

  // A colour role present in one palette and missing from the other would
  // typecheck against ThemeColors only if it were optional, which none are —
  // but a copy-paste that leaves a light hex in the dark palette would not.
  it('gives every colour role a distinct value per scheme', () => {
    const roles = Object.keys(lightTheme.colors) as (keyof ThemeColors)[];

    roles.forEach(role => {
      expect(darkTheme.colors[role]).not.toBe(lightTheme.colors[role]);
    });
  });

  it('resolves the OS scheme, defaulting anything unstated to light', () => {
    expect(getTheme('dark')).toBe(darkTheme);
    expect(getTheme('light')).toBe(lightTheme);
    expect(getTheme(null)).toBe(lightTheme);
    expect(getTheme(undefined)).toBe(lightTheme);
  });
});
