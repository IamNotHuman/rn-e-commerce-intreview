import styled from 'styled-components/native';

export const Screen = styled.View`
  flex: 1;
  padding: ${({theme}) => theme.spacing.md}px;
  background-color: ${({theme}) => theme.colors.background};
`;

export const Empty = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xl}px;
  text-align: center;
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.textMuted};
`;

export const Totals = styled.View`
  margin-top: ${({theme}) => theme.spacing.md}px;
  padding-top: ${({theme}) => theme.spacing.md}px;
  border-top-width: 1px;
  border-top-color: ${({theme}) => theme.colors.border};
`;

export const TotalItems = styled.Text`
  font-size: ${({theme}) => theme.text.title.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme}) => theme.colors.text};
`;

export const TotalPrice = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xs}px;
  font-size: ${({theme}) => theme.text.price.size}px;
  font-weight: ${({theme}) => theme.text.price.weight};
  color: ${({theme}) => theme.colors.text};
`;

/**
 * R13.3: the same `disabled` value blocks the press and drives the colour, so
 * the control cannot look live while being inert. The case here is checkout
 * with an empty cart.
 */
export const PrimaryButton = styled.Pressable`
  margin-top: ${({theme}) => theme.spacing.md}px;
  min-height: ${({theme}) => theme.size.touchTarget}px;
  align-items: center;
  justify-content: center;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme, disabled}) =>
    disabled ? theme.colors.disabled : theme.colors.primary};
`;

export const PrimaryLabel = styled.Text<{$disabled?: boolean}>`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme, $disabled}) =>
    $disabled ? theme.colors.onDisabled : theme.colors.onPrimary};
`;

export const SecondaryButton = styled.Pressable.attrs(({theme}) => ({
  hitSlop: theme.size.hitSlop,
}))`
  margin-top: ${({theme}) => theme.spacing.sm}px;
  min-height: ${({theme}) => theme.size.touchTarget}px;
  align-items: center;
  justify-content: center;
`;

export const SecondaryLabel = styled.Text`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.textMuted};
`;

export const Panel = styled.View`
  margin-top: ${({theme}) => theme.spacing.md}px;
  padding: ${({theme}) => theme.spacing.md}px;
  border-radius: ${({theme}) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({theme}) => theme.colors.border};
  background-color: ${({theme}) => theme.colors.surface};
`;

export const PanelTitle = styled.Text`
  margin-bottom: ${({theme}) => theme.spacing.sm}px;
  font-size: ${({theme}) => theme.text.title.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme}) => theme.colors.text};
`;

export const PanelLine = styled.Text`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.textMuted};
`;
