import {AfterViewInit, Component, ElementRef, inject, input, OnInit, Renderer2} from '@angular/core';
import {GanttItem} from "@app/data/work-item.service";
import {GanttChart} from "@app/gantt/ganttChart";
import {NgClass, NgStyle} from "@angular/common";
import {ObjMap} from "@lib/objMap";

@Component({
  selector: 'gantt-item',
  standalone: true,
  imports: [
    NgStyle,
    NgClass
  ],
  templateUrl: './gantt-item.component.html',
  styleUrl: './gantt-item.component.scss'
})
export class GanttItemComponent implements OnInit, AfterViewInit {
  item = input.required<GanttItem>()
  isTopLevel = input<boolean>(false)

  chart = inject(GanttChart)
  style: ObjMap<any> = {left: "20px"};

  constructor(private ref: ElementRef) {
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {

  }
}
