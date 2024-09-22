import { PlaceKind } from ".";
import {
  ProcessBuilder,
  makeUint32,
  typeArray,
  typeFloat32,
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
  builder
    .place("a", typeArray(typeUint32(), 10))
    .setArray((index) => makeUint32(index + 1), 10);
  return builder;
}

export function buildPointers(): ProcessBuilder {
  const builder = new ProcessBuilder();
  builder.startFrame("foo");
  builder.place("p0", typeUint32(), PlaceKind.Parameter).setUint32(42);
  builder.startFrame("main");
  builder.place("p0", typeUint32(), PlaceKind.Parameter).setUint32(42);
  builder.place("p1", typeUint32(), PlaceKind.Parameter).setUint32(42);
  builder.place("a", typeUint32()).setUint32(42);
  const target = builder
    .place("b", typeUint32(), PlaceKind.Variable, false)
    .setUint32(43);
  builder.place("c", typeUint32()).setUint32(44);
  builder.place("d", typeUint32()).setUint32(45);
  builder
    .place("arr", typeArray(typeUint32(), 5))
    .setArray((index) => makeUint32(index + 1), 5);
  // builder.startFrame("foo");
  // builder.place("pa", typePtr(typeUint32())).setPtr(target.address + BigInt(8));
  return builder;
}
