import React from 'react';
import type {ErrorViewProps} from './ErrorView.type';
import {Container, Message, RetryButton, RetryLabel} from './ErrorView.style';

/**
 * R9: a failure always offers a way out. onRetry is wired by the container to
 * re-dispatch the same thunk.
 */
export const ErrorView = ({message, onRetry}: ErrorViewProps) => (
  <Container>
    <Message>{message}</Message>
    <RetryButton onPress={onRetry} accessibilityRole="button">
      <RetryLabel>Try again</RetryLabel>
    </RetryButton>
  </Container>
);
