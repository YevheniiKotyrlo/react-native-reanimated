import {
  createShareable,
  runOnUISync,
  createWorkletRuntime,
  runOnRuntimeSync,
  type ShareableGuest,
  type ShareableGuestDecorator,
  type ShareableHostDecorator,
  isShareable,
  type PureShareableHost,
  type PureShareableGuest,
} from 'react-native-worklets';
import { describe, expect, test } from '../../ReJest/RuntimeTestsApi';

type StringDecorated = {
  myDecoration: string;
};

const decorateGuestProperty: ShareableGuestDecorator<number, StringDecorated> = (
  shareable: PureShareableGuest<number> & StringDecorated,
) => {
  'worklet';
  shareable.myDecoration = 'decorated';
  return shareable;
};

type FunctionDecorated = {
  myDecorationFunction: () => string;
};

const decorateGuestFunction: ShareableGuestDecorator<number, FunctionDecorated> = (
  shareable: PureShareableGuest<number> & FunctionDecorated,
) => {
  'worklet';
  shareable.myDecorationFunction = () => 'decorated function';
  return shareable;
};

const decorateGuestOverride: ShareableGuestDecorator<number> = (shareable: PureShareableGuest<number>) => {
  'worklet';
  shareable.getSync = () => {
    return -1;
  };
  return shareable;
};

const decorateHostProperty: ShareableHostDecorator<number, StringDecorated> = (
  shareable: PureShareableHost<number> & StringDecorated,
) => {
  'worklet';
  shareable.myDecoration = 'decorated host';
  return shareable;
};

const decorateHostFunction: ShareableHostDecorator<number, FunctionDecorated> = (
  shareable: PureShareableHost<number> & FunctionDecorated,
) => {
  'worklet';
  shareable.myDecorationFunction = () => 'decorated function';
  return shareable;
};

const decorateHostGetter: ShareableHostDecorator<number> = (shareable: PureShareableHost<number>) => {
  'worklet';
  Object.defineProperty(shareable, 'value', {
    get() {
      return 42;
    },
  });
  return shareable;
};

const decorateHostSetter: ShareableHostDecorator<number> = (shareable: PureShareableHost<number>) => {
  'worklet';
  let value = shareable.value;
  Object.defineProperty(shareable, 'value', {
    get() {
      return value + 42;
    },
    set(newValue) {
      value = newValue * 2;
    },
  });
  console.log('decorated with setter');
  return shareable;
};

