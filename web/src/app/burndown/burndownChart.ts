import {D3Chart} from "@app/chart/d3Chart";
import {WorkItem} from "@app/data/work-item.service";
import * as d3 from "d3";
import {ContainerSelection, ElementSelection, Transition} from "@app/chart/d3";
import {BurndownConfig} from "@app/burndown/burndownConfig";
import {Point} from "@app/chart/rect";
import {distinctUntilChanged, Subject} from "rxjs";
import {TimeBucket} from "@app/burndown/timeBucket";
import {LineSeries, Series} from "@app/chart/lineSeries";
import {BarSeries} from "@app/chart/barSeries";
import {HoverSeries} from "@app/chart/hoverSeries";
import {BurndownHover} from "@app/burndown/burndownHover";
import {HoverChart} from "@app/chart/hoverChart";

export class BurndownChart extends D3Chart<BurndownConfig, WorkItem[]> implements HoverChart {
  private hoverElement!: ElementSelection<HTMLDivElement>;
  private timeBuckets: TimeBucket[] = []

  private xScale!: d3.ScaleBand<TimeBucket>;
  private yScale!: d3.ScaleLinear<number, number>;
  private height!: d3.ScaleLinear<number, number>;

  private plotBackground!: d3.Selection<SVGRectElement, any, any, any>;

  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private hover$ = new Subject<TimeBucket | null>();
  private hover!: BurndownHover

  private series: Series<TimeBucket>[] = []
  private hoverSeries: HoverSeries<TimeBucket>[] = []
  private seriesGroup!: ContainerSelection

  override init(config: BurndownConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement)
    this.makeBuckets();
    this.xScale = d3.scaleBand<TimeBucket>()
    this.yScale = d3.scaleLinear()

    this.initElements();

    this.hover$.pipe(distinctUntilChanged()).subscribe((bucket) => {
      const transition = this.transition()
        .duration(150)
      this.hover.hover(bucket)
      for (const series of this.hoverSeries) {
        series.hover(transition, bucket)
      }
    })

    this.reInit();

