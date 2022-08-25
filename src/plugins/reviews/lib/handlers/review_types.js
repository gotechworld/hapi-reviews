import { isUndefined, isNull, isEmpty } from "lodash";
import Boom from "@hapi/boom";
import Joi from "@hapi/joi";
import { Types } from "mongoose";

const LogTag = "ReviewsHandler";

exports.routes = {
  post: {
    handler: async request => {
      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_review_type;

      if (isUndefined(request.payload.type)) {
        return Boom.badRequest();
      }

      try {
        const dataObject = {};
        dataObject.type = request.payload.type;

        const dataInstance = new DataModel(dataObject);
        responseObject.review = await dataInstance.save();

      }
      catch (err) {
        request.server.log([LogTag, "reviews.type.post", "error"], err);
        return Boom.internal();
      }

      return responseObject;
    },
    auth: "im-auth",
    plugins: {
      "hapi-internal-bridge": {
        auth: {
          role: "ROLE_REVIEW",
            permission: "ADD"
        }
      }
    },
    tags: ["api"],
    description: "Post review type",
    validate: {
      payload: Joi.object({
        type: Joi.string()
          .required()
          .label("Type of review"),
      })
    },
    response: {
      schema: Joi.object().keys({
        review: Joi.object()
          .required()
          .label("Review Type")
      }),
        options: {
        allowUnknown: true
      }
    }
  },
  delete: {
    handler: async request => {

      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_review_type;

      try {
        responseObject.review = await DataModel.findOneAndRemove({
          _id: request.params.id
        });
        if (isNull(responseObject.review)) {
          return Boom.notFound();
        }

        responseObject.deleted = true;
      }
      catch (err) {
        request.server.log([LogTag, "reviews.type.delete", "error"], err);
        return Boom.internal();
      }

      return responseObject;
    },
    auth: "im-auth",
      plugins: {
      "hapi-internal-bridge": {
        auth: {
          role: "ROLE_REVIEW",
            permission: "DELETE"
        }
      }
    },
    tags: ["api"],
      description: "Delete review type",
      validate: {
      params: Joi.object({
        id: Joi.string().required().label("Review type id")
      })
    }
  },
  update: {
    handler: async request => {

      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_review_type;

      try {
        const dataObject = {};

        if (!isUndefined(request.payload.type)) {
          dataObject.type = request.payload.type;
        }

        if (isEmpty(dataObject)) {
          return Boom.badRequest("No updates to be applied.");
        }

        const query = { _id: request.params.id };
        const options = { new: true };

        responseObject.review = await DataModel.findOneAndUpdate(query, dataObject, options);

        if (isNull(responseObject.review)) {
          return Boom.notFound();
        }

      }
      catch (err) {
        request.server.log([LogTag, "reviews.type.update", "error"], err);
        return Boom.internal();
      }

      return responseObject;
    },
    auth: "im-auth",
      plugins: {
      "hapi-internal-bridge": {
        auth: {
          role: "ROLE_REVIEW",
            permission: "EDIT"
        }
      }
    },
    tags: ["api"],
      description: "Update review type",
      validate: {
      params: Joi.object({
        id: Joi.string()
          .required()
          .label("Review type id")
      }),
      payload: Joi.object({
        type: Joi.string()
          .required()
          .label("Review type")
      }),
      options: {
        allowUnknown: false
      }
    },
    response: {
      schema: Joi.object().keys({
        review: Joi.object()
          .required()
          .label("Review info")
      }),
        options: {
        allowUnknown: true
      }
    }
  },
  list: {
    handler: async request => {
      const responseObject = {
        meta: {
          size: 0,
        },
        items: []
      };

      const DataModel = request.server.plugins.reviews.model_review_type;
      responseObject.meta.size = await DataModel.count({})
      responseObject.items = await DataModel.find({}, {});

      return responseObject;
    },
    auth: "im-auth",
      plugins: {
      "hapi-internal-bridge": {
        auth: {
          role: "ROLE_REVIEW",
            permission: "LIST"
        }
      }
    },
    tags: ["api"],
    description: "GET review types",
    validate: {},
    response: {
      schema: Joi.object({
        meta: Joi.object()
          .required()
          .label("Meta info for current selection"),
        items: Joi.array()
          .required()
          .label("Items list")
      }),
        options: {
        allowUnknown: true
      }
    }
  }
};
