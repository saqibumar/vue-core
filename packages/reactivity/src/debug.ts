import { extend } from '@vue/shared'
import type { DirtyLevels, Link, Subscriber } from 'alien-signals'
import type { DebuggerEventExtraInfo, ReactiveEffectOptions } from './effect'

export const triggerEventInfos: DebuggerEventExtraInfo[] = []

export function onTrack(
  sub: Link['sub'],
  debugInfo: DebuggerEventExtraInfo,
): void {
  if (!__DEV__) {
    throw new Error(
      `Internal error: onTrack should be called only in development.`,
    )
  }
  if ((sub as ReactiveEffectOptions).onTrack) {
    ;(sub as ReactiveEffectOptions).onTrack!(
      extend(
        {
          effect: sub,
        },
        debugInfo,
      ),
    )
  }
}

export function onTrigger(sub: Link['sub']): void {
  if (!__DEV__) {
    throw new Error(
      `Internal error: onTrigger should be called only in development.`,
    )
  }
  if ((sub as ReactiveEffectOptions).onTrigger) {
    const debugInfo = triggerEventInfos[triggerEventInfos.length - 1]
    ;(sub as ReactiveEffectOptions).onTrigger!(
      extend(
        {
          effect: sub,
        },
        debugInfo,
      ),
    )
  }
}

export function setupDirtyLevelHandler(target: Subscriber): void {
  if (!__DEV__) {
    throw new Error(
      `Internal error: setupDirtyLevelHandler should be called only in development.`,
    )
  }
  // @ts-expect-error
  target._dirtyLevel = target.dirtyLevel
  Object.defineProperty(target, 'dirtyLevel', {
    get() {
      // @ts-expect-error
      return target._dirtyLevel
    },
    set(value) {
      if (
        __DEV__ &&
        value > (0 satisfies DirtyLevels.None) &&
        value < (4 satisfies DirtyLevels.Released)
      ) {
        onTrigger(this)
      }
      // @ts-expect-error
      target._dirtyLevel = value
    },
  })
}
