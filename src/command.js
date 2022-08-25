import Joi from "@hapi/joi";
import Minimist from "minimist";

import { startApp, loadManifest, randomPort } from "./utils";

const _ = require("lodash");

/**
 * Schema object for validating argv.
 */
const schema = Joi.object()
  .keys({
    command: Joi.string().max(30).required(),
    consumer: Joi.boolean().default(false).optional()
  })
  .options({ stripUnknown: true });

/**
 * Entrypoint function is used in order to mock a server instance.
 * There is a global variable named `context` which is reused by the transformer registered plugin. When the context
 * is registered as console, in the plugin register method, commands defined under 'commands' folder are also registered
 * as server methods. (https://hapijs.com/tutorials/server-methods)
 *
 * Calling a command:
 * - create a new testCommand js file extending components/command.js (exports.name = 'my_test_command')
 * - call it with: node commands.js --command my_text_command
 */
const entrypoint = async () => {
  // this way we know exactly if commands should be registered under the server instance or not
  global.context = "commands";

  const argv = Minimist(process.argv.slice(2));
  const validate = schema.validate(argv);

  if (!_.isUndefined(validate.error)) {
    throw new Error(validate.error);
  }

  // load manifest file
  const manifest = loadManifest();
  // random port - simulate hapi's behavior
  manifest.server.port = await randomPort(10000, 65536);
  const server = await startApp(manifest, { relativeTo: __dirname });
  const { captureEvent, captureException } = server.methods;

  server.log(
    ["info"],
    "Server mock for commands started at: " + server.info.uri
  );

  try {
    if (_.isUndefined(server.methods[argv.command])) {
      throw `Server method not found: ${argv.command}`;
    }

    // binding 'server' as root scope for the server method
    const output = await server.methods[argv.command].bind(server)({ argv });
    server.log(["info"], `Executed command ${argv.command}`);
    server.log(["info"], JSON.stringify(output, null, 4));

    // sentry integration for each command execution
    if (captureEvent) {
      captureEvent({
        message: `Running command ${argv.command}`,
        level: "info",
        tags: ["console"],
        extra: {
          output,
          argv
        }
      });
      // wait until sentry sends the event
      if (_.isUndefined(argv.consumer) || !argv.consumer) {
        setTimeout(() => process.exit(0), 3000);
      }
    }
    else {
      process.exit(0);
    }
  }
  catch (e) {
    server.log(["error"], e);
    if (captureException) {
      captureException(e);
    }

    setTimeout(() => process.exit(1), 3000);
  }
};

entrypoint();
