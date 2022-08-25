import { isObject, isUndefined } from "lodash";

const LogTag = "ServicesInit";
const LogMessage = (type, service, message) => {

  console[type](type.toUpperCase(), [LogTag, service], message);
};

exports.init = async (server, settings) => {

  const services = Object.keys(settings.services);
  const auth = settings.auth || {};

  for (const serviceName of services) {
    try {
      const ServiceDefinition = require(`./${serviceName}`);

      if (isUndefined(ServiceDefinition.class) || !isObject(ServiceDefinition.class)) {
        throw "Invalid service definition";
      }

      const serviceKey = `service_${serviceName}`;
      const serviceSettings = !isUndefined(settings.services[serviceName]) ? settings.services[serviceName] : {};

      let instance = undefined;
      if (isUndefined(serviceSettings.websites)) {
        instance = new ServiceDefinition.class(serviceSettings, auth);
      } else {
        const websiteInstances = {};
        for (const websiteCode of Object.keys(serviceSettings.websites)) {
          websiteInstances[websiteCode] = new ServiceDefinition.class(serviceSettings.websites[websiteCode], auth);
        }

        instance = websiteInstances;
      }

      // init amqp connection
      if (serviceName === "queue") {
        await instance.initConnection();
      }

      server.expose(serviceKey, instance);
      LogMessage("info", serviceName, `Registered under key: ${serviceKey}`);
    }
    catch (err) {
      LogMessage("error", serviceName, err);
    }
  }
};
