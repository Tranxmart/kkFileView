# Copyright 2026 Tranxmart, Inc. All rights reserved.
FROM mcr.microsoft.com/playwright:v1.58.2-noble@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /checks
COPY tests/e2e/package.json tests/e2e/package-lock.json ./
RUN npm ci --ignore-scripts
COPY tests/e2e/requirements.txt ./
RUN python3 -m venv /checks/venv \
    && /checks/venv/bin/pip install --no-cache-dir -r requirements.txt
COPY tests/txm/ ./
ENTRYPOINT ["/bin/sh", "/checks/run.sh"]
