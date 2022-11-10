#!/usr/bin/env bash

set -exuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"/../../..

parallel_run() {
  ./dev/ci/parallel_run.sh "$@"
}

echo "--- pnpm root"
# mutex is necessary since frontend and the management-console can
# run concurrent "pnpm" installs
# TODO: This is no longer needed since the management console was removed.
./dev/ci/pnpm-install-with-retry.sh

MAYBE_TIME_PREFIX=""
if [[ "${CI_DEBUG_PROFILE:-"false"}" == "true" ]]; then
  MAYBE_TIME_PREFIX="env time -v"
fi

build_browser() {
  echo "--- pnpm browser"
  (cd client/browser && TARGETS=phabricator eval "${MAYBE_TIME_PREFIX} pnpm build")
}

build_web() {
  echo "--- pnpm web"
  NODE_ENV=production eval "${MAYBE_TIME_PREFIX} pnpm build-web --color"
}

export -f build_browser
export -f build_web

echo "--- (enterprise) build browser and web concurrently"
parallel_run ::: build_browser build_web

echo "--- (enterprise) generate"
go run ./dev/sg generate
