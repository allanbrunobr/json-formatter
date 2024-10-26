// add-primitive-dialog.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

type PrimitiveType = 'string' | 'number' | 'boolean' | 'null';

@Component({
  selector: 'app-add-primitive-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Adicionar Valor Primitivo</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="fill">
          <mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="selectedType" (selectionChange)="onTypeChange()">
            <mat-option value="string">String</mat-option>
            <mat-option value="number">Number</mat-option>
            <mat-option value="boolean">Boolean</mat-option>
            <mat-option value="null">Null</mat-option>
          </mat-select>
        </mat-form-field>

        <ng-container [ngSwitch]="selectedType">
          <mat-form-field *ngSwitchCase="'string'" appearance="fill">
            <mat-label>Valor</mat-label>
            <input matInput [(ngModel)]="value" type="text">
          </mat-form-field>

          <mat-form-field *ngSwitchCase="'number'" appearance="fill">
            <mat-label>Valor</mat-label>
            <input matInput [(ngModel)]="value" type="number">
          </mat-form-field>

          <mat-form-field *ngSwitchCase="'boolean'" appearance="fill">
            <mat-label>Valor</mat-label>
            <mat-select [(ngModel)]="value">
              <mat-option [value]="true">True</mat-option>
              <mat-option [value]="false">False</mat-option>
            </mat-select>
          </mat-form-field>
        </ng-container>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-button color="primary" (click)="onConfirm()">Confirmar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 300px;
    }
    mat-form-field {
      width: 100%;
    }
  `]
})
export class AddPrimitiveDialogComponent {
  selectedType: PrimitiveType = 'string';
  value: string | number | boolean | null = '';

  constructor(private dialogRef: MatDialogRef<AddPrimitiveDialogComponent>) {}

  onTypeChange() {
    switch (this.selectedType) {
      case 'string':
        this.value = '';
        break;
      case 'number':
        this.value = 0;
        break;
      case 'boolean':
        this.value = false;
        break;
      case 'null':
        this.value = null;
        break;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    let finalValue: any;

    switch (this.selectedType) {
      case 'number':
        finalValue = Number(this.value);
        break;
      case 'null':
        finalValue = null;
        break;
      default:
        finalValue = this.value;
    }

    this.dialogRef.close(finalValue);
  }
}
