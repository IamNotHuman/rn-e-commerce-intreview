import styled from 'styled-components/native';

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

/**
 * R13: the visual box stays 32px because a larger one crowds the quantity
 * beside it, so the target is extended instead — 32 + 8 on every side is 48
 * effective, clearing both the iOS 44pt and Android 48dp minimums. hitSlop is
 * a prop rather than a style property, so it arrives through .attrs and stays
 * out of the component file (R6).
 *
 * `disabled` is Pressable's own prop, so the same value that blocks the press
 * is the one the style branches on — the control cannot dim without also going
 * inert, or go inert without dimming.
 */
export const StepButton = styled.Pressable.attrs(({theme}) => ({
  hitSlop: theme.size.hitSlop,
}))`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: ${({theme}) => theme.radius.sm}px;
  border-width: 1px;
  border-color: ${({theme, disabled}) =>
    disabled ? theme.colors.disabled : theme.colors.border};
  background-color: ${({theme, disabled}) =>
    disabled ? theme.colors.disabled : theme.colors.surface};
`;

/**
 * The glyph cannot read `disabled` off the Pressable, so it takes it as a
 * transient prop — styled-components strips `$`-prefixed props before they
 * reach the Text, which would otherwise get an unknown `disabled` prop.
 */
export const StepLabel = styled.Text<{$disabled?: boolean}>`
  font-size: ${({theme}) => theme.text.title.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme, $disabled}) =>
    $disabled ? theme.colors.onDisabled : theme.colors.text};
`;

export const Quantity = styled.Text`
  min-width: 32px;
  text-align: center;
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.text};
`;
