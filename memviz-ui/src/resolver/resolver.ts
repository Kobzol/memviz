import { DebugpyResolver } from "./adapters/debugpy";
import { GDBResolver } from "./adapters/gdb";
import type { ProcessResolverCore } from "./core";

export class ProcessResolver {
  constructor(resolver: ProcessResolverCore) {
    this.gdb = new GDBResolver(resolver);
    this.debugpy = new DebugpyResolver(resolver);
  }
  public gdb: GDBResolver;
  public debugpy: DebugpyResolver;
}
