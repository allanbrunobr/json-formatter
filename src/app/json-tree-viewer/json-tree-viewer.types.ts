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
  value: JsonValue;
}

// Tipos JSON básicos
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

// Interface para objetos dinâmicos
export interface DynamicObject {
  [key: string]: any;
}

// Interface para objetos template
export interface TemplateObject extends DynamicObject {
  [key: string]: string | number | boolean | null | DynamicObject | any[];
}

// Interface para dados do diálogo de edição
export interface EditDialogData {
  template: any;
  path: string[];
  isNew: boolean;
}

// Tipo para valores JSON
export type JsonValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
