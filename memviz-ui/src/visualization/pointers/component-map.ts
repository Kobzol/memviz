import type { Address } from "process-def";
import BTree from "sorted-btree";
import { type ShallowRef, triggerRef } from "vue";

interface ComponentWithAddress {
  size: number;
  element: HTMLElement;
}

export type ComponentUnsubscribeFn = () => void;

// Maps addresses to components
// This component is only shallowly reactive, to avoid unnecessary overhead
// We mark its updates explicitly with a shallow ref parameter to `addComponent`
export class ComponentMap {
  private map: BTree<Address, Map<number, ComponentWithAddress>> = new BTree();
  private lastId = 0;

  addComponent(
    address: Address,
    size: number,
    element: HTMLElement,
    ref: ShallowRef<ComponentMap>,
  ): ComponentUnsubscribeFn {
    const id = this.lastId;
    this.lastId++;

    let entry = this.map.get(address);
    if (entry === undefined) {
      entry = new Map();
      this.map.set(address, entry);
    }
    entry.set(id, {
      size,
      element,
    });

    triggerRef(ref);

    return () => this.removeComponent(address, id, ref);
  }

  count(): number {
    let count = 0;
    for (const entry of this.map.entries()) {
      count += entry[1].size;
    }
    return count;
  }

  getComponentsAt(address: Address): ComponentWithAddress[] {
    const components: ComponentWithAddress[] = [];

    function matchesAddress(addr: Address, component: ComponentWithAddress) {
      return addr <= address && address < addr + BigInt(component.size);
    }

    // TODO: optimize, with a hierarchical tree?
    // https://www.npmjs.com/package/js-hierarchy
    let current = this.map.getPairOrNextHigher(address);
    while (current !== undefined) {
      const [addr, submap] = current;
      submap.forEach((component) => {
        if (matchesAddress(addr, component)) {
          components.push(component);
        }
      });

      current = this.map.nextLowerPair(addr);
    }

    return components;
  }

  dump() {
    for (const entry of this.map.entries()) {
      console.log(entry[0], entry[1]);
    }
  }

  private removeComponent(
    address: Address,
    id: number,
    ref: ShallowRef<ComponentMap>,
  ) {
    const entry = this.map.get(address);
    if (entry !== undefined) {
      entry.delete(id);
      if (entry.size === 0) {
        this.map.delete(address);
      }
      triggerRef(ref);
    }
  }
}
