import {Component, input, OnInit, output} from '@angular/core';
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatCheckbox} from "@angular/material/checkbox";
import {BurndownConfig} from "@app/burndown/burndownConfig";

@Component({
  selector: 'configure-burndown',
  standalone: true,
  imports: [
    MatIcon,
    MatIconButton,
    ReactiveFormsModule,
    MatCheckbox,
    MatButton
  ],
  templateUrl: './configure-burndown.component.html',
  styleUrl: './configure-burndown.component.scss'
})
export class ConfigureBurndownComponent implements OnInit {
  onClose = output<boolean>();
  config = input.required<BurndownConfig>();

  showCompleted!: FormControl<boolean|null>
  formGroup!: FormGroup

  ngOnInit() {
    this.showCompleted = new FormControl<boolean>(this.config().showCompleted);
    this.formGroup = new FormGroup({
      showCompleted: this.showCompleted,
    })
  }

  save() {
    Object.assign(this.config(), this.formGroup.value);
    this.onClose.emit(true)
  }
}
