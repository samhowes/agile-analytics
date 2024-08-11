import * as d3 from 'd3';
import {WorkItem} from "./work-item.service";
import {Subject} from "rxjs";
import {Point, Rect} from "./rect";

export class Cursor {
  xLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
  yLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
  visible: boolean = false;
  location: Point;

  constructor(private group: d3.Selection<SVGGElement, unknown, null, undefined>, private box: Rect) {
    this.hide()
    this.location = {x:0,y:0}
    this.xLine = group.append('line')
    this.yLine = group.append('line')
  }

  show() {
    this.group.attr('style', null)
    this.visible = true
  }

  hide() {
    this.group.attr('style', 'display: none;')
    this.visible = false
  }

  moveTo(location: Point) {

    this.xLine
      .attr('x1', location.x)
      .attr('x2', location.x)
      .attr('y1', this.box.top)
      .attr('y2', this.box.bottom)

    this.yLine
      .attr('x1', this.box.left)
      .attr('x2', this.box.right)
      .attr('y1', location.y)
      .attr('y2', location.y)

    this.location = location;
  }
}

export class Margins {
  constructor(public top: number, public right: number, public bottom: number, public left: number) {}
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
  private svgRect!: Rect
  private box!: ChartBox
  private margins = new Margins(20, 20, 20, 20)
  private xScale!: d3.ScaleLinear<number, number, never>;
  private yScale!: d3.ScaleLinear<number, number, never>;
  private pointsGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private points!: d3.Selection<SVGCircleElement, WorkItem, SVGGElement, unknown>;

  public init$ = new Subject<void>();
  private cursor!: Cursor;
  private cursorGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private pointRadius!: number;

  init(svgElement: SVGSVGElement) {
    this.svgElement = svgElement
    this.svg = d3.select(this.svgElement)
    this.pointsGroup = this.svg.append('g')
      .attr('class', 'work-items')
    this.cursorGroup = this.svg.append('g')
      .attr('class', 'cursor')

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
    this.initCursor()
    this.init$.next()
  }

  onResize() {
    this.initSize();
    // todo: rescale axis
    // todo: redraw?
  }

  private initSize() {
    const rect = this.svgElement.getBoundingClientRect();
    this.svgRect = new Rect(rect.width, rect.height, rect.x, rect.y);
    this.box = new ChartBox(
      new Rect(rect.width, rect.height),
      this.margins
    )
    this.pointRadius = 5
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
      .attr("r", this.pointRadius)
  }

  private initCursor() {
    this.cursor = new Cursor(this.cursorGroup, this.box.inner)
    this.svg.on('mousemove', e => {
      const location = this.svgRect.translate(e)
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
  }
}
