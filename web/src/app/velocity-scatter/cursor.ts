import * as d3 from "d3";
import {Point, Rect} from "./rect";
import {ContainerSelection, ElementSelection} from "./d3";

export class Cursor {
  xLine: ElementSelection<SVGLineElement>;
  yLine: ElementSelection<SVGLineElement>;
  visible: boolean = false;
  location: Point;

  constructor(private group: ContainerSelection, private box: Rect) {
    this.hide()
    this.location = {x: 0, y: 0}
    this.xLine = group.append('line')
    this.yLine = group.append('line')
  }

  show() {
    this.group.attr('style', null)
    this.visible = true
  }

  hide() {
    this.group.attr('style', 'display: none;')
    this.visible = false
  }

  redraw() {
    if (!this.visible)
      return
    this.moveTo(this.location)
  }

  moveTo(location: Point) {
    this.xLine
      .attr('x1', location.x)
      .attr('x2', location.x)
      .attr('y1', this.box.top)
      .attr('y2', this.box.bottom)

    this.yLine
      .attr('x1', this.box.left)
      .attr('x2', this.box.right)
      .attr('y1', location.y)
      .attr('y2', location.y)

    this.location = location;
  }
}
