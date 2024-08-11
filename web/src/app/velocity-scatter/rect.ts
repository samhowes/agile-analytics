export interface Point {
  x: number;
  y: number;
}
export class Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;

  constructor(public width: number, public height: number, public x = 0, public y = 0) {
    this.top = y;
    this.bottom = this.top + height;
    this.left = x;
    this.right = this.left + width;
  }

  contains(p: Point) {
    return this.left <= p.x && p.x <= this.right
      && this.top <= p.y && p.y <= this.bottom // screen coordinates! top is zero pixels!
  }

  mapPoint(p: Point) {
    return {
      x: p.x - this.x,
      y: p.y - this.y,
    }
  }
}
