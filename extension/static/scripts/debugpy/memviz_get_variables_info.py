import dataclasses
import json
from typing import Any, Callable, List, Optional, Tuple


@dataclasses.dataclass
class VariableInformation:
    name: str
    type: str
    value: str
    id: str


def get_frame_places(frame_index: int) -> List[VariableInformation]:
    return "test"


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
