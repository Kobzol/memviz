import importlib.util
import os
import sys

module_name = "memviz_get_variables_info"
module_path = os.path.join(os.path.dirname(__file__), f"{module_name}.py")

spec = importlib.util.spec_from_file_location(module_name, module_path)
module = importlib.util.module_from_spec(spec)
sys.modules[module_name] = module
spec.loader.exec_module(module)
