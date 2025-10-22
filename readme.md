## Terpsichore - FoundryVTT music downloader

This is a music downloader for FoundryVTT using yt-dlp under the hood.

### Requirements

* FoundryVTT V13+
* Linux runtime environment
* ffmpeg installed in path (or x86_64 runtime environment)
* yt-dlp installed in path (or x86_64 runtime environment)

### Installation (using felddy/foundryvtt-docker)

1. Set up and mount a patches directory (see readme in [felddy/foundryvtt-docker])
2. Install the plugin
3. Copy the server patch from `Data/modules/terpsichore/server/terpsichore_server_v13.sh` to your patch directory
4. Restart the container (if using compose, down + up rather than restart/stop/start)

### Installation (manual)

1. Install the plugin.
2. Copy Data/modules/terpsichore/server/terpsichore_server_v13.mjs to the Foundry runtime directory.
3. Change line `(function() {` to `(async function() {`
4. Add the following after the `init.default` call: `await (await import('./terpsichore_server_v13.mjs')).Terpsichore.init();`
5. Document that you will need to do this on every FoundryVTT update.

### How it works

The server patch adds an (authenticated) API endpoint which makes a local call to yt-dlp.

For integration with felddy/foundryvtt-docker, as there's no ability to install packages in the dockerfile without forking it, we include compatible binaries in the bin/ directory of the plugin.
