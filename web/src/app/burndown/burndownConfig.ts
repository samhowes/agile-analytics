import {StateManager} from "@lib/state-manager";

export class BurndownConfig extends StateManager{
  constructor() {
    super(BurndownConfig.name);
  }
  pointsMax = 50
  timeMax = 100
  timeIncrement = 10
  showCompleted: boolean = true;
}
