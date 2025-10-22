import fs from "fs";
import path from "path";
import url from "url";
import express from "express";
import { execSync } from 'child_process';

const shell = (cmd) => execSync(cmd, { encoding: 'utf8' });
const ensureExecutable = (name) => { try { shell(`which ${name}`); return true; } catch (_e) { return false; } };

const _VERSION = "0.1.0";

class Terpsichore {
  static async init() {
    const router = global.express.app._router;
    this._init_jsonBodyParser({ router });
    this._init_bindEndpoints({ router });
  }

  static _init_jsonBodyParser({ router }) {
    const { json: jsonBodyParser } = express;
    const ixJsonParser = router.stack.findIndex(it => it.name === "jsonParser");
    global.express.app.use(jsonBodyParser({ limit: "5mb" }));
    router.stack[ixJsonParser] = router.stack.pop();
  }

  static _getYtdlpExecutionCall() {
    if (ensureExecutable("yt-dlp")) return "yt-dlp";
    if (fs.existsSync(path.join(global.paths.data, 'modules/terpsichore/bin/yt-dlp'))) return path.join(global.paths.data, 'modules/terpsichore/bin/yt-dlp');
    return null;
  }

  static _getFfmpegPath() {
    if (ensureExecutable('ffmpeg')) return null;
    if (fs.existsSync(path.join(global.paths.data, 'modules/terpsichore/bin/ffmpeg'))) return path.join(global.paths.data, 'modules/terpsichore/bin');
    return null;
  }

  static _getCleanDirPath(name) {
    return name.replace(/[^a-zA-Z0-9!£$%&()\-_+=[\]{};'@#~,./\\ ]/g, "").replace(/\s+/g, " ");
  }

  static _getSafeDirectoryPath(dirPath) {
    if (!dirPath) {
      return {
        serverDirPath: this._getForwardSlashed(path.join(global.paths.data)),
        clientDirPath: "",
      };
    }
    let cleanPath = path
      .normalize(this._getCleanDirPath(dirPath))
      .replace(/^(\.\.(\/|\\|$))+/, "");
    return {
      serverDirPath: this._getForwardSlashed(path.join(global.paths.data, cleanPath)),
      clientDirPath: this._getForwardSlashed(cleanPath),
    };
  }

  static _getForwardSlashed(str) {
    if (path.sep === "\\") str = str.replace(/\\/g, "/"); // Convert backslashes on Windows
    return str;
  }

  static async _getUser(req) {
    const { db } = global;
    return db.User.get(req.user);
  }

  static _sendError(res, status, message, traceback) {
    return res.status(status).send({ error: message, traceback: traceback });
  }

  static _init_bindEndpoints({ router }) {
    const prefixPart = global.config.options.routePrefix ? `/${global.config.options.routePrefix}/` : '/';
    router.get(`${prefixPart}api/terpsichore/version`, this._handleGetVersion.bind(this));
    router.post(`${prefixPart}api/terpsichore/downloadSong`, this._handleDownloadSong.bind(this));
  }

  static async _handleGetVersion(_req, res) {
    res.send({ version: _VERSION });
  }

  static _get_ffmpeg_arg() {
    return `--ffmpeg-location "./ffmpeg-master-latest-linux64-gpl/bin/"`;
  }

  static async _handleDownloadSong(req, res) {
    const { logger } = global;

    const user = await this._getUser(req);

    if (!user || !user.hasPermission("FILES_UPLOAD") || !user.hasPermission("PLAYLIST_CREATE")) {
      return this._sendError(res, 403, `User ${user.id} does not have permission to upload files or add to playlist.`);
    }

    try {
      const { serverDirPath, clientDirPath } = this._getSafeDirectoryPath('assets/terpsichore');

      try {
        fs.mkdirSync(serverDirPath, { resursive: true });
      } catch (mkdirErr) { }

      const parsed = url.parse(req.body.url);
      const outputPath = this._getForwardSlashed(path.join(serverDirPath, `%(title)s.mp3`));
      const executable = this._getYtdlpExecutionCall();
      const ffmpegPath = this._getFfmpegPath();
      const ffmpegArg = ffmpegPath ? `--ffmpeg-location "${ffmpegPath}"` : "";
      const workaroundArgs = `--extractor-args "youtube:player_js_version=actual"`

      const output = shell(`${executable} -t mp3 -o "${outputPath}" ${ffmpegArg} ${workaroundArgs} "${parsed.href}"`);
      const file = output.toString().split("\n").find(line => line.includes('[ExtractAudio] Destination: ')).split('[ExtractAudio] Destination: ')[1].trim();
      res.send(JSON.stringify({
        name: path.basename(file, '.mp3'),
        path: path.join(clientDirPath, path.basename(file))
      }));
    } catch (e) {
      this._sendError(res, 500, `Unable to process: ${e.message}`, e.stack);
    }
  }
}

export { Terpsichore };
