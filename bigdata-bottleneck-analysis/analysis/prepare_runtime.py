"""Work around Windows Spark .cmd paths containing spaces or ampersands."""
import os
import subprocess
import sys
import tempfile
from pathlib import Path


def prepare_runtime():
    import pyspark
    os.environ["SPARK_LOCAL_IP"] = "127.0.0.1"
    os.environ["PYSPARK_PYTHON"] = sys.executable
    if os.name != "nt":
        return
    java17 = Path(r"C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot")
    if java17.exists():
        os.environ["JAVA_HOME"] = str(java17)
    runtime = Path(tempfile.mkdtemp(prefix="day18-spark-"))
    # Directory junctions are links, not copies; the installed environment stays intact.
    for name, target in (("spark", Path(pyspark.__file__).parent), ("python", Path(sys.prefix))):
        link = runtime / name
        quote = lambda p: "'" + str(p).replace("'", "''") + "'"
        command = f"New-Item -ItemType Junction -Path {quote(link)} -Target {quote(target)} | Out-Null"
        subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command], check=True)
    os.environ["SPARK_HOME"] = str(runtime / "spark")
    os.environ["PYSPARK_PYTHON"] = str(runtime / "python/Scripts/python.exe")
