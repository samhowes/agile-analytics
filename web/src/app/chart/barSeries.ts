import {ContainerSelection, D3, DataSelection, Transition} from "@app/chart/d3";
import {Series} from "@app/chart/lineSeries";

export class BarSeries<TDatum> implements Series<TDatum> {
  constructor(
    public name: string,
    private container: ContainerSelection,
    private x: (datum: TDatum) => number,
    private y: (datum: TDatum) => number,
    private yBottom: () => number,
    private width: (datum: TDatum) => number,
    private height: (datum: TDatum) => number,
  ) {
    this.container.classed(`series-${name}`, true)
  }

  draw(transition: Transition | null, data: TDatum[]): void {
    let bars: DataSelection<SVGRectElement, TDatum> = this.container.selectAll('rect')
    bars = bars.data<TDatum>(data)
      .join<SVGRectElement, TDatum>(enter => {
          return enter.append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.x(d))
            .attr('y', d => this.yBottom())
            .attr('width', d => this.width(d))
            .attr('height', 0)
        }, update => update,
        exit => exit.remove())

    bars = D3.applyTransition(bars, transition)

    bars
      .attr('y', d => this.y(d))
      .attr('height', d => this.height(d))
  }
}
