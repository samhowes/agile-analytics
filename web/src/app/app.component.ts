import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {VelocityScatterComponent} from "./velocity-scatter/velocity-scatter.component";
import {BurndownComponent} from "@app/burndown/burndown.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, VelocityScatterComponent, BurndownComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'agile-analytics';
}
