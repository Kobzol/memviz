import { type Place, type PythonId, ValueKind } from "process-def/debugpy";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export abstract class RichValue {
  abstract readonly kind: string;
  constructor(public readonly id: PythonId) {}
  public get_type_label(): string {
    return this.kind;
  }

  public get_description(): string {
    return `Value of type <b>${escapeHtml(this.kind)}</b>, Id: <b>${escapeHtml(this.id)}</b>`;
  }
}

export abstract class SizedDescribedRichValue extends RichValue {
  constructor(
    id: PythonId,
    public readonly size: number,
  ) {
    super(id);
  }

  public override get_description(): string {
    return `Value of type <b>${escapeHtml(this.kind)}</b>, Id: <b>${escapeHtml(this.id)}</b>, size: <b>${this.size} B</b>`;
  }
}

export class RichNoneVal extends SizedDescribedRichValue {
  readonly kind = ValueKind.NONE;

  public override get_type_label(): string {
    return "";
  }
}

abstract class RichScalarValue<
  TValue extends string | number,
> extends SizedDescribedRichValue {
  constructor(
    id: PythonId,
    size: number,
    public readonly value: TValue,
  ) {
    super(id, size);
  }
}

export class RichBoolVal extends RichScalarValue<string> {
  readonly kind = ValueKind.BOOL;

  constructor(id: PythonId, size: number, value: boolean) {
    super(id, size, value ? "True" : "False");
  }
}

export class RichIntVal extends RichScalarValue<number> {
  readonly kind = ValueKind.INT;
}

export class RichFloatVal extends RichScalarValue<number> {
  readonly kind = ValueKind.FLOAT;
}

export class RichComplexVal extends SizedDescribedRichValue {
  readonly kind = ValueKind.COMPLEX;

  constructor(
    id: PythonId,
    size: number,
    public readonly real_value: string,
    public readonly imaginary_value: string,
  ) {
    super(id, size);
  }
}

export interface RichKeyValuePair {
  readonly key: RichValue;
  readonly value: RichValue;
}

export class RichRangeVal extends SizedDescribedRichValue {
  readonly kind = ValueKind.RANGE;

  constructor(
    id: PythonId,
    size: number,
    public readonly start: number | null,
    public readonly stop: number | null,
    public readonly step: number | null,
  ) {
    super(id, size);
  }
}

export class RichFunctionVal extends RichValue {
  readonly kind = ValueKind.FUNCTION;

  constructor(
    id: PythonId,
    public readonly name: string,
    public readonly qualified_name: string,
    public readonly module: string | null,
    public readonly signature: string | null,
  ) {
    super(id);
  }

  public override get_description(): string {
    const escapedQualifiedName = escapeHtml(this.qualified_name);
    let result = `Function <b>${escapedQualifiedName}</b>`;

    if (this.module !== null) {
      result += ` in module <b>${escapeHtml(this.module)}</b>`;
    }

    result += `, Id: <b>${escapeHtml(this.id)}</b>`;

    if (this.signature !== null) {
      result += `<b><pre>${escapeHtml(this.name)}${escapeHtml(this.signature)}</pre></b>`;
    }

    return result;
  }
}

export interface RichAttribute {
  readonly name: string;
  readonly value: RichValue | null;
  readonly is_descriptor: boolean;
}

export class RichModuleVal extends RichValue {
  readonly kind = ValueKind.MODULE;

  constructor(
    id: PythonId,
    public readonly name: string,
  ) {
    super(id);
  }
}

export class RichTypeVal extends RichValue {
  readonly kind = ValueKind.TYPE;

  constructor(
    id: PythonId,
    public readonly name: string,
    public readonly module: string | null,
  ) {
    super(id);
  }

  public override get_description(): string {
    const moduleName = this.module ? `${escapeHtml(this.module)}.` : "";
    return `Type <b>${moduleName}${escapeHtml(this.name)}</b>, Id: <b>${escapeHtml(this.id)}</b>`;
  }
}

export type RichVariables = {
  places: Place[];
  values: RichValue[];
};
