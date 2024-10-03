import contextlib
import json
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import gdb
import dataclasses


InternedType = int


@dataclasses.dataclass(frozen=True)
class Ty:
    name: str
    size: int

    def make_key(self) -> Any:
        return self


@dataclasses.dataclass(frozen=True)
class TyBool(Ty):
    kind: str = dataclasses.field(init=False, default="bool")


@dataclasses.dataclass(frozen=True)
class TyInt(Ty):
    signed: bool
    kind: str = dataclasses.field(init=False, default="int")


@dataclasses.dataclass(frozen=True)
class TyFloat(Ty):
    kind: str = dataclasses.field(init=False, default="float")


@dataclasses.dataclass(frozen=True)
class TyPtr(Ty):
    target: InternedType
    kind: str = dataclasses.field(init=False, default="ptr")


@dataclasses.dataclass(frozen=True)
class StructField:
    name: str
    type: InternedType
    offset_bits: int


@dataclasses.dataclass(frozen=True)
class TyStruct(Ty):
    fields: Tuple[StructField]
    kind: str = dataclasses.field(init=False, default="struct")

    def make_key(self) -> Any:
        return ("struct", self.name, self.size, len(self.fields))

@dataclasses.dataclass(frozen=True)
class TyArray(Ty):
    type: InternedType
    element_count: int
    kind: str = dataclasses.field(init=False, default="array")


@dataclasses.dataclass(frozen=True)
class TyUnknown(Ty):
    kind: str = dataclasses.field(init=False, default="unknown")


@dataclasses.dataclass(frozen=True)
class TyInvalid(Ty):
    error: str
    kind: str = dataclasses.field(init=False, default="invalid")


Ty = Union[TyBool, TyInt, TyFloat, TyPtr, TyStruct, TyArray, TyUnknown, TyInvalid]


# The names are intentionally shortened to reduce the amount of data
# (de)serialized from/to JSON
@dataclasses.dataclass(frozen=True)
class Place:
    # Name
    n: str
    # Address
    a: str
    # Type
    t: int
    # Kind
    k: str
    # Initialized
    i: bool
    # Line
    l: int

    @staticmethod
    def create(name: str, address: str, type: int, kind: str, init: bool, line: int) -> "Place":
        return Place(
            n=name,
            a=address,
            t=type,
            k=kind,
            i=init,
            l=line
        )


@dataclasses.dataclass
class PlaceList:
    places: List[Place]
    types: List[Ty]


@dataclasses.dataclass
class Result:
    ok: bool
    value: Optional[Any] = None
    error: Optional[str] = None

    @staticmethod
    def make_ok(value: Any) -> "Result":
        return Result(ok=True, value=value)

    @staticmethod
    def make_error(error: Any) -> "Result":
        return Result(ok=False, error=error)


def try_run(fn: Callable) -> Result:
    try:
        result = fn()
        return dataclass_to_json(Result.make_ok(result))
    except BaseException as e:
        return dataclass_to_json(Result.make_error(str(e)))


def dataclass_to_json(value) -> str:
    return json.dumps(dataclasses.asdict(value))


TypeKey = Tuple[Optional[str], Optional[int]]


class TypeInterner:
    def __init__(self):
        self.cache: Dict[TypeKey, InternedType] = {}
        self.types: List[Ty] = []

    def intern_type(self, ty: Ty) -> InternedType:
        interned_ty = self.get_interned_type(ty)
        if interned_ty is not None:
            return interned_ty

        index = len(self.types)
        self.cache[ty.make_key()] = index
        self.types.append(ty)
        return index

    def replace_type(self, interned_ty: InternedType, ty: Ty):
        self.types[interned_ty] = ty
        assert self.get_interned_type(ty) == interned_ty 

    def get_interned_type(self, ty: Ty) -> Optional[InternedType]:
        return self.cache.get(ty.make_key())

    def get_types(self) -> List[Ty]:
        return self.types


