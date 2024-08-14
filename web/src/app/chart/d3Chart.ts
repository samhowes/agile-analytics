import {Subject} from "rxjs";
import * as d3 from "d3";
import {BaseType} from "d3";
import {Rect} from "@app/chart/rect";
import {ChartBox, Margins} from "@app/chart/chartBox";

export abstract class D3Chart<TConfig, TData> {
  init$ = new Subject<void>();
  config!: TConfig
  protected data!: TData;

  protected svgElement!: SVGSVGElement;
  protected svg!: d3.Selection<SVGSVGElement, any, any, any>;
  protected svgRect!: Rect
  protected box!: ChartBox
  protected margins = new Margins(20, 20, 20, 20)

  init(config: TConfig, svgElement: SVGSVGElement): void {
    this.config = config
    this.svgElement = svgElement
    this.svg = d3.select(this.svgElement)

    new ResizeObserver(() => {
      const newRect = this.getSvgRect()
      if (newRect.equals(this.svgRect))
        return
      this.onResize();
    })
      .observe(this.svgElement)
  }

  private getSvgRect() {
    const rect = this.svgElement.getBoundingClientRect();
    return new Rect(rect.width, rect.height, rect.x, rect.y)
  }

  protected setSizes() {
    this.svgRect = this.getSvgRect()
    this.box = new ChartBox(
      new Rect(this.svgRect.width, this.svgRect.height),
      this.margins
    )
  }

  abstract onResize(): void;

  setData(data: TData): void {
    this.data = data
    this.draw(true)
  }

  abstract draw(shouldAnimate: boolean): void;

  reDraw() {
    this.draw(false)
  }

  protected transition() {
    return this.svg.transition() as unknown as d3.Transition<BaseType, any, any, any>
  }
}
