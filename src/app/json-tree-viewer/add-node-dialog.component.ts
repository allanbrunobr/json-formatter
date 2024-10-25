import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export const ITEM_TYPES = ['field', 'object'] as const;
export type ItemType = typeof ITEM_TYPES[number];

export const VALUE_TYPES = ['string', 'number', 'boolean', 'null'] as const;
export type ValueType = typeof VALUE_TYPES[number];

export interface NodeField {
  key: string;
  type: ValueType;
  value: any;
}

interface DynamicObject {
  [key: string]: any;
}

export interface NodeDialogData {
  path: string[];
  parentType: 'object' | 'array';
}

@Component({
  selector: 'app-add-node-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        Adicionar Novo Item
        <small class="path-info">{{ data.path.join(' > ') }}</small>
      </h2>

      <div mat-dialog-content>
        <!-- Tipo de Item -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo de Item</mat-label>
          <mat-select [(ngModel)]="selectedItemType" (selectionChange)="onTypeChange()">
            <mat-option [value]="'field'">Campo (Chave:Valor)</mat-option>
            <mat-option [value]="'object'">Objeto</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Nome/Chave -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ selectedItemType === 'object' ? 'Nome do Objeto' : 'Nome da Chave' }}</mat-label>
          <input matInput [(ngModel)]="itemKey" placeholder="Digite um nome">
        </mat-form-field>

        <!-- Campos para tipo field -->
        <div *ngIf="selectedItemType === 'field'" class="field-inputs">
          <mat-form-field appearance="outline">
            <mat-label>Tipo do Valor</mat-label>
            <mat-select [(ngModel)]="selectedValueType">
              <mat-option [value]="'string'">Texto</mat-option>
              <mat-option [value]="'number'">Número</mat-option>
              <mat-option [value]="'boolean'">Booleano</mat-option>
              <mat-option [value]="'null'">Nulo</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Valor</mat-label>
            <input matInput [(ngModel)]="itemValue"
                   [type]="selectedValueType === 'number' ? 'number' : 'text'"
                   [placeholder]="getValuePlaceholder()">
          </mat-form-field>
        </div>

        <!-- Campos para tipo object -->
        <div *ngIf="selectedItemType === 'object'" class="object-fields">
          <h3>Campos Iniciais (opcional)</h3>
          <div class="fields-list">
            <div *ngFor="let field of initialFields; let i = index" class="field-row">
              <mat-form-field appearance="outline">
                <mat-label>Chave</mat-label>
                <input matInput [(ngModel)]="field.key">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo</mat-label>
                <mat-select [(ngModel)]="field.type">
                  <mat-option [value]="'string'">Texto</mat-option>
                  <mat-option [value]="'number'">Número</mat-option>
                  <mat-option [value]="'boolean'">Booleano</mat-option>
                  <mat-option [value]="'null'">Nulo</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Valor</mat-label>
                <input matInput [(ngModel)]="field.value"
                       [type]="field.type === 'number' ? 'number' : 'text'">
              </mat-form-field>

              <button mat-icon-button color="warn" (click)="removeField(i)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          <button mat-button color="primary" (click)="addField()">
            <mat-icon>add</mat-icon> Adicionar Campo
          </button>
        </div>
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Cancelar</button>
        <button mat-raised-button color="primary"
                [disabled]="!isValid()"
                (click)="save()">
          Adicionar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .field-inputs {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 16px;
    }

    .object-fields {
      margin-top: 24px;
      border-top: 1px solid #404040;
      padding-top: 16px;
    }

    .fields-list {
      margin-bottom: 16px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr auto;
      gap: 8px;
      margin-bottom: 8px;
      align-items: start;
    }

    .path-info {
      font-size: 12px;
      color: #666;
      margin-left: 8px;
    }

    h3 {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #808080;
    }
  `]
})
export class AddNodeDialogComponent {
  selectedItemType: ItemType = 'field';
  selectedValueType: ValueType = 'string';
  itemKey = '';
  itemValue: any = '';
  initialFields: NodeField[] = [];

  addField() {
    this.initialFields.push({
      key: '',
      type: 'string',
      value: ''
    });
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NodeDialogData,
    private dialogRef: MatDialogRef<AddNodeDialogComponent>
  ) {}

  onTypeChange() {
    this.itemValue = '';
    this.initialFields = [];
  }

  removeField(index: number) {
    this.initialFields.splice(index, 1);
  }

  getValuePlaceholder(): string {
    switch (this.selectedValueType) {
      case 'string': return 'Digite o texto';
      case 'number': return '0';
      case 'boolean': return 'true/false';
      default: return 'Digite o valor';
    }
  }

  isValid(): boolean {
    if (!this.itemKey.trim()) return false;

    if (this.selectedItemType === 'field') {
      if (this.selectedValueType !== 'null' && !this.itemValue && this.itemValue !== 0) return false;
    } else {
      // Para objetos, verifica se todos os campos iniciais são válidos
      return !this.initialFields.some(field =>
        !field.key.trim() ||
        (field.type !== 'null' && !field.value && field.value !== 0)
      );
    }

    return true;
  }

  save() {
    if (!this.isValid()) return;

    if (this.selectedItemType === 'field') {
      let processedValue = this.itemValue;
      switch (this.selectedValueType) {
        case 'number': processedValue = Number(this.itemValue); break;
        case 'boolean': processedValue = Boolean(this.itemValue); break;
        case 'null': processedValue = null; break;
      }

      this.dialogRef.close({
        type: 'field',
        key: this.itemKey,
        value: processedValue
      });
    } else {
      const objectValue: DynamicObject = {}; // Agora com tipo explícito
      this.initialFields.forEach(field => {
        let value = field.value;
        switch (field.type) {
          case 'number': value = Number(field.value); break;
          case 'boolean': value = Boolean(field.value); break;
          case 'null': value = null; break;
        }
        objectValue[field.key] = value;
      });

      this.dialogRef.close({
        type: 'object',
        key: this.itemKey,
        value: objectValue
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
