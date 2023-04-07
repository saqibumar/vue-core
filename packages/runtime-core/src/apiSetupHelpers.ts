import {
  isArray,
  isPromise,
  isFunction,
  Prettify,
  UnionToIntersection,
  extend
} from '@vue/shared'
import {
  getCurrentInstance,
  setCurrentInstance,
  SetupContext,
  createSetupContext,
  unsetCurrentInstance
} from './component'
import { EmitFn, EmitsOptions, ObjectEmitsOptions } from './componentEmits'
import {
  ComponentOptionsMixin,
  ComponentOptionsWithoutProps,
  ComputedOptions,
  MethodOptions
} from './componentOptions'
import {
  ComponentPropsOptions,
  ComponentObjectPropsOptions,
  ExtractPropTypes,
  NormalizedProps,
  PropOptions
} from './componentProps'
import { warn } from './warning'
import { SlotsType, TypedSlots } from './componentSlots'
import { Ref, ref } from '@vue/reactivity'
import { watch } from './apiWatch'

// dev only
const warnRuntimeUsage = (method: string) =>
  warn(
    `${method}() is a compiler-hint helper that is only usable inside ` +
      `<script setup> of a single file component. Its arguments should be ` +
      `compiled away and passing it at runtime has no effect.`
  )

/**
 * Vue `<script setup>` compiler macro for declaring component props. The
 * expected argument is the same as the component `props` option.
 *
 * Example runtime declaration:
 * ```js
 * // using Array syntax
 * const props = defineProps(['foo', 'bar'])
 * // using Object syntax
 * const props = defineProps({
 *   foo: String,
 *   bar: {
 *     type: Number,
 *     required: true
 *   }
 * })
 * ```
 *
 * Equivalent type-based declaration:
 * ```ts
 * // will be compiled into equivalent runtime declarations
 * const props = defineProps<{
 *   foo?: string
 *   bar: number
 * }>()
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits}
 * ```
 *
 * This is only usable inside `<script setup>`, is compiled away in the
 * output and should **not** be actually called at runtime.
 */
// overload 1: runtime props w/ array
export function defineProps<PropNames extends string = string>(
  props: PropNames[]
): Prettify<Readonly<{ [key in PropNames]?: any }>>
// overload 2: runtime props w/ object
export function defineProps<
  PP extends ComponentObjectPropsOptions = ComponentObjectPropsOptions
>(props: PP): Prettify<Readonly<ExtractPropTypes<PP>>>
// overload 3: typed-based declaration
export function defineProps<TypeProps>(): DefineProps<TypeProps>
// implementation
export function defineProps() {
  if (__DEV__) {
    warnRuntimeUsage(`defineProps`)
  }
  return null as any
}

type DefineProps<T> = Readonly<T> & {
  readonly [K in BooleanKey<T>]-?: boolean
}

type BooleanKey<T, K extends keyof T = keyof T> = K extends any
  ? [T[K]] extends [boolean | undefined]
    ? K
    : never
  : never

/**
 * Vue `<script setup>` compiler macro for declaring a component's emitted
 * events. The expected argument is the same as the component `emits` option.
 *
 * Example runtime declaration:
 * ```js
 * const emit = defineEmits(['change', 'update'])
 * ```
 *
 * Example type-based declaration:
 * ```ts
 * const emit = defineEmits<{
 *   (event: 'change'): void
 *   (event: 'update', id: number): void
 * }>()
 *
 * emit('change')
 * emit('update', 1)
 * ```
 *
 * This is only usable inside `<script setup>`, is compiled away in the
 * output and should **not** be actually called at runtime.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits}
 */
// overload 1: runtime emits w/ array
export function defineEmits<EE extends string = string>(
  emitOptions: EE[]
): EmitFn<EE[]>
export function defineEmits<E extends EmitsOptions = EmitsOptions>(
  emitOptions: E
): EmitFn<E>
export function defineEmits<
  T extends ((...args: any[]) => any) | Record<string, any[]>
>(): T extends (...args: any[]) => any ? T : ShortEmits<T>
// implementation
export function defineEmits() {
  if (__DEV__) {
    warnRuntimeUsage(`defineEmits`)
  }
  return null as any
}

type RecordToUnion<T extends Record<string, any>> = T[keyof T]

type ShortEmits<T extends Record<string, any>> = UnionToIntersection<
  RecordToUnion<{
    [K in keyof T]: (evt: K, ...args: T[K]) => void
  }>
>

