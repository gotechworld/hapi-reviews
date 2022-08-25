import Boom from "@hapi/boom";
import Joi from "@hapi/joi";
import { isNull } from "lodash";
import { Types } from "mongoose";
import EmailHelper from "../helpers/emailTemplates";

const LogTag = "ReportsHandler";

exports.routes = {
  postReview: {
    handler: async request => {

      const responseObject = {};
      const ReportModel = request.server.plugins.reviews.model_report;
      const ReviewModel = request.server.plugins.reviews.model_review;
      const NotifService = request.server.plugins.reviews.service_notif;
      const { options } = request.server.plugins.reviews;

      try {
        if (!Types.ObjectId.isValid(request.payload.reviewId)) {
          return Boom.badRequest(`Invalid review id #${request.payload.reviewId}!`);
        }

        // find review
        const review = await ReviewModel.findOne({ _id: request.payload.reviewId });
        if (isNull(review)) {
          return Boom.notFound(`Review #${request.payload.reviewId} not found!`);
        }

        const dataObject = {};
        dataObject.reviewId = request.payload.reviewId;
        dataObject.customer = {
          id: request.payload.customerId,
          name: request.payload.customerName
        };
        dataObject.productId = review.productId;

        // save new report
        const dataInstance = new ReportModel(dataObject);
        responseObject.report = await dataInstance.save();

        // send email
        await NotifService.send(
          EmailHelper.getReportReviewTemplate(review, options.services.notif.reportEmailSend)
        );
      }
      catch (err) {
        request.server.log([LogTag, "report.post review", "error"], err);
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
    description: "Post review report",
    validate: {
      payload: Joi.object({
        customerName: Joi.string().required().label("Customer name"),
        customerId: Joi.number().required().label("Customer id"),
        reviewId: Joi.string().required().label("Review id")
      })
    },
    response: {
      schema: Joi.object().keys({
        report: Joi.object().required().label("Report info")
      }),
      options: { allowUnknown: true }
    }
  },
  postQuestion: {
    handler: async request => {

      const responseObject = {};
      const ReportModel = request.server.plugins.reviews.model_report;
      const QuestionModel = request.server.plugins.reviews.model_question;
      const NotifService = request.server.plugins.reviews.service_notif;
      const { options } = request.server.plugins.reviews;

      try {
        if (!Types.ObjectId.isValid(request.payload.questionId)) {
          return Boom.badRequest(`Invalid question id #${request.payload.questionId}!`);
        }

        // find review
        const question = await QuestionModel.findOne({ _id: request.payload.questionId });
        if (isNull(question)) {
          return Boom.notFound(`Question #${request.payload.questionId} not found!`);
        }

        const dataObject = {};
        dataObject.questionId = request.payload.questionId;
        dataObject.customer = {
          id: request.payload.customerId,
          name: request.payload.customerName
        };
        dataObject.productId = question.productId;

        // save new report
        const dataInstance = new ReportModel(dataObject);
        responseObject.report = await dataInstance.save();

        // send email
        await NotifService.send(
          EmailHelper.getReportQuestionTemplate(question, options.services.notif.reportEmailSend)
        );
      }
      catch (err) {
        request.server.log([LogTag, "report.post question", "error"], err);
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
    description: "Post question report",
    validate: {
      payload: Joi.object({
        customerName: Joi.string().required().label("Customer name"),
        customerId: Joi.number().required().label("Customer id"),
        questionId: Joi.string().required().label("Question id")
      })
    },
    response: {
      schema: Joi.object().keys({
        report: Joi.object().required().label("Report info")
      }),
      options: { allowUnknown: true }
    }
  }
};
