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
  builder.startFrame("main", 0);
  builder.place("a", BigInt(4), typeUint32()).setUint32(50);
  builder.place("b", BigInt(8), typeUint32()).setUint32(42);
  builder.place("c", BigInt(12), typeFloat32()).setFloat32(1.58);
  builder.place("d", BigInt(16), typeFloat32()).setFloat32(4);
  builder.startFrame("foo", 32);
  builder.place("a", BigInt(4), typeUint32()).setUint32(50);
  builder
    .place("b", BigInt(8), typeUint32(), PlaceKind.Variable, false)
    .setUint32(42);
  return builder;
}

export function buildArray(): ProcessBuilder {
  const builder = new ProcessBuilder();
  builder.startFrame("main", 0);
  builder
    .place("a", BigInt(4), typeArray(typeUint32(), 10))
    .setArray((index) => makeUint32(index + 1), 10);
  return builder;
}
