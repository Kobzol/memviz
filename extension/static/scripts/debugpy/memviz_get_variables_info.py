from abc import ABC
import dataclasses
import json
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
class ObjectVal(BaseVal):
    kind: str = dataclasses.field(init=False, default="object")
    attributes: List[KeyValuePair] = dataclasses.field(default_factory=list)
    methods: List[str] = dataclasses.field(default_factory=list)


@dataclasses.dataclass
class Variables:
    places: List[Place]
    values: Dict[PythonId, BaseVal]


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
