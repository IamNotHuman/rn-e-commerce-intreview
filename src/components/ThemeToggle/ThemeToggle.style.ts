import styled from 'styled-components/native';

/**
 * R13.1: a header glyph is deliberately small, so the target is slop-extended
 * rather than grown to 44pt inside the navigation bar.
 */
export const Button = styled.Pressable.attrs(({theme}) => ({
  hitSlop: theme.size.hitSlop,
}))`
  padding: ${({theme}) => theme.spacing.xs}px;
`;

export const Glyph = styled.Text`
  font-size: ${({theme}) => theme.text.title.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme}) => theme.colors.text};
`;
