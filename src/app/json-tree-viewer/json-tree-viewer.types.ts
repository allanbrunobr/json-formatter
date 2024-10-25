// json-tree-viewer.types.ts
export interface SearchMatch {
  path: string[];
  value: any;
  type: 'key' | 'value';
}

export interface JsonNodeMetadata {
  path: string[];
  level: number;
  isLast: boolean;
  parent: any;
  key: string | number;
  value: any;
}

export type JsonValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

// Adicione a interface do diálogo
export interface EditDialogData {
  template: any;
  path: string[];
  isNew: boolean;
}
