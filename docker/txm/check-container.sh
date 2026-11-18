#!/bin/sh
# Copyright 2026 Tranxmart, Inc. All rights reserved.
set -eu
cd "$(dirname "$0")/../.."
mkdir -p .artifacts/txm
txm_test_project="kkfileview-checks-$$"
compose() {
    docker compose --project-name "$txm_test_project" --file docker/txm/compose.test.yml "$@"
}
cleanup() {
    txm_check_status=$?
    trap - EXIT
    compose logs --no-color > .artifacts/txm/container.log 2>&1 || true
    compose down --volumes --remove-orphans || true
    exit "$txm_check_status"
}
trap cleanup EXIT
compose up --detach --wait --wait-timeout 180 viewer
compose exec -T viewer sh -ec '
    test "$(id -u)" = 10001
    test ! -w /opt/kkfileview/bin/kkfileview.jar
    touch /var/cache/kkfileview/.write-probe
    rm /var/cache/kkfileview/.write-probe
    fc-match -f "%{family}\n" ":lang=zh-cn" | grep -q "Noto Sans CJK"
'
compose run --build --rm --use-aliases checks
