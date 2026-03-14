import dataclasses
import inspect
import json

import pytest

import memviz_get_variables_info


@pytest.fixture(autouse=True)
def clean_id_map():
    """Fixture to clear the IdMap before and after each test."""
    memviz_get_variables_info.IdMap.clear()
    yield
    memviz_get_variables_info.IdMap.clear()


def unwrap_response(response: memviz_get_variables_info.Response):
    """Parse JSON response from try_run back to dictionary."""
    data = json.loads(response.message)
    assert data["ok"] is True, f"Operation failed: {data.get('error')}"
    return data["value"]


def unwrap_error(response: memviz_get_variables_info.Response):
    """Parse JSON response from try_run back into an error payload."""
    data = json.loads(response.message)
    assert data["ok"] is False
    return data["error"]


def get_variables_at_current_line(place_occurrence: int = 0):
    """Capture variables for the caller frame at the call site line."""
    caller = inspect.currentframe().f_back
    return dataclasses.asdict(
        memviz_get_variables_info.get_variables(
            caller.f_code.co_filename,
            caller.f_code.co_name,
            caller.f_lineno,
            place_occurrence,
        )
    )


def get_variables_at_place(
    debugged_file_path: str,
    frame_name: str,
    frame_line: int,
    place_occurrence: int = 0,
):
    return dataclasses.asdict(
        memviz_get_variables_info.get_variables(
            debugged_file_path, frame_name, frame_line, place_occurrence
        )
    )


def find_variable(variables_data, name: str):
    """Find variable by name from get_variables output."""
    places = variables_data["places"]
    values = variables_data["values"]

    place = next((p for p in places if p["name"] == name), None)
    assert place is not None, f"Variable '{name}' not found in stack frame."

    val = next((v for v in values if v["id"] == place["id"]), None)
    assert val is not None, f"Value for '{name}' (id: {place['id']}) not found."
    return val


def get_variable_map(variables_data):
    """Return variable_name -> value_dict mapping."""
    places = variables_data["places"]
    values = {v["id"]: v for v in variables_data["values"]}
    return {p["name"]: values[p["id"]] for p in places}


def test_scalar_types():
    """Test numeric, bool and none values."""
    # Numeric
    val_int = 1
    val_float = 1.234
    val_long = 123456789012345678901234567890123456789012345678901234567890
    val_inf = float("inf")
    val_nan = float("nan")
    val_complex = 1 + 2j

    # Bool
    val_bool = True

    # None
    val_none = None

    vars_map = get_variable_map(get_variables_at_current_line())

    # Numeric
    assert vars_map["val_int"]["kind"] == "int"
    assert vars_map["val_int"]["value"] == "1"

    assert vars_map["val_float"]["kind"] == "float"
    assert vars_map["val_float"]["value"] == "1.234"

    assert (
        vars_map["val_long"]["value"]
        == "123456789012345678901234567890123456789012345678901234567890"
    )
    assert vars_map["val_inf"]["value"] == "inf"
    assert vars_map["val_nan"]["value"] == "nan"

    assert vars_map["val_complex"]["kind"] == "complex"
    assert vars_map["val_complex"]["real_value"] == "1.0"
    assert vars_map["val_complex"]["imaginary_value"] == "2.0"

    # Bool
    assert vars_map["val_bool"]["kind"] == "bool"
    assert vars_map["val_bool"]["value"] is True

    # None
    assert vars_map["val_none"]["kind"] == "none"


def test_meta_types():
    """Test classes, functions, and ranges."""

    # Class
    class TestClass:
        pass

    val_class = TestClass

    # Range
    val_range = range(0, 10, 2)

    # Function
    def my_func(x):
        return x

    val_func = my_func

    vars_map = get_variable_map(get_variables_at_current_line())

    # Class
    assert vars_map["val_class"]["kind"] == "type"
    assert vars_map["val_class"]["name"] == "TestClass"

    # Range
    assert vars_map["val_range"]["kind"] == "range"
    assert vars_map["val_range"]["start"] == "0"
    assert vars_map["val_range"]["step"] == "2"

    # Function
    assert "my_func" not in vars_map
    assert vars_map["val_func"]["kind"] == "function"
    assert vars_map["val_func"]["name"] == "my_func"


