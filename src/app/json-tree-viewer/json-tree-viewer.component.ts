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
    const copy = JSON.parse(JSON.stringify(node.value));
    await this.jsonService.addSimilarItem(this.jsonData, node.path, false, copy);
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
    } else if (typeof node.value === 'object' && node.value !== null) {
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

  isValidJsonKey(key: string): boolean {
    return typeof key === 'string' && key.trim().length > 0;
  }

  isValidJsonValue(value: any): boolean {
    return value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      Array.isArray(value) ||
      (typeof value === 'object' && value !== null);
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
    // Se o nó for um valor primitivo, abrimos o diálogo de primitivos
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
      // Se for um objeto ou array, editamos usando o serviço
      await this.jsonService.editItem(this.jsonData, node.path);
    }
    this.processNodes();
  }

  /**
   * Função para deletar um nó
   */
  deleteNode(node: JsonNodeMetadata) {
    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    const key = node.path[node.path.length - 1];

    if (Array.isArray(parent)) {
      // Se o pai for um array, usamos splice para manter a consistência dos índices
      const index = Number(key);
      parent.splice(index, 1);

      // Após remover um elemento do array, precisamos reprocessar todos os nós
      // para atualizar os índices corretamente
      this.processNodes();
    } else if (parent && typeof parent === 'object') {
      // Se o pai for um objeto, podemos simplesmente deletar a propriedade
      delete parent[key];
      this.processNodes();
    }
  }

  /**
   * Função auxiliar para verificar se um nó pode ser editado
   */
  canEditNode(node: JsonNodeMetadata): boolean {
    return node !== null && node !== undefined;
  }

  /**
   * Função auxiliar para verificar se um nó pode ser deletado
   */
  canDeleteNode(node: JsonNodeMetadata): boolean {
    // Não permitimos deletar o nó raiz
    if (node.path.length === 0) {
      return false;
    }

    const parent = this.jsonService.getParentFromPath(this.jsonData, node.path);
    return parent !== null && parent !== undefined;
  }

  /**
   * Função para buscar no JSON
   */
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

  /**
   * Função para copiar todo o JSON
   */
  copyAll() {
    const formattedJson = JSON.stringify(this.jsonData, null, 2);
    navigator.clipboard.writeText(formattedJson).then(
      () => {
        // Opcional: Adicionar feedback visual de sucesso
        console.log('JSON copiado com sucesso');
      },
      (err) => {
        console.error('Erro ao copiar JSON:', err);
      }
    );
  }

  /**
   * Funções auxiliares para verificar correspondências na busca
   */
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

  /**
   * Função para validar o JSON
   */
  validateJson() {
    try {
      // Validação básica do JSON
      JSON.parse(JSON.stringify(this.jsonData));
      this.isValid = true;
    } catch (error) {
      this.isValid = false;
      console.error('JSON inválido:', error);
    }
  }
}
