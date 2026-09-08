export interface ThemeToggleProps {
  /** The scheme currently in effect; the button shows the one it switches to. */
  scheme: 'light' | 'dark';
  onToggle: () => void;
}
