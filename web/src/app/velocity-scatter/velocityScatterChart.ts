import * as d3 from 'd3';
import {WorkItem} from "./work-item.service";
import {Subject} from "rxjs";
import {Point, Rect} from "./rect";
import {Cursor} from "./cursor";
import {ChartBox, Margins} from "./chartBox";
import {ContainerSelection, DataSelection} from "./d3";
import {EnterElement} from "d3";

export class VelocityScatterConfig {
  pointRadius = 8;
  timeMax = 100;
  pointsMax = 13;
  timeUnit = "hrs";
}

export class HoverEvent {
  constructor(
    public workItem: WorkItem,
    public location: Point,
  ) {
  }
}

export class VelocityScatterChart {
  private svgElement!: SVGSVGElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private svgRect!: Rect
  private box!: ChartBox
  private margins = new Margins(20, 20, 20, 20)
  private xScale!: d3.ScaleLinear<number, number, never>;
  private yScale!: d3.ScaleLinear<number, number, never>;

  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private pointsGroup!: ContainerSelection
  private points!: DataSelection<SVGCircleElement, WorkItem>

  private cursor!: Cursor;
  private cursorGroup!: ContainerSelection

  config!: VelocityScatterConfig
  private data: WorkItem[] = [];

  init$ = new Subject<void>();
  hover$ = new Subject<HoverEvent|null>();

  init(config: VelocityScatterConfig, svgElement: SVGSVGElement) {
    this.config = config
    this.svgElement = svgElement
    this.svg = d3.select(this.svgElement)

    this.xScale = d3.scaleLinear().domain([0, this.config.timeMax])
    this.yScale = d3.scaleLinear().domain([0, this.config.pointsMax])

    this.setSizes()
    this.initElements();
    this.setAxes()
    this.initCursor()

    new ResizeObserver(() => this.onResize())
      .observe(this.svgElement)
    this.init$.next()
  }

  private initElements() {
    this.pointsGroup = this.svg.append('g')
      .attr('class', 'work-items')
    this.cursorGroup = this.svg.append('g')
      .attr('class', 'cursor')

    this.xAxis = this.svg.append('g')
    this.yAxis = this.svg.append('g')
  }

  onResize() {
    this.setSizes();
    this.setAxes()
    this.setData(this.data)
    this.cursor.redraw()
  }

  private setSizes() {
    const rect = this.svgElement.getBoundingClientRect();
    this.svgRect = new Rect(rect.width, rect.height, rect.x, rect.y);
    this.box = new ChartBox(
      new Rect(rect.width, rect.height),
      this.margins
    )
    this.xScale.range([this.box.inner.left, this.box.inner.right])
    this.yScale.range([this.box.inner.bottom, this.box.inner.top])
  }

  private setAxes() {
    this.xAxis
      .attr('transform', `translate(0, ${this.box.inner.bottom})`)
      .call(d3.axisBottom(this.xScale))

    this.yAxis
      .attr('transform', `translate(${this.box.inner.left}, 0)`)
      .call(d3.axisLeft(this.yScale))
  }

  setData(workItems: WorkItem[]) {
    this.data = workItems
    this.points = this.pointsGroup.selectAll('circle')
    this.points = this.points.data<WorkItem>(workItems, d => d.id)
      .join<SVGCircleElement, WorkItem>(enter => {
        const circle = enter.append("circle")
          circle.on("mouseenter", (_, d) => {
            this.onHover(d);
          })
        circle.on("mouseleave", (_, d) => {
          this.hover$.next(null)
        })
        return circle
      }, update => update,
        exit => exit.remove())
      .attr('transform',d => `translate(${this.xScale(d.time)}, ${this.yScale(d.points)})`)
      .attr("r", this.config.pointRadius)

    this.onHover(workItems[workItems.length - 1])
  }

  private onHover(d: WorkItem) {
    let location: Point = {
      x: this.xScale(d.time),
      y: this.yScale(d.points)
    }
    location = this.svgRect.unmap(location)
    this.hover$.next(new HoverEvent(d, location))
  }

  private initCursor() {
    this.cursor = new Cursor(this.cursorGroup, this.box.inner)
    this.svg.on('mousemove mouseenter', e => {
      const location = this.svgRect.mapPoint(e)
      if (!this.box.inner.contains(location)) {
        if (this.cursor.visible) {
          this.cursor.hide()
        }
        return
      }
      if (!this.cursor.visible) {
        this.cursor.show()
      }

      this.cursor.moveTo(location)
    })

    this.svg.on('mouseleave', () => {
      this.cursor.hide()
    })
  }
}
