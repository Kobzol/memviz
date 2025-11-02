from abc import ABC
import dataclasses
import json
import inspect
from types import FunctionType, ModuleType
from typing import Any, Callable, Dict, List, Optional
import base64
from sys import getsizeof
from gc import get_referents


PythonId = str


@dataclasses.dataclass(frozen=True)
class Place:
    name: str
    id: PythonId


@dataclasses.dataclass(frozen=True)
class BaseVal(ABC):
    id: PythonId

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, BaseVal):
            return NotImplemented
        return self.id == other.id


@dataclasses.dataclass(frozen=True)
class NoneVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="none")
    size: int


@dataclasses.dataclass(frozen=True)
class BoolVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="bool")
    size: int
    value: bool


@dataclasses.dataclass(frozen=True)
class IntVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="int")
    size: int
    value: str


@dataclasses.dataclass(frozen=True)
class FloatVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="float")
    size: int
    value: str


@dataclasses.dataclass(frozen=True)
class ComplexVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="complex")
    size: int
    real_value: str
    imaginary_value: str


@dataclasses.dataclass(frozen=True)
class DeferredStrVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="defStr")
    size: int
    length: int


@dataclasses.dataclass(frozen=True)
class DeferredListVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="defList")
    size: int
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredTupleVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="defTuple")
    size: int
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredSetVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="defSet")
    size: int
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredFrozenSetVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="defFrozenSet")
    size: int
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredDictVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="defDict")
    size: int
    key_value_pair_count: int


@dataclasses.dataclass(frozen=True)
class KeyValuePair:
    key: BaseVal
    value: BaseVal


@dataclasses.dataclass(frozen=True)
class RangeVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="range")
    size: int
    start: str
    stop: str
    step: str


@dataclasses.dataclass(frozen=True)
class FunctionVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="function")
    name: str
    qualified_name: str
    module: str | None
    signature: str | None


@dataclasses.dataclass(frozen=True)
class DeferredObjectVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="defObject")
    size: int
    type_name: str


@dataclasses.dataclass(frozen=True)
class ObjectVal(DeferredObjectVal):
    kind: str = dataclasses.field(init=False, default="object")
    size: int
    attributes: Dict[str, BaseVal] = dataclasses.field(default_factory=dict)
    methods: Dict[str, FunctionVal] = dataclasses.field(default_factory=dict)


@dataclasses.dataclass
class Variables:
    places: List[Place]
    values: List[BaseVal]


# TODO: find a better way to get the debugged frame
debugged_frame_offset: Optional[int] = None
id_to_reference: Dict[PythonId, str] = {}


def configure(top_frame_file: str) -> None:
    global debugged_frame_offset
    stack = inspect.stack()
    for i, frame in enumerate(stack):
        if frame.filename == top_frame_file:
            debugged_frame_offset = i
            break
    if debugged_frame_offset is None:
        raise Exception(f"Frame file '{top_frame_file}' not found.")


def get_size(val: Any) -> int:
    ids_seen = set()

    def sizeof_inner(v: Any) -> int:
        if id(v) in ids_seen or isinstance(v, (type, ModuleType, FunctionType)):
            return 0
        ids_seen.add(id(v))
        size = getsizeof(v)
        for ref in get_referents(v):
            size += sizeof_inner(ref)
        return size

    return sizeof_inner(val)


def make_value(val: Any) -> BaseVal:
    val_id = str(id(val))
    if val is None:
        return NoneVal(id=val_id, size=get_size(val))
    elif isinstance(val, bool):
        return BoolVal(id=val_id, size=get_size(val), value=val)
    elif isinstance(val, int):
        return IntVal(id=val_id, size=get_size(val), value=str(val))
    elif isinstance(val, float):
        return FloatVal(id=val_id, size=get_size(val), value=str(val))
    elif isinstance(val, complex):
        return ComplexVal(
            id=val_id,
            size=get_size(val),
            real_value=str(val.real),
            imaginary_value=str(val.imag),
        )
    elif isinstance(val, str):
        return DeferredStrVal(
            id=val_id,
            size=get_size(val),
            length=len(val)
        )
    elif isinstance(val, dict):
        return DeferredDictVal(
            id=val_id,
            size=get_size(val),
            key_value_pair_count=len(val)
        )
    elif isinstance(val, list):
        return DeferredListVal(
            id=val_id,
            size=get_size(val),
            element_count=len(val)
        )
    elif isinstance(val, tuple):
        return DeferredTupleVal(
            id=val_id,
            size=get_size(val),
            element_count=len(val)
        )
    elif isinstance(val, set):
        return DeferredSetVal(
            id=val_id,
            size=get_size(val),
            element_count=len(val)
        )
    elif isinstance(val, frozenset):
        return DeferredFrozenSetVal(
            id=val_id,
            size=get_size(val),
            element_count=len(val),
        )
    elif isinstance(val, range):
        return RangeVal(
            id=val_id,
            size=get_size(val),
            start=str(val.start),
            stop=str(val.stop),
            step=str(val.step),
        )
    elif inspect.isfunction(val) or inspect.ismethod(val):
        return FunctionVal(
            id=val_id,
            name=val.__name__,
            qualified_name=val.__qualname__,
            module=val.__module__,
            signature=str(inspect.signature(val)) if hasattr(inspect, "signature") else None,
        )
    else:
        return DeferredObjectVal(
            id=val_id,
            size=get_size(val),
            type_name=type(val).__name__,
        )
    

def evaluate_expression(expression: str, frame_index: int) -> Any:
    stack = inspect.stack()
    frame_info = stack[frame_index + debugged_frame_offset + 1]
    return eval(expression, frame_info.frame.f_globals, frame_info.frame.f_locals)


