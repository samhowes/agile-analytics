import {D3Chart} from "@app/chart/d3Chart";
import {GanttConfig} from "@app/gantt/ganttConfig";
import {WorkItem} from "@app/data/work-item.service";
import {HoverChart} from "@app/chart/hoverChart";

export class GanttChart extends D3Chart<GanttConfig, WorkItem[]> implements HoverChart {

  override init(config: GanttConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement);

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
