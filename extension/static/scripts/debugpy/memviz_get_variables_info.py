import dataclasses
import inspect
import itertools
import json
import sys
from abc import ABC
from typing import Any, Callable, Dict, List, Optional, Tuple
from weakref import WeakValueDictionary


PythonId = str
FrameIndex = int


RETURN_VALUES_DICT_NAME = "__pydevd_ret_val_dict"
SEQUENCE_LOAD_ITEM_COUNT = 15
STR_LOAD_CHAR_COUNT = 100


class IdMap:
    _weakrefMap: WeakValueDictionary[PythonId, Any] = WeakValueDictionary()
    _strongrefMap: Dict[PythonId, Any] = {}

    _NOT_FOUND = object()

    @classmethod
    def register(cls, python_id: PythonId, value: Any) -> None:
        try:
            cls._weakrefMap[python_id] = value
        except TypeError:
            # value does not support weak references
            cls._strongrefMap[python_id] = value

    @classmethod
    def get(cls, python_id: PythonId) -> Any:
        val = cls._strongrefMap.get(python_id, cls._NOT_FOUND)
        if val is not cls._NOT_FOUND:
            return val

        val = cls._weakrefMap.get(python_id, cls._NOT_FOUND)
        if val is not cls._NOT_FOUND:
            return val

        raise ValueError(f"Value with id {python_id} not found.")

    @classmethod
    def clear(cls) -> None:
        cls._weakrefMap.clear()
        cls._strongrefMap.clear()


@dataclasses.dataclass(frozen=True)
class Place:
    name: str
    id: PythonId
    kind: str


@dataclasses.dataclass()
class BaseVal(ABC):
    id: PythonId

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, BaseVal):
            return NotImplemented
        return self.id == other.id


@dataclasses.dataclass()
class NoneVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="none")
    size: int


@dataclasses.dataclass()
class BoolVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="bool")
    size: int
    value: bool


@dataclasses.dataclass()
class IntVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="int")
    size: int
    value: str


@dataclasses.dataclass()
class FloatVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="float")
    size: int
    value: str


@dataclasses.dataclass()
class ComplexVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="complex")
    size: int
    real_value: str
    imaginary_value: str


@dataclasses.dataclass(kw_only=True)
class DeferredStrVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="str")
    size: int
    length: int
    content: Optional[str] = None
    content_offset: int = 0


@dataclasses.dataclass(kw_only=True)
class FlatCollectionVal(BaseVal, ABC):
    element_count: int
    elements: Optional[List[BaseVal]] = None
    element_offset: int = 0


@dataclasses.dataclass(kw_only=True)
class DeferredListVal(FlatCollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="list")


@dataclasses.dataclass(kw_only=True)
class DeferredTupleVal(FlatCollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="tuple")


@dataclasses.dataclass(kw_only=True)
class DeferredSetVal(FlatCollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="set")


@dataclasses.dataclass(kw_only=True)
class DeferredFrozenSetVal(FlatCollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="frozenset")


@dataclasses.dataclass()
class KeyValuePair:
    key: BaseVal
    value: BaseVal


@dataclasses.dataclass(kw_only=True)
class DeferredDictVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="dict")
    size: int
    pair_count: int
    pairs: Optional[List[KeyValuePair]] = None
    pair_offset: int = 0


@dataclasses.dataclass()
class RangeVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="range")
    size: int
    start: str
    stop: str
    step: str


@dataclasses.dataclass()
class FunctionVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="function")
    name: str
    qualified_name: str
    module: str | None
    signature: str | None


@dataclasses.dataclass()
class Attribute:
    name: str
    value: Optional[BaseVal] = None
    is_descriptor: bool = False


@dataclasses.dataclass(kw_only=True)
class ObjectVal(BaseVal, ABC):
    kind: str = dataclasses.field(init=False, default="object")
    size: int
    type_name: str
    attributes: Optional[List[Attribute]] = None


@dataclasses.dataclass()
class ModuleVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="module")
    name: str


@dataclasses.dataclass()
class TypeVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="type")
    name: str
    module: str | None


@dataclasses.dataclass()
class Variables:
    places: List[Place]
    values: List[BaseVal]


def get_str_default_load_content(val: str) -> str:
    count = min(len(val), STR_LOAD_CHAR_COUNT)
    return val[:count]


