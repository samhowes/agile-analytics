import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import seedrandom from 'seedrandom';

export interface WorkItem {
  assignee: string;
  title: string;
  id: number
  points: number
  time: number
}

export class WorkItems {
  static rand = seedrandom("1234")
  static id(): number {
    return Math.floor(this.rand()*10000)

  }
  static completed(title: string, points: number, time: number): WorkItem {
    return {
      id: this.id(),
      title: title,
      assignee: "Dwight Schrute",
      points: points,
      time: time
    }
  }
}

@Injectable({providedIn: 'root'})
export class WorkItemService {
  getCompleted(): Observable<WorkItem[]> {
    return new BehaviorSubject<WorkItem[]>([
      WorkItems.completed("Add hover over Work Item", 3, 10),
      WorkItems.completed("Add Scatter chart cursor", 5, 50),
      WorkItems.completed("Add selection", 8, 80),
      WorkItems.completed("Implement screen resizing", 3, 49),
    ])
  }
}
