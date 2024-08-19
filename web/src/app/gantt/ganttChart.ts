import {D3Chart} from "@app/chart/d3Chart";
import {GanttConfig} from "@app/gantt/ganttConfig";
import {GanttItem} from "@app/data/work-item.service";
import {HoverChart} from "@app/chart/hoverChart";
import {ContainerSelection, ElementSelection} from "@app/chart/d3";
import * as d3 from "d3";
import Color from "colorjs.io";
import {ColorManager} from "@app/gantt/colorManager";

export class GanttSlot {}

export class GanttChart extends D3Chart<GanttConfig, GanttItem[]> implements HoverChart {
  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private seriesGroup!: ContainerSelection

  private xScale!: d3.ScaleTime<number, number, never>;
  private yScale!: d3.ScaleBand<GanttSlot>

  private container!: ElementSelection<HTMLDivElement>;

  colorManager = new ColorManager()

  private map = new Map<GanttItem, ElementSelection<HTMLElement>>()

  override init(config: GanttConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement);
    this.xScale = d3.scaleTime<number, number>()
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

    this.xScale.range([this.box.inner.left, this.box.inner.right])
    // this.yScale.range([this.box.inner.bottom, this.box.inner.top])
    // this.height.range([0, this.box.inner.height])
  }

  override setData(data: GanttItem[]) {
    super.setData(data)
    let min = data[0].startedAt
    let max = data[0].completedAt
    for (const item of data) {
      if (item.startedAt > min) {
        min = item.startedAt
      }
      if (item.completedAt > max) {
        max = item.completedAt
      }
    }
    this.xScale.domain([min, max])
  }

  override onResize(): void {
  }

  override draw(shouldAnimate: boolean): void {
  }

  setHover(element: HTMLElement): void {
  }

  setHtmlContainer(element: HTMLDivElement) {
    this.container = d3.select(element)
  }

  registerElement(item: GanttItem, htmlElement: HTMLElement, isTopLevel: boolean) {
    const element = d3.select(htmlElement)
    this.map.set(item, element)

    let offset = 0;
    let inset = 0;
    if (item.parent) {
      offset = this.xScale(item.parent.startedAt)
      inset += 5
      if (item.parent.parent) {
        inset += 5;
      }
    }

    const start = this.xScale(item.startedAt) - offset
    const end = this.xScale(item.completedAt) - offset
    const width  = end - start - inset;

    element.style("left", `${start}px`)
    element.style("width", `${width}px`)

    if (!isTopLevel)
      return

    this.colorManager.style(element)
  }
}

