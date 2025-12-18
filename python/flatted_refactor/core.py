from typing import Any, Dict, List, Union

from .types import IndexRegistry, StringWrapper, is_array, is_object, resolve_refs, wrap


def transform(registry: IndexRegistry, value: Any) -> Any:
    if is_array(value):
        out: List[Any] = []
        for v in value:
            out.append(registry.index_of(v))
        return out

    if is_object(value):
        out: Dict[str, Any] = {}
        for k, v in value.items():
            out[k] = registry.index_of(v)
        return out

    return value


def build_output(value: Any) -> List[Any]:
    registry = IndexRegistry()
    output: List[Any] = []
    # seed root
    i = int(registry.index_of(value))
    while i < len(registry.input):
        output.append(transform(registry, registry.input[i]))
        i += 1
    return output


def parse_from_json_struct(json_struct: List[Any]) -> Union[Dict[str, Any], List[Any], str, Any]:
    wrapped: List[Any] = [wrap(v) for v in json_struct]
    input_list: List[Any] = [w.value if isinstance(w, StringWrapper) else w for w in wrapped]
    root = input_list[0]

    if is_array(root):
        return resolve_refs(root, input_list)
    if is_object(root):
        return resolve_refs(root, input_list)
    return root

