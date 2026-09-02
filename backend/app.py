"""
Legacy entry point — kept for backwards compatibility.

The application has been refactored into the `app/` package.
Please use `run.py` as the new entry point:

    python run.py

This file simply delegates to run.py so existing scripts / IDE launch
configurations that reference app.py continue to work.
"""
import runpy

runpy.run_path("run.py", run_name="__main__")
