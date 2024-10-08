import {AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
import {VelocityScatterChart, VelocityScatterConfig} from "./velocityScatterChart";
import {SpinnerOverlay} from "../components/spinner-overlay.component";
import {WorkItemService} from "../data/work-item.service";
import {combineLatest} from "rxjs";
import {HoverComponent} from "@app/velocity-scatter/hover/hover.component";

@Component({
  selector: 'velocity-scatter',
  standalone: true,
  imports: [
    SpinnerOverlay,
    HoverComponent,
  ],
  templateUrl: './velocity-scatter.component.html',
  styleUrl: './velocity-scatter.component.scss',
  providers: [VelocityScatterChart]
})
export class VelocityScatterComponent implements AfterViewInit, OnInit {
  svgElement = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private chart = inject(VelocityScatterChart);
  private workItemService = inject(WorkItemService);

  isLoading = signal<boolean>(true)

  ngOnInit() {
    combineLatest([this.workItemService.getCompleted(), this.chart.init$]).subscribe(results => {
      this.isLoading.set(false)
      this.chart.setData(results[0])
    })
  }

  ngAfterViewInit() {
    this.chart.init(new VelocityScatterConfig(), this.svgElement().nativeElement);

  }
}
