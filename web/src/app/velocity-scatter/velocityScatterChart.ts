import * as d3 from 'd3';
import {WorkItem} from "./work-item.service";
import {Subject} from "rxjs";
import {Point, Rect} from "../chart/rect";
import {Cursor} from "./cursor";
import {ContainerSelection, DataSelection} from "../chart/d3";
import {D3Chart} from "@app/chart/d3Chart";

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

export class VelocityScatterChart extends D3Chart<VelocityScatterConfig, WorkItem[]>{
  private xScale!: d3.ScaleLinear<number, number, never>;
  private yScale!: d3.ScaleLinear<number, number, never>;

  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private pointsGroup!: ContainerSelection
  private points!: DataSelection<SVGCircleElement, WorkItem>

  private cursor!: Cursor;
  private cursorGroup!: ContainerSelection

  hover$ = new Subject<HoverEvent|null>();

  override init(config: VelocityScatterConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement)
    this.initElements();
    this.initCursor()

    this.xScale = d3.scaleLinear()
    this.yScale = d3.scaleLinear()

    this.reInit()

    this.init$.next()
  }

  override reInit() {
    this.xScale.domain([0, this.config.timeMax])
    this.yScale.domain([0, this.config.pointsMax])

    this.setSizes()
    this.setAxes()
  }

  override setSizes() {
    super.setSizes()
    this.xScale.range([this.box.inner.left, this.box.inner.right])
    this.yScale.range([this.box.inner.bottom, this.box.inner.top])
  }

  private initElements() {
    this.pointsGroup = this.svg.append('g')
      .attr('class', 'work-items')
    this.cursorGroup = this.svg.append('g')
      .attr('class', 'cursor')

    this.xAxis = this.svg.append('g')
    this.yAxis = this.svg.append('g')
  }

  private setAxes() {
    this.xAxis
      .attr('transform', `translate(0, ${this.box.inner.bottom})`)
      .call(d3.axisBottom(this.xScale))

    this.yAxis
      .attr('transform', `translate(${this.box.inner.left}, 0)`)
      .call(d3.axisLeft(this.yScale))
  }

  private initCursor() {
    this.cursor = new Cursor(this.cursorGroup, () => this.box.inner)
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

  onResize() {
    this.setSizes();
    this.setAxes()
    this.setData(this.data)
    this.cursor.redraw()
  }

  override draw(shouldAnimate = true) {
    this.points = this.pointsGroup.selectAll('circle')
    this.points = this.points.data<WorkItem>(this.data, d => d.id)
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
  }

  private onHover(d: WorkItem) {
    let location: Point = {
      x: this.xScale(d.time),
      y: this.yScale(d.points)
    }
    location = this.svgRect.unmap(location)
    this.hover$.next(new HoverEvent(d, location))
  }
}
