import {Observable, Subject} from "rxjs";
import * as d3 from "d3";
import {Rect} from "@app/chart/rect";
import {ChartBox, Margins} from "@app/chart/chartBox";
import {WorkItem} from "@app/velocity-scatter/work-item.service";
import {BaseType} from "d3";

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

    new ResizeObserver(() => this.onResize())
      .observe(this.svgElement)
  }

  protected setSizes() {
    const rect = this.svgElement.getBoundingClientRect();
    this.svgRect = new Rect(rect.width, rect.height, rect.x, rect.y);
    this.box = new ChartBox(
      new Rect(rect.width, rect.height),
      this.margins
    )
  }

  abstract onResize(): void;

  setData(data: TData): void {
    this.data = data
  }

  reDraw() {
    this.setData(this.data)
  }

  protected transition() {
    return this.svg.transition() as unknown as d3.Transition<BaseType, any, any, any>
  }
}
