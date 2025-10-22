#!/bin/bash

RESOURCE_HOME="${FOUNDRY_HOME:-$HOME}"
log "Resource home: $RESOURCE_HOME"

if [[ -e /data/Data/modules/terpsichore/server/terpsichore_server_v13.mjs ]]; then
  log "Applying Terpsichore patch..."
  cp /data/Data/modules/terpsichore/server/terpsichore_server_v13.mjs $RESOURCE_HOME/resources/app
  sed -i 's$  init.default$  await init.default$' $RESOURCE_HOME/resources/app/main.mjs
  sed -i 's$  \});$  });\n  await (await import("./terpsichore_server_v13.mjs")).Terpsichore.init();$' $RESOURCE_HOME/resources/app/main.mjs
else
  log "Unable to find Terpsichore patch."
fi
