import contextlib
import json
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import gdb
import dataclasses


@dataclasses.dataclass(frozen=True)
class Ty:
    name: str
    size: int


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
    target: int
    kind: str = dataclasses.field(init=False, default="ptr")


@dataclasses.dataclass(frozen=True)
class StructField:
    name: str
    type: int
    offset_bits: int


@dataclasses.dataclass(frozen=True)
class TyStruct(Ty):
    fields: Tuple[StructField]
    kind: str = dataclasses.field(init=False, default="struct")


@dataclasses.dataclass(frozen=True)
class TyArray(Ty):
    type: int
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


@dataclasses.dataclass(frozen=True)
class Place:
    name: str
    address: str
    type: int
    param: bool


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


class TypeInterner:
    def __init__(self):
        self.cache: Dict[Any, Tuple[Ty, int]] = {}

    def intern_type(self, type: Ty) -> int:
        key = self.calculate_key(type)
        entry = self.cache.get(key)
        if entry is not None:
            return entry[1]

        index = len(self.cache)
        self.cache[key] = (type, index)
        return index

    def get_types(self) -> List[Ty]:
        types = sorted(self.cache.values(), key=lambda v: v[1])
        return [ty for (ty, _) in types]

    def calculate_key(self, ty: Ty) -> Any:
        return ty


def make_type(ty: gdb.Type, interner: TypeInterner, typename: Optional[str] = None) -> int:
    ty = ty.unqualified()
    size = ty.sizeof
    name = ty.name
    if name is None:
        name = typename

    if ty.code == gdb.TYPE_CODE_BOOL:
        return interner.intern_type(TyBool(name=name, size=size))
    elif ty.code == gdb.TYPE_CODE_INT:
        return interner.intern_type(TyInt(name=name, size=size, signed=ty.is_signed))
    elif ty.code == gdb.TYPE_CODE_FLT:
        return interner.intern_type(TyFloat(name=name, size=size))
    elif ty.code == gdb.TYPE_CODE_PTR:
        return interner.intern_type(TyPtr(name=name, size=size, target=make_type(ty.target())))
    elif ty.code == gdb.TYPE_CODE_TYPEDEF:
        return make_type(ty.strip_typedefs(), interner=interner, typename=name)
    elif ty.code == gdb.TYPE_CODE_STRUCT:
        fields = []
        for field in ty.fields():
            if field.type is None:
                type = interner.intern_type(TyInvalid(name="unknown", size=1, error="Unknown field type"))
            else:
                type = make_type(field.type, interner=interner)
            field = StructField(
                name=field.name,
                type=type,
                offset_bits=field.bitpos
            )
            fields.append(field)
        return interner.intern_type(TyStruct(name=name, size=size, fields=tuple(fields)))
    elif ty.code == gdb.TYPE_CODE_ARRAY:
        inner_type = ty.target()
        element_count = ty.sizeof // inner_type.sizeof
        inner_type = make_type(inner_type, interner=interner)
        return interner.intern_type(TyArray(name=name, size=size, type=inner_type, element_count=element_count))
    else:
        return interner.intern_type(TyUnknown(name=name, size=size))


# def parse_type(typename: str):
#     try:
#         ty = gdb.lookup_type(typename)
#     except gdb.error as e:
#         return TyInvalid(name=typename, error=str(e))
#     return make_type(ty)


# def type_of_val(value: str):
#     val = gdb.parse_and_eval(value)
#     return make_type(val.type)


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


def get_frame_places(frame_index: int) -> PlaceList:
    interner = TypeInterner()
    with activate_frame(frame_index) as frame:
        block = frame.block()

        places = []
        for symbol in block:
            ty = make_type(symbol.type, interner)
            value = symbol.value(frame)
            is_param = symbol.is_argument
            places.append(Place(name=symbol.name, address=str(value.address), type=ty, param=is_param))
        return PlaceList(places=places, types=interner.get_types())


# TODO: simple value
# TODO: find if variable is initialized by its line
