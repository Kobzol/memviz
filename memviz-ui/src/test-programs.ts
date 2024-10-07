import { PlaceKind } from ".";
import {
  ProcessBuilder,
  makeUint32,
  typeArray,
  typeChar,
  typeFloat32,
  typePtr,
  typeUint32,
} from "./resolver/eager";

export function buildSimpleProgram(): ProcessBuilder {
  const builder = new ProcessBuilder();
  builder.startFrame("main");
  builder.place("a", typeUint32()).setUint32(50);
  builder.place("b", typeUint32()).setUint32(42);
  builder.place("c", typeFloat32()).setFloat32(1.58);
  builder.place("d", typeFloat32()).setFloat32(4);
  builder.startFrame("foo");
  builder.place("a", typeUint32()).setUint32(50);
  builder.place("b", typeUint32(), PlaceKind.Variable, false).setUint32(42);
  return builder;
}

export function buildArray(): ProcessBuilder {
  const builder = new ProcessBuilder();
  builder.startFrame("main");

  const size = 100;
  builder
    .place("a", typeArray(typeUint32(), size))
    .setArray((index) => makeUint32(index + 1), size);
  return builder;
}

export function buildPointers(): ProcessBuilder {
  const builder = new ProcessBuilder();
  builder.startFrame("main");
  builder.place("a", typeUint32()).setUint32(42);
  const target = builder
    .place("b", typeUint32(), PlaceKind.Variable, false)
    .setUint32(43);
  builder.place("c", typeUint32()).setUint32(44);
  builder.place("d", typeUint32()).setUint32(45);
  builder.startFrame("foo");
  builder.place("pa", typePtr(typeUint32())).setPtr(target.address + BigInt(8));
  return builder;
}

export function buildString(): ProcessBuilder {
  const builder = new ProcessBuilder();
  builder.startFrame("main");
  const p0 = builder
    .place("data", typeArray(typeChar(), 6), PlaceKind.Parameter)
    .setCString("Hello");
  builder.place("ptr", typePtr(typeChar())).setPtr(p0.address);
  return builder;
}

export function buildHeap(): ProcessBuilder {
  const builder = new ProcessBuilder();
  const heap0 = builder
    .allocHeap(BigInt(1000), 4 * 4, false)
    .setArray((i) => makeUint32(i), 4);
  const heap1 = builder.allocHeap(BigInt(2004), 16).setCString("hello");

  builder.startFrame("main");
  builder.place("ptr", typePtr(typeUint32())).setPtr(heap0.address);
  builder.place("ptr2", typePtr(typeChar())).setPtr(heap1.address);
  return builder;
}

export function buildComplex(): ProcessBuilder {
  const builder = new ProcessBuilder();
  builder.startFrame("main");
  const p0 = builder
    .place("data", typeArray(typeChar(), 101), PlaceKind.Parameter)
    .setCString("Hello".repeat(20));
  builder.place("ptr", typePtr(typeChar())).setPtr(p0.address);
  builder.place("p0", typeUint32(), PlaceKind.Parameter).setUint32(42);
  const p1 = builder.place("p1", typePtr(typeUint32()));
  builder.place("a", typeUint32()).setUint32(42);
  const target = builder.place("b", typeUint32()).setUint32(43);
  builder.startFrame("foo");
  builder.place("pa", typePtr(typeUint32())).setPtr(target.address);
  const x = builder.place("x", typeUint32()).setUint32(50);
  builder.place("pnull", typePtr(typeUint32())).setPtr(BigInt(0));
  p1.setPtr(x.address);
  const size = 100;
  builder
    .place("a", typeArray(typeUint32(), size))
    .setArray((index) => makeUint32(index + 1), size);
  return builder;
}
