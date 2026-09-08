import React from 'react';
import type {LoaderProps} from './Loader.type';
import {Container, Label, Spinner} from './Loader.style';

export const Loader = ({label}: LoaderProps) => (
  <Container accessible accessibilityRole="progressbar">
    <Spinner />
    {label ? <Label>{label}</Label> : null}
  </Container>
);