/**
 * Vue `<script setup>` compiler macro for declaring a component's exposed
 * instance properties when it is accessed by a parent component via template
 * refs.
 *
 * `<script setup>` components are closed by default - i.e. variables inside
 * the `<script setup>` scope is not exposed to parent unless explicitly exposed
 * via `defineExpose`.
 *
 * This is only usable inside `<script setup>`, is compiled away in the
 * output and should **not** be actually called at runtime.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineexpose}
 */
export function defineExpose<
  Exposed extends Record<string, any> = Record<string, any>
>(exposed?: Exposed) {
  if (__DEV__) {
    warnRuntimeUsage(`defineExpose`)
  }
}

/**
 * Vue `<script setup>` compiler macro for declaring a component's additional
 * options. This should be used only for options that cannot be expressed via
 * Composition API - e.g. `inhertiAttrs`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineoptions}
 */
export function defineOptions<
  RawBindings = {},
  D = {},
  C extends ComputedOptions = {},
  M extends MethodOptions = {},
  Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
  Extends extends ComponentOptionsMixin = ComponentOptionsMixin
>(
  options?: ComponentOptionsWithoutProps<
    {},
    RawBindings,
    D,
    C,
    M,
    Mixin,
    Extends
  > & { emits?: undefined; expose?: undefined; slots?: undefined }
): void {
  if (__DEV__) {
    warnRuntimeUsage(`defineOptions`)
  }
}

export function defineSlots<
  S extends Record<string, any> = Record<string, any>
>(): TypedSlots<SlotsType<S>> {
  if (__DEV__) {
    warnRuntimeUsage(`defineSlots`)
  }
  return null as any
}

/**
 * (**Experimental**) Vue `<script setup>` compiler macro for declaring a two-way
 * binding prop. This will declare a prop with the same name and a corresponding
 * `update:propName` event.
 *
 * The prop will be automatically marked as `required` by default. Use the
 * `required: false` option or set a default value to make it optional.
 *
 * Example: required model
 * ```ts
 * const modelValue = defineModel<string>()
 * modelValue.value = "hello"
 * ```
 *
 * Example: specified a name
 * ```ts
 * const count = defineModel<number>('count')
 * count.value++
 * ```
 *
 * Example: specified a name and default value
 * ```ts
 * const count = defineModel<number>('count', { default: 0 })
 * ```
 *
 */
export function defineModel<T>(
  options: { required: false } & PropOptions<T>
): Ref<T | undefined>
export function defineModel<T>(options?: PropOptions<T>): Ref<T>
export function defineModel<T>(
  name: string,
  options: { required: false } & PropOptions<T>
): Ref<T | undefined>
export function defineModel<T>(name: string, options?: PropOptions<T>): Ref<T>
export function defineModel(): any {
  if (__DEV__) {
    warnRuntimeUsage('defineModel')
  }
}

type NotUndefined<T> = T extends undefined ? never : T

type InferDefaults<T> = {
  [K in keyof T]?: InferDefault<T, NotUndefined<T[K]>>
}

type InferDefault<P, T> = T extends
  | null
  | number
  | string
  | boolean
  | symbol
  | Function
  ? T | ((props: P) => T)
  : (props: P) => T

type PropsWithDefaults<Base, Defaults> = Base & {
  [K in keyof Defaults]: K extends keyof Base
    ? Defaults[K] extends undefined
      ? Base[K]
      : NotUndefined<Base[K]>
    : never
}
/**
 * Vue `<script setup>` compiler macro for providing props default values when
 * using type-based `defineProps` declaration.
 *
 * Example usage:
 * ```ts
 * withDefaults(defineProps<{
 *   size?: number
 *   labels?: string[]
 * }>(), {
 *   size: 3,
 *   labels: () => ['default label']
 * })
 * ```
 *
 * This is only usable inside `<script setup>`, is compiled away in the output
 * and should **not** be actually called at runtime.
 *
 * @see {@link https://vuejs.org/guide/typescript/composition-api.html#typing-component-props}
 */
export function withDefaults<Props, Defaults extends InferDefaults<Props>>(
  props: Props,
  defaults: Defaults
): PropsWithDefaults<Props, Defaults> {
  if (__DEV__) {
    warnRuntimeUsage(`withDefaults`)
  }
  return null as any
}

export function useSlots(): SetupContext['slots'] {
  return getContext().slots
}

export function useAttrs(): SetupContext['attrs'] {
  return getContext().attrs
}

