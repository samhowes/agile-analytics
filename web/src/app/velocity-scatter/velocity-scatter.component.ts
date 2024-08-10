import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject, signal,
  viewChild
} from '@angular/core';
import {VelocityScatterChart} from "./velocityScatterChart";
import {SpinnerOverlay} from "../components/spinner-overlay.component";


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
export class VelocityScatterComponent implements AfterViewChecked {
  svgElement = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private chart = inject(VelocityScatterChart);

  isLoading = signal<boolean>(true)

  ngAfterViewChecked() {
    this.chart.init(this.svgElement().nativeElement);
  }
}