def make_value(val: Any) -> BaseVal:
    val_id = str(id(val))
    size = sys.getsizeof(val)
    if val is None:
        return NoneVal(id=val_id, size=size)
    elif inspect.ismodule(val):
        return ModuleVal(id=val_id, name=val.__name__)
    elif inspect.isclass(val):
        return TypeVal(
            id=val_id,
            name=val.__name__,
            module=val.__module__,
        )
    elif isinstance(val, bool):
        return BoolVal(id=val_id, size=size, value=val)
    elif isinstance(val, int):
        return IntVal(id=val_id, size=size, value=str(val))
    elif isinstance(val, float):
        return FloatVal(id=val_id, size=size, value=str(val))
    elif isinstance(val, complex):
        return ComplexVal(
            id=val_id,
            size=size,
            real_value=str(val.real),
            imaginary_value=str(val.imag),
        )
    elif isinstance(val, str):
        return DeferredStrVal(
            id=val_id,
            size=size,
            length=len(val),
            content=get_str_default_load_content(val),
        )
    elif isinstance(val, dict):
        return DeferredDictVal(id=val_id, size=size, pair_count=len(val))
    elif isinstance(val, list):
        return DeferredListVal(id=val_id, size=size, element_count=len(val))
    elif isinstance(val, tuple):
        return DeferredTupleVal(id=val_id, size=size, element_count=len(val))
    elif isinstance(val, set):
        return DeferredSetVal(id=val_id, size=size, element_count=len(val))
    elif isinstance(val, frozenset):
        return DeferredFrozenSetVal(
            id=val_id,
            size=size,
            element_count=len(val),
        )
    elif isinstance(val, range):
        return RangeVal(
            id=val_id,
            size=size,
            start=str(val.start),
            stop=str(val.stop),
            step=str(val.step),
        )
    elif inspect.isfunction(val) or inspect.ismethod(val):
        try:
            signature = inspect.signature(val)
            signature = signature.format(max_width=50)
        except Exception:
            signature = None

        return FunctionVal(
            id=val_id,
            name=val.__name__,
            qualified_name=val.__qualname__,
            module=val.__module__,
            signature=signature,
        )
    else:
        return ObjectVal(
            id=val_id,
            size=size,
            type_name=type(val).__name__,
        )


def get_frame_by_index(
    frame_index: FrameIndex, debugged_file_path: str
) -> inspect.FrameInfo:
    # get topmost debugged frame info
    stack = inspect.stack()
    topmost_debugged_frame = None
    for frame in stack:
        if frame.filename == debugged_file_path:
            topmost_debugged_frame = frame
            break
    if topmost_debugged_frame is None:
        raise Exception(f"Could not find frame for file {debugged_file_path}")

    # get the frame at frame_index relative to topmost_debugged_frame
    target_index = stack.index(topmost_debugged_frame) + frame_index
    if target_index < 0 or target_index >= len(stack):
        raise Exception(f"Frame index {frame_index} out of range.")
    return stack[target_index]


def check_type(value: Any, expected_types: Tuple[str, ...]) -> None:
    value_type = type(value).__name__
    if value_type not in expected_types:
        raise ValueError(
            f"Value {value} is of type {value_type}, expected one of {expected_types}."
        )


def validate_slicing_params(
    value: Any,
    start_index: int,
    count: int,
) -> int:
    collection_length = len(value)
    if not (
        (0 <= start_index < collection_length)
        or (start_index == collection_length and count == 0)
    ):
        raise ValueError(
            f"Start_index {start_index} out of range [0, {collection_length}] for {value}."
        )
    if start_index + count > collection_length:
        raise ValueError(
            f"Count {count} out of range. Collection {value} has length {collection_length}, "
            f"so maximum allowed count is {collection_length - start_index} for start_index {start_index}."
        )
    return collection_length


def get_argument_names(frame: inspect.FrameInfo) -> List[str]:
    argvalues = inspect.getargvalues(frame.frame)
    arg_names = list(argvalues.args)
    if argvalues.varargs:
        arg_names.append(argvalues.varargs)
    if argvalues.keywords:
        arg_names.append(argvalues.keywords)
    return arg_names


