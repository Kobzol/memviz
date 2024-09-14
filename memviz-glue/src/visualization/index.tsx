import type { ProcessState } from "../process/memory";
import type { ProcessResolver } from "../process/resolver/resolver";

export class Memviz {
  constructor(private root: HTMLElement) {}

  async showState(state: ProcessState, resolver: ProcessResolver) {}
}
// TODO: CSS
// TODO: arrows
// TODO: flexible layout (width/height computation?)
