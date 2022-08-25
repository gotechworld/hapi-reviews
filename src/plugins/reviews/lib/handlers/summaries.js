import { isUndefined, union } from "lodash";
import Boom from "@hapi/boom";
import Joi from "@hapi/joi";

const LogTag = "SummariesHandler";

exports.routes = {
  list: {
    handler: async request => {
      const responseObject = {
        meta: {
          query: request.query
        },
        items: []
      };

      const DataModel = request.server.plugins.reviews.model_summary;

      if (
        isUndefined(request.query.productId) &&
        isUndefined(request.query.sellerId)
      ) {
        return Boom.badRequest("No productId / sellerId clause");
      }

      try {
        const itemsByQuery = {};
        if (!isUndefined(request.query.productId)) {
          itemsByQuery.product = await DataModel.find({
            productId: request.query.productId
          });
        }

        if (!isUndefined(request.query.sellerId) && request.query.sellerId) {
          itemsByQuery.seller = await DataModel.find({
            sellerId: request.query.sellerId
          });
        }

        Object.keys(itemsByQuery).forEach(type => {
          responseObject.items = union(responseObject.items, itemsByQuery[type]);
        });
      }
      catch (err) {
        request.server.log([LogTag, "summaries.list", "error"], err);
        return Boom.internal();
      }

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
    description: "GET product/seller summary by filters",
    validate: {
      query: Joi.object({
        productId: Joi.alternatives()
          .try(Joi.number(), Joi.array())
          .optional()
          .label("Product id (can be repeated - array)"),
        sellerId: Joi.alternatives()
          .try(Joi.number(), Joi.array())
          .optional()
          .label("Product id (can be repeated - array)")
      })
    },
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
