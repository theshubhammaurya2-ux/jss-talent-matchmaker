"""Fallback test runner if pytest isn't installed:  python run_tests.py"""
import importlib, sys, traceback
sys.path.insert(0, ".")
failed = 0
for mod in ["tests.test_matcher", "tests.test_real_samples"]:
    m = importlib.import_module(mod)
    for n in dir(m):
        if n.startswith("test_"):
            try:
                getattr(m, n)(); print("PASS", n)
            except Exception:
                failed += 1; print("FAIL", n); traceback.print_exc()
print("\nAll passed" if not failed else f"\n{failed} failed")
