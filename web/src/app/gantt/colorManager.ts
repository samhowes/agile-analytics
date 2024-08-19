import Color from "colorjs.io";
import {ElementSelection} from "@app/chart/d3";

export class GanttItemColors {
  public border: Color;
  public header: Color;
  public body: Color;
  constructor(public primary: Color) {
    this.border = primary.clone()
    this.header = primary.clone()
    this.header.lighten()
    this.body = this.header.clone()
    this.body.lighten()
  }
}

export class ColorManager {
  private colors: GanttItemColors[] = [];
  private index = 0;

  constructor() {
    this.colors.push(new GanttItemColors(new Color("#ef0000")))
  }

  advance() {
    this.index++;
  }

  style(element: ElementSelection<HTMLElement>) {
    const colors = this.colors[this.index]

    const border = colors.primary.toString();
    element.style('border-color', border)

    element.select("div.header").style('background', colors.header.toString())
    element.select("div.body").style('background', colors.body.toString())
  }
}
