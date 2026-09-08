import styled from 'styled-components/native';

export const Screen = styled.ScrollView`
  flex: 1;
  background-color: ${({theme}) => theme.colors.background};
`;

export const Content = styled.View`
  padding: ${({theme}) => theme.spacing.md}px;
`;

export const Hero = styled.Image`
  width: 100%;
  height: 260px;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme}) => theme.colors.border};
`;

export const Title = styled.Text`
  margin-top: ${({theme}) => theme.spacing.md}px;
  font-size: ${({theme}) => theme.text.heading.size}px;
  font-weight: ${({theme}) => theme.text.heading.weight};
  color: ${({theme}) => theme.colors.text};
`;

export const Price = styled.Text`
  margin-top: ${({theme}) => theme.spacing.sm}px;
  font-size: ${({theme}) => theme.text.title.size}px;
  font-weight: ${({theme}) => theme.text.title.weight};
  color: ${({theme}) => theme.colors.primary};
`;

export const Category = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xs}px;
  font-size: ${({theme}) => theme.text.caption.size}px;
  color: ${({theme}) => theme.colors.textMuted};
`;

export const Description = styled.Text`
  margin-top: ${({theme}) => theme.spacing.md}px;
  font-size: ${({theme}) => theme.text.body.size}px;
  color: ${({theme}) => theme.colors.text};
  line-height: 20px;
`;

export const AddButton = styled.Pressable`
  margin-top: ${({theme}) => theme.spacing.lg}px;
  min-height: ${({theme}) => theme.size.touchTarget}px;
  justify-content: center;
  align-items: center;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme}) => theme.colors.primary};
`;

export const AddLabel = styled.Text`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.onPrimary};
`;

export const NotFound = styled.Text`
  margin-top: ${({theme}) => theme.spacing.xl}px;
  text-align: center;
  font-size: ${({theme}) => theme.text.body.size}px;
  color: ${({theme}) => theme.colors.textMuted};
`;
