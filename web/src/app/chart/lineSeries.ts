import {ContainerSelection, ElementSelection, Transition} from "@app/chart/d3";
import * as d3 from "d3";

export interface Series<TDatum> {
  draw(transition: Transition | null, data: TDatum[]): void;
}

export class LineSeries<TDatum> implements Series<TDatum> {
  private readonly line: d3.Line<TDatum>;
  private path!: ElementSelection<SVGPathElement>;

  constructor(
    public name: string,
    private container: ContainerSelection,
    private x: (datum: TDatum) => number,
    private y: (datum: TDatum) => number,
  ) {
    this.container.classed(`series-${name}`, true)
    this.line = d3.line<TDatum>()
      .x(this.x)
      .y(this.y)
  }

  draw(transition: Transition | null, data: TDatum[]) {
    if (!this.path) {
      this.path = this.container.append('path').classed('series-line', true)
    } else if (!transition) {
      this.path.attr('stroke-dasharray', null)
    }
    this.path.attr('d', this.line(data))

    if (!transition)
      return

    this.path.attr('stroke-dasharray', '0,1')
    this.path.transition(transition)
      .attrTween("stroke-dasharray", function () {
        const length = this.getTotalLength();
        return d3.interpolate(`0,${length}`, `${length},${length}`);
      })
  }
}

