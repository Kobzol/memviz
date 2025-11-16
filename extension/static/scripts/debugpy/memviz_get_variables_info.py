from abc import ABC
import dataclasses
import json
import inspect
from types import FunctionType, ModuleType
from typing import Any, Callable, Dict, List, Optional, Tuple
from sys import getsizeof
from gc import get_referents


PythonId = str
FrameIndex = int
ValueAccessExpr = str


@dataclasses.dataclass(frozen=True)
class Place:
    name: str
    id: PythonId


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


@dataclasses.dataclass()
class DeferredStrVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="str")
    size: int
    length: int
    content: Dict[int, str] = dataclasses.field(default_factory=dict)


@dataclasses.dataclass()
class CollectionVal(BaseVal, ABC):
    element_count: int
    elements: Dict[int, BaseVal] = dataclasses.field(default_factory=dict, kw_only=True)


@dataclasses.dataclass()
class DeferredListVal(CollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="list")


@dataclasses.dataclass()
class DeferredTupleVal(CollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="tuple")


@dataclasses.dataclass()
class DeferredSetVal(CollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="set")


@dataclasses.dataclass()
class DeferredFrozenSetVal(CollectionVal):
    size: int
    kind: str = dataclasses.field(init=False, default="frozenset")


@dataclasses.dataclass()
class KeyValuePair:
    key: BaseVal
    value: BaseVal


@dataclasses.dataclass()
class DeferredDictVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="dict")
    size: int
    pair_count: int
    pairs: Dict[int, KeyValuePair] = dataclasses.field(default_factory=dict)


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
class ObjectVal(BaseVal, ABC):
    kind: str
    size: int
    type_name: str


@dataclasses.dataclass()
class DeferredObjectVal(ObjectVal):
    kind: str = dataclasses.field(init=False, default="deferred_object")


@dataclasses.dataclass()
class ResolvedObjectVal(ObjectVal):
    kind: str = dataclasses.field(init=False, default="object")
    attributes: Dict[str, BaseVal] = dataclasses.field(default_factory=dict)
    methods: Dict[str, FunctionVal] = dataclasses.field(default_factory=dict)
    data_descriptors: List[str] = dataclasses.field(default_factory=list)
    getset_descriptors: List[str] = dataclasses.field(default_factory=list)
    member_descriptors: List[str] = dataclasses.field(default_factory=list)


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


@dataclasses.dataclass(frozen=True)
class EvaluationContext:
    value_access_expr: ValueAccessExpr
    frame_info: inspect.FrameInfo


id_to_access_expr: Dict[Tuple[FrameIndex, PythonId], ValueAccessExpr] = {}


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
    elif inspect.ismodule(val):
        return ModuleVal(id=val_id, name=val.__name__)
    elif inspect.isclass(val):
        return TypeVal(
            id=val_id,
            name=val.__name__,
            module=val.__module__,
        )
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
        return DeferredStrVal(id=val_id, size=get_size(val), length=len(val))
    elif isinstance(val, dict):
        return DeferredDictVal(id=val_id, size=get_size(val), pair_count=len(val))
    elif isinstance(val, list):
        return DeferredListVal(id=val_id, size=get_size(val), element_count=len(val))
    elif isinstance(val, tuple):
        return DeferredTupleVal(id=val_id, size=get_size(val), element_count=len(val))
    elif isinstance(val, set):
        return DeferredSetVal(id=val_id, size=get_size(val), element_count=len(val))
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
            signature=(
                str(inspect.signature(val)) if hasattr(inspect, "signature") else None
            ),
        )
    else:
        return DeferredObjectVal(
            id=val_id,
            size=get_size(val),
            type_name=type(val).__name__,
        )


def get_frame_by_index(
    frame_index: FrameIndex, debugged_file_path: str
) -> inspect.FrameInfo:
    # get topmost debugged frame info
    stack = inspect.stack()
    topmost_debugged_frame = None
    for i, frame in enumerate(stack):
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


def evaluate_expression(expression: str, frame_info: inspect.FrameInfo) -> Any:
    return eval(expression, frame_info.frame.f_globals, frame_info.frame.f_locals)


