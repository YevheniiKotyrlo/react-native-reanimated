import React, { useEffect } from 'react';
import type { ComponentType } from 'react';
import type { HostComponent, ScrollViewProps, ViewProps } from 'react-native';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

// React Native's host scroll view, without the ScrollView component that listens to its events in JavaScript.
const NativeScrollView: HostComponent<ScrollViewProps> =
  require('react-native/Libraries/Components/ScrollView/ScrollViewNativeComponent').default;
const NativeScrollContentView: ComponentType<ViewProps> =
  Platform.OS === 'ios'
    ? require('react-native/Libraries/Components/ScrollView/ScrollContentViewNativeComponent')
        .default
    : View;

const AnimatedNativeScrollView =
  Animated.createAnimatedComponent(NativeScrollView);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const SCROLL_EVENT_THROTTLE_MS = 0;
const SCROLL_SPEED_PER_SECOND = 1500;
const SCROLL_RANGE = 8000;
const ROW_COUNT = 50;
const ROW_HEIGHT = 200;
const ROWS = Array.from({ length: ROW_COUNT }, (_, index) => index);

export default function EmptyExample() {
  const scrollViewRef =
    useAnimatedRef<React.ComponentRef<typeof AnimatedNativeScrollView>>();
  const eventCount = useSharedValue(0);
  const reportedSecond = useSharedValue(-1);
  const readout = useSharedValue('');

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: () => {
      eventCount.value += 1;
    },
  });

  const scrollDriver = useFrameCallback(({ timeSinceFirstFrame }) => {
    const travelled =
      ((timeSinceFirstFrame / 1000) * SCROLL_SPEED_PER_SECOND) %
      (2 * SCROLL_RANGE);
    scrollTo(
      scrollViewRef,
      0,
      travelled < SCROLL_RANGE ? travelled : 2 * SCROLL_RANGE - travelled,
      false
    );
    const second = Math.floor(timeSinceFirstFrame / 1000);
    if (second !== reportedSecond.value) {
      reportedSecond.value = second;
      readout.value = `${eventCount.value} scroll events in ${second} s`;
    }
  }, false);

  useEffect(() => {
    scrollDriver.setActive(true);
  }, [scrollDriver]);

  const readoutProps = useAnimatedProps(() => ({
    text: readout.value,
    defaultValue: readout.value,
  }));

  return (
    <View style={styles.container}>
      <AnimatedTextInput
        editable={false}
        animatedProps={readoutProps}
        style={styles.readout}
      />
      <AnimatedNativeScrollView
        ref={scrollViewRef}
        onScroll={scrollHandler}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE_MS}
        style={styles.scrollView}>
        <NativeScrollContentView collapsable={false}>
          {ROWS.map((row) => (
            <View
              key={row}
              style={[
                styles.row,
                row % 2 === 0 ? styles.evenRow : styles.oddRow,
              ]}
            />
          ))}
        </NativeScrollContentView>
      </AnimatedNativeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    backgroundColor: 'white',
  },
  readout: {
    fontSize: 20,
    padding: 16,
    color: 'black',
  },
  scrollView: {
    flex: 1,
    overflow: 'scroll',
  },
  row: {
    height: ROW_HEIGHT,
  },
  evenRow: {
    backgroundColor: '#b58df1',
  },
  oddRow: {
    backgroundColor: '#82cab2',
  },
});
