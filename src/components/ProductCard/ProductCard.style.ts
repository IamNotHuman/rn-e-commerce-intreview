import styled from 'styled-components/native';

export const Card = styled.Pressable`
  padding: ${({theme}) => theme.spacing.md}px;
  margin-bottom: ${({theme}) => theme.spacing.md}px;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme}) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({theme}) => theme.colors.border};
`;

/**
 * R13.4: fixed height plus a placeholder colour, so the slot is visible while
 * the bytes land instead of the row snapping open. The dimensions are
 * layout-intrinsic and stay literals; the colour is a token.
 */
export const Thumbnail = styled.Image`
  width: 100%;
  height: 140px;
  border-radius: ${({theme}) => theme.radius.sm}px;
  background-color: ${({theme}) => theme.colors.border};
`;

export const Title = styled.Text`
  margin-top: ${({theme}) => theme.spacing.sm}px;
  font-size: ${({theme}) => theme.text.title.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme}) => theme.colors.text};
`;

export const Price = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xs}px;
  font-size: ${({theme}) => theme.text.price.size}px;
  font-weight: ${({theme}) => theme.text.price.weight};
  color: ${({theme}) => theme.colors.text};
`;

export const Category = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xs}px;
  font-size: ${({theme}) => theme.text.caption.size}px;
  font-weight: ${({theme}) => theme.text.caption.weight};
  color: ${({theme}) => theme.colors.textMuted};
`;

/**
 * R13.1: the box is grown to the platform minimum rather than slop-extended,
 * because a full-width primary action has the room for it.
 */
export const AddButton = styled.Pressable`
  margin-top: ${({theme}) => theme.spacing.md}px;
  min-height: ${({theme}) => theme.size.touchTarget}px;
  align-items: center;
  justify-content: center;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme}) => theme.colors.primary};
`;

export const AddLabel = styled.Text`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme}) => theme.colors.onPrimary};
`;
