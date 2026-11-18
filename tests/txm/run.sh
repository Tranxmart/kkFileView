#!/bin/sh
# Copyright 2026 Tranxmart, Inc. All rights reserved.
set -eu
/checks/venv/bin/python generate-fixtures.py
python3 -m http.server 18080 --bind 0.0.0.0 --directory /tmp/fixtures &
fixture_pid=$!
trap 'kill "$fixture_pid" 2>/dev/null || true' EXIT
./node_modules/.bin/playwright test --config=playwright.config.ts