export function useModel<T>(name: string): Ref<T> {
  const i = getCurrentInstance()!
  if (__DEV__ && !i) {
    warn(`useModel() called without active instance.`)
    return ref() as any
  }

  const options = (i.propsOptions[0] as NormalizedProps)[name]
  if (__DEV__ && !options) {
    warn(`useModel() called with prop "${name}" which is not declared.`)
    return ref() as any
  }

  if (options && !options.required) {
    const proxy = ref<any>(i.props[name])

    watch(
      () => i.props[name],
      v => (proxy.value = v)
    )

    watch(proxy, value => {
      if (value !== i.props[name]) {
        i.emit(`update:${name}`, value)
      }
    })

    return proxy
  } else {
    return {
      __v_isRef: true,
      get value() {
        return i.props[name]
      },
      set value(value) {
        if (value !== i.props[name]) {
          i.emit(`update:${name}`, value)
        }
      }
    } as any
  }
}

function getContext(): SetupContext {
  const i = getCurrentInstance()!
  if (__DEV__ && !i) {
    warn(`useContext() called without active instance.`)
  }
  return i.setupContext || (i.setupContext = createSetupContext(i))
}

function normalizePropsOrEmits(props: ComponentPropsOptions | EmitsOptions) {
  return isArray(props)
    ? props.reduce(
        (normalized, p) => ((normalized[p] = {}), normalized),
        {} as ComponentObjectPropsOptions | ObjectEmitsOptions
      )
    : props
}

/**
 * Runtime helper for merging default declarations. Imported by compiled code
 * only.
 * @internal
 */
export function mergeDefaults(
  raw: ComponentPropsOptions,
  defaults: Record<string, any>
): ComponentObjectPropsOptions {
  const props = normalizePropsOrEmits(raw)
  for (const key in defaults) {
    if (key.startsWith('__skip')) continue
    let opt = props[key]
    if (opt) {
      if (isArray(opt) || isFunction(opt)) {
        opt = props[key] = { type: opt, default: defaults[key] }
      } else {
        opt.default = defaults[key]
      }
    } else if (opt === null) {
      opt = props[key] = { default: defaults[key] }
    } else if (__DEV__) {
      warn(`props default key "${key}" has no corresponding declaration.`)
    }
    if (opt && defaults[`__skip_${key}`]) {
      opt.skipFactory = true
    }
  }
  return props
}

/**
 * Runtime helper for merging model declarations.
 * Imported by compiled code only.
 * @internal
 */
export function mergeModels(
  a: ComponentPropsOptions | EmitsOptions,
  b: ComponentPropsOptions | EmitsOptions
) {
  if (!a || !b) return a || b
  if (isArray(a) && isArray(b)) return a.concat(b)
  return extend({}, normalizePropsOrEmits(a), normalizePropsOrEmits(b))
}

/**
 * Runtime helper for adding required to model declarations.
 * Imported by compiled code only.
 * @internal
 */
export function addRequiredToModels(options: ComponentObjectPropsOptions) {
  for (const key in options) {
    // the model props object is generated by us so they are guaranteed to
    // be objects
    const prop = options[key]!
    if (!('required' in prop) && !('default' in prop)) {
      ;(prop as any).required = true
    }
  }

  return options
}

/**
 * Used to create a proxy for the rest element when destructuring props with
 * defineProps().
 * @internal
 */
export function createPropsRestProxy(
  props: any,
  excludedKeys: string[]
): Record<string, any> {
  const ret: Record<string, any> = {}
  for (const key in props) {
    if (!excludedKeys.includes(key)) {
      Object.defineProperty(ret, key, {
        enumerable: true,
        get: () => props[key]
      })
    }
  }
  return ret
}

/**
 * `<script setup>` helper for persisting the current instance context over
 * async/await flows.
 *
 * `@vue/compiler-sfc` converts the following:
 *
 * ```ts
 * const x = await foo()
 * ```
 *
 * into:
 *
 * ```ts
 * let __temp, __restore
 * const x = (([__temp, __restore] = withAsyncContext(() => foo())),__temp=await __temp,__restore(),__temp)
 * ```
 * @internal
 */
export function withAsyncContext(getAwaitable: () => any) {
  const ctx = getCurrentInstance()!
  if (__DEV__ && !ctx) {
    warn(
      `withAsyncContext called without active current instance. ` +
        `This is likely a bug.`
    )
  }
  let awaitable = getAwaitable()
  unsetCurrentInstance()
  if (isPromise(awaitable)) {
    awaitable = awaitable.catch(e => {
      setCurrentInstance(ctx)
      throw e
    })
  }
  return [awaitable, () => setCurrentInstance(ctx)]
}
