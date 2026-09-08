import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${({theme}) => theme.spacing.lg}px;
`;

export const Label = styled.Text`
  margin-top: ${({theme}) => theme.spacing.sm}px;
  font-size: ${({theme}) => theme.text.body.size}px;
  color: ${({theme}) => theme.colors.textMuted};
`;

/**
 * Colour and size live here rather than as props on the component, so the
 * spinner obeys R6/R12 like every other styled node.
 */
export const Spinner = styled.ActivityIndicator.attrs(({theme}) => ({
  color: theme.colors.primary,
  size: 'large' as const,
}))``;
