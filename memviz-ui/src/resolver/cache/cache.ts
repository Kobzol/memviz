import { DebugpyResolver } from "../adapters/debugpy";
import type { ProcessResolverCore } from "../core";
import type { ProcessResolver } from "../resolver";
import { CachingGDBResolver } from "./adapters/gdb-cache";

export class CachingResolver<T extends ProcessResolverCore>
  implements ProcessResolver
{
  public gdb: CachingGDBResolver;
  public debugpy: DebugpyResolver;

  constructor(public inner: T) {
    this.gdb = new CachingGDBResolver(inner);
    this.debugpy = new DebugpyResolver(inner);
  }
}
