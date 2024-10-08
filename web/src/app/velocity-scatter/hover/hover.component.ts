import { Component } from '@angular/core';
import {HoverDisplay} from "@app/velocity-scatter/hover/hover.display";
import {combineLatest, debounceTime} from "rxjs";
import {VelocityScatterChart, VelocityScatterConfig} from "@app/velocity-scatter/velocityScatterChart";
import {MatCard} from "@angular/material/card";
import {NgClass, NgIf, NgStyle} from "@angular/common";

@Component({
  selector: 'hover',
  standalone: true,
  imports: [
    MatCard,
    NgStyle,
    NgClass,
    NgIf,
  ],
  templateUrl: './hover.component.html',
  styleUrl: './hover.component.scss'
})
export class HoverComponent {
  display = new HoverDisplay()
  get config(): VelocityScatterConfig {
    return this.chart.config
  }

  constructor(
    private chart: VelocityScatterChart,
  ) {
    combineLatest([
      this.chart.hover$,
      this.display.active$
    ])
      .pipe(debounceTime(150))
      .subscribe(result => {
        const event = result[0]
        const isActive = result[1]

        // moved their cursor away from both
        if (!event && !isActive)
          this.display.hide()
        // moved cursor to a different work item
        else if (event && this.display.workItem !== event.workItem)
          this.display.show(event)
        // moved to a work item for the first time
        else if (event && !isActive)
          this.display.show(event)
      })
  }
}