describe('Test Shareable hosted on UI', () => {
  describe('as host', () => {
    test('isShareable', () => {
      const shareable = createShareable('UI', 0);
      const isShareableResult = runOnUISync(() => isShareable(shareable));
      expect(isShareableResult).toBe(true);
    });

    test('reads value on UI Runtime', () => {
      const shareable = createShareable('UI', 0);
      const value = runOnUISync(() => (shareable as ShareableGuest<number>).value);
      expect(value).toBe(0);
    });

    test('sets value on UI Runtime', () => {
      const shareable = createShareable('UI', 0);
      const value = runOnUISync(() => {
        shareable.value = 42;
        return shareable.value;
      });
      expect(value).toBe(42);
    });
  });

  describe('as guest on RN Runtime', () => {
    test('isShareable', () => {
      const shareable = createShareable('UI', 0);
      const isShareableResult = isShareable(shareable);
      expect(isShareableResult).toBe(true);
    });

    test('getSync', () => {
      const shareable = createShareable('UI', 0);
      const value = (shareable as ShareableGuest<number>).getSync();
      expect(value).toBe(0);
    });

    test('getAsync', async () => {
      const shareable = createShareable('UI', 0);
      const value = await (shareable as ShareableGuest<number>).getAsync();
      expect(value).toBe(0);
    });

    test('setSync', () => {
      const shareable = createShareable('UI', 0);
      (shareable as ShareableGuest<number>).setSync(42);
      const value = (shareable as ShareableGuest<number>).getSync();
      expect(value).toBe(42);
    });

    test('setAsync', async () => {
      const shareable = createShareable('UI', 0);
      (shareable as ShareableGuest<number>).setAsync(42);
      const value = await (shareable as ShareableGuest<number>).getAsync();
      expect(value).toBe(42);
    });
  });

  describe('as guest on Worker Runtime', () => {
    test('getSync on Worker Runtime', () => {
      const shareable = createShareable('UI', 0);
      const runtime = createWorkletRuntime({ name: 'test' });

      const value = runOnRuntimeSync(runtime, () => {
        'worklet';
        return (shareable as ShareableGuest<number>).getSync();
      });

      expect(value).toBe(0);
    });

    test('getAsync on Worker Runtime', async () => {
      // TODO: Not implemented yet
    });

    test('setSync on Worker Runtime', () => {
      const shareable = createShareable('UI', 0);
      const runtime = createWorkletRuntime({ name: 'test' });

      runOnRuntimeSync(runtime, () => {
        'worklet';
        (shareable as ShareableGuest<number>).setSync(42);
      });
      const value = (shareable as ShareableGuest<number>).getSync();

      expect(value).toBe(42);
    });

    test('setAsync on Worker Runtime', async () => {
      const shareable = createShareable('UI', 0);
      const runtime = createWorkletRuntime({ name: 'test' });

      runOnRuntimeSync(runtime, () => {
        'worklet';
        (shareable as ShareableGuest<number>).setAsync(42);
      });
      const value = await (shareable as ShareableGuest<number>).getAsync();

      expect(value).toBe(42);
    });
  });

  describe('with host decorator on RN Runtime', () => {
    test('decorator adds property', () => {
      const shareable = createShareable('UI', 0, { hostDecorator: decorateHostProperty });
      const decoration = runOnUISync(() => {
        'worklet';
        return shareable.myDecoration;
      });
      expect(decoration).toBe('decorated host');
    });

    test('decorator adds function', () => {
      const shareable = createShareable('UI', 0, { hostDecorator: decorateHostFunction });
      const decorationResult = runOnUISync(() => {
        'worklet';
        return shareable.myDecorationFunction!();
      });
      expect(decorationResult).toBe('decorated function');
    });

    test('decorator overrides getter', () => {
      const shareable = createShareable('UI', 0, { hostDecorator: decorateHostGetter });
      const value = runOnUISync(() => shareable.value);
      expect(value).toBe(42);
    });

    test('decorator overrides setter', () => {
      const shareable = createShareable('UI', 0, { hostDecorator: decorateHostSetter });
      const valuePre = runOnUISync(() => {
        'worklet';
        return shareable.value;
      });
      const valuePost = runOnUISync(() => {
        'worklet';
        shareable.value = 42;
        return shareable.value;
      });
      expect(valuePre).toBe(42);
      expect(valuePost).toBe(42 + 42 * 2);
    });
  });

  describe('with guest decorator on RN Runtime', () => {
    test('decorator adds property', () => {
      const shareable = createShareable('UI', 0, { guestDecorator: decorateGuestProperty });
      const decoration = shareable.myDecoration;
      expect(decoration).toBe('decorated');
    });

    test('decorator adds function', () => {
      const shareable = createShareable('UI', 0, { guestDecorator: decorateGuestFunction });
      const decorationResult = shareable.myDecorationFunction!();
      expect(decorationResult).toBe('decorated function');
    });

    test('decorator overrides method', () => {
      const shareable = createShareable('UI', 0, { guestDecorator: decorateGuestOverride });
      const getSyncValue = shareable.getSync!();
      expect(getSyncValue).toBe(-1);
    });
  });

  describe('with guest decorator on Worker Runtime', () => {
    test('decorator adds property', () => {
      const shareable = createShareable('UI', 0, { guestDecorator: decorateGuestProperty });
      const runtime = createWorkletRuntime({ name: 'test' });

      const decoration = runOnRuntimeSync(runtime, () => {
        'worklet';
        return shareable.myDecoration;
      });

      expect(decoration).toBe('decorated');
    });

    test('decorator adds function', () => {
      const shareable = createShareable('UI', 0, { guestDecorator: decorateGuestFunction });
      const runtime = createWorkletRuntime({ name: 'test' });

      const decorationResult = runOnRuntimeSync(runtime, () => {
        'worklet';
        return shareable.myDecorationFunction!();
      });

      expect(decorationResult).toBe('decorated function');
    });

    test('decorator overrides method', () => {
      const shareable = createShareable('UI', 0, { guestDecorator: decorateGuestOverride });
      const runtime = createWorkletRuntime({ name: 'test' });

      const getSyncValue = runOnRuntimeSync(runtime, () => {
        'worklet';
        return shareable.getSync!();
      });

      expect(getSyncValue).toBe(-1);
    });
  });
});
