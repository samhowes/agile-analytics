import {Rect} from "@app/chart/rect";
import {BurndownConfig} from "@app/burndown/burndownConfig";
import {ElementSelection} from "@app/chart/d3";
import * as d3 from "d3";
import {TimeBucket} from "@app/burndown/timeBucket";
import {ChartBox} from "@app/chart/chartBox";

export class HoverElement {
  className: string;
  constructor(
    public name: string,
    public valueFn: (d: TimeBucket) => number)
  {
    this.className = name.toLowerCase().replaceAll(' ', '-')
  }
}

export class BurndownHover {
  private elements: HoverElement[] = []
  private visible = false
  constructor(
    private svgRect: Rect,
    private config: BurndownConfig,
    private container: ElementSelection<HTMLDivElement>,
    private xScale: d3.ScaleBand<TimeBucket>,
    private yScale: d3.ScaleLinear<number, number>
  ) {

    if (this.config.showCompleted) {
      this.elements.push(new HoverElement("Completed", (d) => d.completedPoints))
    }

    if (this.config.showActive) {
      this.elements.push(new HoverElement("Active", (d) => d.activePoints))
    }

    this.elements.push(new HoverElement("Remaining", (d) => d.remainingPoints))

    if (this.config.showBurndown) {
      this.elements.push(new HoverElement("Burndown", (d) => d.remainingPoints))
    }

    if (this.config.showTotalScope) {
      this.elements.push(new HoverElement("Total Scope", (d) => d.totalPoints))
    }
  }

  hover(bucket: TimeBucket|null) {
    if (!bucket) {
      if (!this.visible)
        return

      this.container.transition()
        .delay(500)
        .duration(400)
        .style('opacity', 0)
      return
    }

    this.setContent(bucket)

    const yOffset = -30;
    const xOffset = 30
    const y = this.yScale(bucket.remainingPoints) + this.svgRect.top + yOffset
    const x = this.xScale(bucket)! + this.xScale.bandwidth() / 2 + this.svgRect.left + xOffset

    const transition = this.container.transition()
      .duration(400)

    if (!this.visible) {
      this.container
        .style('top', y + 'px')
        .style('left', x + 'px')
      transition.style('opacity', 1)
    } else {
      transition
        .style('top', y + 'px')
        .style('left', x + 'px')
    }
  }

  private setContent(bucket: TimeBucket) {
    this.container.selectAll("*").remove()
    this.container.append('span')
      .attr('class', 'title')
      .text(`${bucket.max} hrs`)

    for (const e of this.elements) {
      const div = this.container.append('div')
        .attr('class', `data-point data-point-${e.className}`)
      div.append('svg')
        .append('rect')
        .attr('width', 10)
        .attr('height', 10)
      div.append('span')
        .text(`${e.name}: ${e.valueFn(bucket)}`)
    }
  }
}
