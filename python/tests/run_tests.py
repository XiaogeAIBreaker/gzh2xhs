import json
import sys


sys.path.append(".")

from python.baseline import flatted_baseline as base
from python.flatted_refactor import api as ref


def assert_identity_list_self_ref(obj):
    assert isinstance(obj, list)
    assert obj[0] is obj


def assert_identity_dict_self_ref(obj):
    assert isinstance(obj, dict)
    assert obj["self"] is obj


def assert_mutual_ref(a, b):
    assert isinstance(a, list) and isinstance(b, list)
    assert a[0] is b
    assert b[0] is a


def test_round_trip_cases():
    # 1. 根为字符串
    s = "hello"
    s_json_base = base.stringify(s)
    s_json_ref = ref.stringify(s)
    assert json.loads(s_json_base) == json.loads(s_json_ref)
    assert base.parse(s_json_base) == ref.parse(s_json_ref) == s

    # 2. 自引用列表
    a = []
    a.append(a)
    a_json_base = base.stringify(a)
    a_json_ref = ref.stringify(a)
    a_rt_base = base.parse(a_json_base)
    a_rt_ref = ref.parse(a_json_ref)
    assert_identity_list_self_ref(a_rt_base)
    assert_identity_list_self_ref(a_rt_ref)

    # 3. 自引用字典
    d = {}
    d["self"] = d
    d_json_base = base.stringify(d)
    d_json_ref = ref.stringify(d)
    d_rt_base = base.parse(d_json_base)
    d_rt_ref = ref.parse(d_json_ref)
    assert_identity_dict_self_ref(d_rt_base)
    assert_identity_dict_self_ref(d_rt_ref)

    # 4. 互引用列表
    x = []
    y = []
    x.append(y)
    y.append(x)
    xy_json_base = base.stringify(x)
    xy_json_ref = ref.stringify(x)
    xy_rt_base = base.parse(xy_json_base)
    xy_rt_ref = ref.parse(xy_json_ref)
    # 从根恢复另一个列表
    b_base = xy_rt_base[0]
    b_ref = xy_rt_ref[0]
    assert_mutual_ref(xy_rt_base, b_base)
    assert_mutual_ref(xy_rt_ref, b_ref)

    # 5. 混合结构与字符串共享
    m1 = {"name": "n", "list": []}
    m2 = {"title": "n", "link": m1["list"]}
    m1["list"].append(m2)
    m_json_base = base.stringify(m1)
    m_json_ref = ref.stringify(m1)
    m_rt_base = base.parse(m_json_base)
    m_rt_ref = ref.parse(m_json_ref)
    # 验证共享字符串与结构引用
    assert m_rt_base["name"] == m_rt_base["list"][0]["title"]
    assert m_rt_ref["name"] == m_rt_ref["list"][0]["title"]
    assert m_rt_base["list"][0]["link"] is m_rt_base["list"]
    assert m_rt_ref["list"][0]["link"] is m_rt_ref["list"]


def main():
    try:
        test_round_trip_cases()
        print("ALL TESTS PASSED")
    except AssertionError as e:
        print("TEST FAILED:", e)
        raise


if __name__ == "__main__":
    main()

