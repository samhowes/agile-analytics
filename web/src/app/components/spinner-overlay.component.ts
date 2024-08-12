import {Component, Input} from "@angular/core";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'spinner-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinner],
  template: `<div class="spinner-wrapper">
    <div class="spinner-overlay" [ngClass]="{opaque: opaque, thin:thin}" *ngIf="spin">
      <mat-spinner *ngIf="spin" [diameter]="diameter"></mat-spinner>
    </div>
    <ng-content></ng-content>
  </div>`,
  styles: [`
    :host {
      display: flex;
      flex: 1;
    }
      .spinner-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1;
        .spinner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;

          display: flex;
          justify-content: center;
          place-items: center;

          &.opaque {
            background-color: rgba(0,0,0,.2);
            border-radius: 4px;
          }
          &.opaque:not(.thin) {
            margin: .75rem;
          }
          &.thin {
            margin: .1rem;
          }
        }
      }
    `]
})
export class SpinnerOverlay {
  @Input('spin') spin: boolean = false
  @Input('diameter') diameter: number = 40
  @Input('opaque') opaque: boolean = true
  @Input('thin') thin: boolean = true
}