def add_to_id_to_reference(python_id: PythonId, reference: str) -> None:
    # only add if not already present to keep the first (likely shortest) reference
    if python_id not in id_to_reference:
        id_to_reference[python_id] = reference


def get_variables(frame_index: int) -> List[Variables]:
    stack = inspect.stack()
    frame_info = stack[frame_index + debugged_frame_offset]
    frame = frame_info.frame

    places = []
    values = set()

    for name, value in frame.f_locals.items():
        value_repr = make_value(value)
        place = Place(
            name=name,
            id=value_repr.id,
        )
        places.append(place)
        values.add(value_repr)
        add_to_id_to_reference(value_repr.id, name)

    return Variables(places=places, values=list(values))
    

def get_collection_type_elements(collection_id: PythonId, frame_index: int, start_index: int, element_count: int) -> List[BaseVal]:
    if collection_id not in id_to_reference:
        raise Exception(f"Collection with id {collection_id} not found.")
    reference = id_to_reference[collection_id]

    value_type = evaluate_expression(f"type({reference}).__name__", frame_index)
    if value_type not in ("list", "tuple", "set", "frozenset"):
        raise Exception(f"Value with id {collection_id} is of type {value_type}, not a collection type.")
    length = evaluate_expression(f"len({reference})", frame_index)
    if start_index < 0 or start_index >= length:
        raise Exception(f"Start_index {start_index} out of range [0, {length}] for collection {reference}.")
    if start_index + element_count > length:
        raise Exception(f"Element count {element_count} out of range [0, {length - start_index}] for collection {reference}.")

    evaluation_reference = reference
    collection_type = evaluate_expression(f"type({reference}).__name__", frame_index)
    if collection_type in ("set", "frozenset"):
        evaluation_reference = f'tuple({reference})'

    value = evaluate_expression(f"{evaluation_reference}[{start_index}:{start_index + element_count}]", frame_index)
    assert isinstance(value, (list, tuple, set, frozenset))
    elements = []
    for i, element in enumerate(value):
        reference = f"{evaluation_reference}[{start_index + i}]"
        value_repr = make_value(element)
        elements.append(value_repr)
        add_to_id_to_reference(value_repr.id, reference)
    return elements


def get_dict_entries(dict_id: PythonId, frame_index: int, start_index: int, pair_count: int) -> List[KeyValuePair]:
    if dict_id not in id_to_reference:
        raise Exception(f"Dict with id {dict_id} not found.")
    reference = id_to_reference[dict_id]

    value_type = evaluate_expression(f"type({reference}).__name__", frame_index)
    if value_type != "dict":
        raise Exception(f"Value with id {dict_id} is of type {value_type}, not a dict.")
    
    length = evaluate_expression(f"len({reference})", frame_index)
    if start_index < 0 or start_index >= length:
        raise Exception(f"Start_index {start_index} out of range [0, {length}] for dict {reference}.")
    if start_index + pair_count > length:
        raise Exception(f"Key value pair count {pair_count} out of range [0, {length - start_index}] for dict {reference}.")

    value = evaluate_expression(reference, frame_index)
    assert isinstance(value, dict)

    items = list(value.items())[start_index:start_index + pair_count]
    key_value_pairs = []
    for i, (key, value) in enumerate(items):
        key_repr = make_value(key)
        value_repr = make_value(value)
        key_value_pairs.append(KeyValuePair(key_repr, value_repr))
        add_to_id_to_reference(key_repr.id, f"list({reference}.keys())[{start_index + i}]")
        add_to_id_to_reference(value_repr.id, f"{reference}[{repr(key)}]")
    
    return key_value_pairs


def get_string_contents(str_id: PythonId, frame_index: int, start_index: int, length: int) -> str:
    if str_id not in id_to_reference:
        raise Exception(f"string with id {str_id} not found.")
    reference = id_to_reference[str_id]

    value_type = evaluate_expression(f"type({reference}).__name__", frame_index)
    if value_type != "str":
        raise Exception(f"Value with id {str_id} is of type {value_type}, not a string.")

    str_length = evaluate_expression(f"len({reference})", frame_index)
    if start_index < 0 or start_index >= str_length:
        raise Exception(f"start_index {start_index} out of range [0, {str_length}] for string {reference}.")
    if start_index + length > str_length:
        raise Exception(f"length {length} out of range [0, {str_length - start_index}] for string {reference}.")

    str_value = evaluate_expression(f"{reference}[{start_index}:{start_index + length}]", frame_index)
    assert isinstance(str_value, str)
    return str_value


def get_object(object_id: PythonId, frame_index: int) -> ObjectVal:
    if object_id not in id_to_reference:
        raise Exception(f"object with id {object_id} not found.")
    reference = id_to_reference[object_id]

    obj = evaluate_expression(reference, frame_index)
    assert obj is not None
    attributes = {}
    methods = {}
    for attr_name in dir(obj):
        attr_value = getattr(obj, attr_name)
        value_repr = make_value(attr_value)
        if inspect.ismethod(attr_value):
            methods[attr_name] = value_repr
        else:
            attributes[attr_name] = value_repr
        add_to_id_to_reference(value_repr.id, f"{reference}.{attr_name}")
        
    return ObjectVal(
        id=object_id,
        size=get_size(obj),
        type_name=type(obj).__name__,
        attributes=attributes,
        methods=methods,
    )


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


def try_run(fn: Callable) -> str:
    try:
        result = fn()
        return encode_dataclass(Result.make_ok(result))
    except BaseException as e:
        return encode_dataclass(Result.make_error(str(e)))


def dataclass_to_json(value) -> str:
    return json.dumps(dataclasses.asdict(value))


def encode_dataclass(value) -> str:
    json_str = dataclass_to_json(value)
    return base64.b64encode(json_str.encode("utf-8")).decode("utf-8")
