import * as d3 from 'd3';

export class VelocityScatterChart {
  private svgElement!: SVGSVGElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;


  init(svgElement: SVGSVGElement) {
    this.svgElement = svgElement
    this.svg = d3.select(this.svgElement)
    this.configureSize()

    this.svg.attr('style', 'background: red')
  }

  configureSize() {
    this.onResize();
    new ResizeObserver(() => this.onResize())
      .observe(this.svgElement)
  }

  onResize() {
    // todo: rescale axis
    // todo: redraw?
  }
}
