import {Key} from "@lib/reflection";

export declare type ObjMap<T> = { [id: string]: T }
export declare type ObjPair<T> = { key: string, value: T }

export class ObjMaps {
  static getOrSet<T>(obj: ObjMap<T>, key: string, valueFunc: T): T
  static getOrSet<T>(obj: ObjMap<T>, key: string, valueFunc: () => T): T {
    let val = obj[key]
    if (!val) {
      if (typeof valueFunc === 'function') {
        val = valueFunc()
      } else {
        val = valueFunc
      }
      obj[key] = val
    }
    return val
  }

  static *values<T>(obj: ObjMap<T>): Generator<T> {
    for (const id in obj) {
      yield obj[id]
    }
  }

  static valuesArray<T>(obj: ObjMap<T>): T[] {
    return Array.from(this.values(obj));
  }

  static keys<T>(nodes: ObjMap<T>): string[] {
    return Object.getOwnPropertyNames(nodes);
  }

  static props<T>(obj: T): Key<T>[] {
    return Object.getOwnPropertyNames(obj) as Key<T>[]
  }

  static entries<T>(obj: ObjMap<T>): Array<ObjPair<T>> {
    return this.keys(obj).map(k => {
      return {key: k, value: obj[k]}
    })
  }

  static get(obj: ObjMap<any>, key: string) {
    if (!obj) return undefined
    return obj[key]
  }

  static clear(map: ObjMap<any>) {
    for (const key of ObjMaps.keys(map)) {
      delete map[key]
    }
  }

  static clean(map: ObjMap<any>) {
    for (const entry of this.entries(map)) {
      if (entry.value === undefined) {
        delete map[entry.key]
      }
    }
  }

  static copyValues<T>(to:ObjMap<any>, from: ObjMap<any>): T {
    for (const key of this.keys(to)) {
      if (typeof to[key] === 'function') continue
      if (from[key] !== undefined) {
        to[key] = from[key]
      }
    }
    return to as unknown as T
  }

  static deleteKeys<T>(obj: T, ...keys: KeyOf<T>[]) {
    for (const key of keys) {
      delete obj[key]
    }
  }

  static valueKeys<T>(obj: ObjMap<any>) {
    return this.keys(obj).filter(k => typeof obj[k] !== 'function')
  }

  static isEmpty(children: ObjMap<any>) {
    for (const key in children) {
      return false
    }
    return true
  }
  static assign<T>(to: T, from: Partial<T>) {
    return Object.assign(to as object, from)
  }
}

export declare type KeyOf<T> = keyof T
