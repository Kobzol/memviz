import IntervalTree, { type NumericTuple } from "@flatten-js/interval-tree";
import type { Address } from "process-def";
import { type ShallowRef, triggerRef } from "vue";
import { assert } from "../../utils";
import type { Path } from "./path";

export interface ComponentWithAddress {
  address: Address;
  size: number;
  path: Path;
  element: HTMLElement;
}

export type ComponentUnsubscribeFn = () => void;

type Interval = [bigint, bigint];

// Maps addresses to components
// This component is only shallowly reactive, to avoid unnecessary overhead
// We mark its updates explicitly with a shallow ref parameter that is
// passed to `addComponent`
export class ComponentMap {
  private tree: IntervalTree<ComponentWithAddress> = new IntervalTree();

  addComponent(
    component: ComponentWithAddress,
    ref: ShallowRef<ComponentMap>,
  ): ComponentUnsubscribeFn {
    if (component.size === 0) return () => {};

    // Make sure that we have our own object
    const entry = { ...component };
    const start = component.address;
    // End is inclusive
    const end = start + BigInt(component.size - 1);

    const interval: Interval = [start, end];
    this.tree.insert(interval as any as NumericTuple, entry);

    triggerRef(ref);

    return () => this.removeComponent(interval, entry, ref);
  }

  count(): number {
    return this.tree.size;
  }

  getComponentsAt(address: Address): ComponentWithAddress[] {
    function matchesAddress(addr: Address, component: ComponentWithAddress) {
      return addr <= address && address < addr + BigInt(component.size);
    }

    const components = [
      ...this.tree.search([address, address] as any as NumericTuple),
    ];
    for (const item of components) {
      assert(matchesAddress(address, item), "interval tree logic is wrong");
    }

    return components;
  }

  dump() {
    console.log(this.tree.items);
  }

  private removeComponent(
    interval: Interval,
    entry: ComponentWithAddress,
    ref: ShallowRef<ComponentMap>,
  ) {
    const existing = this.tree.remove(interval as any as NumericTuple, entry);
    assert(
      existing !== undefined,
      `interval ${interval} not found in interval tree`,
    );
    triggerRef(ref);
  }
}
