import contextlib
import json
from typing import Any, Callable, List, Optional, Union
import gdb
from gdb import types
import dataclasses


@dataclasses.dataclass
class Ty:
    name: str

    def get_size(self) -> int:
        return 1


@dataclasses.dataclass
class TyBool(Ty):
    size: int
    kind: str = dataclasses.field(init=False, default="bool")

    def get_size(self) -> int:
        return self.size


@dataclasses.dataclass
class TyInt(Ty):
    signed: bool
    size: int
    kind: str = dataclasses.field(init=False, default="int")

    def get_size(self) -> int:
        return self.size


@dataclasses.dataclass
class TyFloat(Ty):
    size: int
    kind: str = dataclasses.field(init=False, default="float")

    def get_size(self) -> int:
        return self.size


@dataclasses.dataclass
class TyPtr(Ty):
    target: "Ty"
    size: int
    kind: str = dataclasses.field(init=False, default="ptr")

    def get_size(self) -> int:
        return self.size


@dataclasses.dataclass
class StructField:
    name: str
    type: "Ty"
    offset_bits: int


@dataclasses.dataclass
class TyStruct(Ty):
    fields: List[StructField]
    size: int
    kind: str = dataclasses.field(init=False, default="struct")

    def get_size(self) -> int:
        return self.size


@dataclasses.dataclass
class TyArray(Ty):
    type: "Ty"
    element_count: int
    kind: str = dataclasses.field(init=False, default="array")

    def get_size(self) -> int:
        return self.type.get_size() * self.element_count


@dataclasses.dataclass
class TyUnknown(Ty):
    size: int
    kind: str = dataclasses.field(init=False, default="unknown")

    def get_size(self) -> int:
        return self.size


@dataclasses.dataclass
class TyInvalid(Ty):
    error: str
    kind: str = dataclasses.field(init=False, default="invalid")


Ty = Union[TyBool, TyInt, TyFloat, TyPtr, TyStruct, TyArray, TyUnknown, TyInvalid]


@dataclasses.dataclass
class Place:
    name: str
    address: str
    type: Ty
    param: bool


@dataclasses.dataclass
class PlaceList:
    places: List[Place]


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


def make_type(ty: gdb.Type, typename: Optional[str] = None):
    ty = ty.unqualified()
    size = ty.sizeof
    name = ty.name
    if name is None:
        name = typename

    if ty.code == gdb.TYPE_CODE_BOOL:
        return TyBool(name=name, size=size)
    elif ty.code == gdb.TYPE_CODE_INT:
        return TyInt(name=name, signed=ty.is_signed, size=size)
    elif ty.code == gdb.TYPE_CODE_FLT:
        return TyFloat(name=name, size=size)
    elif ty.code == gdb.TYPE_CODE_PTR:
        return TyPtr(name=name, target=make_type(ty.target()), size=size)
    elif ty.code == gdb.TYPE_CODE_TYPEDEF:
        return make_type(ty.strip_typedefs(), typename=name)
    elif ty.code == gdb.TYPE_CODE_STRUCT:
        fields = []
        for field in ty.fields():
            if field.type is None:
                type = TyInvalid(name="unknown", error="Unknown field type")
            else:
                type = make_type(field.type)
            field = StructField(
                name=field.name,
                type=type,
                offset_bits=field.bitpos
            )
            fields.append(field)
        return TyStruct(name=name, fields=fields, size=size)
    elif ty.code == gdb.TYPE_CODE_ARRAY:
        inner_type = make_type(ty.target())
        element_count = ty.sizeof // inner_type.get_size()
        return TyArray(name=name, type=inner_type, element_count=element_count)
    else:
        return TyUnknown(name=name, size=size)


def parse_type(typename: str):
    try:
        ty = gdb.lookup_type(typename)
    except gdb.error as e:
        return TyInvalid(name=typename, error=str(e))
    return make_type(ty)


def type_of_val(value: str):
    val = gdb.parse_and_eval(value)
    return make_type(val.type)


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
    with activate_frame(frame_index) as frame:
        block = frame.block()

        places = []
        for symbol in block:
            ty = make_type(symbol.type)
            value = symbol.value(frame)
            is_param = symbol.is_argument
            places.append(Place(name=symbol.name, address=str(value.address), type=ty, param=is_param))
        return PlaceList(places=places)


def dataclass_to_json(value) -> str:
    return json.dumps(dataclasses.asdict(value))


# TODO: simple value
# TODO: type caching
# TODO: find if variable is initialized by its line
