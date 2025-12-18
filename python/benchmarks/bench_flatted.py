import sys
import timeit


sys.path.append(".")

from python.baseline import flatted_baseline as base
from python.flatted_refactor import api as ref


def case_self_ref_list():
    a = []
    a.append(a)
    return a


def case_mutual_lists():
    x = ["s"]
    y = ["s"]
    x.append(y)
    y.append(x)
    return x


def case_shared_strings(n=1000):
    names = ["name" for _ in range(n)]
    d = {"items": names}
    d["self"] = d
    return d


def bench_one(label, obj, number=1000):
    base_s = timeit.timeit(lambda: base.stringify(obj), number=number)
    ref_s = timeit.timeit(lambda: ref.stringify(obj), number=number)

    bj = base.stringify(obj)
    rj = ref.stringify(obj)
    base_p = timeit.timeit(lambda: base.parse(bj), number=number)
    ref_p = timeit.timeit(lambda: ref.parse(rj), number=number)

    print(f"{label}: stringify base={base_s:.6f}s, ref={ref_s:.6f}s; parse base={base_p:.6f}s, ref={ref_p:.6f}s")


def main():
    bench_one("self_ref_list", case_self_ref_list(), number=5000)
    bench_one("mutual_lists", case_mutual_lists(), number=3000)
    bench_one("shared_strings_1k", case_shared_strings(1000), number=100)
    print("BENCH DONE")


if __name__ == "__main__":
    main()

