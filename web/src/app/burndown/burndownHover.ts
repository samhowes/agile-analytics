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
    private box: ChartBox,
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

    const screenRect = this.container.node()!.getBoundingClientRect()

    const yOffset = -screenRect.height/2;
    const xOffset = 15
    const baseY = this.yScale(bucket.remainingPoints)
    const baseX = this.xScale(bucket)! + this.xScale.bandwidth() / 2

    let rect = new Rect(
      screenRect.width,
      screenRect.height,
      baseX - xOffset - screenRect.width,
      baseY + yOffset,
    )

    // are we extending past the left side of the screen?
    if (rect.left < this.box.inner.left) {
      // swap to the right side instead of the left
      rect.setX(baseX + xOffset)
    }

    // are we extending beyond the bottom?
    const bottomDiff = this.box.inner.bottom - rect.bottom
    if (bottomDiff < 0) {
      // shift upwards
      rect.setY(rect.y + bottomDiff)
    }

    // are we extending beyond the top?
    const topDiff = rect.top - this.box.inner.top
    if (topDiff < 0) {
      // shift downwards, invert the negative number
      rect.setY(rect.y + topDiff)
    }

    // adjust to screen coordinates
    rect.setX(this.svgRect.x + rect.x)
    rect.setY(this.svgRect.y + rect.y)

    const transition = this.container.transition()
      .duration(400)

    if (!this.visible) {
      this.container
        .style('left', rect.x + 'px')
        .style('top', rect.y + 'px')
      transition.style('opacity', 1)
    } else {
      transition
        .style('left', rect.x + 'px')
        .style('top', rect.y + 'px')
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
