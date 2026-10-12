import { render } from '@testing-library/react-native';
import type { ComponentRef } from 'react';
import { createRef } from 'react';
import { View } from 'react-native';

import Animated from '../src';

type ViewInstance = ComponentRef<typeof View>;

describe('a ref that changes after mount', () => {
  test('View attaches the new ref and detaches the old one', () => {
    const first = createRef<ViewInstance>();
    const second = createRef<ViewInstance>();

    const { rerender } = render(<View ref={first} />);
    rerender(<View ref={second} />);

    expect(first.current).toBeNull();
    expect(second.current).not.toBeNull();
  });

  test('Animated.View attaches the new ref and detaches the old one', () => {
    const first = createRef<ViewInstance>();
    const second = createRef<ViewInstance>();

    const { rerender } = render(<Animated.View ref={first} />);
    rerender(<Animated.View ref={second} />);

    expect(first.current).toBeNull();
    expect(second.current).not.toBeNull();
  });

  test('View attaches a ref added after mount', () => {
    const added = createRef<ViewInstance>();

    const { rerender } = render(<View />);
    rerender(<View ref={added} />);

    expect(added.current).not.toBeNull();
  });

  test('Animated.View attaches a ref added after mount', () => {
    const added = createRef<ViewInstance>();

    const { rerender } = render(<Animated.View />);
    rerender(<Animated.View ref={added} />);

    expect(added.current).not.toBeNull();
  });
});
