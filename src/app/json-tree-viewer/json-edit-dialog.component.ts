// json-edit-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

interface EditDialogData {
  template: any;
  path: string[];
  isNew: boolean;
  key?: string;  // Adicionado para valores simples
  value?: any;   // Adicionado para valores simples
}

@Component({
  selector: 'app-json-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.isNew ? 'Adicionar novo item' : 'Editar item' }}
      <small class="path-info">{{ data.path.join(' > ') }}</small>
    </h2>

    <div mat-dialog-content>
      <!-- Para valores simples -->
      <div *ngIf="!isObjectTemplate" class="simple-value-container">
        <mat-form-field appearance="outline" class="field">
          <mat-label>{{ data.key || 'Valor' }}</mat-label>
          <input matInput [(ngModel)]="simpleValue" [placeholder]="getPlaceholderForType(simpleValueType)">
          <mat-hint>{{ getTypeHint(data.value) }}</mat-hint>
        </mat-form-field>
      </div>

      <!-- Para objetos -->
      <div *ngIf="isObjectTemplate" class="fields-container">
        <ng-container *ngFor="let field of fields">
          <mat-form-field appearance="outline" class="field">
            <mat-label>{{ field.key }}</mat-label>
            <input matInput [(ngModel)]="field.value" [placeholder]="getPlaceholder(field)">
            <mat-hint>{{ getTypeHint(field.template) }}</mat-hint>
          </mat-form-field>
        </ng-container>
      </div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()">Salvar</button>
    </div>
  `,
  styles: [`
    .path-info {
      font-size: 12px;
      color: #666;
      margin-left: 8px;
    }

    .fields-container, .simple-value-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }

    .field {
      width: 100%;
    }

    mat-hint {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class JsonEditDialogComponent {
  fields: { key: string; value: any; template: any }[] = [];
  isObjectTemplate = false;
  simpleValue: any = '';
  simpleValueType: string = 'string';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditDialogData,
    private dialogRef: MatDialogRef<JsonEditDialogComponent>
  ) {
    this.initializeFields();
  }

  private initializeFields() {
    this.isObjectTemplate = typeof this.data.template === 'object' && this.data.template !== null;

    if (this.isObjectTemplate) {
      this.fields = Object.entries(this.data.template).map(([key, value]) => ({
        key,
        value: this.data.isNew ? this.getDefaultValue(value) : value,
        template: value
      }));
    } else {
      // Para valores simples
      this.simpleValueType = typeof this.data.value;
      this.simpleValue = this.data.value;
    }
  }

  private getDefaultValue(template: any): any {
    if (typeof template === 'string') return '';
    if (typeof template === 'number') return 0;
    if (typeof template === 'boolean') return false;
    if (Array.isArray(template)) return [];
    if (typeof template === 'object' && template !== null) return {};
    return null;
  }

  getPlaceholder(field: { key: string; template: any }): string {
    if (typeof field.template === 'string') return `Digite o texto...`;
    if (typeof field.template === 'number') return '0';
    return `Digite o valor para ${field.key}`;
  }

  getPlaceholderForType(type: string): string {
    switch (type) {
      case 'string': return 'Digite o texto...';
      case 'number': return '0';
      case 'boolean': return 'true/false';
      default: return 'Digite o valor...';
    }
  }

  getTypeHint(template: any): string {
    if (typeof template === 'string') return 'Texto';
    if (typeof template === 'number') return 'Número';
    if (typeof template === 'boolean') return 'Booleano';
    if (Array.isArray(template)) return 'Array';
    if (typeof template === 'object' && template !== null) return 'Objeto';
    return 'Valor';
  }

  save() {
    if (this.isObjectTemplate) {
      const result: Record<string, any> = {};
      this.fields.forEach(field => {
        result[field.key] = field.value;
      });
      this.dialogRef.close(result);
    } else {
      let finalValue = this.simpleValue;
      if (this.simpleValueType === 'number') {
        finalValue = Number(this.simpleValue);
      } else if (this.simpleValueType === 'boolean') {
        finalValue = Boolean(this.simpleValue);
      }
      this.dialogRef.close(finalValue);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