def test_strings():
    """
    Test strings including empty string, special characters, unicode, multiline.
    """
    empty_str = ""
    special_str = 'Line\nNewline\tTab"Quotes"'
    unicode_str = "Hélľó 🚀 Wořld"
    multiline_str = """First
    Second"""

    vars_map = get_variable_map(get_variables_at_current_line())

    assert vars_map["empty_str"]["length"] == 0

    assert vars_map["special_str"]["content"] == 'Line\nNewline\tTab"Quotes"'

    assert "🚀" in vars_map["unicode_str"]["content"]
    assert vars_map["unicode_str"]["length"] == len("Hélľó 🚀 Wořld")

    assert "\n" in vars_map["multiline_str"]["content"]


def test_string_truncation_and_paging():
    """Test that large strings are truncated and can be paged by slicing."""
    limit = memviz_get_variables_info.STR_LOAD_CHAR_COUNT
    large_str = "0123456789" * ((limit // 5) + 2)

    data = get_variables_at_current_line()
    val_large = find_variable(data, "large_str")

    # Truncation
    if len(large_str) > limit:
        assert len(val_large["content"]) == limit
        assert val_large["length"] == len(large_str)

    # Slicing
    str_id = val_large["id"]
    str_slice = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_string_contents(str_id, 3, 3)
    )
    content = unwrap_response(str_slice)
    assert content == "345"


def test_collection_types():
    """Test tuples, sets, and frozensets."""
    val_tuple = (1, 2)
    val_set = {10, 20}
    val_frozenset = frozenset([30, 40])

    vars_map = get_variable_map(get_variables_at_current_line())

    assert vars_map["val_tuple"]["kind"] == "tuple"
    assert vars_map["val_tuple"]["element_count"] == 2

    assert vars_map["val_set"]["kind"] == "set"
    assert len(vars_map["val_set"]["elements"]) == 2

    assert vars_map["val_frozenset"]["kind"] == "frozenset"


def test_collection_deferred_loading():
    """Test lazy loading logic for collections."""
    my_list = list(range(20))
    my_set = set(my_list)

    # List
    data = get_variables_at_current_line()
    list_val = find_variable(data, "my_list")

    # Initial eager load check
    assert list_val["element_count"] == 20
    assert len(list_val["elements"]) == min(
        20, memviz_get_variables_info.SEQUENCE_LOAD_ITEM_COUNT
    )

    # Lazy loading check
    list_id = list_val["id"]
    slice_resp = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_flat_collection_elements(list_id, 15, 5)
    )
    slice_data = unwrap_response(slice_resp)

    assert len(slice_data) == 5
    assert slice_data[0]["value"] == "15"
    assert slice_data[-1]["value"] == "19"

    # Set
    set_val = find_variable(data, "my_set")

    # Initial eager load check
    assert set_val["element_count"] == 20
    eager_elements = set_val["elements"]
    eager_count = min(20, memviz_get_variables_info.SEQUENCE_LOAD_ITEM_COUNT)
    assert len(eager_elements) == eager_count

    # Lazy loading check
    set_id = set_val["id"]
    set_slice = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_flat_collection_elements(
            set_id, 0, eager_count
        )
    )
    lazy_elements_1 = unwrap_response(set_slice)

    assert eager_elements == lazy_elements_1

    # Requesting the same range again should yield the same results
    set_slice = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_flat_collection_elements(
            set_id, 0, eager_count
        )
    )
    lazy_elements_2 = unwrap_response(set_slice)

    assert lazy_elements_1 == lazy_elements_2


def test_dictionary_lazy_loading():
    """Test lazy loading for dictionaries."""
    large_dict = {f"key_{i}": i for i in range(20)}

    data = get_variables_at_current_line()
    val_dict = find_variable(data, "large_dict")

    assert val_dict["kind"] == "dict"
    assert val_dict["pair_count"] == 20
    assert len(val_dict["pairs"]) == memviz_get_variables_info.SEQUENCE_LOAD_ITEM_COUNT

    dict_id = val_dict["id"]
    slice = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_dict_entries(dict_id, 15, 5)
    )
    entries = unwrap_response(slice)

    assert len(entries) == 5
    assert entries[-1]["value"]["value"] == "19"


