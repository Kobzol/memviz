import { SessionType } from "process-def";
import type { Attribute, KeyValuePair } from "process-def/debugpy";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  DebugpyProcessBuilder,
  makeBool,
  makeComplex,
  makeDict,
  makeFloat,
  makeInt,
  makeList,
  makeNone,
  makeObject,
  makeStr,
} from "../src/resolver/eager/utils/debugpy";
import { ProcessResolver } from "../src/resolver/resolver";
import { debugpyComponentMap } from "../src/visualization/debugpy/store";
import { Memviz } from "../src/visualization/index";

const leaderLineObjects: Array<{ remove: ReturnType<typeof vi.fn> }> = [];

vi.mock("leader-line", () => ({
  LeaderLine: class {
    remove = vi.fn();
    position = vi.fn();
    color = "";
    endPlugColor = "";

    constructor() {
      leaderLineObjects.push(this);
    }

    static pointAnchor() {
      return { x: 0, y: 0 };
    }
  },
}));

describe("Debugpy UI rendering", () => {
  let container: HTMLElement;
  let memviz: Memviz;
  let builder: DebugpyProcessBuilder;

  const renderedText = () => container.textContent || "";

  const renderState = async () => {
    const [state, eagerResolver] = builder.build();

    const resolver = new ProcessResolver(eagerResolver);
    await memviz.showState(state, resolver, SessionType.Debugpy);

    await vi.waitFor(
      () => {
        expect(container.children.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );
  };

  beforeAll(() => {
    container = document.createElement("div");
    container.id = "app";
    document.body.appendChild(container);
    memviz = new Memviz(container);
  });

  beforeEach(() => {
    builder = new DebugpyProcessBuilder();
  });

  afterEach(() => {
    leaderLineObjects.length = 0;
    vi.restoreAllMocks();
  });

  afterAll(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  });

  test("mounts and renders a minimal state", async () => {
    builder.startFrame("main");
    builder.place("intVariable", makeInt(builder, 1));

    await renderState();

    await vi.waitFor(() => {
      expect(container.children.length).toBeGreaterThan(0);
      expect(renderedText()).toContain("intVariable");
    });
  });

  test("renders strings", async () => {
    builder.startFrame("main");
    const strVal = makeStr(builder, "Content of my string");
    builder.place("variableName", strVal);

    const [state, eagerResolver] = builder.build();
    const resolver = new ProcessResolver(eagerResolver);

    await memviz.showState(state, resolver, SessionType.Debugpy);

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("variableName");
      expect(text).toContain("Content of my string");
    });
  });

  test("renders lists", async () => {
    builder.startFrame("main");
    const elements = [
      makeInt(builder, 1),
      makeInt(builder, 2),
      makeInt(builder, 3),
    ];
    const listVal = makeList(builder, elements);
    builder.place("numbersList", listVal);

    const [state, eagerResolver] = builder.build();
    const resolver = new ProcessResolver(eagerResolver);

    await memviz.showState(state, resolver, SessionType.Debugpy);

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("numbersList");
      expect(text).toContain("1");
      expect(text).toContain("2");
      expect(text).toContain("3");
      expect(container.querySelectorAll(".elements-table tr").length).toBe(3);
    });
  });

  test("renders dicts", async () => {
    const builder = new DebugpyProcessBuilder();
    builder.startFrame("main");
    const pairs = [
      { key: makeStr(builder, "name"), value: makeStr(builder, "Alice") },
      { key: makeStr(builder, "age"), value: makeInt(builder, 40) },
    ];
    const dictVal = makeDict(builder, pairs);
    builder.place("personDict", dictVal);

    const [state, eagerResolver] = builder.build();
    const resolver = new ProcessResolver(eagerResolver);

    await memviz.showState(state, resolver, SessionType.Debugpy);

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("personDict");
      expect(text).toContain("name");
      expect(text).toContain("Alice");
      expect(text).toContain("age");
      expect(text).toContain("40");
    });
  });

  test("renders objects", async () => {
    const builder = new DebugpyProcessBuilder();
    builder.startFrame("main");
    const attributes = [
      { name: "attribute1", value: makeInt(builder, 10), is_descriptor: false },
      { name: "attribute2", value: makeInt(builder, 20), is_descriptor: false },
    ];
    const objVal = makeObject(builder, "CustomClass", attributes);
    builder.place("customObject", objVal);

    const [state, eagerResolver] = builder.build();
    const resolver = new ProcessResolver(eagerResolver);

    await memviz.showState(state, resolver, SessionType.Debugpy);

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("customObject");
      expect(text).toContain("CustomClass");
      expect(text).toContain("attribute1");
      expect(text).toContain("10");
      expect(text).toContain("attribute2");
      expect(text).toContain("20");
    });
  });

  test("renders stack frames", async () => {
    const builder = new DebugpyProcessBuilder();
    builder.startFrame("main");
    builder.startFrame("function_a");
    builder.startFrame("function_b");
    builder.place("variable_in_a_frame", makeInt(builder, 3));

    const [state, eagerResolver] = builder.build();
    const resolver = new ProcessResolver(eagerResolver);

    await memviz.showState(state, resolver, SessionType.Debugpy);

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("main");
      expect(text).toContain("function_a");
      expect(text).toContain("function_b");
      expect(text).toContain("variable_in_a_frame");
      expect(text).toContain("3");
    });
  });

  test("renders scalar types", async () => {
    const builder = new DebugpyProcessBuilder();
    builder.startFrame("scalar_varaibles");

    builder.place("none_val", makeNone(builder));
    builder.place("bool_val", makeBool(builder, true));
    builder.place("int_val", makeInt(builder, 1234));
    builder.place("float_val", makeFloat(builder, 5.67));
    builder.place("complex_val", makeComplex(builder, "8", "-9"));
    builder.place("str_val", makeStr(builder, "test"));

    const [state, eagerResolver] = builder.build();
    const resolver = new ProcessResolver(eagerResolver);

    await memviz.showState(state, resolver, SessionType.Debugpy);

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("none_val");
      expect(text).toContain("None");
      expect(text).toContain("bool_val");
      expect(text).toContain("True");
      expect(text).toContain("int_val");
      expect(text).toContain("1234");
      expect(text).toContain("float_val");
      expect(text).toContain("5.67");
      expect(text).toContain("complex_val");
      expect(text).toContain("8 - 9j");
      expect(text).toContain("str_val");
      expect(text).toContain("test");
    });
  });

  test("updates when state changes", async () => {
    const builder1 = new DebugpyProcessBuilder();
    builder1.startFrame("main");
    builder1.place("first_variable", makeInt(builder1, 1));

    const [state1, resolver1] = builder1.build();
    await memviz.showState(
      state1,
      new ProcessResolver(resolver1),
      SessionType.Debugpy,
    );

    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("first_variable");
    });

    const builder2 = new DebugpyProcessBuilder();
    builder2.startFrame("main");
    builder2.place("second_variable", makeInt(builder2, 100));

    const [state2, resolver2] = builder2.build();
    await memviz.showState(
      state2,
      new ProcessResolver(resolver2),
      SessionType.Debugpy,
    );

    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("second_variable");
      expect(container.innerHTML).not.toContain("first_variable");
    });
  });

  test("renders nested values", async () => {
    builder.startFrame("main");

    const attrs = [
      {
        name: "object_value",
        value: makeInt(builder, 10),
        is_descriptor: false,
      },
    ];
    const objVal = makeObject(builder, "TestClass", attrs);

    const dictPairs = [{ key: makeStr(builder, "inner"), value: objVal }];
    const dictVal = makeDict(builder, dictPairs);

    const listElems = [dictVal];
    const listVal = makeList(builder, listElems);

    builder.place("root", listVal);

    await renderState();

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("root");
      expect(text).toContain("inner");
      expect(text).toContain("object_value");
      expect(text).toContain("10");
      expect(text).toContain("TestClass");
    });
  });

  test("renders circular references", async () => {
    builder.startFrame("main");

    const pair: KeyValuePair = {
      key: makeStr(builder, "self"),
      value: makeNone(builder),
    };

    const dictVal = makeDict(builder, [pair]);

    pair.value = dictVal;
    builder.place("recursive_root", dictVal);

    await renderState();

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("recursive_root");
      expect(text).toContain("self");
    });
  });

  test("renders self referencing object attributes", async () => {
    builder.startFrame("main");

    const selfAttr: Attribute = {
      name: "self_reference",
      value: makeNone(builder),
      is_descriptor: false,
    };
    const node = makeObject(builder, "Node", [selfAttr]);
    selfAttr.value = node;

    builder.place("node_root", node).withAttributes([selfAttr]);

    await renderState();

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("node_root");
      expect(text).toContain("Node");
      expect(text).toContain("self_reference");
    });
  });

  test("renders shared references", async () => {
    builder.startFrame("main");

    const val = makeInt(builder, 123);

    builder.place("first_reference", val);
    builder.place("second_reference", val);

    await renderState();

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("first_reference");
      expect(text).toContain("second_reference");
      expect(text).toContain("123");
    });
  });

  test("removes values from previous state", async () => {
    const builder1 = new DebugpyProcessBuilder();
    builder1.startFrame("main");
    builder1.place("remove", makeInt(builder1, 11));
    builder1.place("keep", makeInt(builder1, 22));

    const [state1, resolver1] = builder1.build();
    await memviz.showState(
      state1,
      new ProcessResolver(resolver1),
      SessionType.Debugpy,
    );

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("remove");
      expect(text).toContain("keep");
      expect(text).toContain("11");
      expect(text).toContain("22");
    });

    const builder2 = new DebugpyProcessBuilder();
    builder2.startFrame("main");
    builder2.place("keep", makeInt(builder2, 33));

    const [state2, resolver2] = builder2.build();
    await memviz.showState(
      state2,
      new ProcessResolver(resolver2),
      SessionType.Debugpy,
    );

    await vi.waitFor(() => {
      const text = renderedText();
      expect(text).toContain("keep");
      expect(text).toContain("33");
      expect(text).not.toContain("remove");
    });
  });

  test("removes components and leader lines when rendered heap values are not visible", async () => {
    builder.startFrame("main");

    // create a dictionary with a self reference
    const pair: KeyValuePair = {
      key: makeStr(builder, "self"),
      value: makeNone(builder),
    };
    const dictVal = makeDict(builder, [pair]);
    pair.value = dictVal;

    builder.place("my_variable", dictVal);

    await renderState();

    await vi.waitFor(
      () => {
        expect(debugpyComponentMap.value.count()).toBeGreaterThan(0);
        expect(leaderLineObjects.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    // render a new state that doesn't have the dictionary
    const builder2 = new DebugpyProcessBuilder();
    builder2.startFrame("main");
    builder2.place("flat_value", makeInt(builder2, 1));

    const [state2, resolver2] = builder2.build();
    await memviz.showState(
      state2,
      new ProcessResolver(resolver2),
      SessionType.Debugpy,
    );

    await vi.waitFor(() => {
      expect(debugpyComponentMap.value.count()).toBe(0);
    });

    // check that all leader lines have had remove called on them
    await vi.waitFor(() => {
      const totalRemoveCalls = leaderLineObjects.reduce(
        (sum, line) => sum + line.remove.mock.calls.length,
        0,
      );
      expect(totalRemoveCalls).toBeGreaterThan(0);
    });
  });
});
