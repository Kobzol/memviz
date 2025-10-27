from abc import ABC
import dataclasses
import json
import inspect
from typing import Any, Callable, Dict, List, Optional


PythonId = str


@dataclasses.dataclass(frozen=True)
class Place:
    name: str
    id: PythonId


@dataclasses.dataclass(frozen=True)
class BaseVal(ABC):
    size: int


@dataclasses.dataclass(frozen=True)
class DeferredVal(BaseVal, ABC):
    reference: str


@dataclasses.dataclass(frozen=True)
class NoneVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="none")


@dataclasses.dataclass(frozen=True)
class BoolVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="bool")
    value: bool


@dataclasses.dataclass(frozen=True)
class IntVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="int")
    value: str


@dataclasses.dataclass(frozen=True)
class FloatVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="float")
    value: str


@dataclasses.dataclass(frozen=True)
class ComplexVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="complex")
    real_value: str
    imaginary_value: str


@dataclasses.dataclass(frozen=True)
class DeferredStrVal(DeferredVal):
    kind: str = dataclasses.field(init=False, default="defStr")
    length: int


@dataclasses.dataclass(frozen=True)
class DeferredListVal(DeferredVal):
    kind: str = dataclasses.field(init=False, default="defList")
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredTupleVal(DeferredVal):
    kind: str = dataclasses.field(init=False, default="defTuple")
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredSetVal(DeferredVal):
    kind: str = dataclasses.field(init=False, default="defSet")
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredFrozenSetVal(DeferredVal):
    kind: str = dataclasses.field(init=False, default="defFrozenSet")
    element_count: int


@dataclasses.dataclass(frozen=True)
class DeferredDictVal(DeferredVal):
    kind: str = dataclasses.field(init=False, default="defDict")
    key_value_pair_count: int


@dataclasses.dataclass(frozen=True)
class KeyValuePair:
    key: BaseVal
    value: BaseVal


@dataclasses.dataclass(frozen=True)
class RangeVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="range")
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
class DeferredObjectVal(DeferredVal):
    kind: str = dataclasses.field(init=False, default="defObject")
    type_name: str


@dataclasses.dataclass(frozen=True)
class ObjectVal(DeferredObjectVal):
    kind: str = dataclasses.field(init=False, default="object")
    attributes: List[KeyValuePair] = dataclasses.field(default_factory=list)
    methods: List[str] = dataclasses.field(default_factory=list)


@dataclasses.dataclass
class Variables:
    places: List[Place]
    values: Dict[PythonId, BaseVal]


# TODO: find a better way to get the debugged frame
debugged_frame_offset: Optional[int] = None


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
    return getattr(val, "__sizeof__", lambda: 0)()


def make_value(val: Any, reference: str = None) -> BaseVal:
    size = get_size(val)
    if val is None:
        return NoneVal(size=size)
    elif isinstance(val, bool):
        return BoolVal(size=size, value=val)
    elif isinstance(val, int):
        return IntVal(size=size, value=str(val))
    elif isinstance(val, float):
        return FloatVal(size=size, value=str(val))
    elif isinstance(val, complex):
        return ComplexVal(
            size=size,
            real_value=str(val.real),
            imaginary_value=str(val.imag),
        )
    elif isinstance(val, str):
        return DeferredStrVal(
            size=size,
            reference=reference,
            length=len(val)
        )
    elif isinstance(val, dict):
        return DeferredDictVal(
            size=size,
            reference=reference,
            key_value_pair_count=len(val)
        )
    elif isinstance(val, list):
        return DeferredListVal(
            size=size,
            reference=reference,
            element_count=len(val)
        )
    elif isinstance(val, tuple):
        return DeferredTupleVal(
            size=size,
            reference=reference,
            element_count=len(val)
        )
    elif isinstance(val, set):
        return DeferredSetVal(
            size=size,
            reference=reference,
            element_count=len(val)
        )
    elif isinstance(val, frozenset):
        return DeferredFrozenSetVal(
            size=size,
            reference=reference,
            element_count=len(val),
        )
    elif isinstance(val, range):
        return RangeVal(
            size=size,
            start=str(val.start),
            stop=str(val.stop),
            step=str(val.step),
        )
    elif inspect.isfunction(val):
        return FunctionVal(
            size=size,
            name=val.__name__,
            qualified_name=val.__qualname__,
            module=val.__module__,
            signature=str(inspect.signature(val)) if hasattr(inspect, "signature") else None,
        )
    else:
        return DeferredObjectVal(
            size=size,
            reference=reference,
            type_name=type(val).__name__,
        )
    