    this.init$.next()
  }

  setHover(element: HTMLDivElement) {
    this.hoverElement = d3.select(element)
  }

  reInit() {
    this.xScale.domain(this.timeBuckets)
      .paddingOuter(.1)
      .paddingInner(.4)
    this.yScale.domain([0, this.config.pointsMax])
    this.height = d3.scaleLinear().domain([0, this.config.pointsMax])

    this.setSizes()
    this.setAxes()

    this.seriesGroup.selectAll("g").remove()

    this.series = [
      new BarSeries<TimeBucket>(
        "remaining",
        this.seriesGroup.append('g'),
        d => this.xScale(d)!,
        d => this.yScale(d.remainingPoints),
        () => this.yScale(0),
        d => this.xScale.bandwidth(),
        d => this.height(d.remainingPoints)
      ),
      new BarSeries<TimeBucket>(
        "active",
        this.seriesGroup.append('g'),
        d => this.xScale(d)!,
        d => this.yScale(d.activePoints) - this.height(d.remainingPoints),
        () => this.yScale(0),
        d => this.xScale.bandwidth(),
        d => this.height(d.activePoints)
      ),
      new BarSeries<TimeBucket>(
        "completed",
        this.seriesGroup.append('g'),
        d => this.xScale(d)!,
        d => this.yScale(d.completedPoints) - this.height(d.remainingPoints) - this.height(d.activePoints),
        () => this.yScale(0),
        d => this.xScale.bandwidth(),
        d => this.height(d.completedPoints)
      ).setEnabled(() => this.config.showCompleted),

      new LineSeries<TimeBucket>(
        "burndown",
        this.seriesGroup.append('g'),
        d => this.xScale(d)! + this.xScale.bandwidth() / 2,
        d => this.yScale(d.remainingPoints)
      ),

      new LineSeries<TimeBucket>(
        "total-scope",
        this.seriesGroup.append('g'),
        d => this.xScale(d)! + this.xScale.bandwidth() / 2,
        d => this.yScale(d.totalPoints)
      ),
    ]
    this.hoverSeries = [
      new HoverSeries<TimeBucket>(
        "burndown-points",
        this.seriesGroup.append('g'),
        d => this.xScale(d)! + this.xScale.bandwidth() / 2,
        d => this.yScale(d.remainingPoints)
      ),
      new HoverSeries<TimeBucket>(
        "total-scope-points",
        this.seriesGroup.append('g'),
        d => this.xScale(d)! + this.xScale.bandwidth() / 2,
        d => this.yScale(d.totalPoints)
      )
    ]

    this.series.push(...this.hoverSeries)

    this.hover = new BurndownHover(
      this.svgRect,
      this.box,
      this.config,
      this.hoverElement,
      this.xScale,
      this.yScale
    )
  }

  private makeBuckets() {
    this.timeBuckets = []
    for (let i = this.config.timeIncrement; i <= this.config.timeMax; i += this.config.timeIncrement) {
      this.timeBuckets.push(
        new TimeBucket(i - this.config.timeIncrement, i)
      )
    }
  }

  override setSizes() {
    super.setSizes()
    this.xScale.range([this.box.inner.left, this.box.inner.right])
    this.yScale.range([this.box.inner.bottom, this.box.inner.top])
    this.height.range([0, this.box.inner.height])
  }

  override onResize(): void {
    this.setSizes()
    this.setAxes()
    this.reDraw()
  }

  private initElements() {
    this.plotBackground = this.svg.append('rect')
      .classed('plot-background', true)
      .attr('fill', 'transparent')
    this.svg.on('mousemove', (event) => {
      const svgPoint = this.svgRect.mapPoint(event)
      if (!this.box.inner.contains(svgPoint)) {
        this.hover$.next(null)
      } else {
        event.preventDefault()
        this.onHover(event)
      }
    })
    this.xAxis = this.svg.append('g')
    this.yAxis = this.svg.append('g')

    this.seriesGroup = this.svg.append("g").attr('class', 'series-group')
  }

  private setAxes() {
    this.xAxis
      .attr('transform', `translate(0, ${this.box.inner.bottom})`)
      .call(d3.axisBottom(this.xScale))

    this.yAxis
      .attr('transform', `translate(${this.box.inner.left}, 0)`)
      .call(d3.axisLeft(this.yScale))
  }

  override setData(data: WorkItem[]) {
    let completed = 5
    let active = 3
    let remaining = 20

    for (let i = 0; i < this.timeBuckets.length; i++) {
      const bucket = this.timeBuckets[i]
      bucket.completedPoints = completed
      bucket.activePoints = active
      bucket.remainingPoints = remaining
      bucket.totalPoints = bucket.completedPoints + bucket.activePoints + bucket.remainingPoints

      if (remaining === 0 && active == 0)
        continue

      if (active > remaining) {
        completed = completed + active
        active = remaining
        remaining = 0
      } else if (remaining === 0) {
        completed += active
        active = 0
      } else {
        remaining -= active
        completed += active
      }
    }
    super.setData(data);
  }

  override draw(shouldAnimate = true) {
    this.plotBackground
      .attr('x', this.box.inner.left)
      .attr('y', this.box.inner.top)
      .attr('width', this.box.inner.width)
      .attr('height', this.box.inner.height)

    const transition: Transition | null = shouldAnimate ? this.transition().duration(1000) : null

    for (const series of this.series) {
      series.draw(transition, this.timeBuckets)
    }
  }

  private onHover(event: Point) {
    const svgPoint = this.svgRect.mapPoint(event)
    const plotPoint = this.box.inner.mapPoint(svgPoint)

    const bandWidth = this.box.inner.width / this.timeBuckets.length
    const outerPadding = this.xScale.paddingOuter() * bandWidth

    let index = 0;
    if (plotPoint.x <= outerPadding)
      index = 0
    else if (this.box.inner.width - outerPadding <= plotPoint.x)
      index = this.timeBuckets.length - 1
    else {
      const innerX = plotPoint.x - outerPadding
      index = Math.floor(innerX / this.xScale.step())
    }
    const bucket = this.timeBuckets[index]

    this.hover$.next(bucket)
  }
}
