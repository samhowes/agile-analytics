import {D3Chart} from "@app/chart/d3Chart";
import {GanttConfig} from "@app/gantt/ganttConfig";
import {GanttItem, WorkItem} from "@app/data/work-item.service";
import {HoverChart} from "@app/chart/hoverChart";
import {ContainerSelection} from "@app/chart/d3";
import * as d3 from "d3";
import {TimeBucket} from "@app/burndown/timeBucket";

export class GanttSlot {}

export class GanttChart extends D3Chart<GanttConfig, GanttItem[]> implements HoverChart {
  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private seriesGroup!: ContainerSelection

  private xScale!: d3.ScaleLinear<number, number>
  private yScale!: d3.ScaleBand<GanttSlot>

  override init(config: GanttConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement);
    this.xScale = d3.scaleLinear()
    this.yScale = d3.scaleBand<GanttSlot>()

    this.xAxis = this.svg.append('g')
    this.yAxis = this.svg.append('g')

    this.seriesGroup = this.svg.append("g").attr('class', 'series-group')

    this.reInit()

    this.init$.next()
  }

  override reInit() {
    this.setSizes()
  }

  override setSizes() {
    super.setSizes()
    // this.xScale.range([this.box.inner.left, this.box.inner.right])
    // this.yScale.range([this.box.inner.bottom, this.box.inner.top])
    // this.height.range([0, this.box.inner.height])
  }

  override onResize(): void {
  }

  override draw(shouldAnimate: boolean): void {
  }

  setHover(element: HTMLElement): void {
  }
}
