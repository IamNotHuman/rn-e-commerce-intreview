import React from 'react';
import type {ThemeToggleProps} from './ThemeToggle.type';
import {Button, Glyph} from './ThemeToggle.style';

/**
 * Shows the scheme it will switch *to*, which is the convention users expect
 * from a single toggle (a moon while in light mode). Glyph-only, so the label
 * carries the meaning for assistive tech (R13.1).
 */
export const ThemeToggle = ({scheme, onToggle}: ThemeToggleProps) => {
  const next = scheme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${next} theme`}>
      {/* U+FE0E forces text presentation: bare ☀ renders as a colour emoji and ignores the theme colour */}
      <Glyph>{next === 'dark' ? '☾' : '☀\uFE0E'}</Glyph>
    </Button>
  );
};
