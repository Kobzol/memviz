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

export class FrameObjectsVisibilityState {
  // frameId -> source object ids
  private frameSourceObjects = ref(new Map<number, Set<PythonId>>());

  public setFrameSourceObjects(frameId: number, sourceObjIds: PythonId[]) {
    const nextSourceObjectIds = new Set(sourceObjIds);
    const currentSourceObjectIds = this.frameSourceObjects.value.get(frameId);

    if (
      currentSourceObjectIds &&
      equals(currentSourceObjectIds, nextSourceObjectIds)
    )
      return;

    const nextFrameSourceObjects = new Map(this.frameSourceObjects.value);
    nextFrameSourceObjects.set(frameId, nextSourceObjectIds);
    this.frameSourceObjects.value = nextFrameSourceObjects;
  }

  public clearFrameSourceObjects(frameId: number) {
    if (!this.frameSourceObjects.value.has(frameId)) {
      return;
    }

    const nextFrameSourceObjects = new Map(this.frameSourceObjects.value);
    nextFrameSourceObjects.delete(frameId);
    this.frameSourceObjects.value = nextFrameSourceObjects;
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
