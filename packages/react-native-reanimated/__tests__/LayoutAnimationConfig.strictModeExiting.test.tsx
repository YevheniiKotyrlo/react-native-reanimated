import { render } from '@testing-library/react-native';
import type { Ref } from 'react';
import { StrictMode, useImperativeHandle } from 'react';
import { View } from 'react-native';

import { LayoutAnimationConfig } from '../src';

jest.mock('../src/core', () => ({
  ...jest.requireActual('../src/core'),
  setShouldAnimateExitingForTag: jest.fn(),
}));

const {
  setShouldAnimateExitingForTag,
}: {
  setShouldAnimateExitingForTag: jest.Mock;
} = jest.requireMock('../src/core');

function ForwardsHostInstance({ ref }: { ref?: Ref<unknown> }) {
  useImperativeHandle(ref, () => ({ __nativeTag: 42 }), []);
  return <View />;
}

describe('LayoutAnimationConfig skipExiting while it stays mounted', () => {
  beforeEach(() => {
    setShouldAnimateExitingForTag.mockClear();
  });

  test('mounting marks no child', () => {
    render(
      <LayoutAnimationConfig skipExiting>
        <ForwardsHostInstance />
      </LayoutAnimationConfig>
    );

    expect(setShouldAnimateExitingForTag.mock.calls).toEqual([]);
  });

  test('mounting under StrictMode marks no child', () => {
    render(
      <StrictMode>
        <LayoutAnimationConfig skipExiting>
          <ForwardsHostInstance />
        </LayoutAnimationConfig>
      </StrictMode>
    );

    expect(setShouldAnimateExitingForTag.mock.calls).toEqual([]);
  });
});
