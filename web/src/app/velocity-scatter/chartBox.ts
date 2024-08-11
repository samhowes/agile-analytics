import {Rect} from "./rect";

export class Margins {
  constructor(public top: number, public right: number, public bottom: number, public left: number) {}
}

export class ChartBox {
  public inner: Rect;

  constructor(
    public boundingRect: Rect,
    public margins: Margins
  ) {
    this.inner = new Rect(
      this.boundingRect.width - margins.left - margins.right,
      this.boundingRect.height - margins.top - margins.bottom,
      this.boundingRect.x + margins.left,
      this.boundingRect.y + margins.top,
    )
  }
}
