import type { ProcessResolverCore } from "../core";
import type { ProcessResolver } from "../resolver";
import { CachingDebugpyResolver } from "./adapters/debugpy-cache";
import { CachingGDBResolver } from "./adapters/gdb-cache";

export class CachingResolver<T extends ProcessResolverCore>
  implements ProcessResolver
{
  public gdb: CachingGDBResolver;
  public debugpy: CachingDebugpyResolver;

  constructor(public inner: T) {
    this.gdb = new CachingGDBResolver(inner);
    this.debugpy = new CachingDebugpyResolver(inner);
  }
}