def get_variables(frame_index: FrameIndex, debugged_file_path: str) -> Variables:
    frame_info = get_frame_by_index(frame_index, debugged_file_path)
    arg_names = get_argument_names(frame_info)
    frame = frame_info.frame

    places = []
    values: Dict[PythonId, BaseVal] = {}

    for name, value in frame.f_locals.items():
        if name.startswith("__") and name.endswith("__"):
            # skip special variables
            continue
        if inspect.isfunction(value):
            if name not in arg_names and name == value.__name__:
                # skip local function definitions
                continue

        value_id = str(id(value))
        if value_id in values:
            value_repr = values[value_id]
        else:
            value_repr = make_value(value)
            IdMap.register(value_repr.id, value)

        # load one level of nested values
        if isinstance(value_repr, FlatCollectionVal) and value_repr.element_count > 0:
            elements = get_flat_collection_elements(
                collection_id=value_repr.id,
                start_index=0,
                element_count=min(value_repr.element_count, SEQUENCE_LOAD_ITEM_COUNT),
            )
            value_repr.elements = elements
        elif isinstance(value_repr, DeferredDictVal) and value_repr.pair_count > 0:
            pairs = get_dict_entries(
                dict_id=value_repr.id,
                start_index=0,
                pair_count=min(value_repr.pair_count, SEQUENCE_LOAD_ITEM_COUNT),
            )
            value_repr.pairs = pairs
        elif isinstance(value_repr, ObjectVal):
            value_repr = get_object(
                object_id=value_repr.id,
            )

        values[value_repr.id] = value_repr

        kind = "v"
        if name == RETURN_VALUES_DICT_NAME:
            kind = "r"
        elif name in arg_names:
            kind = "p"

        place = Place(name=name, id=value_repr.id, kind=kind)
        places.append(place)

    return Variables(places=places, values=list(values.values()))


def get_flat_collection_elements(
    collection_id: PythonId,
    start_index: int,
    element_count: int,
) -> List[BaseVal]:
    value = IdMap.get(collection_id)

    allowed_types = ("list", "tuple", "set", "frozenset")
    check_type(value, allowed_types)
    validate_slicing_params(value, start_index, element_count)

    elements = []
    for element in itertools.islice(value, start_index, start_index + element_count):

        value_repr = make_value(element)
        elements.append(value_repr)
        IdMap.register(value_repr.id, element)
    return elements


def get_dict_entries(
    dict_id: PythonId,
    start_index: int,
    pair_count: int,
) -> List[KeyValuePair]:
    value = IdMap.get(dict_id)
    check_type(value, ("dict",))
    validate_slicing_params(value, start_index, pair_count)

    entries = []
    for key, val in itertools.islice(
        value.items(), start_index, start_index + pair_count
    ):

        key_repr = make_value(key)
        value_repr = make_value(val)
        entries.append(KeyValuePair(key_repr, value_repr))
        IdMap.register(key_repr.id, key)
        IdMap.register(value_repr.id, val)
    return entries


def get_string_contents(
    str_id: PythonId,
    start_index: int,
    length: int,
) -> str:

    value = IdMap.get(str_id)

    check_type(value, ("str",))
    validate_slicing_params(value, start_index, length)

    return value[start_index : start_index + length]


def get_object(object_id: PythonId) -> ObjectVal:
    obj = IdMap.get(object_id)

    attributes = []

    for attr_name in dir(obj):
        if attr_name.startswith("__") and attr_name.endswith("__"):
            # skip special attributes
            continue
        try:
            # passive inspection to avoid resolving descriptors
            static_attr_value = inspect.getattr_static(obj, attr_name)
        except Exception:
            continue

        attr = Attribute(name=attr_name)

        if (
            inspect.isdatadescriptor(static_attr_value)
            or inspect.isgetsetdescriptor(static_attr_value)
            or inspect.ismemberdescriptor(static_attr_value)
        ):
            attr.is_descriptor = True

        else:
            # need to get the attribute value dynamically to check if it's a method
            attr_value = getattr(obj, attr_name)
            value_repr = make_value(attr_value)
            if inspect.ismethod(attr_value):
                continue
            else:
                attr.value = value_repr

            IdMap.register(value_repr.id, attr_value)

        attributes.append(attr)

    attributes.sort(key=lambda a: a.name.startswith("_"))

    return ObjectVal(
        id=object_id,
        size=sys.getsizeof(obj),
        type_name=type(obj).__name__,
        attributes=attributes,
    )


@dataclasses.dataclass(frozen=True)
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


@dataclasses.dataclass()
class Response:
    message: str = dataclasses.field(init=False)
    content: dataclasses.InitVar[Any]

    def __init__(self, content: Any) -> None:
        self.message = json.dumps(dataclasses.asdict(content))

    def __repr__(self) -> str:
        # Debugpy's evaluate returns Python repr() of the string result,
        # which by default could escape characters and break JSON parsing,
        # so the message is returned as is.
        return self.message


def try_run(fn: Callable) -> Response:
    try:
        result = fn()
        return Response(Result.make_ok(result))
    except BaseException as e:
        return Response(Result.make_error(str(e)))
