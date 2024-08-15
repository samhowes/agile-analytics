import {Component, input, output} from '@angular/core';
import {GanttConfig} from "@app/gantt/ganttConfig";

@Component({
  selector: 'configure-gantt',
  standalone: true,
  imports: [],
  templateUrl: './configure-gantt.component.html',
  styleUrl: './configure-gantt.component.scss'
})
export class ConfigureGanttComponent {
  onClose = output<boolean>();
  config = input.required<GanttConfig>();
}
