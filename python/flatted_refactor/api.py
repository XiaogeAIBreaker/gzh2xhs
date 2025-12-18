from typing import Any, Union
import json

from .core import build_output, parse_from_json_struct
from .errors import FlattedParseError, FlattedStringifyError


def parse(value: str, *args: Any, **kwargs: Any) -> Union[dict, list, str, Any]:
    """将 Flatted JSON 文本解析为含循环引用的原始结构。

    Args:
        value: Flatted JSON 字符串。
        *args: 传递给 `json.loads` 的位置参数。
        **kwargs: 传递给 `json.loads` 的关键字参数。

    Returns:
        原始结构（dict/list/str/任意）

    Raises:
        FlattedParseError: 当 JSON 解析失败或结构非法时。
    """
    try:
        json_struct = json.loads(value, *args, **kwargs)
    except Exception as exc:
        raise FlattedParseError(str(exc)) from exc

    if not isinstance(json_struct, list):
        # Flatted 约定输出为数组结构
        raise FlattedParseError("Invalid flatted JSON structure: root must be list")

    try:
        return parse_from_json_struct(json_struct)
    except Exception as exc:
        raise FlattedParseError(str(exc)) from exc


def stringify(value: Any, *args: Any, **kwargs: Any) -> str:
    """将含循环引用的结构序列化为 Flatted JSON 文本。

    Args:
        value: 原始结构（dict/list/str/任意）。
        *args: 传递给 `json.dumps` 的位置参数。
        **kwargs: 传递给 `json.dumps` 的关键字参数。

    Returns:
        Flatted JSON 字符串。

    Raises:
        FlattedStringifyError: 当 JSON 序列化失败时。
    """
    try:
        output = build_output(value)
        return json.dumps(output, *args, **kwargs)
    except Exception as exc:
        raise FlattedStringifyError(str(exc)) from exc

