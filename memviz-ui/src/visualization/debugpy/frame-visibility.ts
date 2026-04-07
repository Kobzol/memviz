import type { PythonId } from "process-def/debugpy";
import { ref } from "vue";

function equals(a: Set<PythonId>, b: Set<PythonId>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  for (const id of a) {
    if (!b.has(id)) {
      return false;
    }
  }
  return true;
}

export class ObjectVisibilityState {
  // frameId -> source object ids
  private frameSourceObjects = ref(new Map<number, Set<PythonId>>());
  // set of collapsed object ids
  private collapsedSourceIds = ref(new Set<PythonId>());

  public setVisibleSourceObjectsForFrame(
    frameId: number,
    sourceIds: PythonId[],
  ) {
    const newValue = new Set(sourceIds);
    const currentValue = this.frameSourceObjects.value.get(frameId);
    if (currentValue && equals(currentValue, newValue)) {
      return;
    }
    // create a new map instance to trigger reactivity
    const newMap = new Map(this.frameSourceObjects.value);
    newMap.set(frameId, newValue);
    this.frameSourceObjects.value = newMap;
  }

  public clearVisibleSourceObjectsForFrame(frameId: number) {
    if (!this.frameSourceObjects.value.has(frameId)) {
      return;
    }

    // create a new map instance to trigger reactivity
    const newMap = new Map(this.frameSourceObjects.value);
    newMap.delete(frameId);
    this.frameSourceObjects.value = newMap;
  }

  public setSourceObjectAsCollapsed(sourceId: PythonId, isCollapsed: boolean) {
    if (this.collapsedSourceIds.value.has(sourceId) === isCollapsed) {
      return;
    }

    const newSet = new Set(this.collapsedSourceIds.value);
    if (isCollapsed) {
      newSet.add(sourceId);
    } else {
      newSet.delete(sourceId);
    }
    this.collapsedSourceIds.value = newSet;
  }

  public clearCollapsedSources() {
    if (this.collapsedSourceIds.value.size === 0) {
      return;
    }

    this.collapsedSourceIds.value = new Set();
  }

  public filterVisibleChildIds(
    sourceObjectId: PythonId,
    childIds: PythonId[],
  ): PythonId[] {
    if (this.collapsedSourceIds.value.has(sourceObjectId)) {
      return [];
    }
    return childIds;
  }

  public getOrderedVisibleSourceObjectIds(frameIds: number[]): PythonId[] {
    const orderedIds: PythonId[] = [];
    const seenIds = new Set<PythonId>();

    for (const frameId of frameIds) {
      const sourceObjectIds = this.frameSourceObjects.value.get(frameId);
      if (!sourceObjectIds) continue;

      for (const id of sourceObjectIds) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        orderedIds.push(id);
      }
    }

    return orderedIds;
  }
}
