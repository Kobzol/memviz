import { LeaderLine } from "leader-line";
import type { PythonId } from "process-def/debugpy";
import { type ShallowRef, triggerRef } from "vue";
import { withDisabledPanZoom } from "../utils/panzoom";

export interface ComponentWithId {
  id: PythonId;
  element: HTMLElement;
}

export type LeaderLineWithId = {
  id: number;
  arrow: LeaderLine;
};

export type ComponentUnsubscribeFn = () => void;

class ArrowMap {
  private arrows: Map<PythonId, LeaderLineWithId[]> = new Map();
  private nextArrowId = 0;

  get(targetId: PythonId): LeaderLineWithId[] {
    return this.arrows.get(targetId) || [];
  }

  private getColor(isHighlighted = false): string {
    const alpha = isHighlighted ? 1 : 0.1;
    return `rgba(255, 121, 73, ${alpha})`;
  }

  public create(
    source: HTMLDivElement,
    target: ComponentWithId,
  ): LeaderLineWithId {
    let arrow: LeaderLine | null = null;

    withDisabledPanZoom(() => {
      const targetIsRight =
        source.getBoundingClientRect().right <
        target.element.getBoundingClientRect().left;

      const targetEndSocket = targetIsRight ? "left" : "right";

      arrow = new LeaderLine(source, target.element, {
        path: "fluid",
        startSocket: "right",
        endSocket: targetEndSocket,
        endPlug: "arrow2",
        endPlugSize: 1.25,
        endPlugColor: this.getColor(),
        color: this.getColor(),
        size: 4,
        dropShadow: { dx: 1, dy: 1, blur: 2 },
      });
    });

    if (!arrow) {
      throw new Error(
        `Failed to create LeaderLine for source: ${source} and target: ${target.id}`,
      );
    }

    const arrowWithId: LeaderLineWithId = {
      id: this.nextArrowId++,
      arrow,
    };

    const existing = this.get(target.id);
    existing.push(arrowWithId);
    this.arrows.set(target.id, existing);

    return arrowWithId;
  }

  public tryDelete(targetId: PythonId, arrowId: number) {
    const existing = this.get(targetId);
    const arrowToRemove = existing.find((a) => a.id === arrowId);
    if (arrowToRemove) {
      arrowToRemove.arrow.remove();
    }

    const filtered = existing.filter((arrow) => arrow.id !== arrowId);
    if (filtered.length === 0) {
      this.arrows.delete(targetId);
    } else {
      this.arrows.set(targetId, filtered);
    }
  }

  public tryDeleteAllForId(targetId: PythonId) {
    const arrows = this.get(targetId);
    for (const arrow of arrows) {
      arrow.arrow.remove();
    }
    this.arrows.delete(targetId);
  }

  highlight(targetId: PythonId) {
    withDisabledPanZoom(() => {
      const arrows = this.get(targetId);
      for (const arrow of arrows) {
        const color = this.getColor(true);
        arrow.arrow.color = color;
        arrow.arrow.endPlugColor = color;
      }
    });
  }

  unhighlight(targetId: PythonId) {
    withDisabledPanZoom(() => {
      const arrows = this.get(targetId);
      for (const arrow of arrows) {
        const color = this.getColor(false);
        arrow.arrow.color = color;
        arrow.arrow.endPlugColor = color;
      }
    });
  }

  public repositionAll() {
    withDisabledPanZoom(() => {
      for (const [_, arrows] of this.arrows) {
        for (const { arrow } of arrows) {
          arrow.position();
        }
      }
    });
  }
}

export class ComponentMap {
  private components: Map<PythonId, ComponentWithId> = new Map();
  private arrows: ArrowMap = new ArrowMap();

  // stack of currently hovered object IDs (with the most recently
  // hovered ID at the end of the array)
  // most recently hovered is the innermost value in case of nested
  // hover (e.g. hovering an object in a list)
  private hoveredObjectIds: PythonId[] = [];

  private highlightCurrentValue() {
    const currentId = this.hoveredObjectIds[this.hoveredObjectIds.length - 1];
    if (!currentId) return;
    this.arrows.highlight(currentId);
  }

  addComponent(
    component: ComponentWithId,
    ref: ShallowRef<ComponentMap>,
  ): ComponentUnsubscribeFn {
    const entry = { ...component };
    this.components.set(component.id, entry);
    triggerRef(ref);
    return () => this.removeComponent(component.id, ref);
  }

  count(): number {
    return this.components.size;
  }

  public getComponent(id: PythonId): ComponentWithId | null {
    return this.components.get(id) || null;
  }

  private removeComponent(id: PythonId, ref: ShallowRef<ComponentMap>) {
    withDisabledPanZoom(() => {
      const component = this.components.get(id);
      if (!component) {
        console.warn(
          `Component with ID ${id} did not exist in Debugpy component map`,
        );
        return;
      }

      this.arrows.tryDeleteAllForId(id);
      this.components.delete(id);
    });
    triggerRef(ref);
  }

  public createArrow(
    source: HTMLDivElement,
    targetId: PythonId,
  ): LeaderLineWithId {
    const target = this.getComponent(targetId);
    if (target === null) {
      throw new Error(
        `Component with ID ${targetId} does not exist in Debugpy component map`,
      );
    }
    return this.arrows.create(source, target);
  }

  public tryRemoveArrow(targetId: PythonId, arrowId: number) {
    this.arrows.tryDelete(targetId, arrowId);
  }

  public highlightValue(id: PythonId) {
    const previouslyHighlightedId =
      this.hoveredObjectIds[this.hoveredObjectIds.length - 1];

    if (previouslyHighlightedId === id) return;

    if (previouslyHighlightedId) {
      this.arrows.unhighlight(previouslyHighlightedId);
    }

    const currentObjectIdx = this.hoveredObjectIds.indexOf(id);
    if (currentObjectIdx !== -1) {
      this.hoveredObjectIds.splice(currentObjectIdx, 1);
    }

    this.hoveredObjectIds.push(id);
    this.highlightCurrentValue();
  }

  public unhighlightValue(id: PythonId) {
    const currentObjectIdx = this.hoveredObjectIds.lastIndexOf(id);
    if (currentObjectIdx === -1) return;

    const currentId = this.hoveredObjectIds[this.hoveredObjectIds.length - 1];
    if (currentId) {
      this.arrows.unhighlight(currentId);
    }

    this.hoveredObjectIds.splice(currentObjectIdx, 1);
    this.highlightCurrentValue();
  }
  public repositionArrows() {
    this.arrows.repositionAll();
  }
}
