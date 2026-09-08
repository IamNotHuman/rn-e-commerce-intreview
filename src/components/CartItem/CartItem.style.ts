import styled from 'styled-components/native';

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${({theme}) => theme.spacing.md}px;
  margin-bottom: ${({theme}) => theme.spacing.sm}px;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme}) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({theme}) => theme.colors.border};
`;

/**
 * R13.4: fixed box plus a placeholder colour so the row does not reflow when
 * the image resolves.
 */
export const Thumbnail = styled.Image`
  width: 56px;
  height: 56px;
  border-radius: ${({theme}) => theme.radius.sm}px;
  background-color: ${({theme}) => theme.colors.border};
`;

export const Details = styled.View`
  flex: 1;
  margin-horizontal: ${({theme}) => theme.spacing.md}px;
`;

export const Title = styled.Text`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.text};
`;

export const LineTotal = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xs}px;
  font-size: ${({theme}) => theme.text.price.size}px;
  font-weight: ${({theme}) => theme.text.price.weight};
  color: ${({theme}) => theme.colors.text};
`;

/**
 * R13.1: a text-only control, so the box stays as small as the word and the
 * target is extended with slop instead.
 */
export const RemoveButton = styled.Pressable.attrs(({theme}) => ({
  hitSlop: theme.size.hitSlop,
}))`
  margin-top: ${({theme}) => theme.spacing.sm}px;
`;

export const RemoveLabel = styled.Text`
  font-size: ${({theme}) => theme.text.caption.size}px;
  color: ${({theme}) => theme.colors.danger};
`;
