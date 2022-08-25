import ModelsInitialiser from "./models/index";
import RoutesInjector from "./routes/index";
import CommandsInjector from "./commands/index";
import Listeners from "./listeners/index";
import ServicesInitializer from "./services/index";

exports.plugin = {
  /**
   * Register plugin.
   */
  register: async (server, options) => {
    // init models
    ModelsInitialiser.init(
      server,
      options.models,
      server.plugins["hapi-panda-mongoose"].connection
    );

    // based on context, push commands or routes
    if (global.context === "commands") {
      CommandsInjector.register(server);
    }
    else {
      RoutesInjector.inject(server);
    }

    // expose options
    server.expose("options", options);

    // init services
    await ServicesInitializer.init(server, options);

    // inject custom event listeners
    Listeners.register(server);

    server.log(["reviews", "info"], "Registering reviews plugin");
  },
  pkg: require("../package.json")
};
