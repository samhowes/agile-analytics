import {D3Chart} from "@app/chart/d3Chart";
import {WorkItem} from "@app/velocity-scatter/work-item.service";
import * as d3 from "d3";
import {ContainerSelection, DataSelection} from "@app/chart/d3";

export class BurndownConfig {
  pointsMax = 50
  timeMax = 100
  timeIncrement = 10
}

export class TimeBucket {
  label: string;

  constructor(public min: number, public max: number) {
    this.label = max.toString()
  }

  completedPoints = 0;
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

  private xAxis!: ContainerSelection
  private yAxis!: ContainerSelection

  private barsGroup!: ContainerSelection
  private bars!: DataSelection<SVGGElement, TimeBucket>


  override init(config: BurndownConfig, svgElement: SVGSVGElement) {
    super.init(config, svgElement)

    this.timeBuckets = []
    for (let i = this.config.timeIncrement; i <= this.config.timeMax; i += this.config.timeIncrement) {
      this.timeBuckets.push(
        new TimeBucket(i - this.config.timeIncrement, i)
      )
    }

    this.xScale = d3.scaleBand<TimeBucket>().domain(this.timeBuckets)
      .padding(.1)
    this.yScale = d3.scaleLinear().domain([0, this.config.pointsMax])

    this.setSizes()
    this.initElements();
    this.setAxes()

    this.init$.next()
  }

  override setSizes() {
    super.setSizes()
    this.xScale.range([this.box.inner.left, this.box.inner.right])
    this.yScale.range([this.box.inner.bottom, this.box.inner.top])
  }

  override onResize(): void {
    this.setSizes();
    this.setAxes()
    this.setData(this.data)
  }

  private initElements() {
    this.barsGroup = this.svg.append('g').classed('bars', true)
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

    for (let i = 0; i < this.timeBuckets.length; i++) {
      const bucket = this.timeBuckets[i]
      bucket.completedPoints = 20
      bucket.remainingPoints = 10
      bucket.totalPoints = bucket.completedPoints + bucket.remainingPoints
    }

    this.bars = this.barsGroup.selectAll('g')
    this.bars = this.bars.data<TimeBucket>(this.timeBuckets, d => d.max)
      .join<SVGGElement, TimeBucket>(
        enter => {
          const g = enter.append('g')
          g.append('rect')
            .attr('x', d => 0)
            .attr('y', d => 0)
            // .attr('width', this.xScale.bandwidth())
            .attr('height', b => this.yScale(0) - this.yScale(b.completedPoints))
            .attr('class', 'bar completed')
          return g
        },
        update => update,
        exit => exit.remove()
      ).attr('transform',
        d => `translate(${this.xScale(d)}, ${this.yScale(d.completedPoints)})`)

    // make sure width gets set on update so it gets resized on screen resize
    this.bars
      .selectAll('rect')
      .attr('width', this.xScale.bandwidth())
  }
}
