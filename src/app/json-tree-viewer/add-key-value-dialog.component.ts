// add-key-value-dialog.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

interface KeyValuePair {
  key: string;
  value: any;
}

@Component({
  selector: 'app-add-key-value-dialog',
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
    <h2 mat-dialog-title>Adicionar Par Chave:Valor</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="fill">
          <mat-label>Chave</mat-label>
          <input matInput [(ngModel)]="pair.key" type="text" required>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Tipo do Valor</mat-label>
          <mat-select [(ngModel)]="selectedType" (selectionChange)="onTypeChange()">
            <mat-option value="string">String</mat-option>
            <mat-option value="number">Number</mat-option>
            <mat-option value="boolean">Boolean</mat-option>
            <mat-option value="null">Null</mat-option>
            <mat-option value="object">Object</mat-option>
            <mat-option value="array">Array</mat-option>
          </mat-select>
        </mat-form-field>

        <ng-container [ngSwitch]="selectedType">
          <mat-form-field *ngSwitchCase="'string'" appearance="fill">
            <mat-label>Valor</mat-label>
            <input matInput [(ngModel)]="tempValue" type="text">
          </mat-form-field>

          <mat-form-field *ngSwitchCase="'number'" appearance="fill">
            <mat-label>Valor</mat-label>
            <input matInput [(ngModel)]="tempValue" type="number">
          </mat-form-field>

          <mat-form-field *ngSwitchCase="'boolean'" appearance="fill">
            <mat-label>Valor</mat-label>
            <mat-select [(ngModel)]="tempValue">
              <mat-option [value]="true">True</mat-option>
              <mat-option [value]="false">False</mat-option>
            </mat-select>
          </mat-form-field>
        </ng-container>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-button color="primary" (click)="onConfirm()" [disabled]="!isValid()">
        Confirmar
      </button>
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
export class AddKeyValueDialogComponent {
  pair: KeyValuePair = {
    key: '',
    value: null
  };
  selectedType: string = 'string';
  tempValue: any = '';

  constructor(private dialogRef: MatDialogRef<AddKeyValueDialogComponent>) {}

  onTypeChange() {
    switch (this.selectedType) {
      case 'string':
        this.tempValue = '';
        break;
      case 'number':
        this.tempValue = 0;
        break;
      case 'boolean':
        this.tempValue = false;
        break;
      case 'null':
        this.tempValue = null;
        break;
      case 'object':
        this.tempValue = {};
        break;
      case 'array':
        this.tempValue = [];
        break;
    }
  }

  isValid(): boolean {
    return this.pair.key.trim().length > 0;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (!this.isValid()) return;

    let finalValue: any;
    switch (this.selectedType) {
      case 'number':
        finalValue = Number(this.tempValue);
        break;
      case 'null':
        finalValue = null;
        break;
      case 'object':
        finalValue = {};
        break;
      case 'array':
        finalValue = [];
        break;
      default:
        finalValue = this.tempValue;
    }

    this.pair.value = finalValue;
    this.dialogRef.close(this.pair);
  }
}
