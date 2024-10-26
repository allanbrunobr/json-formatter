// json-tree-viewer.service.ts
import { Injectable } from '@angular/core';
import {SearchMatch, JsonNodeMetadata, JsonValueType, DynamicObject} from './json-tree-viewer.types';
import { MatDialog } from '@angular/material/dialog';
import { JsonEditDialogComponent } from './json-edit-dialog.component';
import {AddNodeDialogComponent} from './add-node-dialog.component';


@Injectable({
  providedIn: 'root'
})
export class JsonTreeViewerService {
  constructor(private dialog: MatDialog) {}

  validateJson(jsonData: any): boolean {
    try {
      JSON.parse(JSON.stringify(jsonData));
      return true;
    } catch {
      return false;
    }
  }

  flattenJson(
    data: any,
    path: string[] = [],
    level = 0,
    expandedNodes: Set<string>
  ): JsonNodeMetadata[] {
    const nodes: JsonNodeMetadata[] = [];

    if (Array.isArray(data)) {
      nodes.push({
        path,
        level,
        isLast: false,
        parent: data,
        key: path[path.length - 1] || 0,
        value: data
      });

      if (expandedNodes.has(path.join('.'))) {
        data.forEach((item, index) => {
          const childPath = [...path, index.toString()];
          nodes.push(...this.flattenJson(item, childPath, level + 1, expandedNodes));
        });
      }
    } else if (data && typeof data === 'object') {
      nodes.push({
        path,
        level,
        isLast: false,
        parent: data,
        key: path[path.length - 1] || '',
        value: data
      });

      if (expandedNodes.has(path.join('.'))) {
        const entries = Object.entries(data);
        entries.forEach(([key, value], index) => {
          const childPath = [...path, key];
          nodes.push(...this.flattenJson(value, childPath, level + 1, expandedNodes));
        });
      }
    } else {
      nodes.push({
        path,
        level,
        isLast: true,
        parent: null,
        key: path[path.length - 1] || '',
        value: data
      });
    }

    return nodes;
  }

