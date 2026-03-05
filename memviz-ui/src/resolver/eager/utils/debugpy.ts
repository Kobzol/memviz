import {
  type FrameIndex,
  type ProcessState,
  SessionType,
  type StackFrame,
} from "process-def";
import type {
  Attribute,
  BoolVal,
  ComplexVal,
  DeferredDictVal,
  DeferredListVal,
  DeferredStrVal,
  FloatVal,
  IntVal,
  KeyValuePair,
  NoneVal,
  ObjectVal,
  PythonId,
  Value,
  Variables,
} from "process-def/debugpy";
import { PlaceKind, ValueKind } from "process-def/debugpy";
import { EagerResolver } from "../eager";

export interface FullProcessState extends ProcessState {
  sessionType: SessionType.Debugpy;
  stackTrace: FullStackTrace;
  frameVariables: Map<FrameIndex, Variables>;
  collectionElements: Map<PythonId, Value[]>;
  stringContents: Map<PythonId, string>;
  dictPairs: Map<PythonId, KeyValuePair[]>;
  objectAttributes: Map<PythonId, Attribute[]>;
}

interface FullStackTrace {
  frames: FullStackFrame[];
}

interface FullStackFrame extends StackFrame {}

type BuilderFrame = Omit<FullStackFrame, "id" | "index"> & {
  variables: Variables;
};

function isRawStrVal(v: Value): v is DeferredStrVal {
  return v.kind === ValueKind.STR;
}

export class DebugpyProcessBuilder {
  private frames: BuilderFrame[] = [];
  private activeFrame: BuilderFrame | null = null;
  private idCounter = 0;
  private collectionElements = new Map<PythonId, Value[]>();
  private stringContents = new Map<PythonId, string>();
  private dictPairs = new Map<PythonId, KeyValuePair[]>();
  private objectAttributes = new Map<PythonId, Attribute[]>();

  startFrame(name: string, file = "main.py", line: number | null = null) {
    if (this.activeFrame) this.endFrame();

    this.activeFrame = {
      name,
      line: line ?? (this.frames.length + 1) * 10,
      file,
      variables: { places: [], values: [] },
    };
  }

  endFrame() {
    if (!this.activeFrame) throw new Error("No active frame to end");
    this.frames.push(this.activeFrame);
    this.activeFrame = null;
  }

  place(name: string, value: Value, kind = PlaceKind.Variable): ValueBuilder {
    if (!this.activeFrame) throw new Error("No active frame");

    this.activeFrame.variables.places.push({ name, id: value.id, kind });
    this.activeFrame.variables.values.push(value);

    if (isRawStrVal(value) && value.content) {
      this.stringContents.set(value.id, value.content);
    }

    return this.configure(value);
  }

  configure(value: Value): ValueBuilder {
    return new ValueBuilder(
      value.id,
      this.collectionElements,
      this.stringContents,
      this.dictPairs,
      this.objectAttributes,
    );
  }

  generateId(): PythonId {
    return `${this.idCounter++}`;
  }

  build(): [FullProcessState, EagerResolver] {
    if (this.activeFrame) this.endFrame();

    const reversedFrames = this.frames.slice().reverse();
    const frameVariables = new Map<FrameIndex, Variables>();
    reversedFrames.forEach((f, i) => frameVariables.set(i, f.variables));

    const processState: FullProcessState = {
      sessionType: SessionType.Debugpy,
      stackTrace: {
        frames: reversedFrames.map((f, i) => ({
          id: i,
          index: i,
          name: f.name,
          line: f.line,
          file: f.file,
        })),
      },
      stackAddressRange: null,
      frameVariables,
      collectionElements: this.collectionElements,
      stringContents: this.stringContents,
      dictPairs: this.dictPairs,
      objectAttributes: this.objectAttributes,
    };

    const resolver = new EagerResolver(undefined, processState);

    return [processState, resolver];
  }
}

export class ValueBuilder {
  constructor(
    private id: PythonId,
    private collections: Map<PythonId, Value[]>,
    private strings: Map<PythonId, string>,
    private dicts: Map<PythonId, KeyValuePair[]>,
    private objects: Map<PythonId, Attribute[]>,
  ) {}

  withElements(elements: Value[]) {
    this.collections.set(this.id, elements);
    return this;
  }

  withContent(content: string) {
    this.strings.set(this.id, content);
    return this;
  }

  withPairs(pairs: KeyValuePair[]) {
    this.dicts.set(this.id, pairs);
    return this;
  }

  withAttributes(attrs: Attribute[]) {
    this.objects.set(this.id, attrs);
    return this;
  }
}

export const makeNone = (b: DebugpyProcessBuilder): NoneVal => ({
  kind: ValueKind.NONE,
  id: b.generateId(),
  size: 28,
});

export const makeBool = (b: DebugpyProcessBuilder, val: boolean): BoolVal => ({
  kind: ValueKind.BOOL,
  id: b.generateId(),
  size: 28,
  value: val,
});

export const makeInt = (b: DebugpyProcessBuilder, val: number): IntVal => ({
  kind: ValueKind.INT,
  id: b.generateId(),
  size: 28,
  value: val,
});

export const makeFloat = (b: DebugpyProcessBuilder, val: number): FloatVal => ({
  kind: ValueKind.FLOAT,
  id: b.generateId(),
  size: 28,
  value: val,
});

export const makeComplex = (
  b: DebugpyProcessBuilder,
  real: string,
  imag: string,
): ComplexVal => ({
  kind: ValueKind.COMPLEX,
  id: b.generateId(),
  size: 28,
  real_value: real,
  imaginary_value: imag,
});

export const makeStr = (
  b: DebugpyProcessBuilder,
  content: string,
): DeferredStrVal => {
  return {
    kind: ValueKind.STR,
    id: b.generateId(),
    size: 49 + content.length,
    length: Array.from(content).length,
    content: content,
    content_offset: 0,
  };
};

export const makeList = (
  b: DebugpyProcessBuilder,
  elements: Value[],
): DeferredListVal => {
  return {
    kind: ValueKind.LIST,
    id: b.generateId(),
    size: 56 + elements.length * 8,
    element_count: elements.length,
    elements: elements,
    element_offset: 0,
  };
};

export const makeDict = (
  b: DebugpyProcessBuilder,
  pairs: KeyValuePair[],
): DeferredDictVal => {
  return {
    kind: ValueKind.DICT,
    id: b.generateId(),
    size: 240,
    pair_count: pairs.length,
    pairs: pairs,
    pair_offset: 0,
  };
};

export const makeObject = (
  b: DebugpyProcessBuilder,
  type: string,
  attrs: Attribute[],
): ObjectVal => ({
  kind: ValueKind.OBJECT,
  id: b.generateId(),
  size: 56,
  type_name: type,
  attributes: attrs,
});
