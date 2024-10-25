// json-tree-viewer.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonTreeViewerService } from './json-tree-viewer.service';
import { SearchMatch, JsonNodeMetadata } from './json-tree-viewer.types';
import { JsonEditDialogComponent } from './json-edit-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-json-tree-viewer',
  templateUrl: './json-tree-viewer.component.html',
  styleUrls: ['./json-tree-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    JsonEditDialogComponent
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

  constructor(public jsonService: JsonTreeViewerService) {}

  ngOnInit() {
    this.validateJson();
    this.processNodes();
  }

  validateJson() {
    this.isValid = this.jsonService.validateJson(this.jsonData);
  }

  getValueType(value: any): string {
    return this.jsonService.getValueType(value);
  }

  formatValue(value: any): string {
    return this.jsonService.formatValue(value);
  }

  processNodes() {
    this.renderNodes = this.jsonService.flattenJson(
      this.jsonData,
      [],
      0,
      this.expandedNodes
    );
  }

  deleteNode(node: JsonNodeMetadata) {
    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    if (Array.isArray(parent)) {
      const index = parseInt(node.path[node.path.length - 1]);
      parent.splice(index, 1);
    } else {
      delete parent[node.path[node.path.length - 1]];
    }
    this.processNodes();
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

  copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
  }

  copyAll() {
    navigator.clipboard.writeText(JSON.stringify(this.jsonData, null, 2));
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

      // Expande os nós necessários
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

  getNodePath(node: JsonNodeMetadata): string {
    return node.path.join('.');
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

  async addSimilarItem(node: JsonNodeMetadata) {
    await this.jsonService.addSimilarItem(this.jsonData, node.path);
    this.processNodes();
  }

  async editNode(node: JsonNodeMetadata) {
    await this.jsonService.editItem(this.jsonData, node.path);
    this.processNodes();
  }

}
