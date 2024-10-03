import { type Place, PlaceKind, type Type } from "process-def";

export interface InternedPlaceList {
  places: PlaceWithInternedType[];
  types: Type[];
}

type PlaceWithInternedType = {
  // Name
  n: string;
  // Address
  a: string | null;
  // Interned type
  t: number;
  // Kind
  k: string;
  // Initialized
  i: boolean;
  // Line
  l: number;
};

const PLACE_KIND_MAP: { [key: string]: PlaceKind } = {
  p: PlaceKind.Parameter,
  v: PlaceKind.Variable,
  s: PlaceKind.ShadowedVariable,
  g: PlaceKind.GlobalVariable,
};

export function deserializePlaces(placeList: InternedPlaceList): Place[] {
  // Unintern types
  const types = placeList.types;
  for (const type of types) {
    uninternType(type, types);
  }
  // Unintern and deserialize types
  const places: Place[] = [];
  for (const place of placeList.places) {
    places.push({
      kind: PLACE_KIND_MAP[place.k],
      name: place.n,
      address: place.a,
      type: types[place.t],
      initialized: place.i,
      line: place.l,
    });
  }
  return places;
}

function uninternType(type: Type, types: Type[]) {
  function getType(index: unknown): Type {
    return types[index as number];
  }

  if (type.kind === "ptr") {
    if (Number.isInteger(type.target)) {
      type.target = getType(type.target);
      uninternType(type.target, types);
    }
    fillName(type);
  } else if (type.kind === "struct") {
    for (const field of type.fields) {
      if (Number.isInteger(field.type)) {
        field.type = getType(field.type);
        uninternType(field.type, types);
      }
    }
  } else if (type.kind === "array") {
    if (Number.isInteger(type.type)) {
      type.type = getType(type.type);
      uninternType(type.type, types);
    }
    fillName(type);
  }
}

function fillName(type: Type) {
  if (type.kind === "ptr") {
    if (type.name === null && type.target.name !== null) {
      type.name = `${type.target.name}*`;
    }
  } else if (type.kind === "array") {
    if (type.name === null && type.type.name !== null) {
      type.name = `${type.type.name}[${type.element_count}]`;
    }
  }
}
