import {D3Chart} from "@app/chart/d3Chart";
import {WorkItem} from "@app/velocity-scatter/work-item.service";
import * as d3 from "d3";
import {ContainerSelection, DataSelection, ElementSelection, Transition} from "@app/chart/d3";
import {BurndownConfig} from "@app/burndown/burndownConfig";
import {Action} from "@lib/reflection";
import {Point} from "@app/chart/rect";
import {distinct, distinctUntilChanged, Subject} from "rxjs";
import {data} from "autoprefixer";

export class TimeBucket {
  label: string;

  constructor(public min: number, public max: number) {
    this.label = max.toString()
  }

  completedPoints = 0;
  activePoints = 0;
  remainingPoints = 0;
  totalPoints = 0

  // to act as a d3.ScaleBand Domain
  valueOf() {
    return this.max
  }

  toString() {
    return this.valueOf().toString()
  }
}

export class BurndownChart extends D3Chart<BurndownConfig, WorkItem[]> {
  private timeBuckets: TimeBucket[] = []

  private xScale!: d3.ScaleBand<TimeBucket>;
  private yScale!: d3.ScaleLinear<number, number>;
  private height!: d3.ScaleLinear<number, number>;

  private plotBackground!: d3.Selection<SVGRectElement, any, any, any>;

  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private barsGroup!: ContainerSelection
  private bars!: DataSelection<SVGGElement, TimeBucket>
  private linesGroup!: ContainerSelection

  private burndownPath!: d3.Selection<SVGPathElement, unknown, null, undefined>;
  private totalPath!: d3.Selection<SVGPathElement, unknown, null, undefined>;
  private hover$ = new Subject<TimeBucket | null>();


  override init(config: BurndownConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement)
    this.initElements();

    this.hover$.pipe(distinctUntilChanged()).subscribe((bucket) => {
      if (!bucket) {
        console.log('mouseleave')
      } else {
        console.log(bucket.max)
      }
    })

    this.reInit();

    this.init$.next()
  }

  reInit() {
    this.makeBuckets();

    this.xScale = d3.scaleBand<TimeBucket>().domain(this.timeBuckets).padding(.1)
    this.yScale = d3.scaleLinear().domain([0, this.config.pointsMax])
    this.height = d3.scaleLinear().domain([0, this.config.pointsMax])

    this.setSizes()
    this.setAxes()
  }

  private makeBuckets() {
    this.timeBuckets = []
    for (let i = this.config.timeIncrement; i <= this.config.timeMax; i += this.config.timeIncrement) {
      this.timeBuckets.push(
        new TimeBucket(i - this.config.timeIncrement, i)
      )
    }
  }

  override reDraw() {
    this.bars.remove()
    super.reDraw()
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
    this.plotBackground = this.svg.append('rect').classed('plot-background', true)
      .on('mousemove', (event) => {
        event.preventDefault()
        this.onHover(event)
      })
    this.svg.on('mousemove', (event) => {
      const svgPoint = this.svgRect.mapPoint(event)
      if (!this.box.inner.contains(svgPoint)) {
        this.hover$.next(null)
      }
    })
    this.xAxis = this.svg.append('g')
    this.yAxis = this.svg.append('g')
    this.barsGroup = this.svg.append('g').classed('bars', true)
    this.linesGroup = this.svg.append('g').classed('lines', true)
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

    this.drawBars(transition);
    this.drawLines(transition);
  }

  private drawLines(transition: Transition | null) {
    const burndownLine = d3.line<TimeBucket>()
      .x(d => this.xScale(d)! + this.xScale.bandwidth() / 2)
      .y(d => this.yScale(d.remainingPoints))

    const totalLine = d3.line<TimeBucket>()
      .x(d => this.xScale(d)! + this.xScale.bandwidth() / 2)
      .y(d => this.yScale(d.totalPoints))

    if (!this.burndownPath) {
      this.burndownPath = this.linesGroup.append('path')
        .attr('class', 'burndown')
    }
    this.burndownPath.attr('d', burndownLine(this.timeBuckets))

    if (!this.totalPath) {
      this.totalPath = this.linesGroup.append('path')
        .attr('class', 'total-scope')
    }
    this.totalPath.attr('d', totalLine(this.timeBuckets))


    this.growPath(this.burndownPath, transition)
    this.growPath(this.totalPath, transition)
  }

  private drawBars(transition: Transition | null) {
    this.bars = this.barsGroup.selectAll('g')

    const onHover = (event: any, bucket: TimeBucket) => this.hover$.next(bucket)

    this.bars = this.bars.data<TimeBucket>(this.timeBuckets, d => d.max)
      .join<SVGGElement, TimeBucket>(
        enter => {
          const g = enter.append('g')
            .attr('class', 'time-slice')
            .attr('stroke', 'white')
            .attr('stroke-width', '1px')
            .on('mouseover', onHover)

          // draw the bars from the top down, completed -> active -> remaining
          if (this.config.showCompleted) {
            g.append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('height', 0)
              .attr('class', 'bar completed')
          }

          g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('height', 0)
            .attr('class', 'bar active')

          g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('height', 0)
            .attr('class', 'bar remaining')

          return g
        },
        update => update,
        exit => exit.remove()
      ).attr('transform',
        d => `translate(${this.xScale(d)}, ${this.yScale(0)})`)

    // make sure width gets set on update so it gets resized on screen resize
    this.bars
      .selectAll('rect')
      .attr('width', this.xScale.bandwidth())

    const bars = this.applyTransition(this.bars, transition)

    bars.attr('transform',
      d => `translate(${this.xScale(d)}, ${this.yScale(d.totalPoints)})`)

    bars.selectAll<SVGRectElement, TimeBucket>('rect.completed')
      .attr('height', d => this.height(d.completedPoints))

    bars.selectAll<SVGRectElement, TimeBucket>('rect.active')
      .attr('y', d => this.height(d.completedPoints))
      .attr('height', b => this.height(b.activePoints))
    //
    bars.selectAll<SVGRectElement, TimeBucket>('rect.remaining')
      .attr('y', d => this.height(d.completedPoints + d.activePoints))
      .attr('height', d => this.height(d.remainingPoints))

  }

  private growPath(path: ElementSelection<SVGPathElement>, transition: Transition | null) {
    if (!transition)
      return;
    path.attr('stroke-dasharray', '0,1')
    path.transition(transition)
      .attrTween("stroke-dasharray", function () {
        const length = this.getTotalLength();
        return d3.interpolate(`0,${length}`, `${length},${length}`);
      })
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
