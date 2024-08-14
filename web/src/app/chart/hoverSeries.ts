import {ContainerSelection, ElementSelection, Transition} from "@app/chart/d3";
import * as d3 from "d3";
import {Series} from "@app/chart/lineSeries";

export class HoverSeries<TDatum> implements Series<TDatum> {
  private halo!: ElementSelection<SVGCircleElement>;
  private map = new Map<TDatum, ElementSelection<SVGCircleElement>>()
  private hoverElement: ElementSelection<SVGCircleElement> | null = null

  constructor(
    public name: string,
    private container: ContainerSelection,
    private x: (datum: TDatum) => number,
    private y: (datum: TDatum) => number,
  ) {
    this.container.classed(`series-${name}`, true)
  }

  draw(transition: Transition | null, data: TDatum[]): void {
    this.map.clear()

    if (!this.halo) {
      this.halo = this.container.append('circle')
        .attr('class', 'halo')
        .attr('visibility', 'hidden')
    }

    const self = this
    this.container.selectAll('circle.point')
      .data(data)
      .join<SVGCircleElement, TDatum>('circle')
      .attr('class', 'point')
      .attr('cx', d => this.x(d))
      .attr('cy', d => this.y(d))
      .attr('r', 0)
      .attr('opacity', 1)
      .each(function (d) {
        const el = d3.select(this) as ElementSelection<SVGCircleElement>
        self.map.set(d, el);
      })
  }

  hover(transition: Transition, item: TDatum | null) {
    if (!item) {
      if (!this.hoverElement)
        return;
      this.hoverElement.transition(transition)
        .attr('r', 0)
      this.halo.transition(transition)
        .attr('r', 0)
      this.hoverElement = null
      return
    }

    if (this.hoverElement) {
      this.hoverElement.transition(transition)
        .attr('r', 0)
    }

    this.hoverElement = this.map.get(item)!
    this.hoverElement
      .attr('opacity', 1)
      .transition(transition)
      .attr('r', 6)

    this.halo
      .attr('visibility', null)
      .attr('cx', this.x(item))
      .attr('cy', this.y(item))
      .transition(transition)
      .attr('r', 10)
  }
}
