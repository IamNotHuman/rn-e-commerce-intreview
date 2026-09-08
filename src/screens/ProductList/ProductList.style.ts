import styled from 'styled-components/native';

export const Screen = styled.View`
  flex: 1;
  background-color: ${({theme}) => theme.colors.background};
`;

export const Toolbar = styled.View`
  padding-horizontal: ${({theme}) => theme.spacing.md}px;
  padding-top: ${({theme}) => theme.spacing.md}px;
`;

/**
 * R13.5: the search field's behaviour is configured here rather than in the
 * component, because these are props and props on a styled node belong in
 * .attrs (R6). Autocorrect on a product search fights the user, and
 * clearButtonMode is the iOS affordance for emptying the field.
 */
export const SearchInput = styled.TextInput.attrs(({theme}) => ({
  placeholderTextColor: theme.colors.textMuted,
  autoCorrect: false,
  autoCapitalize: 'none' as const,
  returnKeyType: 'search' as const,
  clearButtonMode: 'while-editing' as const,
}))`
  padding-horizontal: ${({theme}) => theme.spacing.md}px;
  padding-vertical: ${({theme}) => theme.spacing.sm}px;
  border-radius: ${({theme}) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({theme}) => theme.colors.border};
  background-color: ${({theme}) => theme.colors.surface};
  font-size: ${({theme}) => theme.text.body.size}px;
  color: ${({theme}) => theme.colors.text};
`;

export const CategoryRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: ${({theme}) => theme.spacing.sm}px;
`;

/**
 * R13.1: a chip is deliberately small, so it is slop-extended rather than
 * grown to 44pt, which would make the filter row dominate the screen.
 */
export const CategoryChip = styled.Pressable.attrs(({theme}) => ({
  hitSlop: theme.size.hitSlop,
}))<{selected: boolean}>`
  margin-right: ${({theme}) => theme.spacing.sm}px;
  margin-bottom: ${({theme}) => theme.spacing.sm}px;
  padding-horizontal: ${({theme}) => theme.spacing.md}px;
  padding-vertical: ${({theme}) => theme.spacing.xs}px;
  border-radius: ${({theme}) => theme.radius.lg}px;
  border-width: 1px;
  border-color: ${({theme, selected}) =>
    selected ? theme.colors.primary : theme.colors.border};
  background-color: ${({theme, selected}) =>
    selected ? theme.colors.primary : theme.colors.surface};
`;

export const CategoryLabel = styled.Text<{selected: boolean}>`
  font-size: ${({theme}) => theme.text.caption.size}px;
  color: ${({theme, selected}) =>
    selected ? theme.colors.onPrimary : theme.colors.text};
`;

export const CartBar = styled.Pressable`
  margin: ${({theme}) => theme.spacing.md}px;
  min-height: ${({theme}) => theme.size.touchTarget}px;
  justify-content: center;
  align-items: center;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme}) => theme.colors.primary};
`;

export const CartBarLabel = styled.Text`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.onPrimary};
`;

export const EmptyMessage = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xl}px;
  text-align: center;
  font-size: ${({theme}) => theme.text.body.size}px;
  color: ${({theme}) => theme.colors.textMuted};
`;

/**
 * The FlatList itself is left unstyled and wrapped instead: styled.FlatList is
 * generic over its item type, and threading that through adds noise for what is
 * only horizontal padding.
 */
export const ListWrapper = styled.View`
  flex: 1;
  padding-horizontal: ${({theme}) => theme.spacing.md}px;
`;
