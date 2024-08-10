import {AfterViewInit, Component, ElementRef, inject, ViewChild} from '@angular/core';
import {VelocityScatterChart} from "./velocityScatterChart";

@Component({
  selector: 'velocity-scatter',
  standalone: true,
  imports: [],
  templateUrl: './velocity-scatter.component.html',
  styleUrl: './velocity-scatter.component.scss',
  providers: [VelocityScatterChart]
})
export class VelocityScatterComponent implements AfterViewInit {
  @ViewChild('svg') svgElement!: ElementRef<SVGSVGElement>
  private chart = inject(VelocityScatterChart);

  ngAfterViewInit() {
    this.chart.init(this.svgElement.nativeElement);
  }
}
