import {
  Ref,
  ref,
  shallowRef,
  isRef,
  unref,
  reactive,
  expectType,
  proxyRefs,
  toRef,
  toRefs,
  ToRefs
} from './index'

function plainType(arg: number | Ref<number>) {
  // ref coercing
  const coerced = ref(arg)
  expectType<Ref<number>>(coerced)

  // isRef as type guard
  if (isRef(arg)) {
    expectType<Ref<number>>(arg)
  }

  // ref unwrapping
  expectType<number>(unref(arg))

  // ref inner type should be unwrapped
  const nestedRef = ref({
    foo: ref(1)
  })
  expectType<{ foo: number }>(nestedRef.value)

  // ref boolean
  const falseRef = ref(false)
  expectType<Ref<boolean>>(falseRef)
  expectType<boolean>(falseRef.value)

  // ref true
  const trueRef = ref<true>(true)
  expectType<Ref<true>>(trueRef)
  expectType<true>(trueRef.value)

  // tuple
  expectType<[number, string]>(unref(ref([1, '1'])))

  interface IteratorFoo {
    [Symbol.iterator]: any
  }

  // with symbol
  expectType<Ref<IteratorFoo | null | undefined>>(
    ref<IteratorFoo | null | undefined>()
  )

  // should not unwrap ref inside arrays
  const arr = ref([1, new Map<string, any>(), ref('1')]).value
  const value = arr[0]
  if (isRef(value)) {
    expectType<Ref>(value)
  } else if (typeof value === 'number') {
    expectType<number>(value)
  } else {
    // should narrow down to Map type
    // and not contain any Ref type
    expectType<Map<string, any>>(value)
  }

  // should still unwrap in objects nested in arrays
  const arr2 = ref([{ a: ref(1) }]).value
  expectType<number>(arr2[0].a)
}

plainType(1)

function bailType(arg: HTMLElement | Ref<HTMLElement>) {
  // ref coercing
  const coerced = ref(arg)
  expectType<Ref<HTMLElement>>(coerced)

  // isRef as type guard
  if (isRef(arg)) {
    expectType<Ref<HTMLElement>>(arg)
  }

  // ref unwrapping
  expectType<HTMLElement>(unref(arg))

  // ref inner type should be unwrapped
  // eslint-disable-next-line no-restricted-globals
  const nestedRef = ref({ foo: ref(document.createElement('DIV')) })

  expectType<Ref<{ foo: HTMLElement }>>(nestedRef)
  expectType<{ foo: HTMLElement }>(nestedRef.value)
}
// eslint-disable-next-line no-restricted-globals
const el = document.createElement('DIV')
bailType(el)

function withSymbol() {
  const customSymbol = Symbol()
  const obj = {
    [Symbol.asyncIterator]: { a: 1 },
    [Symbol.unscopables]: { b: '1' },
    [customSymbol]: { c: [1, 2, 3] }
  }

  const objRef = ref(obj)

  expectType<{ a: number }>(objRef.value[Symbol.asyncIterator])
  expectType<{ b: string }>(objRef.value[Symbol.unscopables])
  expectType<{ c: Array<number> }>(objRef.value[customSymbol])
}

withSymbol()

const state = reactive({
  foo: {
    value: 1,
    label: 'bar'
  }
})

expectType<string>(state.foo.label)

// shallowRef
type Status = 'initial' | 'ready' | 'invalidating'
const shallowStatus = shallowRef<Status>('initial')
if (shallowStatus.value === 'initial') {
  expectType<Ref<Status>>(shallowStatus)
  expectType<Status>(shallowStatus.value)
  shallowStatus.value = 'invalidating'
}

const refStatus = ref<Status>('initial')
if (refStatus.value === 'initial') {
  expectType<Ref<Status>>(shallowStatus)
  expectType<Status>(shallowStatus.value)
  refStatus.value = 'invalidating'
}

// proxyRefs: should return `reactive` directly
const r1 = reactive({
  k: 'v'
})
const p1 = proxyRefs(r1)
expectType<typeof r1>(p1)

// proxyRefs: `ShallowUnwrapRef`
const r2 = {
  a: ref(1),
  obj: {
    k: ref('foo')
  }
}
const p2 = proxyRefs(r2)
expectType<number>(p2.a)
expectType<Ref<string>>(p2.obj.k)

// toRef
const obj = {
  a: 1,
  b: ref(1),
  c: 0,
  d: [1, 'd'],
  f: { foo: 'f' },
  g: ref('g'),
  h: ref([{ foo: 'h' }, 'h'])
} as {
  a: number
  b: Ref<number>
  // union primitive type, array
  c: number | string | (string | number)[]
  // tuple
  d: [number, string]
  // union tuple & object
  f: [number, string] | { foo: string }
  // union ref
  g: Ref<number | string | (string | number)[]>
  // tuple ref
  h: Ref<[{ foo: string }, string]>
}
expectType<Ref<number>>(toRef(obj, 'a'))
expectType<Ref<number>>(toRef(obj, 'b'))
expectType<Ref<number | string | (string | number)[]>>(toRef(obj, 'c'))
expectType<Ref<[number, string]>>(toRef(obj, 'd'))
expectType<Ref<[number, string] | { foo: string }>>(toRef(obj, 'f'))
expectType<Ref<number | string | (string | number)[]>>(toRef(obj, 'g'))
expectType<Ref<[{ foo: string }, string]>>(toRef(obj, 'h'))

// toRefs
const objRefs = toRefs(obj)
expectType<{
  a: Ref<number>
  b: Ref<number>
}>(objRefs)

// #2687
interface AppData {
  state: 'state1' | 'state2' | 'state3'
}

const data: ToRefs<AppData> = toRefs(
  reactive({
    state: 'state1'
  })
)

switch (data.state.value) {
  case 'state1':
    data.state.value = 'state2'
    break
  case 'state2':
    data.state.value = 'state3'
    break
  case 'state3':
    data.state.value = 'state1'
    break
}
