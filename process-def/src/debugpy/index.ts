import type { Val } from "./value";

export type { Val, KeyValuePair, ObjectVal } from "./value";

export type PythonId = string;

export interface Place {
  name: string;
  id: PythonId;
}

export interface Variables {
  places: Place[];
  values: { [key: PythonId]: Val };
}
