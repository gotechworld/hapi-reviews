import { isUndefined, isEmpty, isNull } from "lodash";
import Boom from "@hapi/boom";
import Joi from "@hapi/joi";
import { Types } from "mongoose";
import UtilsHelper from "../helpers/utils";
import { QueueReviewsIdentifier } from "../helpers/queueIdentifiers";
import AutoApprove from "../helpers/autoApprove";

const LogTag = "QuestionsHandler";

exports.routes = {
  post: {
    handler: async request => {
      const responseObject = {};
      const Mongoose = request.server.plugins["hapi-panda-mongoose"].mongoose;
      const DataModel = request.server.plugins.reviews.model_question;
      const queueService = request.server.plugins.reviews.service_queue;
      const { options } = request.server.plugins.reviews;

      if (
        isUndefined(request.payload.productId) &&
        isUndefined(request.payload.sellerId) &&
        isUndefined(request.payload.parentId)
      ) {
        return Boom.badRequest();
      }

      try {
        const dataObject = {};
        dataObject.customer = {
          name: request.payload.customerName,
          id: request.payload.customerId
        };
        dataObject.body = request.payload.body;
        if (!isUndefined(request.payload.productId)) {
          dataObject.productId = request.payload.productId;
        }

        if (!isUndefined(request.payload.sellerId)) {
          dataObject.sellerId = request.payload.sellerId;
        }

        if (!isUndefined(request.payload.parentId)) {
          if (!Types.ObjectId.isValid(request.payload.parentId)) {
            return Boom.badRequest(`Invalid parent question id #${request.payload.parentId}!`);
          }

          const parentQuestion = await DataModel.findOne({ _id: request.payload.parentId });
          if (isNull(parentQuestion)) {
            return Boom.notFound(`Parent question #${request.payload.parentId} not found!`);
          }

          dataObject.parent = [
            new Mongoose.mongo.ObjectId(request.payload.parentId)
          ];
        }

        if (!isEmpty(request.payload.date)) {
          dataObject.date = request.payload.date;
        }

        if (!isUndefined(request.payload.context)) {
          dataObject.context = request.payload.context;
        }

        if (!isUndefined(request.payload.categoryId)) {
          dataObject.categoryId = request.payload.categoryId;
        }

        if (AutoApprove.canAutoApprove(dataObject.body, options)) {
          dataObject.status = true;
        }

        if (!isUndefined(request.payload.fromMerchandiser)) {
          dataObject.fromMerchandiser = request.payload.fromMerchandiser;
        }

        const dataInstance = new DataModel(dataObject);
        responseObject.question = await dataInstance.save();
        queueService.publish(QueueReviewsIdentifier, { type: "question", ...responseObject.question._doc });
      }
      catch (err) {
        request.server.log([LogTag, "questions.post", "error"], err);
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
    description: "Post product/seller question",
    validate: {
      payload: Joi.object({
        productId: Joi.number()
          .optional()
          .label("Product id targeted by this question"),
        sellerId: Joi.number()
          .optional()
          .label("Seller id targetted by this question"),
        parentId: Joi.string()
          .optional()
          .label("Parent id - for nested answers"),
        body: Joi.alternatives()
          .conditional("parentId", {
            is: Joi.exist(),
            then: Joi.string()
              .required()
              .min(2, "utf8")
              .max(3000, "utf8")
              .label("Question body"),
            otherwise: Joi.string()
              .required()
              .min(6, "utf8")
              .max(3000, "utf8")
              .label("Question body")
          }),
        date: Joi.string()
          .optional()
          .label("Creation date"),
        customerName: Joi.string()
          .required()
          .label("Customer name"),
        customerId: Joi.number()
          .required()
          .label("Customer id"),
        context: Joi.object()
          .optional()
          .label("Context"),
        categoryId: Joi.number()
          .optional()
          .label("Category id targeted by this question"),
        fromMerchandiser: Joi.boolean()
          .optional()
          .default(false)
          .label("From Merchandiser")
      })
    },
    response: {
      schema: Joi.object().keys({
        question: Joi.object()
          .required()
          .label("Question info")
      }),
      options: {
        allowUnknown: true
      }
    }
  },
  delete: {
    handler: async request => {
      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_question;

      try {
        responseObject.question = await DataModel.findOneAndRemove({
          _id: request.params.id
        });
        if (isNull(responseObject.question)) {
          return Boom.notFound();
        }

        // remove children
        if (isEmpty(responseObject.question.parent)) {
          await DataModel.remove({
            parent: request.params.id
          });
        }

        responseObject.deleted = true;

        request.server.events.emit("recalculate_summary", {
          productId: responseObject.question.productId,
          sellerId: responseObject.question.sellerId,
          type: "question"
        });
      }
      catch (err) {
        request.server.log([LogTag, "questions.delete", "error"], err);
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
    description: "Delete product/seller question",
    validate: {
      params: Joi.object({
        id: Joi.string()
          .required()
          .label("Question id")
      })
    }
  },
  get: {
    handler: async request => {

      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_question;

      let projection = { context: 0 };
      if (request.query.show_context && request.query.show_context === "true") {
        projection = {};
      }

      if (!Types.ObjectId.isValid(request.params.id)) {
        return Boom.badRequest(`Invalid question id #${request.params.id}!`);
      }

      try {
        responseObject.question = await DataModel.findOne(
          { _id: request.params.id },
          projection
        );
        if (isNull(responseObject.question)) {
          return Boom.notFound();
        }

        responseObject.question = responseObject.question.toObject();
        responseObject.question.children = await DataModel.find(
          { parent: responseObject.question._id },
          projection
        ).sort({ _id: 1 });
      }
      catch (err) {
        request.server.log([LogTag, "questions.get", "error"], err);
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
    description: "Get product/seller question with all it's children",
    validate: {
      params: Joi.object({
        id: Joi.string()
          .required()
          .label("Question id")
      })
    },
    response: {
      schema: Joi.object().keys({
        question: Joi.object()
          .required()
          .label("Question info")
      }),
      options: {
        allowUnknown: true
      }
    }
  },
  update: {
    handler: async request => {

      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_question;

      try {
        let dataObject = {
          $inc: {}
        };

        if (!isUndefined(request.payload.customerName)) {
          dataObject["customer.name"] = request.payload.customerName;
        }

        if (!isUndefined(request.payload.status)) {
          dataObject.status = request.payload.status;
        }

        if (!isUndefined(request.payload.body)) {
          dataObject.body = request.payload.body;
        }

        if (!isUndefined(request.payload.fromMerchandiser)) {
          dataObject.fromMerchandiser = request.payload.fromMerchandiser;
        }

        const currentQuestion = await DataModel.findOne({_id: request.params.id});

        if (!isUndefined(request.payload.sameQuestion)) {
          dataObject.$inc = { "sameQuestion": request.payload.sameQuestion };

          if (!isUndefined(request.payload.communityCustomerId)) {
            if (request.payload.sameQuestion > 0) {
              dataObject.$push = {"customers_sameQuestion": request.payload.communityCustomerId};
            } else {
              dataObject.$pull = {"customers_sameQuestion": request.payload.communityCustomerId};
            }
            dataObject = UtilsHelper.preventMultipleIncrements(dataObject, request, currentQuestion);
          }
        }

        if (!isUndefined(request.payload.upvotes)) {
          dataObject.$inc["community.upvotes"] = request.payload.upvotes;

          if (!isUndefined(request.payload.communityCustomerId)) {
            if (request.payload.upvotes > 0) {
              dataObject.$push = {"community.customers_upvoting": request.payload.communityCustomerId};
            } else {
              dataObject.$pull = {"community.customers_upvoting": request.payload.communityCustomerId};
            }
            dataObject = UtilsHelper.preventMultipleIncrements(dataObject, request, currentQuestion);
          }
        }

        if (!isUndefined(request.payload.downvotes)) {
          dataObject.$inc["community.downvotes"] = request.payload.downvotes;

          if (!isUndefined(request.payload.communityCustomerId)) {
            if (request.payload.downvotes > 0) {
              dataObject.$push = {"community.customers_downvoting": request.payload.communityCustomerId};
            } else {
              dataObject.$pull = {"community.customers_downvoting": request.payload.communityCustomerId};
            }
            dataObject = UtilsHelper.preventMultipleIncrements(dataObject, request, currentQuestion);
          }
        }

        dataObject.updatedAt = Date.now();

        if (isEmpty(dataObject)) {
          return Boom.badRequest("No updates to be applied.");
        }

        const query = { _id: request.params.id };
        const options = { new: true };

        responseObject.question = await DataModel.findOneAndUpdate(
          query,
          dataObject,
          options
        );

        if (isNull(responseObject.question)) {
          return Boom.notFound();
        }

        if (!isUndefined(dataObject.status)) {
          request.server.events.emit("recalculate_summary", {
            productId: responseObject.question.productId,
            sellerId: responseObject.question.sellerId,
            type: "question"
          });
        }
      }
      catch (err) {
        request.server.log([LogTag, "questions.update", "error"], err);
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
    description: "Update product/seller question",
    validate: {
      params: Joi.object({
        id: Joi.string()
          .required()
          .label("Question id")
      }),
      payload: Joi.object({
        status: Joi.boolean()
          .optional()
          .label("Status option"),
        body: Joi.string()
          .optional()
          .label("Question body"),
        customerName: Joi.string()
          .optional()
          .label("Customer name"),
        sameQuestion: Joi.number()
          .valid(1, -1)
          .label("Same question counter"),
        upvotes: Joi.number()
          .optional()
          .valid(1, -1)
          .label("Question upvotes"),
        downvotes: Joi.number()
          .optional()
          .valid(1, -1)
          .label("Question downvotes"),
        fromMerchandiser: Joi.boolean()
          .optional()
          .label("From Merchandiser"),
        communityCustomerId: Joi.number()
          .optional()
          .label("Id of customer that upvotes/downvotes")
      }),
      options: {
        allowUnknown: false
      }
    },
    response: {
      schema: Joi.object().keys({
        question: Joi.object()
          .required()
          .label("Question info")
      }),
      options: {
        allowUnknown: true
      }
    }
  },
  list: {
    handler: async request => {

      const { options } = request.server.plugins.reviews;
      const responseObject = {
        meta: {
          size: 0,
          page: request.query.page || 0,
          limit: request.query.limit || 0
        },
        items: []
      };

      const DataModel = request.server.plugins.reviews.model_question;

      if (
        isUndefined(request.query.productId) &&
        isUndefined(request.query.sellerId)
      ) {
        return Boom.badRequest("No productId / sellerId clause");
      }

      try {
        const query = {};

        let projection = { context: 0 };
        if (request.query.show_context && request.query.show_context === true) {
          projection = {};
        }

        if (
          !isUndefined(request.query.productId) &&
          request.query.productId > 0
        ) {
          query.productId = request.query.productId;
        }

        if (!isUndefined(request.query.sellerId) && request.query.sellerId) {
          query.sellerId = request.query.sellerId;
        }

        if (!isUndefined(request.query.status)) {
          query.status = request.query.status;
        }

        if (!isUndefined(request.query.popular) && request.query.popular) {
          query["community.upvotes"] = { $gte: options.minPopularUpvotes };
        }

        if (!isUndefined(request.query.customerId)) {
          query["customer.id"] = request.query.customerId;
        }

        if (!isUndefined(request.query.categoryId)) {
          query.categoryId = request.query.categoryId;
        }

        if (!isUndefined(request.query.questionId)) {
          if (!Types.ObjectId.isValid(request.query.questionId)) {
            return Boom.badRequest(`Invalid question id #${request.query.questionId}!`);
          }

          query._id = request.query.questionId;
        }

        if (!isUndefined(request.query.website)) {
          query["context.websiteCode"] = request.query.website;
        }

        if (!request.query.show_comments) {
          query.parent = [];
        }

        if (!isUndefined(request.query.brand)) {
          query.brand = { $in: request.query.brand };
        }

        if (!isUndefined(request.query.date)) {
          query.date = {
            $gte: UtilsHelper.getDate(request.query.date, "start"),
            $lte: UtilsHelper.getDate(request.query.date, "end")
          };
        }

        // sorting
        let defaultSortBy = "_id";
        let defaultOrderBy = "desc";
        if (!isUndefined(request.query.sortBy)) {
          defaultSortBy = request.query.sortBy;
          if (request.query.sortBy === "upvotes") {
            defaultSortBy = "community.upvotes";
          }
        }

        if (!isUndefined(request.query.orderBy)) {
          defaultOrderBy = request.query.orderBy;
        }

        const sort = { [defaultSortBy]: defaultOrderBy };

        const skip = request.query.page * request.query.limit;
        responseObject.meta.size = await DataModel.count(query);
        if (responseObject.meta.size > 0) {
          responseObject.items = await DataModel.find(query, projection)
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
            responseObject.items[i].children = await DataModel.find(
              localQuery,
              projection
            ).sort(sort);
          }
        }
      }
      catch (err) {
        request.server.log([LogTag, "questions.list", "error"], err);
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
    description: "GET product/seller questions by filters",
    validate: {
      query: Joi.object({
        productId: Joi.number()
          .default(0)
          .optional()
          .label("Product id"),
        sellerId: Joi.number()
          .default(0)
          .optional()
          .label("Product id"),
        page: Joi.number()
          .default(0)
          .optional()
          .label("Current page"),
        limit: Joi.number()
          .default(10)
          .optional()
          .label("Limit items"),
        show_comments: Joi.boolean()
          .default(false)
          .optional()
          .label("Show comments"),
        show_context: Joi.boolean()
          .default(false)
          .optional()
          .label("Show context"),
        status: Joi.boolean()
          .optional()
          .label("Status"),
        customerId: Joi.number()
          .optional()
          .label("Customer id"),
        categoryId: Joi.number()
          .optional()
          .label("Category id"),
        questionId: Joi.string()
          .optional()
          .label("Question id"),
        brand: Joi.array().single()
          .optional()
          .label("Brand"),
        website: Joi.string()
          .optional()
          .valid("altex", "mediagalaxy")
          .label("Website"),
        date: Joi.date()
          .optional()
          .label("Date"),
        sortBy: Joi.string()
          .optional()
          .valid("date", "upvotes")
          .label("Sort by"),
        orderBy: Joi.string()
          .optional()
          .valid("asc", "desc")
          .label("Order by")
      }).rename('brand[]', 'brand', { ignoreUndefined: true })
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
