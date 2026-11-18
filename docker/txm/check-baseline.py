#!/usr/bin/env python3
# Copyright 2026 Tranxmart, Inc. All rights reserved.
"""Verify the recorded upstream release is an ancestor and matches the app version."""
import json
import re
import subprocess
from pathlib import Path
from xml.etree import ElementTree

root = Path(__file__).resolve().parents[2]
baseline = json.loads((root / "docker/txm/upstream.json").read_text())
commit = baseline["commit"]
if not re.fullmatch(r"[0-9a-f]{40}", commit):
    raise SystemExit("upstream.json must pin a full upstream commit")
subprocess.run(["git", "merge-base", "--is-ancestor", commit, "HEAD"], cwd=root, check=True)
pom = ElementTree.parse(root / "pom.xml")
version = pom.findtext("{http://maven.apache.org/POM/4.0.0}version")
if version != baseline["version"] or baseline["tag"] != "v" + version:
    raise SystemExit("Update the upstream baseline and application version together")
print(f"Upstream baseline: {baseline['tag']} at {commit}; application {version}")
