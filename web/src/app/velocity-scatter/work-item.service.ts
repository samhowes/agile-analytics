import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import seedrandom from 'seedrandom';

export interface WorkItem {
  id: number
  points: number
  time: number
}

export class WorkItems {
  static rand = seedrandom("1234")
  static id(): number {
    return Math.floor(this.rand()*10000)

  }
  static completed(points: number, time: number): WorkItem {
    return {
      id: this.id(),
      points: points,
      time: time
    }
  }
}

@Injectable({providedIn: 'root'})
export class WorkItemService {
  getCompleted(): Observable<WorkItem[]> {
    return new BehaviorSubject<WorkItem[]>([
      WorkItems.completed(3, 10),
      WorkItems.completed(5, 50),
      WorkItems.completed(5, 49),
    ])
  }
}
