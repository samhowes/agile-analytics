import {D3Chart} from "@app/chart/d3Chart";
import {GanttConfig} from "@app/gantt/ganttConfig";
import {GanttItem} from "@app/data/work-item.service";
import {HoverChart} from "@app/chart/hoverChart";
import {ContainerSelection, ElementSelection} from "@app/chart/d3";
import * as d3 from "d3";
import {DateTime} from "luxon";

export class GanttData {
  totalDays!: number;
  totalRows!: number;
  minDate!: DateTime;
  maxDate!: DateTime;
  constructor(private data: GanttItem[]) {
    this.processData()
  }

  private processData() {
    let min = this.data[0].startedAt
    let max = this.data[0].completedAt
    let itemCount = 0

    const visit = (items: GanttItem[]) => {
      for (const item of items) {
        itemCount++;
        if (item.startedAt < min) {
          min = item.startedAt
        }
        if (item.completedAt > max) {
          max = item.completedAt
        }

        if (item.children.length)
          visit(item.children)
      }
    }
    visit(this.data)

    min = min.minus({day: min.weekday-1})  // move min to Monday
    max = max.plus({day: 7 - max.weekday}) // move max to sunday

    this.minDate = min
    this.maxDate = max
    this.totalDays = max.diff(min, ['days']).days
    this.totalRows = itemCount
  }
}

export class GanttChart extends D3Chart<GanttConfig, GanttData>{
  private xScale!: d3.ScaleTime<number, number, never>;

  private html!: ElementSelection<HTMLDivElement>;

  private sizes = {
    dayWidth: 56,
    rowHeight: 40
  }

  override init(config: GanttConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement);
    this.xScale = d3.scaleTime<number, number>()

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


  override setData(data: GanttData) {
    super.setData(data)

    this.html
      .style('width', (this.data.totalDays * this.sizes.dayWidth) + 'px')
      .style('height', (this.data.totalRows * this.sizes.rowHeight) + 'px')

    this.drawHeader()

  }

  override onResize(): void {
  }

  override draw(shouldAnimate: boolean): void {
  }

  setHtmlContainer(element: HTMLDivElement) {
    this.html = d3.select(element)
  }

  private drawHeader() {
    const header = this.html.append('div')
      .classed('header', true)
      .style('display', 'flex')
    for (let i = 0; i < this.data.totalDays; i++) {
      const label = this.data.minDate.plus({days: i}).toFormat('ccc')
      const div = header.append('div');
      div
        // .style('position', 'absolute')
        // .style('left', (i * this.sizes.dayWidth) + 'px')
        .style('width', this.sizes.dayWidth + 'px')
      div
        .append('span')
        .text(label)
    }
  }
}

