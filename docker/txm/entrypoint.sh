#!/bin/sh
# Copyright 2026 Tranxmart, Inc. All rights reserved.
set -eu

mkdir -p /var/cache/kkfileview/home "${KK_FILE_DIR:-/var/cache/kkfileview/previews}"
exec java -Dfile.encoding=UTF-8 \
    -Duser.home=/var/cache/kkfileview/home \
    -Dspring.config.location=/opt/kkfileview/config/application.properties \
    -jar /opt/kkfileview/bin/kkfileview.jar "$@"
