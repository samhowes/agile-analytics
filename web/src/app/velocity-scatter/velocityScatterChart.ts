import * as d3 from 'd3';
import {ElementRef} from "@angular/core";
import {WorkItem} from "./work-item.service";
import {Subject} from "rxjs";

export class Margins {
  constructor(public top: number, public right: number, public bottom: number, public left: number) {}
}

export class Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  constructor(public width: number, public height: number, public x = 0, public y = 0) {
    this.top = y;
    this.bottom = this.top + height;
    this.left = x;
    this.right = this.left + width;
  }
}

export class ChartBox {
  public inner: Rect;
  constructor(
    public boundingRect: Rect,
    public margins: Margins
  ) {
    this.inner = new Rect(
      this.boundingRect.width - margins.left - margins.right,
      this.boundingRect.height - margins.top - margins.bottom,
      this.boundingRect.x + margins.left,
      this.boundingRect.y + margins.top,
    )
  }
}

export class VelocityScatterChart {
  private svgElement!: SVGSVGElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private box!: ChartBox
  private margins = new Margins(20, 20, 20, 20)
  private xScale!: d3.ScaleLinear<number, number, never>;
  private yScale!: d3.ScaleLinear<number, number, never>;
  private pointsGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private points!: d3.Selection<SVGCircleElement, WorkItem, SVGGElement, unknown>;

  public init$ = new Subject<void>();

  init(svgElement: SVGSVGElement) {
    this.svgElement = svgElement
    this.svg = d3.select(this.svgElement)
    this.pointsGroup = this.svg.append('g')
      .attr('class', 'work-items')

    this.initSize()
    new ResizeObserver(() => this.onResize())
      .observe(this.svgElement)

    this.xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([this.box.inner.left, this.box.inner.right])

    this.yScale = d3.scaleLinear()
      .domain([0, 13])
      .range([this.box.inner.bottom, this.box.inner.top])

    this.initElements()
    this.init$.next()
  }

  onResize() {
    this.initSize();
    // todo: rescale axis
    // todo: redraw?
  }

  private initSize() {
    const rect = this.svgElement.getBoundingClientRect();
    this.box = new ChartBox(
      new Rect(rect.width, rect.height),
      this.margins
    )
  }

  private initElements() {
    const xAxis = this.svg.append('g')
      .attr('transform', `translate(0, ${this.box.inner.bottom})`)
      .call(d3.axisBottom(this.xScale))

    const yAxis = this.svg.append('g')
      .attr('transform', `translate(${this.box.inner.left}, 0)`)
      .call(d3.axisLeft(this.yScale))
  }

  setData(workItems: WorkItem[]) {
    this.points = this.pointsGroup.selectAll('circle')
    this.points = this.points.data(workItems, d => d.id)
      .join("circle")
      .attr('transform',d => `translate(${this.xScale(d.time)}, ${this.yScale(d.points)})`)
      .attr("r", 3)
  }
}