def register_value_access_expr(
    frame_index: FrameIndex, python_id: PythonId, access_expr: str
) -> None:
    # only add if not already present to keep the first (likely shortest) expression
    if (frame_index, python_id) not in id_to_access_expr:
        id_to_access_expr[(frame_index, python_id)] = access_expr


def get_context(
    value_id: PythonId, frame_index: FrameIndex, debugged_file_path: str
) -> EvaluationContext:
    if (frame_index, value_id) not in id_to_access_expr:
        raise ValueError(
            f"Value with id {value_id} not found in saved values for frame {frame_index}."
        )
    access_expr = id_to_access_expr[(frame_index, value_id)]

    frame_info = get_frame_by_index(frame_index, debugged_file_path)

    return EvaluationContext(access_expr, frame_info)


def check_type(context: EvaluationContext, expected_types: Tuple[str, ...]) -> str:
    value_type = evaluate_expression(
        f"type({context.value_access_expr}).__name__", context.frame_info
    )
    if value_type not in expected_types:
        raise ValueError(
            f"Value {context.value_access_expr} is of type {value_type}, expected one of {expected_types}."
        )
    return value_type


def validate_slicing_params(
    context: EvaluationContext,
    start_index: int,
    count: int,
) -> int:
    collection_length = evaluate_expression(
        f"len({context.value_access_expr})", context.frame_info
    )
    if not (0 <= start_index < collection_length):
        raise ValueError(
            f"Start_index {start_index} out of range [0, {collection_length}] for {context.value_access_expr}."
        )
    if start_index + count > collection_length:
        raise ValueError(
            f"Count {count} out of range. Collection {context.value_access_expr} has length {collection_length}, "
            f"so maximum allowed count is {collection_length - start_index} for start_index {start_index}."
        )
    return collection_length


def get_variables(frame_index: FrameIndex, debugged_file_path: str) -> Variables:
    frame_info = get_frame_by_index(frame_index, debugged_file_path)
    if frame_info is None:
        raise ValueError(f"Could not find frame for file {debugged_file_path}")

    frame = frame_info.frame

    places = []
    values: Dict[PythonId, BaseVal] = {}

    for name, value in frame.f_locals.items():
        value_id = str(id(value))

        if value_id in values:
            value_repr = values[value_id]
        else:
            value_repr = make_value(value)
            register_value_access_expr(frame_index, value_repr.id, name)

        # load one level of nested values
        if isinstance(value_repr, CollectionVal) and value_repr.element_count > 0:
            elements = get_collection_elements(
                collection_id=value_repr.id,
                frame_index=frame_index,
                debugged_file_path=debugged_file_path,
                start_index=0,
                element_count=value_repr.element_count,
            )
            value_repr.elements = {i: elem for i, elem in enumerate(elements)}
        elif isinstance(value_repr, DeferredDictVal) and value_repr.pair_count > 0:
            pairs = get_dict_entries(
                dict_id=value_repr.id,
                frame_index=frame_index,
                debugged_file_path=debugged_file_path,
                start_index=0,
                pair_count=value_repr.pair_count,
            )
            value_repr.pairs = {i: pair for i, pair in enumerate(pairs)}
        elif isinstance(value_repr, DeferredStrVal) and value_repr.length > 0:
            content = get_string_contents(
                str_id=value_repr.id,
                frame_index=frame_index,
                debugged_file_path=debugged_file_path,
                start_index=0,
                length=value_repr.length,
            )
            value_repr.content = {i: ch for i, ch in enumerate(content)}

        elif isinstance(value_repr, DeferredObjectVal):
            value_repr = get_object(
                object_id=value_repr.id,
                frame_index=frame_index,
                debugged_file_path=debugged_file_path,
            )

        values[value_repr.id] = value_repr
        place = Place(
            name=name,
            id=value_repr.id,
        )
        places.append(place)

    return Variables(places=places, values=list(values.values()))


