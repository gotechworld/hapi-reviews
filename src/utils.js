import Glue from "@hapi/glue";
import Minimist from "minimist";
import { isUndefined } from "lodash";
import CatboxRedis from "@hapi/catbox-redis";
import Net from "net";

/**
 * Check if port is available.
 * @param {number} port
 */
const isPortAvailable = port => {
  return new Promise(resolve => {
    // if port is not a number or is not an integet or is out of range block
    if (isNaN(port) || port != parseInt(port) || port < 0 || port > 65536) {
      throw "Ivalid input. Port must be an Integer number betwen 0 and 65536";
    }
    // do the test
    port = parseInt(port);
    const tester = Net.createServer()
      // catch errors, and resolve false
      .once("error", () => {
        resolve(false);
      })
      // return true if succeeded
      .once("listening", () =>
        tester.once("close", () => resolve(true)).close()
      )
      .listen(port);
  });
};

/**
 * Get random port for running a HTTP server for the current command.
 * @param {number} min
 * @param {number} max
 */
const randomPort = async (min, max) => {
  let port = -1;
  let found = false;
  do {
    if (max == null) {
      max = min;
      min = 0;
    }
    port = min + Math.floor(Math.random() * (max - min + 1));
    found = await isPortAvailable(port);
  } while (!found);

  return port;
};

/**
 * Load manifest file content.
 */
const loadManifest = () => {
  const args = Minimist(process.argv.slice(2));
  const configPath = isUndefined(args.CONFIG_FILE)
    ? "./config/manifest.json"
    : args.CONFIG_FILE;
  return require(configPath); // eslint-disable-line
};

/**
 * Start an app (server) based on its manifest.
 * @param manifest
 * @param options
 * @returns {Promise.<void>}
 */
const startApp = async (manifest, options) => {
  // hack for CatboxRedis cache driver
  manifest.server.cache[0].provider.constructor = CatboxRedis;
  const server = await Glue.compose(
    manifest,
    options
  );
  await server.start();
  server.log(["info"], `Server started at: ${server.info.uri}`);
  return server;
};

/**
 * Process listeners.
 */
process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
  })
  .on("uncaughtException", err => {
    console.error(err, "Uncaught Exception thrown");
    process.exit(1);
  });

/**
 * Export functions.
 */
exports.loadManifest = loadManifest;
exports.startApp = startApp;
exports.randomPort = randomPort;
exports.isPortAvailable = isPortAvailable;
