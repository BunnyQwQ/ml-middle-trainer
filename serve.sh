#!/bin/sh
# Serves a built copy of the trainer. Needs Node 20+.
exec node "$(dirname "$0")/serve.mjs" "$(dirname "$0")/dist" 4173
