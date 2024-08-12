import {AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
import {SpinnerOverlay} from "@app/components/spinner-overlay.component";
import {WorkItemService} from "@app/velocity-scatter/work-item.service";
import {combineLatest} from "rxjs";
import {BurndownChart} from "@app/burndown/burndownChart";
import {NgIf} from "@angular/common";
import {ConfigureBurndownComponent} from "@app/burndown/configure-burndown/configure-burndown.component";
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {BurndownConfig} from "@app/burndown/burndownConfig";

@Component({
  selector: 'burndown',
  standalone: true,
  imports: [
    SpinnerOverlay,
    NgIf,
    ConfigureBurndownComponent,
    MatIconButton,
    MatIcon
  ],
  templateUrl: './burndown.component.html',
  styleUrl: './burndown.component.scss',
  providers: [BurndownChart]
})
export class BurndownComponent implements OnInit, AfterViewInit {
  svgElement = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private chart = inject(BurndownChart);
  private workItemService = inject(WorkItemService);

  isLoading = signal<boolean>(true)
  configureOpen = signal<boolean>(false)

  config = new BurndownConfig();
  menuConfig = this.config

  ngOnInit() {
    this.config.load()
    combineLatest([this.workItemService.getCompleted(), this.chart.init$]).subscribe(results => {
      this.isLoading.set(false)
      this.chart.setData(results[0])
    })
  }

  ngAfterViewInit() {
    this.chart.init(this.config, this.svgElement().nativeElement);
  }

  showConfigure() {
    this.menuConfig = Object.assign({}, this.config);
    this.configureOpen.set(true)
  }

  closeConfigure(shouldSave: boolean) {
    this.configureOpen.set(false);
    if (!shouldSave)
      return
    Object.assign(this.config, this.menuConfig)
    this.config.save()
    this.chart.reInit()
    this.chart.reDraw()
  }
}