def make_type(ty: gdb.Type, interner: TypeInterner, typename: Optional[str] = None) -> InternedType:
    ty = ty.unqualified()
    size = ty.sizeof
    name = ty.name
    if typename is not None or name is None:
        name = typename

    if ty.code == gdb.TYPE_CODE_BOOL:
        return interner.intern_type(TyBool(name=name, size=size))
    elif ty.code == gdb.TYPE_CODE_INT:
        return interner.intern_type(TyInt(name=name, size=size, signed=ty.is_signed))
    elif ty.code == gdb.TYPE_CODE_FLT:
        return interner.intern_type(TyFloat(name=name, size=size))
    elif ty.code == gdb.TYPE_CODE_PTR:
        target = make_type(ty.target(), interner=interner)
        ptr_ty = TyPtr(name=name, size=size, target=target)
        return interner.intern_type(ptr_ty)
    elif ty.code == gdb.TYPE_CODE_TYPEDEF:
        return make_type(ty.strip_typedefs(), interner=interner, typename=name)
    elif ty.code == gdb.TYPE_CODE_STRUCT:
        # This hack is needed to support recursive data structures (e.g. Node { next: Node* })
        struct_ty = TyStruct(name=name, size=size, fields=(None,) * len(ty.fields()))
        interned_ty = interner.get_interned_type(struct_ty)
        if interned_ty is not None:
            return interned_ty
        interned_ty = interner.intern_type(struct_ty)

        fields = []
        for field in ty.fields():
            if field.type is None:
                field_ty = interner.intern_type(TyInvalid(name="unknown", size=1, error="Unknown field type"))
            else:
                field_ty = make_type(field.type, interner=interner)
            field = StructField(
                name=field.name,
                type=field_ty,
                offset_bits=field.bitpos
            )
            fields.append(field)
        interner.replace_type(interned_ty, TyStruct(name=name, size=size, fields=tuple(fields)))
        return interned_ty
    elif ty.code == gdb.TYPE_CODE_ARRAY:
        inner_type = ty.target()
        element_count = ty.sizeof // inner_type.sizeof
        inner_type = make_type(inner_type, interner=interner)
        return interner.intern_type(TyArray(name=name, size=size, type=inner_type, element_count=element_count))
    else:
        return interner.intern_type(TyUnknown(name=name, size=size))


@contextlib.contextmanager
def activate_frame(index: int):
    """
    Temporarily select frame with the given index.
    The topmost stack frame has index 0.
    """
    frame = gdb.selected_frame()

    current_frame = gdb.newest_frame()
    current_index = 0
    while current_index < index:
        current_frame = current_frame.older()
        if current_frame is None:
            raise Exception(f"Frame {index} not found")
        current_index += 1
    try:
        current_frame.select()
        yield current_frame
    finally:
        frame.select()


def get_frame_places(frame_index: int = 0) -> PlaceList:
    interner = TypeInterner()
    places = []
    seen_names = set()

    with activate_frame(frame_index) as frame:
        sal = frame.find_sal()
        current_line = sal.line
        block = frame.block()
        while block is not None:
            if not block.is_valid():
                break

            is_local_block = not (block.is_global or block.is_static)

            for symbol in block:
                if not (symbol.is_variable or symbol.is_argument or symbol.is_constant):
                    continue

                # We use >= instead of > because multiple statements can be on the same line
                # E.g. for (int i = 0; i < ...; i++)
                init = current_line >= symbol.line
                name = symbol.name
                is_shadowed = False

                if is_local_block and symbol.is_variable:
                    is_shadowed = name in seen_names
                    seen_names.add(name)

                kind = None
                if symbol.is_argument:
                    kind = "p"
                elif is_shadowed:
                    # Shadowed variable
                    kind = "s"
                elif is_local_block:
                    kind = "v"
                else:
                    kind = "g"

                ty = make_type(symbol.type, interner)
                value = symbol.value(frame)
                address = value.address
                if address is not None:
                    address = address.format_string(
                        raw=True,
                        address=True,
                        symbols=False,
                        pretty_arrays=False,
                        pretty_structs=False,
                        array_indexes=False,
                        actual_objects=False,
                        format="x"
                    )

                place = Place.create(
                    name=name,
                    address=address,
                    type=ty,
                    kind=kind,
                    init=init,
                    line=symbol.line
                )
                places.append((place, (symbol.line, address or name or "")))
            block = block.superblock
    places = sorted(places, key=lambda v: v[1])
    places = [place for (place, _) in places]
    return PlaceList(places=places, types=interner.get_types())


def get_stack_address_range() -> Optional[Tuple[str, str]]:
    pid = gdb.selected_inferior().pid
    with open(f"/proc/{pid}/maps") as f:
        for line in f:
            f = line.strip()
            parts = f.split()
            if len(parts) < 6:
                continue
            location = parts[5].strip()
            if location == "[stack]":
                range = parts[0].split("-")
                if len(range) == 2:
                    return (f"0x{range[0]}", f"0x{range[1]}")
    return None
