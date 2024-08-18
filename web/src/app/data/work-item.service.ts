import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable, tap} from "rxjs";
import seedrandom from 'seedrandom';
import {HttpClient} from "@angular/common/http";

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
    return Math.floor(this.rand() * 10000)

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

export interface GanttItem {
  id: string
  type: string
  title: string
  points: number
  contributor: string
  startedAt: Date
  completedAt: Date
  children: GanttItem[]

  parent: GanttItem|null
}

@Injectable({providedIn: 'root'})
export class WorkItemService {
  constructor(private http: HttpClient) {
  }

  getCompleted(): Observable<WorkItem[]> {
    return new BehaviorSubject<WorkItem[]>([
      WorkItems.completed("Add hover over Work Item", 3, 10),
      WorkItems.completed("Add Scatter chart cursor", 5, 50),
      WorkItems.completed("Add selection", 8, 80),
      WorkItems.completed("Implement screen resizing", 3, 49),
    ])
  }

  getGantt(): Observable<GanttItem[]> {
    const visit = (items: GanttItem[], parent: GanttItem|null) => {
      for (const item of items) {
        item.startedAt = new Date(item.startedAt)
        item.completedAt = new Date(item.completedAt)
        item.parent = parent
        visit(item.children, item)
      }
    }
    return this.http.get<GanttItem[]>('api/gantt/forecast')
      .pipe(tap(items => {
        visit(items, null)
      }))
  }
}
