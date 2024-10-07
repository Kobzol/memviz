import IntervalTree, { type NumericTuple } from "@flatten-js/interval-tree";
import type { Address } from "process-def";
import { type ShallowRef, triggerRef } from "vue";
import { assert } from "../../utils";
import { formatAddress } from "../utils/formatting";
import type { Path } from "./path";

export interface ComponentWithAddress {
  address: Address;
  size: number;
  path: Path;
  element: HTMLElement;
}

export type ComponentUnsubscribeFn = () => void;

type Interval = [bigint, bigint];
type ComponentId = number;

// Maps addresses to components
// This component is only shallowly reactive, to avoid unnecessary overhead
// We mark its updates explicitly with a shallow ref parameter that is
// passed to `addComponent`
export class ComponentMap {
  // We store IDs in the tree to allow simple comparison of values when removing entries
  // Comparing complex JS objects containing DOM elements did not seem to work weell
  private tree: IntervalTree<ComponentId> = new IntervalTree();
  private components: Map<ComponentId, ComponentWithAddress> = new Map();
  // Monotonically increasing counter of component IDs
  private idCounter = 0;

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
    const id = this.idCounter;
    this.idCounter += 1;
    this.tree.insert(interval as any as NumericTuple, id);
    this.components.set(id, entry);

    triggerRef(ref);

    // console.log(
    //   `Adding component at ${formatInterval(interval)}, ${entry.path.format()}`,
    //   entry.element,
    // );
    return () => this.removeComponent(interval, id, ref);
  }

  count(): number {
    return this.components.size;
  }

  getAllComponents(): ComponentWithAddress[] {
    return this.tree.values.map((id) => this.getElement(id));
  }

  getComponentsAt(address: Address): ComponentWithAddress[] {
    function matchesAddress(addr: Address, component: ComponentWithAddress) {
      return addr <= address && address < addr + BigInt(component.size);
    }

    const components = this.tree
      .search([address, address] as any as NumericTuple)
      .map((id) => this.getElement(id));
    for (const item of components) {
      assert(matchesAddress(address, item), "interval tree logic is wrong");
    }

    return components;
  }

  dump() {
    console.log(`Component map has ${this.tree.size} element(s)`);
    for (const item of this.tree.items) {
      const interval = item.key as any as Interval;
      const entry = this.getElement(item.value);
      console.log(
        `${formatInterval(interval)}: ${entry.path.format()} (ID ${item.value})`,
        entry.element,
      );
    }
  }

  private removeComponent(
    interval: Interval,
    id: ComponentId,
    ref: ShallowRef<ComponentMap>,
  ) {
    // console.log(`Removing component at ${formatInterval(interval)} (ID ${id})`);
    const existing = this.tree.remove(interval as any as NumericTuple, id);
    assert(
      existing !== undefined,
      `interval ${formatInterval(interval)} not found in interval tree`,
    );
    assert(
      this.components.delete(id),
      `element with ID ${id} did not exist in component map`,
    );
    triggerRef(ref);
  }

  private getElement(id: ComponentId): ComponentWithAddress {
    const component = this.components.get(id)!;
    assert(component !== undefined, "inconsistent component map");
    return component;
  }
}

function formatInterval(interval: Interval): string {
  return `(${formatAddress(interval[0])}, ${formatAddress(interval[1])})`;
}
