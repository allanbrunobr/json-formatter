import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { JsonTreeViewerService } from './json-tree-viewer.service';
import { SearchMatch, JsonNodeMetadata, JsonObject, JsonArray, JsonValue } from './json-tree-viewer.types';
import { AddPrimitiveDialogComponent } from './add-primitive-dialog.component';
import { AddKeyValueDialogComponent } from './add-key-value-dialog.component';

interface MenuOption {
  label: string;
  icon: string;
  action: (node: JsonNodeMetadata) => void;
}

@Component({
  selector: 'app-json-tree-viewer',
  templateUrl: './json-tree-viewer.component.html',
  styleUrls: ['./json-tree-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class JsonTreeViewerComponent implements OnInit {
  @Input() jsonData: any;

  protected readonly Array = Array;
  protected readonly Object = Object;

  expandedNodes: Set<string> = new Set();
  isValid = true;
  searchQuery = '';
  searchResults: SearchMatch[] = [];
  currentSearchIndex = -1;
  renderNodes: JsonNodeMetadata[] = [];

  constructor(
    public jsonService: JsonTreeViewerService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.validateJson();
    this.processNodes();
  }

  validateJson() {
    this.isValid = this.jsonService.validateJson(this.jsonData);
  }

  processNodes() {
    this.renderNodes = this.jsonService.flattenJson(
      this.jsonData,
      [],
      0,
      this.expandedNodes
    );
  }

  async addArrayItem(node: JsonNodeMetadata, type: 'primitive' | 'object' | 'array') {
    const array = node.value as JsonArray;
    let newValue: JsonValue;

    switch (type) {
      case 'primitive':
        const dialogRef = this.dialog.open(AddPrimitiveDialogComponent);
        newValue = await dialogRef.afterClosed().toPromise();
        break;
      case 'object':
        newValue = {};
        break;
      case 'array':
        newValue = [];
        break;
    }

    if (newValue !== undefined) {
      array.push(newValue);
      this.processNodes();
    }
  }

  async addKeyValuePair(node: JsonNodeMetadata) {
    const obj = node.value as JsonObject;
    const result = await this.dialog.open(AddKeyValueDialogComponent).afterClosed().toPromise();

    if (result) {
      const { key, value } = result;
      obj[key] = value;
      this.processNodes();
    }
  }

  async addCopySimilarItem(node: JsonNodeMetadata) {
    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    const key = node.path[node.path.length - 1];

    // Faz uma cópia profunda do valor atual
    const copy = JSON.parse(JSON.stringify(node.value));

    if (Array.isArray(parent)) {
      // Se o pai for um array, adiciona a cópia no array
      parent.push(copy);
    } else if (typeof parent === 'object' && parent !== null) {
      // Se o pai for um objeto, gera uma nova chave única
      const newKey = this.jsonService.generateUniqueKey(parent, key.toString());
      parent[newKey] = copy;
    }

    this.processNodes();
  }

  getMenuOptions(node: JsonNodeMetadata): MenuOption[] {
    if (Array.isArray(node.value)) {
      return [
        {
          label: 'Adicionar valor primitivo',
          icon: 'add_circle_outline',
          action: () => this.addArrayItem(node, 'primitive')
        },
        {
          label: 'Adicionar objeto',
          icon: 'add_box',
          action: () => this.addArrayItem(node, 'object')
        },
        {
          label: 'Adicionar array',
          icon: 'list',
          action: () => this.addArrayItem(node, 'array')
        },
        {
          label: 'Duplicar elemento',
          icon: 'content_copy',
          action: () => this.addCopySimilarItem(node)
        }
      ];
    } else if (this.isObject(node.value)) {
      return [
        {
          label: 'Adicionar par chave:valor',
          icon: 'add_box',
          action: () => this.addKeyValuePair(node)
        },
        {
          label: 'Duplicar objeto',
          icon: 'content_copy',
          action: () => this.addCopySimilarItem(node)
        }
      ];
    }
    return [];
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  getValueType(value: any): string {
    return this.jsonService.getValueType(value);
  }

  formatValue(value: any): string {
    return this.jsonService.formatValue(value);
  }

  isExpandable(value: any): boolean {
    return value !== null && typeof value === 'object';
  }

  toggleNode(path: string) {
    if (this.expandedNodes.has(path)) {
      this.expandedNodes.delete(path);
    } else {
      this.expandedNodes.add(path);
    }
    this.processNodes();
  }

  isExpanded(path: string): boolean {
    return this.expandedNodes.has(path);
  }

  getNodePath(node: JsonNodeMetadata): string {
    return node.path.join('.');
  }

  async editNode(node: JsonNodeMetadata) {
    if (typeof node.value !== 'object' || node.value === null) {
      const dialogRef = this.dialog.open(AddPrimitiveDialogComponent, {
        data: { value: node.value }
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (result !== undefined) {
        const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
        const key = node.path[node.path.length - 1];

        if (Array.isArray(parent)) {
          parent[Number(key)] = result;
        } else {
          parent[key] = result;
        }
      }
    } else {
      await this.jsonService.editItem(this.jsonData, node.path);
    }
    this.processNodes();
  }

  deleteNode(node: JsonNodeMetadata) {
    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    const key = node.path[node.path.length - 1];

    if (Array.isArray(parent)) {
      const index = Number(key);
      parent.splice(index, 1);
    } else if (parent && typeof parent === 'object') {
      delete parent[key];
    }
    this.processNodes();
  }

  canEditNode(node: JsonNodeMetadata): boolean {
    return node !== null && node !== undefined;
  }

  canDeleteNode(node: JsonNodeMetadata): boolean {
    if (node.path.length === 0) {
      return false;
    }
    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    return parent !== null && parent !== undefined;
  }

// ... (continuação do json-tree-viewer.component.ts)

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.currentSearchIndex = -1;
      return;
    }

    this.searchResults = this.jsonService.searchJson(this.jsonData, this.searchQuery);
    this.currentSearchIndex = this.searchResults.length > 0 ? 0 : -1;
    this.highlightCurrentMatch();
  }

  navigateSearch(direction: number) {
    this.currentSearchIndex += direction;
    this.highlightCurrentMatch();
  }

  highlightCurrentMatch() {
    if (this.currentSearchIndex >= 0 && this.searchResults[this.currentSearchIndex]) {
      const match = this.searchResults[this.currentSearchIndex];
      const path = match.path.join('.');

      let currentPath: string[] = [];
      match.path.forEach(segment => {
        currentPath.push(segment);
        this.expandedNodes.add(currentPath.join('.'));
      });

      this.processNodes();

      setTimeout(() => {
        const element = document.querySelector(`[data-path="${path}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  expandAll() {
    this.jsonService.collectPaths(this.jsonData).forEach(path => {
      this.expandedNodes.add(path.join('.'));
    });
    this.processNodes();
  }

  collapseAll() {
    this.expandedNodes.clear();
    this.processNodes();
  }

  copyAll() {
    const formattedJson = JSON.stringify(this.jsonData, null, 2);
    navigator.clipboard.writeText(formattedJson).then(
      () => {
        console.log('JSON copiado com sucesso');
      },
      (err) => {
        console.error('Erro ao copiar JSON:', err);
      }
    );
  }

  isKeyMatched(node: JsonNodeMetadata): boolean {
    return this.searchResults.some(
      match => match.type === 'key' &&
        match.path.join('.') === this.getNodePath(node)
    );
  }

  isValueMatched(node: JsonNodeMetadata): boolean {
    return this.searchResults.some(
      match => match.type === 'value' &&
        match.path.join('.') === this.getNodePath(node)
    );
  }

  isNodeHighlighted(node: JsonNodeMetadata): boolean {
    return this.currentSearchIndex >= 0 &&
      this.searchResults[this.currentSearchIndex]?.path.join('.') ===
      this.getNodePath(node);
  }
}