def get_collection_elements(
    collection_id: PythonId,
    frame_index: FrameIndex,
    debugged_file_path: str,
    start_index: int,
    element_count: int,
) -> List[BaseVal]:
    context = get_context(collection_id, frame_index, debugged_file_path)

    allowed_types = ("list", "tuple", "set", "frozenset")
    value_type = check_type(context, allowed_types)
    validate_slicing_params(context, start_index, element_count)

    value_access_expr = context.value_access_expr
    if value_type in ("set", "frozenset"):
        value_access_expr = f"tuple({context.value_access_expr})"

    value = evaluate_expression(
        f"{value_access_expr}[{start_index}:{start_index + element_count}]",
        context.frame_info,
    )

    elements = []
    for i, element in enumerate(value):
        element_access_expr = f"{value_access_expr}[{start_index + i}]"
        value_repr = make_value(element)
        elements.append(value_repr)
        register_value_access_expr(frame_index, value_repr.id, element_access_expr)
    return elements


def get_dict_entries(
    dict_id: PythonId,
    frame_index: FrameIndex,
    debugged_file_path: str,
    start_index: int,
    pair_count: int,
) -> List[KeyValuePair]:
    context = get_context(dict_id, frame_index, debugged_file_path)

    check_type(context, ("dict",))
    validate_slicing_params(context, start_index, pair_count)

    items = evaluate_expression(
        f"list({context.value_access_expr}.items())[{start_index}:{start_index + pair_count}]",
        context.frame_info,
    )

    entries = []
    for i, (key, val) in enumerate(items):
        key_repr = make_value(key)
        value_repr = make_value(val)
        entries.append(KeyValuePair(key_repr, value_repr))
        register_value_access_expr(
            frame_index,
            key_repr.id,
            f"list({context.value_access_expr}.keys())[{start_index + i}]",
        )
        register_value_access_expr(
            frame_index, value_repr.id, f"{context.value_access_expr}[{repr(key)}]"
        )
    return entries


def get_string_contents(
    str_id: PythonId,
    frame_index: FrameIndex,
    debugged_file_path: str,
    start_index: int,
    length: int,
) -> str:
    context = get_context(str_id, frame_index, debugged_file_path)

    check_type(context, ("str",))
    validate_slicing_params(context, start_index, length)

    return evaluate_expression(
        f"{context.value_access_expr}[{start_index}:{start_index + length}]",
        context.frame_info,
    )


def get_object(
    object_id: PythonId, frame_index: FrameIndex, debugged_file_path: str
) -> ResolvedObjectVal:
    context = get_context(object_id, frame_index, debugged_file_path)
    obj = evaluate_expression(context.value_access_expr, context.frame_info)

    if obj is None:
        raise ValueError(
            f"Object {context.value_access_expr} could not be resolved: got None"
        )

    attributes = {}
    methods = {}
    getset_descriptors = []
    member_descriptors = []
    data_descriptors = []

    for attr_name in dir(obj):
        try:
            # passive inspection to avoid resolving descriptors
            static_attr_value = inspect.getattr_static(obj, attr_name)
        except Exception:
            continue

        if inspect.isdatadescriptor(static_attr_value):
            data_descriptors.append(attr_name)
        elif inspect.isgetsetdescriptor(static_attr_value):
            getset_descriptors.append(attr_name)
        elif inspect.ismemberdescriptor(static_attr_value):
            member_descriptors.append(attr_name)
        else:
            # need to get the attribute value dynamically to check if it's a method
            attr_value = getattr(obj, attr_name)
            value_repr = make_value(attr_value)
            if inspect.ismethod(attr_value):
                assert isinstance(value_repr, FunctionVal)
                methods[attr_name] = value_repr
            else:
                attributes[attr_name] = value_repr

            register_value_access_expr(
                frame_index, value_repr.id, f"{context.value_access_expr}.{attr_name}"
            )

    return ResolvedObjectVal(
        id=object_id,
        size=get_size(obj),
        type_name=type(obj).__name__,
        attributes=attributes,
        methods=methods,
        data_descriptors=data_descriptors,
        getset_descriptors=getset_descriptors,
        member_descriptors=member_descriptors,
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


@dataclasses.dataclass(frozen=True)
class Response:
    message: str

    def __init__(self, content: dataclasses.dataclass) -> None:
        object.__setattr__(self, "message", json.dumps(dataclasses.asdict(content)))

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
