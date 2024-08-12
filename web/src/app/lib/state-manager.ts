import {ObjMaps} from "@lib/objMap";
import {Observable} from "rxjs";

export abstract class StateManager {
  protected constructor(
    private key: string,
  ) {
  }

  load() {
    const str = localStorage.getItem(this.key)
    let obj
    if (str) {
      obj = JSON.parse(str)
      ObjMaps.copyValues(this, obj)
    }
  }

  saveOn(...obs: Observable<any>[]) {
    for (const o of obs) {
      o.subscribe(_ => this.save())
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this))
  }
}
