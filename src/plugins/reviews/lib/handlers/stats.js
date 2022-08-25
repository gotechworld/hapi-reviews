import Boom from "@hapi/boom";
import Joi from "@hapi/joi";
import { isUndefined } from "lodash";
import StatsHelper from "../helpers/stats";
import UtilsHelper from "../helpers/utils";

const LogTag = "StatsHandler";

exports.routes = {
  get: {
    handler: async request => {

      const responseObject = { data: {} };
      const ReviewModel = request.server.plugins.reviews.model_review;
      const QuestionModel = request.server.plugins.reviews.model_question;

      try {
        const query = { date: {
          $gte: UtilsHelper.getDate(false, "start"),
          $lte: UtilsHelper.getDate(false, "end")
        } };

        responseObject.data = await StatsHelper.getStatObject(query, ReviewModel, QuestionModel);
      }
      catch (err) {
        request.server.log([LogTag, "stats.list", "error"], err);
        return Boom.internal();
      }

      return responseObject;
    },
    auth: "im-auth",
    plugins: {
      "hapi-internal-bridge": {
        auth: {
          role: "ROLE_REVIEW",
          permission: "GET"
        }
      }
    },
    tags: ["api"],
    description: "GET stats",
    validate: {
      query: Joi.object({})
    },
    response: {
      schema: Joi.object({
        data: Joi.object().required().label("Stats list real-time")
      }),
      options: { allowUnknown: true }
    }
  },
  list: {
    handler: async request => {

      const responseObject = {
        meta: {
          size: 0,
          page: request.query.page || 0,
          limit: request.query.limit || 0
        },
        items: []
      };
      const StatModel = request.server.plugins.reviews.model_stat;

      try {
        const query = {};

        // sorting
        let defaultSortBy = "_id";
        let defaultOrderBy = "desc";
        if (!isUndefined(request.query.sortBy)) {
          defaultSortBy = request.query.sortBy;
        }

        if (!isUndefined(request.query.orderBy)) {
          defaultOrderBy = request.query.orderBy;
        }

        if (!isUndefined(request.query.date)) {
          query.date = {
            $gte: UtilsHelper.getDate(request.query.date, "start"),
            $lte: UtilsHelper.getDate(request.query.date, "end")
          };
        }

        const sort = { [defaultSortBy]: defaultOrderBy };

        const skip = request.query.page * request.query.limit;
        responseObject.meta.size = await StatModel.count(query);
        if (responseObject.meta.size > 0) {
          responseObject.items = await StatModel.find(query)
            .skip(skip)
            .limit(request.query.limit)
            .sort(sort);

          // get children items
          const localQuery = {};
          // inherit status clause if any
          if (!isUndefined(request.query.status)) {
            localQuery.status = request.query.status;
          }

          for (const i in responseObject.items) {
            responseObject.items[i] = responseObject.items[i].toObject();
            localQuery.parent = responseObject.items[i]._id;
            responseObject.items[i].children = await StatModel.find(
              localQuery
            ).sort(sort);
          }
        }
      }
      catch (err) {
        request.server.log([LogTag, "stats.list", "error"], err);
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
    description: "GET stats",
    validate: {
      query: Joi.object({
        date: Joi.date().optional().label("Date"),
        sortBy: Joi.string().optional().valid("date").label("Sort by"),
        orderBy: Joi.string().optional().valid("asc", "desc").label("Order by")
      })
    },
    response: {
      schema: Joi.object({
        meta: Joi.object().required().label("Meta info for current selection"),
        items: Joi.array().required().label("Items list")
      }),
      options: { allowUnknown: true }
    }
  }
};
