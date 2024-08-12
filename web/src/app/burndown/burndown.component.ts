import {AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
import {SpinnerOverlay} from "@app/components/spinner-overlay.component";
import {VelocityScatterConfig} from "@app/velocity-scatter/velocityScatterChart";
import {WorkItemService} from "@app/velocity-scatter/work-item.service";
import {combineLatest} from "rxjs";
import {BurndownChart, BurndownConfig} from "@app/burndown/burndownChart";

@Component({
  selector: 'burndown',
  standalone: true,
  imports: [
    SpinnerOverlay
  ],
  templateUrl: './burndown.component.html',
  styleUrl: './burndown.component.scss',
  providers: [BurndownChart]
})
export class BurndownComponent implements OnInit, AfterViewInit {
  svgElement = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private chart = inject(BurndownChart);
  private workItemService = inject(WorkItemService);

  isLoading = signal<boolean>(true)

  ngOnInit() {
    combineLatest([this.workItemService.getCompleted(), this.chart.init$]).subscribe(results => {
      this.isLoading.set(false)
      this.chart.setData(results[0])
    })
  }

  ngAfterViewInit() {
    this.chart.init(new BurndownConfig(), this.svgElement().nativeElement);

  }
}
