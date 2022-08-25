import { isUndefined, isNull, isEmpty } from "lodash";
import Boom from "@hapi/boom";
import Joi from "@hapi/joi";
import { Types } from "mongoose";

import AutoApprove from "../helpers/autoApprove";
import { QueueReviewsIdentifier } from "../helpers/queueIdentifiers";
import UtilsHelper from "../helpers/utils";
import { STATUS_ACTIVE, STATUS_INACTIVE } from "../models/review";

const LogTag = "ReviewsHandler";
/** after this date only reviews that have verifiedBuyer = true are eligible */
const verifiedBuyerDate = "2022-05-28";

exports.routes = {
  post: {
    handler: async request => {

      const responseObject = {};
      const Mongoose = request.server.plugins["hapi-panda-mongoose"].mongoose;
      const DataModel = request.server.plugins.reviews.model_review;
      const { options } = request.server.plugins.reviews;
      const queueService = request.server.plugins.reviews.service_queue;

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

        const existingReview = await DataModel.findOne({
          "customer.id": request.payload.customerId,
          productId: request.payload.productId,
          status: true
        });
        if (!isNull(existingReview)) {
          // TODO: add translations library
          // return Boom.conflict(`You have already placed a review for this product.`);
          return Boom.conflict(`Ai plasat deja o recenzie pentru acest produs.`);
        }

        if (!isUndefined(request.payload.sellerId)) {
          dataObject.sellerId = request.payload.sellerId;
        }

        if (!isUndefined(request.payload.parentId)) {
          if (!Types.ObjectId.isValid(request.payload.parentId)) {
            return Boom.badRequest(`Invalid parent review id #${request.payload.parentId}!`);
          }

          const parentReview = await DataModel.findOne({ _id: request.payload.parentId });
          if (isNull(parentReview)) {
            return Boom.notFound(`Parent review #${request.payload.parentId} not found!`);
          }

          dataObject.parent = [
            new Mongoose.mongo.ObjectId(request.payload.parentId)
          ];
        }

        if (!isEmpty(request.payload.date)) {
          dataObject.date = request.payload.date;
        }

        if (!isUndefined(request.payload.verifiedBuyer)) {
          dataObject.verifiedBuyer = request.payload.verifiedBuyer;
        }

        if (!isUndefined(request.payload.rating)) {
          dataObject.rating = request.payload.rating;
        }

        if (!isUndefined(request.payload.title)) {
          dataObject.title = request.payload.title;
        }

        if (!isUndefined(request.payload.recommendProduct)) {
          dataObject.recommendProduct = request.payload.recommendProduct;
        }

        if (!isUndefined(request.payload.fromMerchandiser)) {
          dataObject.fromMerchandiser = request.payload.fromMerchandiser;
        }

        if (isUndefined(request.payload.parentId)) {
          if (
            AutoApprove.canAutoApprove(dataObject.body, options)
            && AutoApprove.canAutoApprove(dataObject.title)
          ) {
            dataObject.status = true;
          }
        }
        else {
          if (AutoApprove.canAutoApprove(dataObject.body, options)) {
            dataObject.status = true;
          }
        }

        if (!isUndefined(request.payload.context)) {
          dataObject.context = request.payload.context;
        }

        if (!isUndefined(request.payload.categoryId)) {
          dataObject.categoryId = request.payload.categoryId;
        }

        if (!isUndefined(request.payload.terms)) {
          dataObject.terms = request.payload.terms;
        } else {
          dataObject.terms = false;
        }

        if (!isUndefined(request.payload.typeId) && !isUndefined(request.payload.type)) {
          dataObject.type = {
            type: request.payload.type,
            id: request.payload.typeId
          };
        }

        const dataInstance = new DataModel(dataObject);
        responseObject.review = await dataInstance.save();
        responseObject.review._doc.images = request.payload.images;
        delete responseObject.review._doc.type;
        queueService.publish(QueueReviewsIdentifier, { type: "review", ...responseObject.review._doc });
        delete responseObject.review._doc.images;
      }
      catch (err) {
        request.server.log([LogTag, "reviews.post", "error"], err);
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
    description: "Post product/seller review",
    validate: {
      payload: Joi.object({
        productId: Joi.number()
          .optional()
          .label("Product id targeted by this review"),
        sellerId: Joi.number()
          .optional()
          .label("Seller id targeted by this review"),
        parentId: Joi.string()
          .optional()
          .label("Parent id - for nested answers"),
        rating: Joi.alternatives()
          .conditional("parentId", {
            is: Joi.exist(),
            then: Joi.number()
              .optional()
              .default(0)
              .min(0)
              .max(5),
            otherwise: Joi.number()
              .required()
              .default(1)
              .min(1)
              .max(5)
          })
          .label("Rating for review"),
        verifiedBuyer: Joi.boolean()
          .optional()
          .default(false)
          .label("Is customer a verified buyer flag"),
        body: Joi.alternatives()
          .conditional("parentId", {
            is: Joi.exist(),
            then: Joi.string()
              .required()
              .min(10, "utf8")
              .max(2000, "utf8")
              .label("Review body"),
            otherwise: Joi.string()
              .required()
              .min(10, "utf8")
              .max(3000, "utf8")
              .label("Review body")
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
        typeId: Joi.string()
          .optional()
          .label("Review type id"),
        type: Joi.string()
          .optional()
          .label("Type"),
        title: Joi.alternatives()
          .conditional("parentId", {
            is: Joi.exist(),
            then: Joi.string()
              .optional(),
            otherwise: Joi.string()
              .required()
          })
          .label("Title"),
        recommendProduct: Joi.boolean()
          .optional()
          .label("Recommend product"),
        context: Joi.object()
          .optional()
          .label("Context"),
        categoryId: Joi.number()
          .optional()
          .label("Category id targeted by this review"),
        fromMerchandiser: Joi.boolean()
          .optional()
          .default(false)
          .label("From Merchandiser"),
        images: Joi.array()
          .optional()
          .label("Images"),
        terms: Joi.boolean()
          .optional()
          .label("Terms & Conditions")
      })
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
    },
    payload: {
      maxBytes: 1000 * 1000 * 6, // 6 Mb
    }
  },
  delete: {
    handler: async request => {

      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_review;

      try {
        responseObject.review = await DataModel.findOneAndRemove({
          _id: request.params.id
        });
        if (isNull(responseObject.review)) {
          return Boom.notFound();
        }

        // remove children
        if (isEmpty(responseObject.review.parent)) {
          await DataModel.remove({
            parent: request.params.id
          });
        }

        responseObject.deleted = true;

        request.server.events.emit("recalculate_summary", {
          productId: responseObject.review.productId,
          sellerId: responseObject.review.sellerId,
          type: "review"
        });
      }
      catch (err) {
        request.server.log([LogTag, "reviews.delete", "error"], err);
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
    description: "Delete product/seller review",
    validate: {
      params: Joi.object({
        id: Joi.string().required().label("Review id")
      })
    }
  },
  get: {
    handler: async request => {
      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_review;

      let projection = { context: 0 };
      if (request.query.show_context && request.query.show_context === "true") {
        projection = {};
      }

      if (!Types.ObjectId.isValid(request.params.id)) {
        return Boom.badRequest(`Invalid review id #${request.params.id}!`);
      }

      try {
        responseObject.review = await DataModel.findOne(
          { _id: request.params.id },
          projection
        );
        if (isNull(responseObject.review)) {
          return Boom.notFound();
        }

        responseObject.review = responseObject.review.toObject();
        responseObject.review.children = await DataModel.find(
          { parent: responseObject.review._id },
          projection
        ).sort({ _id: 1 });
      }
      catch (err) {
        request.server.log([LogTag, "reviews.get", "error"], err);
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
    description: "Get product/seller review",
    validate: {
      params: Joi.object({
        id: Joi.string()
          .required()
          .label("Review id")
      })
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
  update: {
    handler: async request => {

      const responseObject = {};
      const DataModel = request.server.plugins.reviews.model_review;

      try {

        let dataObject = {
          $inc: {}
        };

        if (!isUndefined(request.payload.customerName)) {
          dataObject["customer.name"] = request.payload.customerName;
        }

        if (!isUndefined(request.payload.status)) {
          dataObject.status = request.payload.status;
          if (request.payload.status === true) {
            if (!isUndefined(request.payload.approvedBy)) {
              dataObject.approvedBy = request.payload.approvedBy;
            }
          }
        }

        if (!isUndefined(request.payload.body)) {
          dataObject.body = request.payload.body;
        }

        if (!isUndefined(request.payload.rating)) {
          dataObject.rating = request.payload.rating;
        }

        if (!isUndefined(request.payload.fromMerchandiser)) {
          dataObject.fromMerchandiser = request.payload.fromMerchandiser;
        }

        const currentReview = await DataModel.findOne({_id: request.params.id});

        if (request.payload.status === true) {
          const query = {
            "customer.id": currentReview.customer.id,
            productId: currentReview.productId,
            status: true,
            verifiedBuyer: true,
            date: { $gte: UtilsHelper.getDate(verifiedBuyerDate, "start")},
          };

          const existingApprovedReview = await DataModel.findOne(query);
          if (!isNull(existingApprovedReview)) {
            // TODO: add translations library
            // return Boom.conflict(`This customer has already an approved review for this product.`);
            return Boom.conflict(`Acest client are deja o recenzie aprobata pentru acest produs.`);
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

            dataObject = UtilsHelper.preventMultipleIncrements(dataObject, request, currentReview);
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

            dataObject = UtilsHelper.preventMultipleIncrements(dataObject, request, currentReview);

          }
        }

        if (!isUndefined(request.payload.typeId) && !isUndefined(request.payload.type)) {
          dataObject.type = {
            type: request.payload.type,
            id: request.payload.typeId
          };
        }

        if (!isUndefined(request.payload.images)) {
          dataObject.images = request.payload.images;
        }

        dataObject.updatedAt = Date.now();

        if (isEmpty(dataObject)) {
          return Boom.badRequest("No updates to be applied.");
        }

        const query = { _id: request.params.id };
        const options = { new: true };

        responseObject.review = await DataModel.findOneAndUpdate(query, dataObject, options);

        if (isNull(responseObject.review)) {
          return Boom.notFound();
        }

        if (!isUndefined(request.payload.status)) {
          request.server.events.emit("recalculate_summary", {
            productId: responseObject.review.productId,
            sellerId: responseObject.review.sellerId,
            type: "review"
          });
          if (request.payload.status === STATUS_ACTIVE && currentReview.status === STATUS_INACTIVE) {
            request.server.events.emit("send_email", {review: responseObject.review});
          }
        }
      }
      catch (err) {
        request.server.log([LogTag, "reviews.update", "error"], err);
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
    description: "Update product/seller review",
    validate: {
      params: Joi.object({
        id: Joi.string()
          .required()
          .label("Review id")
      }),
      payload: Joi.object({
        status: Joi.boolean()
          .optional()
          .label("Status option"),
        body: Joi.string()
          .optional()
          .label("Review body"),
        rating: Joi.number()
          .optional()
          .min(0)
          .max(5)
          .label("Review rating"),
        customerName: Joi.string()
          .optional()
          .label("Customer name"),
        upvotes: Joi.number()
          .optional()
          .valid(1, -1)
          .label("Review upvotes"),
        typeId: Joi.string()
          .optional()
          .label("Review type id"),
        type: Joi.string()
          .optional()
          .label("Type"),
        downvotes: Joi.number()
          .optional()
          .valid(1, -1)
          .label("Review downvotes"),
        images: Joi.array()
          .optional()
          .label("Images"),
        fromMerchandiser: Joi.boolean()
          .optional()
          .label("From Merchandiser"),
        communityCustomerId: Joi.number()
          .optional()
          .label("Id of customer that upvotes/downvotes"),
        approvedBy: Joi.string()
          .optional()
          .label("Approved By user")
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

      const { options } = request.server.plugins.reviews;
      const responseObject = {
        meta: {
          size: 0,
          page: request.query.page || 0,
          limit: request.query.limit || 0
        },
        items: []
      };

      const DataModel = request.server.plugins.reviews.model_review;

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

        if (!request.query.show_comments) {
          query.parent = [];
        }

        if (!isUndefined(request.query.popular) && request.query.popular) {
          query["community.upvotes"] = { $gte: options.minPopularUpvotes };
        }

        if (!isUndefined(request.query.verifiedBuyer)) {
          query.verifiedBuyer = request.query.verifiedBuyer;
        }

        if (!isUndefined(request.query.recommendProduct)) {
          query.recommendProduct = request.query.recommendProduct;
        }

        if (!isUndefined(request.query.fromMerchandiser)) {
          query.fromMerchandiser = request.query.fromMerchandiser;
        }

        if (!isUndefined(request.query.rating)) {
          query.rating = request.query.rating;
        }

        if (!isUndefined(request.query.customerId)) {
          query["customer.id"] = request.query.customerId;
        }

        if (!isUndefined(request.query.categoryId)) {
          query.categoryId = request.query.categoryId;
        }

        if (!isUndefined(request.query.type)) {
          query["type.type"] = request.query.type;
        }

        if (!isUndefined(request.query.brand)) {
          query.brand = { $in: request.query.brand };
        }

        if (!isUndefined(request.query.reviewId)) {
          if (!Types.ObjectId.isValid(request.query.reviewId)) {
            return Boom.badRequest(`Invalid review id #${request.query.reviewId}!`);
          }

          query._id = request.query.reviewId;
        }

        if (!isUndefined(request.query.website)) {
          query["context.websiteCode"] = request.query.website;
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
        request.server.log([LogTag, "reviews.list", "error"], err);
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
    description: "GET product/seller reviews by filters",
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
        popular: Joi.boolean()
          .optional()
          .label("Popular"),
        verifiedBuyer: Joi.boolean()
          .optional()
          .label("Verified buyer"),
        recommendProduct: Joi.boolean()
          .optional()
          .label("Recommend product"),
        fromMerchandiser: Joi.boolean()
          .optional()
          .label("From merchandiser"),
        customerId: Joi.number()
          .optional()
          .label("Customer id"),
        categoryId: Joi.number()
          .optional()
          .label("Category id"),
        reviewId: Joi.string()
          .optional()
          .label("Review id"),
        rating: Joi.number()
          .optional()
          .label("Rating"),
        website: Joi.string()
          .optional()
          .valid("altex", "mediagalaxy")
          .label("Website"),
        date: Joi.date()
          .optional()
          .label("Date"),
        type: Joi.string()
          .optional()
          .label("Review type"),
        brand: Joi.array().single()
          .optional()
          .label("Brand"),
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
