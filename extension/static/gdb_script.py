import json
from typing import List, Optional, Union
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
        return TyStruct(name=name, fields=fields)
    elif ty.code == gdb.TYPE_CODE_ARRAY:
        inner_type = make_type(ty.target())
        element_count = ty.sizeof // inner_type.get_size()
        return TyArray(name=name, type=inner_type, element_count=element_count)
    else:
        return TyUnknown(name=name, size=size)


def serialize_type(ty: Ty) -> str:
    data = dataclasses.asdict(ty)
    return json.dumps(data) 


def parse_type(typename: str):
    try:
        ty = gdb.lookup_type(typename)
    except gdb.error as e:
        return TyInvalid(name=typename, error=str(e))
    return make_type(ty)


def type_of_val(value: str):
    val = gdb.parse_and_eval(value)
    return make_type(val.type)