  getValueType(value: any): JsonValueType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value as JsonValueType;
  }

  formatValue(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (Array.isArray(value)) return '[]';
    if (typeof value === 'object') return '{}';
    return String(value);
  }

  searchJson(obj: any, searchQuery: string, path: string[] = []): SearchMatch[] {
    const matches: SearchMatch[] = [];

    const isMatch = (value: any) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase());

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          matches.push(...this.searchJson(item, searchQuery, [...path, index.toString()]));
        } else if (isMatch(item)) {
          matches.push({ path: [...path, index.toString()], value: item, type: 'value' });
        }
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        if (isMatch(key)) {
          matches.push({ path: [...path, key], value: key, type: 'key' });
        }

        if (typeof value === 'object' && value !== null) {
          matches.push(...this.searchJson(value, searchQuery, [...path, key]));
        } else if (isMatch(value)) {
          matches.push({ path: [...path, key], value: value, type: 'value' });
        }
      });
    }

    return matches;
  }

  collectPaths(obj: any, current: string[] = []): string[][] {
    const paths: string[][] = [];

    if (Array.isArray(obj)) {
      paths.push(current);
      obj.forEach((item, index) => {
        if (item && typeof item === 'object') {
          paths.push(...this.collectPaths(item, [...current, index.toString()]));
        }
      });
    } else if (obj && typeof obj === 'object') {
      paths.push(current);
      Object.entries(obj).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          paths.push(...this.collectPaths(value, [...current, key]));
        }
      });
    }

    return paths;
  }

  async editItem(data: any, path: string[]): Promise<any> {
    const current = this.getValueFromPath(data, path);
    if (!current) return null;

    const result = await this.openEditDialog(current, path, false);
    if (result) {
      const parent = this.getParentFromPath(data, path);
      const key = path[path.length - 1];
      if (Array.isArray(parent)) {
        parent[parseInt(key)] = result;
      } else {
        parent[key] = result;
      }
      return result;
    }
    return null;
  }

  // json-tree-viewer.service.ts
  private openEditDialog(template: any, path: string[], isNew: boolean) {
    // Se for um valor simples, passamos o valor e a chave diretamente
    const isSimpleValue = typeof template !== 'object' || template === null;
    const data = isSimpleValue ? {
      template: null,
      path,
      isNew,
      key: path[path.length - 1],
      value: template
    } : {
      template,
      path,
      isNew
    };

    return this.dialog.open(JsonEditDialogComponent, {
      data,
      width: '800px',
      maxHeight: '90vh'
    }).afterClosed().toPromise();
  }

  // json-tree-viewer.service.ts
  async addItem(data: any, path: string[]): Promise<any> {
    const parent = this.getParentFromPath(data, path);
    const isArray = Array.isArray(parent);

    const dialogRef = this.dialog.open(AddNodeDialogComponent, {
      width: '800px',
      data: {
        path,
        parentType: isArray ? 'array' : 'object'
      }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      if (Array.isArray(parent)) {
        parent.push(result.value);
      } else {
        parent[result.key] = result.value;
      }
      return result;
    }
    return null;
  }

  getParentFromPath(data: any, path: string[]): any {
    return path.length > 1
      ? this.getValueFromPath(data, path.slice(0, -1))
      : data;
  }

  private generateUniqueKey(obj: DynamicObject, baseKey: string): string {
    let key = baseKey;
    let counter = 1;
    while (obj[key] !== undefined) {
      key = `${baseKey}${counter}`;
      counter++;
    }
    return key;
  }

  getValueFromPath(data: DynamicObject, path: string[]): any {
    try {
      return path.reduce((obj: any, key: string) => {
        if (obj === undefined || obj === null) {
          throw new Error('Invalid path');
        }
        if (Array.isArray(obj)) {
          const index = parseInt(key, 10);
          if (isNaN(index)) {
            throw new Error('Invalid array index');
          }
          return obj[index];
        }
        return obj[key];
      }, data);
    } catch (error) {
      console.error('Error accessing path:', path, error);
      return null;
    }
  }

  setValueAtPath(data: DynamicObject, path: string[], value: any): boolean {
    try {
      const parentPath = path.slice(0, -1);
      const lastKey = path[path.length - 1];
      const parent = parentPath.length ? this.getValueFromPath(data, parentPath) : data;

      if (parent === null || parent === undefined) {
        return false;
      }

      if (Array.isArray(parent)) {
        const index = parseInt(lastKey, 10);
        if (isNaN(index)) {
          return false;
        }
        parent[index] = value;
      } else {
        parent[lastKey] = value;
      }

      return true;
    } catch (error) {
      console.error('Error setting value at path:', path, error);
      return false;
    }
  }

  pathExists(data: any, path: string[]): boolean {
    try {
      let current = data;
      for (const key of path) {
        if (current === null || current === undefined) {
          return false;
        }
        if (Array.isArray(current)) {
          const index = parseInt(key, 10);
          if (isNaN(index) || index < 0 || index >= current.length) {
            return false;
          }
          current = current[index];
        } else {
          if (!(key in current)) {
            return false;
          }
          current = current[key];
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  createPath(data: any, path: string[]): boolean {
    try {
      let current = data;
      for (let i = 0; i < path.length; i++) {
        const key = path[i];
        const isLastKey = i === path.length - 1;

        if (Array.isArray(current)) {
          const index = parseInt(key, 10);
          if (isNaN(index)) {
            return false;
          }
          if (index >= current.length) {
            while (current.length <= index) {
              current.push(isLastKey ? null : {});
            }
          }
          if (!isLastKey) {
            current = current[index];
          }
        } else {
          if (!(key in current)) {
            current[key] = isLastKey ? null : {};
          }
          if (!isLastKey) {
            current = current[key];
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async addSimilarItem(data: DynamicObject, path: string[], empty: boolean = true, copyValue: any = null): Promise<any> {
    const parent = this.getParentFromPath(data, path);
    const template = empty ? this.getEmptyTemplate(this.getValueFromPath(data, path)) : copyValue;

    const result = await this.openEditDialog(template, path, true);
    if (result) {
      if (Array.isArray(parent)) {
        parent.push(result);
      } else if (typeof parent === 'object' && parent !== null) {
        const key = this.generateUniqueKey(parent, path[path.length - 1]);
        parent[key] = result;
      }
      return result;
    }
    return null;
  }

  async addKeyValuePair(data: any, path: string[]): Promise<any> {
    const targetObj: DynamicObject = this.getValueFromPath(data, path);

    const dialogRef = this.dialog.open(AddNodeDialogComponent, {
      width: '500px',
      data: {
        path,
        parentType: 'object',
        mode: 'keyValue'
      }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      targetObj[result.key] = result.value;
      return result;
    }
    return null;
  }

  private getEmptyTemplate(obj: any): DynamicObject | any[] | null {
    if (Array.isArray(obj)) {
      return [];
    }
    if (typeof obj === 'object' && obj !== null) {
      const template: DynamicObject = {};
      Object.keys(obj).forEach(key => {
        template[key] = this.getDefaultValue(typeof obj[key]);
      });
      return template;
    }
    return null;
  }

  private getDefaultValue(type: string): any {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'object': return {};
      default: return null;
    }
  }

}