def test_object_inspection_and_descriptors():
    """Test objects, attribute visibility, and descriptors."""

    class Person:
        def __init__(self, name, age):
            self.name = name
            self.age = age
            self._executed = False

        @property
        def is_adult(self):
            self._executed = True
            return self.age >= 18

    p = Person("Anna", 40)

    data = get_variables_at_current_line()
    obj_val = find_variable(data, "p")

    assert obj_val["kind"] == "object"
    assert obj_val["type_name"] == "Person"

    attrs = {a["name"]: a for a in obj_val["attributes"]}

    assert "name" in attrs
    assert "age" in attrs

    # Descriptor check
    assert attrs["is_adult"]["is_descriptor"] is True
    assert attrs["is_adult"]["value"] is None
    # Side effect check
    assert p._executed is False


def test_object_lazy_attribute_loading():
    """Test that object attributes in nested structures are loaded lazily."""

    class TestClass:
        def __init__(self):
            self.numbers = [1, 2, 3]

    nested_obj = [TestClass()]

    data = get_variables_at_current_line()
    nested_val = find_variable(data, "nested_obj")

    # Verify eager loading stopped at the list
    obj_ref = nested_val["elements"][0]
    assert obj_ref["kind"] == "object"
    assert obj_ref["attributes"] is None

    # Load attributes
    obj_id = obj_ref["id"]
    resp_attrs = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_object(obj_id)
    )
    obj_expanded = unwrap_response(resp_attrs)

    attrs = {a["name"]: a for a in obj_expanded["attributes"]}
    assert "numbers" in attrs
    assert attrs["numbers"]["value"]["kind"] == "list"


def test_identity_and_circular_refs():
    """Test circular references and shared object identity."""
    # Circular
    a = {}
    b = {}
    a["b"] = b
    b["a"] = a

    # Shared
    shared_list = [1, 2]
    alias_list = shared_list

    vars_map = get_variable_map(get_variables_at_current_line())

    # Circular check
    val_a = vars_map["a"]
    val_b = vars_map["b"]
    b_ref_inside_a = val_a["pairs"][0]["value"]
    assert b_ref_inside_a["id"] == val_b["id"]

    # Shared check
    val_shared = vars_map["shared_list"]
    val_alias = vars_map["alias_list"]
    assert val_shared["id"] == val_alias["id"]


def test_scoping_rules():
    """Test that dunder variables are hidden and arguments are marked correctly."""

    def scoped_function(arg1, arg2):
        local_var = "local"
        __dunder__ = "hidden"
        return get_variables_at_current_line()

    data = scoped_function("val1", "val2")
    vars_map = get_variable_map(data)
    places = data["places"]

    assert "__dunder__" not in vars_map
    assert "local_var" in vars_map

    p_arg = next(p for p in places if p["name"] == "arg1")
    p_local = next(p for p in places if p["name"] == "local_var")
    assert p_arg["kind"] == "p"
    assert p_local["kind"] == "v"


def test_nested_frames():
    """Test inspecting variables in multiple nested frames."""
    level_name = "outer"
    unique_outer = 999

    def middle(outer_line):
        level_name = "middle"
        unique_middle = 555
        middle_line_before_call = inspect.currentframe().f_lineno + 1
        inner(middle_line_before_call, outer_line)

    def inner(middle_line, outer_line):
        level_name = "inner"
        unique_inner = 111

        inner_data = get_variables_at_current_line()
        map_inner = get_variable_map(inner_data)
        assert map_inner["level_name"]["content"] == "inner"

        mid_data = get_variables_at_place(__file__, "middle", middle_line, 0)
        map_mid = get_variable_map(mid_data)
        assert map_mid["level_name"]["content"] == "middle"
        assert "unique_inner" not in map_mid
        assert map_mid["unique_middle"]["value"] == "555"

        outer_data = get_variables_at_place(
            __file__, "test_nested_frames", outer_line, 0
        )
        map_outer = get_variable_map(outer_data)
        assert map_outer["level_name"]["content"] == "outer"
        assert map_outer["unique_outer"]["value"] == "999"

    outer_line_before_call = inspect.currentframe().f_lineno + 1
    middle(outer_line_before_call)


def test_error_handling():
    """Test invalid IDs and out-of-bounds access."""
    # Invalid ID
    resp_fail = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_flat_collection_elements(
            "invalid_id", 0, 10
        )
    )
    assert "not found" in unwrap_error(resp_fail)

    # Out of bounds
    memviz_get_variables_info.IdMap.register("dummy_id", [1, 2, 3])
    resp_bounds = memviz_get_variables_info.try_run(
        lambda: memviz_get_variables_info.get_flat_collection_elements(
            "dummy_id", 100, 5
        )
    )
    assert "out of range" in unwrap_error(resp_bounds)
