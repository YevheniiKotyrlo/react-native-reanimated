'use strict';

import { WorkletsError } from '../debug/WorkletsError';
import {
  runOnRuntimeSyncFromId as RNRuntimeRunOnRuntimeSyncFromId,
  scheduleOnRuntimeFromId as RNRuntimeScheduleOnRuntimeFromId,
} from '../runtimes';
import { runOnUIAsync as RNRuntimeRunOnUIAsync } from '../threads';
import type { WorkletFunction } from '../types';
import { createSerializable } from './serializable';
import { serializableMappingCache } from './serializableMappingCache';
import type {
  SerializableRef,
  Shareable,
  ShareableGuest,
  ShareableGuestDecorator,
  ShareableGuestMeta,
  ShareableHost,
} from './types';

export function __installUnpacker() {
  let runOnRuntimeSyncFromId: typeof RNRuntimeRunOnRuntimeSyncFromId;
  let scheduleOnRuntimeFromId: typeof RNRuntimeScheduleOnRuntimeFromId;
  let runOnUIAsync: typeof RNRuntimeRunOnUIAsync;
  let memoize: (
    unpacked: Shareable<unknown>,
    serialized: SerializableRef<unknown>
  ) => void;
  const serializer =
    globalThis.__RUNTIME_KIND === 1 || globalThis._WORKLETS_BUNDLE_MODE_ENABLED
      ? createSerializable
      : (value: unknown) => globalThis.__serializer(value);

  if (
    globalThis.__RUNTIME_KIND === 1 /* RuntimeKind.ReactNative */ ||
    globalThis._WORKLETS_BUNDLE_MODE_ENABLED
  ) {
    runOnRuntimeSyncFromId = RNRuntimeRunOnRuntimeSyncFromId;
    scheduleOnRuntimeFromId = RNRuntimeScheduleOnRuntimeFromId;
    runOnUIAsync = RNRuntimeRunOnUIAsync;
    memoize = (unpacked, serialized) => {
      serializableMappingCache.set(unpacked, serialized);
    };
  } else {
    const proxy = globalThis.__workletsModuleProxy;
    runOnRuntimeSyncFromId = ((
      hostId: number,
      worklet: WorkletFunction,
      ...args: unknown[]
    ) => {
      const serializedWorklet = serializer(() => {
        'worklet';
        return globalThis.__serializer(worklet(...args));
      });
      return proxy.runOnRuntimeSyncFromId(hostId, serializedWorklet);
    }) as typeof RNRuntimeRunOnRuntimeSyncFromId;

    scheduleOnRuntimeFromId = ((
      hostId: number,
      worklet: WorkletFunction,
      ...args: unknown[]
    ) => {
      proxy.scheduleOnRuntimeFromId(
        hostId,
        serializer(() => {
          'worklet';
          return globalThis.__serializer(worklet(...args));
        })
      );
    }) as typeof RNRuntimeScheduleOnRuntimeFromId;

    runOnUIAsync = () => {
      throw new WorkletsError(
        'runOnUIAsync is not supported on Worklet Runtimes yet'
      );
    };

    memoize = () => {
      // No-op on Worklet Runtimes outside of Bundle Mode.
    };
  }

  /**
   * @param shareableRef - Is of type {@link SerializableRef} on the Ref Runtime
   *   side and of type {@link Shareable} on the Host Runtime side.
   * @param isHost - Whether the unpacker is running on the Host Runtime side.
   * @param initial - Initial value to use when running on the Host Runtime
   *   side. Undefined on the Ref Runtime side.
   */
  function shareableGuestUnpacker<TValue>(
    hostId: number,
    shareableRef: SerializableRef<TValue>,
    guestDecorator?: ShareableGuestDecorator<TValue>
  ): Shareable<TValue> {
    type HostRuntimeType = ShareableHost<TValue>;

    let shareableGuest = shareableRef as unknown as ShareableGuest<TValue> &
      ShareableGuestMeta;

    const get = () => {
      'worklet';
      return (shareableGuest as HostRuntimeType).value;
    };

    const setWithValue = (value: TValue) => {
      'worklet';
      (shareableGuest as HostRuntimeType).value = value;
    };

    const setWithSetter = (setter: (prev: TValue) => TValue) => {
      'worklet';
      const currentValue = (shareableGuest as HostRuntimeType).value;
      const newValue = setter(currentValue);
      (shareableGuest as HostRuntimeType).value = newValue;
    };

    shareableGuest.getAsync = () => {
      return runOnUIAsync(get);
    };

    shareableGuest.getSync = () => {
      return runOnRuntimeSyncFromId(hostId, get);
    };

    shareableGuest.setAsync = (value: TValue | ((prev: TValue) => TValue)) => {
      if (typeof value === 'function') {
        scheduleOnRuntimeFromId(
          hostId,
          setWithSetter,
          value as (prev: TValue) => TValue
        );
      } else {
        scheduleOnRuntimeFromId(hostId, setWithValue, value);
      }
    };

    shareableGuest.setSync = (value: TValue | ((prev: TValue) => TValue)) => {
      if (typeof value === 'function') {
        runOnRuntimeSyncFromId(
          hostId,
          setWithSetter,
          value as (prev: TValue) => TValue
        );
      } else {
        runOnRuntimeSyncFromId(hostId, setWithValue, value);
      }
    };

    shareableGuest.isHost = false;
    shareableGuest.__shareableRef = true;

    if (guestDecorator) {
      shareableGuest = guestDecorator(shareableGuest);
    }

    memoize(shareableGuest, shareableRef);
    return shareableGuest;
  }

  globalThis.__shareableGuestUnpacker = shareableGuestUnpacker;
}

export type ShareableUnpacker<TValue = unknown> = (
  hostId: number,
  shareableRef: SerializableRef<TValue>,
  decorateGuest?: ShareableGuestDecorator<TValue>
) => Shareable<TValue>;
