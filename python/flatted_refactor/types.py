from typing import Any, Dict, List, MutableMapping, MutableSequence, Set, Union


class StringWrapper:
    def __init__(self, value: str) -> None:
        self.value = value


class IndexRegistry:
    def __init__(self) -> None:
        self.input: List[Any] = []
        self.id_to_index: Dict[int, str] = {}
        self.str_to_index: Dict[str, str] = {}

    def index_of(self, value: Any) -> Union[str, Any]:
        if isinstance(value, str):
            idx = self.str_to_index.get(value)
            if idx is None:
                self.input.append(value)
                idx = str(len(self.input) - 1)
                self.str_to_index[value] = idx
            return idx

        if isinstance(value, (list, tuple, dict)):
            key = id(value)
            idx = self.id_to_index.get(key)
            if idx is None:
                self.input.append(value)
                idx = str(len(self.input) - 1)
                self.id_to_index[key] = idx
            return idx

        return value


def is_array(value: Any) -> bool:
    return isinstance(value, (list, tuple))


def is_object(value: Any) -> bool:
    return isinstance(value, dict)


def wrap(value: Any) -> Any:
    if isinstance(value, str):
        return StringWrapper(value)

    if is_array(value):
        seq = list(value)
        for i, v in enumerate(seq):
            seq[i] = wrap(v)
        return seq

    if is_object(value):
        out: Dict[str, Any] = {}
        for k, v in value.items():
            out[k] = wrap(v)
        return out

    return value


def resolve_refs(root: Any, input_list: List[Any]) -> Any:
    visited: Set[int] = set()

    def _loop(container: Union[MutableSequence[Any], MutableMapping[str, Any]]) -> Union[List[Any], Dict[str, Any]]:
        if is_array(container):
            for i in range(len(container)):
                v = container[i]
                if isinstance(v, StringWrapper):
                    target = input_list[int(v.value)]
                    container[i] = target
                    _ref(container, i, target)
            return container  # type: ignore[return-value]
        else:
            for k in list(container.keys()):
                v = container[k]
                if isinstance(v, StringWrapper):
                    target = input_list[int(v.value)]
                    container[k] = target
                    _ref(container, k, target)
            return container  # type: ignore[return-value]

    def _ref(parent: Any, key: Any, value: Any) -> None:
        if is_array(value):
            obj_id = id(value)
            if obj_id not in visited:
                visited.add(obj_id)
                _loop(value)  # type: ignore[arg-type]
        elif is_object(value):
            obj_id = id(value)
            if obj_id not in visited:
                visited.add(obj_id)
                _loop(value)  # type: ignore[arg-type]

    return _loop(root) if (is_array(root) or is_object(root)) else root

