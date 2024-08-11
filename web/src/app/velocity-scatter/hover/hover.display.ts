import {ObjMap} from "@lib/objMap";
import {HoverEvent} from "@app/velocity-scatter/velocityScatterChart";
import {WorkItem} from "@app/velocity-scatter/work-item.service";
import {BehaviorSubject} from "rxjs";

export class HoverDisplay {
  styles: ObjMap<any> = {}
  workItem: WorkItem|null = null
  isActive = false;
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
  }

  hide() {
    this.isActive = false;
    this.workItem = null
    this.styles = {
      "display": "none"
    }
  }

  mouseenter() {
    console.log('hover mouseenter')
    this.isActive = true
    this.active$.next(true)
  }

  mouseleave() {
    console.log('hover mouseleave')
    this.isActive = false;
    this.active$.next(false)
  }
}
