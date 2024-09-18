import type { DebugProtocol } from "@vscode/debugprotocol";

export interface Location {
  source: DebugProtocol.Source;
  line: number;
}

interface LineLocation {
  line: number;
  column: number | null;
}

interface SourceWithBreakpoints {
  source: DebugProtocol.Source;
  locations: LineLocation[];
}

export class BreakpointMap {
  // Source => lines
  private breakpointMap: Map<string, SourceWithBreakpoints> = new Map();

  hasUserBreakpoint(location: Location): boolean {
    const key = sourceHashKey(location.source);
    const record = this.breakpointMap.get(key);
    if (record === undefined) return false;

    return record.locations.find((l) => l.line === location.line) !== undefined;
  }

  setSourceBreakpoints(
    source: DebugProtocol.Source,
    breakpoints: DebugProtocol.SourceBreakpoint[],
  ) {
    const key = sourceHashKey(source);
    this.breakpointMap.delete(key);
    this.breakpointMap.set(key, {
      source,
      locations: breakpoints.map((bp) => ({
        line: bp.line,
        column: bp.column ?? null,
      })),
    });
  }

  getSourceBreakpoints(
    source: DebugProtocol.Source,
  ): DebugProtocol.SourceBreakpoint[] {
    const key = sourceHashKey(source);
    const locations = this.breakpointMap.get(key)?.locations ?? [];
    return locations.map((loc) => ({
      line: loc.line,
      column: loc.column ?? undefined,
    }));
  }
}

function sourceHashKey(source: DebugProtocol.Source): string {
  return source.path ?? source.name ?? "source";
}
