import {AfterViewChecked, Component, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
import {VelocityScatterChart} from "./velocityScatterChart";
import {SpinnerOverlay} from "../components/spinner-overlay.component";
import {WorkItemService} from "./work-item.service";
import {combineLatest, forkJoin} from "rxjs";


@Component({
  selector: 'velocity-scatter',
  standalone: true,
  imports: [
    SpinnerOverlay
  ],
  templateUrl: './velocity-scatter.component.html',
  styleUrl: './velocity-scatter.component.scss',
  providers: [VelocityScatterChart]
})
export class VelocityScatterComponent implements AfterViewChecked, OnInit {
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

  ngAfterViewChecked() {
    this.chart.init(this.svgElement().nativeElement);
  }
}
