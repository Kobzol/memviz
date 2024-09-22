import { PlaceKind } from ".";
import {
  ProcessBuilder,
  makeUint32,
  typeArray,
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
  builder
    .place("b", typeUint32(), PlaceKind.Variable, null, false)
    .setUint32(42);
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
  builder.startFrame("main");
  const a = builder.place("a", typeUint32()).setUint32(42);
  builder.startFrame("foo");
  builder.place("pa", typePtr(typeUint32())).setPtr(a.address);
  return builder;
}