def evaluate_expression(expression: str, frame_index: int) -> Any:
    stack = inspect.stack()
    frame_info = stack[frame_index + debugged_frame_offset + 1]
    return eval(expression, frame_info.frame.f_globals, frame_info.frame.f_locals)


def get_variables(frame_index: int) -> List[Variables]:
    stack = inspect.stack()
    frame_info = stack[frame_index + debugged_frame_offset]
    frame = frame_info.frame

    places = []
    values = {}

    for name, value in frame.f_locals.items():
        value_id = str(id(value))
        place = Place(
            name=name,
            id=value_id,
        )
        places.append(place)
        if value_id not in values:
            values[value_id] = make_value(value, reference=name)

    return Variables(places=places, values=values)


def get_collection_type_elements(reference: str, frame_index: int, start_index: int, element_count: int) -> List[BaseVal]:
    length = evaluate_expression(f"len({reference})", frame_index)
    if start_index < 0 or start_index >= length:
        raise Exception(f"start_index {start_index} out of range [0, {length}] for collection {reference}.")
    if start_index + element_count > length:
        raise Exception(f"element_count {element_count} out of range [0, {length - start_index}] for collection {reference}.")

    value = evaluate_expression(f"{reference}[{start_index}:{start_index + element_count}]", frame_index)
    assert isinstance(value, (list, tuple, set, frozenset))
    elements = []
    for i, element in enumerate(value):
        elements.append(make_value(element, reference=f"{reference}[{start_index + i}]"))
    return elements


def get_dict_entries(reference: str, frame_index: int, start_index: int, pair_count: int) -> List[KeyValuePair]:
    length = evaluate_expression(f"len({reference})", frame_index)

    if start_index < 0 or start_index >= length:
        raise Exception(f"start_index {start_index} out of range [0, {length}] for dict {reference}.")
    if start_index + pair_count > length:
        raise Exception(f"key_value_pair_count {pair_count} out of range [0, {length - start_index}] for dict {reference}.")

    value = evaluate_expression(reference, frame_index)
    assert isinstance(value, dict)

    items = list(value.items())[start_index:start_index + pair_count]
    key_value_pairs = []
    for i, (key, val) in enumerate(items):
        key_value_pairs.append(
            KeyValuePair(
                key=make_value(key, reference=f"{reference}.keys()[{start_index + i}]"),
                value=make_value(val, reference=f"{reference}[{repr(key)}]"),
            )
        )
    return key_value_pairs


def get_string_contents(reference: str, frame_index: int, start_index: int, length: int) -> str:
    str_length = evaluate_expression(f"len({reference})", frame_index)

    if start_index < 0 or start_index >= str_length:
        raise Exception(f"start_index {start_index} out of range [0, {str_length}] for string {reference}.")
    if start_index + length > str_length:
        raise Exception(f"length {length} out of range [0, {str_length - start_index}] for string {reference}.")

    str_value = evaluate_expression(f"{reference}[{start_index}:{start_index + length}]", frame_index)
    assert isinstance(str_value, str)
    return str_value


def get_object(reference: str, frame_index: int) -> ObjectVal:
    obj = evaluate_expression(reference, frame_index)
    assert obj is not None
    attributes = []
    methods = []
    for attr_name in dir(obj):
        attr_value = getattr(obj, attr_name)
        if inspect.ismethod(attr_value) or inspect.isfunction(attr_value):
            methods.append(attr_name)
        else:
            attributes.append(
                KeyValuePair(
                    key=make_value(attr_name, reference=f"{reference}.{attr_name}"),
                    value=make_value(attr_value, reference=f"{reference}.{attr_name}"),
                )
            )

    return ObjectVal(
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
        return dataclass_to_json(Result.make_ok(result))
    except BaseException as e:
        return dataclass_to_json(Result.make_error(str(e)))


def dataclass_to_json(value) -> str:
    return json.dumps(dataclasses.asdict(value))
