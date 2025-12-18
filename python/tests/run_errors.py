import sys


sys.path.append(".")

from python.flatted_refactor import api as ref
from python.flatted_refactor.errors import FlattedParseError, FlattedStringifyError


def main():
    # 非法 JSON
    try:
        ref.parse("not a json")
        print("ERROR: expected FlattedParseError for invalid JSON")
        raise SystemExit(1)
    except FlattedParseError:
        pass

    # 非法结构（根非 list）
    try:
        ref.parse("{}")
        print("ERROR: expected FlattedParseError for non-list root")
        raise SystemExit(1)
    except FlattedParseError:
        pass

    # stringify 正常性（不应抛出异常）
    try:
        _ = ref.stringify({"a": [1, 2, 3]})
    except FlattedStringifyError as e:
        print("ERROR: unexpected stringify failure", e)
        raise SystemExit(1)

    print("ERROR TESTS PASSED")


if __name__ == "__main__":
    main()

