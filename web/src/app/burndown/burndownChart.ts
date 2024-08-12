import {D3Chart} from "@app/chart/d3Chart";
import {WorkItem} from "@app/velocity-scatter/work-item.service";
import * as d3 from "d3";
import {ContainerSelection, DataSelection} from "@app/chart/d3";
import {BurndownConfig} from "@app/burndown/burndownConfig";
import {BaseType} from "d3";

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

  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private barsGroup!: ContainerSelection
  private bars!: DataSelection<SVGGElement, TimeBucket>
  private linesGroup!: ContainerSelection


  override init(config: BurndownConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement)
    this.initElements();

    this.reInit();

    this.init$.next()
  }

  reInit() {
    this.timeBuckets = []
    for (let i = this.config.timeIncrement; i <= this.config.timeMax; i += this.config.timeIncrement) {
      this.timeBuckets.push(
        new TimeBucket(i - this.config.timeIncrement, i)
      )
    }

    this.xScale = d3.scaleBand<TimeBucket>().domain(this.timeBuckets)
      .padding(.1)
    this.yScale = d3.scaleLinear().domain([0, this.config.pointsMax])
    this.height = d3.scaleLinear().domain([0, this.config.pointsMax])

    this.setSizes()
    this.setAxes()
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
    this.setSizes();
    this.setAxes()
    this.setData(this.data)
  }

  private initElements() {
    this.barsGroup = this.svg.append('g').classed('bars', true)
    this.linesGroup = this.svg.append('g').classed('lines', true)
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

  override setData(workItems: WorkItem[]) {
    super.setData(workItems)

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

    this.bars = this.barsGroup.selectAll('g')
    this.bars = this.bars.data<TimeBucket>(this.timeBuckets, d => d.max)
      .join<SVGGElement, TimeBucket>(
        enter => {
          const g = enter.append('g')
            .attr('stroke', 'white')
            .attr('stroke-width', '1px')

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

    const burndownLine = d3.line<TimeBucket>()
      .x(d => this.xScale(d)! + this.xScale.bandwidth()/2)
      .y(d => this.yScale(d.remainingPoints))

    const totalLine = d3.line<TimeBucket>()
      .x(d => this.xScale(d)! + this.xScale.bandwidth()/2)
      .y(d => this.yScale(d.totalPoints))

    const burndownPath = this.linesGroup.append('path')
      .attr('class', 'burndown')
      .attr('stroke-dasharray', '0,1')
      .attr('d', burndownLine(this.timeBuckets))

    const totalPath = this.linesGroup.append('path')
      .attr('class', 'total-scope')
      .attr('stroke-dasharray', '0,1')
      .attr('d', totalLine(this.timeBuckets))

    const transition = this.transition().duration(1000)

    this.bars.transition(transition)
      .attr('transform',
        d => `translate(${this.xScale(d)}, ${this.yScale(d.totalPoints)})`)

    this.bars.transition(transition)
      .selectAll<SVGRectElement, TimeBucket>('rect.completed')
      .attr('height', d => this.height(d.completedPoints))

    this.bars.transition(transition)
      .selectAll<SVGRectElement, TimeBucket>('rect.active')
      .attr('y', d => this.height(d.completedPoints))
      .attr('height', b => this.height(b.activePoints))

    this.bars.transition(transition)
      .selectAll<SVGRectElement, TimeBucket>('rect.remaining')
      .attr('y', d => this.height(d.completedPoints + d.activePoints))
      .attr('height', d => this.height(d.remainingPoints))

    this.growPath(burndownPath, transition)
    this.growPath(totalPath, transition)
  }

  private growPath(path: d3.Selection<SVGPathElement, unknown, null, undefined>, transition: d3.Transition<BaseType, any, any, any>) {
    path.transition(transition)
      .attrTween("stroke-dasharray", function() {
        const length = this.getTotalLength();
        return d3.interpolate(`0,${length}`, `${length},${length}`);
      })
  }
}
