import {AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {NgClass, NgIf, NgStyle} from "@angular/common";
import {SpinnerOverlay} from "@app/components/spinner-overlay.component";
import {WorkItemService} from "@app/data/work-item.service";
import {combineLatest} from "rxjs";
import {GanttChart} from "@app/gantt/ganttChart";
import {ConfigureGanttComponent} from "@app/gantt/configure-gantt/configure-gantt.component";
import {GanttConfig} from "@app/gantt/ganttConfig";
import {GanttItemComponent} from "@app/gantt/gantt-item/gantt-item.component";

@Component({
  selector: 'gantt',
  standalone: true,
  imports: [
    ConfigureGanttComponent,
    MatIcon,
    MatIconButton,
    NgIf,
    SpinnerOverlay,
    GanttItemComponent,
    NgStyle,
    NgClass
  ],
  templateUrl: './gantt.component.html',
  styleUrl: './gantt.component.scss',
  providers: [GanttChart]
})
export class GanttComponent implements OnInit, AfterViewInit {
  svgElement = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  // htmlContainer = viewChild.required<ElementRef<HTMLDivElement>>('htmlContainer');
  hoverElement = viewChild.required<ElementRef<HTMLDivElement>>('hoverElement');
  protected chart = inject(GanttChart);
  private workItemService = inject(WorkItemService);

  isLoading = signal<boolean>(true)
  configureOpen = signal<boolean>(false)
  chartInit = signal<boolean>(false)

  config = new GanttConfig();
  menuConfig = this.config

  ngOnInit() {
    this.config.load()
    this.chart.init$.subscribe(() => this.chartInit.set(true))
    combineLatest([this.workItemService.getGantt(), this.chart.init$]).subscribe(results => {
      this.isLoading.set(false)
      this.chart.setData(results[0])
    })
  }

  ngAfterViewInit() {
    this.chart.setHover(this.hoverElement().nativeElement);
    // this.chart.setHtmlContainer(this.htmlContainer().nativeElement);
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
