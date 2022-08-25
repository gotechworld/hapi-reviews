import { isObject, isUndefined } from "lodash";

const LogTag = "ModelsInit";
const LogMessage = (type, model, message) => {
  console[type](type.toUpperCase(), [LogTag, model], message);
};

exports.init = (server, models, mongoose) => {
  models.forEach(modelName => {
    try {
      const ModelDefinition = require(`./${modelName}`);
      if (
        isUndefined(ModelDefinition.schema) ||
        !isObject(ModelDefinition.schema) ||
        isUndefined(ModelDefinition.name)
      ) {
        throw "Invalid model definition";
      }
      const modelKey = `model_${modelName}`;
      const instance = mongoose.model(
        ModelDefinition.name,
        ModelDefinition.schema
      );
      server.expose(modelKey, instance);
      LogMessage("info", modelName, `Registered under key: ${modelKey}`);
    } catch (err) {
      LogMessage("error", modelName, err);
    }
  });
};
