import {ObjMap} from "@lib/objMap";
import {HoverEvent} from "@app/velocity-scatter/velocityScatterChart";
import {WorkItem} from "@app/data/work-item.service";
import {BehaviorSubject} from "rxjs";

export class HoverDisplay {
  styles: ObjMap<any> = {}
  ngClass: ObjMap<any> = {}

  workItem: WorkItem|null = null
  active$ = new BehaviorSubject<boolean>(false)

  constructor() {
    this.hide()
  }

  show(event: HoverEvent) {
    this.workItem = event.workItem
    this.styles = {
      "position": "fixed",
      "top": 6 + event.location.y + 'px',
      "left": 6 + event.location.x + 'px',
    }
    this.ngClass = {
      "popup-show": true
    }
  }

  hide() {
    this.ngClass = {
      "popup-hide": true
    }
  }

  mouseenter() {
    this.active$.next(true)
  }

  mouseleave() {
    this.active$.next(false)
  }
}
