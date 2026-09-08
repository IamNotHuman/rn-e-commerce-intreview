import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${({theme}) => theme.spacing.lg}px;
`;

export const Message = styled.Text`
  margin-bottom: ${({theme}) => theme.spacing.md}px;
  font-size: ${({theme}) => theme.text.body.size}px;
  color: ${({theme}) => theme.colors.danger};
  text-align: center;
`;

export const RetryButton = styled.Pressable`
  min-height: ${({theme}) => theme.size.touchTarget}px;
  justify-content: center;
  padding-horizontal: ${({theme}) => theme.spacing.lg}px;
  border-radius: ${({theme}) => theme.radius.md}px;
  background-color: ${({theme}) => theme.colors.primary};
`;

export const RetryLabel = styled.Text`
  font-size: ${({theme}) => theme.text.body.size}px;
  font-weight: ${({theme}) => theme.text.body.weight};
  color: ${({theme}) => theme.colors.onPrimary};
`;
