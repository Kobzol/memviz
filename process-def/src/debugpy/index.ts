import type { PythonVal } from "./value";

export type { PythonVal, KeyValuePair, ObjectVal } from "./value";

export type PythonId = string;

export interface PythonPlace {
  name: string;
  id: PythonId;
}

export interface PythonVariables {
  places: PythonPlace[];
  values: { [key: PythonId]: PythonVal };
}
