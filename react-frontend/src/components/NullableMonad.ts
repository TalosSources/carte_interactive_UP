import { type IMaybe, Maybe } from 'typescript-monads'

export type Nullable<T> = T | null | undefined

// https://stackoverflow.com/questions/65693008/typescript-create-extension-method-for-type-alias
// Nullable.prototype.then = …

export function some<T> (t: T): Nullable<T> {
  return t
}
export function none<T> (): Nullable<T> {
  return undefined
}
export function isSome<T> (t: Nullable<T>): t is T {
  if (t == null) { return false }
  if (typeof t === 'undefined') { return false }
  return true
}
export function then<T, R> (t: Nullable<T>, fn: (t: T) => Nullable<R>): Nullable<R> { // aka bind
  if (isSome(t)) {
    return fn(t)
  }
  return t as Nullable<R>
}
export function orElse<T> (t: Nullable<T>, else_: T): T { // probably just use ?? as it's nicer?
  return t ?? else_
  // if (isSome(t)) {
  //   return t
  // }
  // return else_
}

export function intoMaybe<T> (t: Nullable<T>): IMaybe<T> {
  return then(t, Maybe.some) ?? Maybe.none()
}
