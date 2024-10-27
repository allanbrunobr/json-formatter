import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {JsonTreeViewerService} from './json-tree-viewer.service';
import {JsonArray, JsonNodeMetadata, JsonObject, JsonValue, SearchMatch} from './json-tree-viewer.types';
import {AddPrimitiveDialogComponent} from './add-primitive-dialog.component';
import {AddKeyValueDialogComponent} from './add-key-value-dialog.component';

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
    // this.renderNodes = this.jsonService.flattenJson(
    //   this.jsonData,
    //   [],
    //   0,
    //   this.expandedNodes
    // );
    // this.updateClosingBrackets();
    this.renderNodes = this.jsonService.flattenJson(
      this.jsonData,
      [],
      0,
      this.expandedNodes
    ).map(node => ({
      ...node,
      needsClosing: this.isExpandable(node.value) && this.isExpanded(this.getNodePath(node))
    }));
  }

  updateClosingBrackets() {
    this.renderNodes = this.renderNodes.map(node => ({
      ...node,
      hasClosingBracket: this.shouldShowClosingBracket(node)
    }));
  }

  shouldShowClosingBracket(node: JsonNodeMetadata): boolean {
    // return this.isExpandable(node.value) &&
    //   this.isExpanded(this.getNodePath(node));
    return this.isExpandable(node.value) &&
      this.isExpanded(this.getNodePath(node)) &&
      !this.isLastChild(node);
  }

  isLastChild(node: JsonNodeMetadata): boolean {
    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    if (!parent) return true;

    const lastKey = node.path[node.path.length - 1];
    if (Array.isArray(parent)) {
      return parseInt(lastKey) === parent.length - 1;
    }
    const keys = Object.keys(parent);
    return keys[keys.length - 1] === lastKey;
  }

  getNodePath(node: JsonNodeMetadata): string {
    return node.path.join('.');
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
      this.expandedNodes.add(this.getNodePath(node));
      this.processNodes();
    }
  }

  async addKeyValuePair(node: JsonNodeMetadata) {
    const obj = node.value as JsonObject;
    const result = await this.dialog.open(AddKeyValueDialogComponent).afterClosed().toPromise();

    if (result) {
      const { key, value } = result;
      obj[key] = value;
      this.expandedNodes.add(this.getNodePath(node));
      this.processNodes();
    }
  }

  async addCopySimilarItem(node: JsonNodeMetadata) {
    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    const key = node.path[node.path.length - 1];
    const copy = JSON.parse(JSON.stringify(node.value));

    if (Array.isArray(parent)) {
      parent.push(copy);
    } else if (typeof parent === 'object' && parent !== null) {
      const newKey = this.jsonService.generateUniqueKey(parent, key.toString());
      parent[newKey] = copy;
    }

    this.expandedNodes.add(this.getNodePath(node));
    this.processNodes();
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
      parent.splice(Number(key), 1);
    } else if (parent && typeof parent === 'object') {
      delete parent[key];
    }
    this.processNodes();
  }

  canEditNode(node: JsonNodeMetadata): boolean {
    return node !== null && node !== undefined;
  }

  canDeleteNode(node: JsonNodeMetadata): boolean {
    if (node.path.length === 0) return false;
    return this.jsonService.getParentFromPath(this.jsonData, node.path) !== null;
  }

  getValueType(value: any): string {
    return this.jsonService.getValueType(value);
  }

  formatValue(value: any, isLast: boolean = false): string {
    return this.jsonService.formatValue(value);  // Remove a lógica de vírgulas
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
  }

  copyAll() {
    navigator.clipboard.writeText(JSON.stringify(this.jsonData, null, 2));
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

      // Expande os nós até o resultado
      let currentPath: string[] = [];
      match.path.forEach(segment => {
        currentPath.push(segment);
        this.expandedNodes.add(currentPath.join('.'));
      });

      this.processNodes();

      // Rola até o elemento
      setTimeout(() => {
        const element = document.querySelector(`[data-path="${path}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }
}
