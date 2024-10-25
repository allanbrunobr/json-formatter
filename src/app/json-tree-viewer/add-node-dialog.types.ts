export interface NodeField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'null';
  value: any;
}

export interface NodeDialogData {
  path: string[];
  parentType: 'object' | 'array';
}
