export class TimeBucket {
  label: string;

  constructor(public min: number, public max: number) {
    this.label = max.toString()
  }

  completedPoints = 0;
  activePoints = 0;
  remainingPoints = 0;
  totalPoints = 0

  // to act as a d3.ScaleBand Domain
  valueOf() {
    return this.max
  }

  toString() {
    return this.valueOf().toString()
  }
}
