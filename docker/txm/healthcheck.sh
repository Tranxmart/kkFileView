#!/bin/sh
# Copyright 2026 Tranxmart, Inc. All rights reserved.
set -eu

kk_context="${KK_CONTEXT_PATH:-/}"
curl --fail --silent --show-error --max-time 4 \
    "http://127.0.0.1:${KK_SERVER_PORT:-8012}${kk_context%/}/actuator/health" >/dev/null
