import { isNull, isUndefined } from "lodash";
import EmailHelper from "../helpers/emailTemplates";
import { QueueBrandsIdentifier } from "../helpers/queueIdentifiers";
import { QueueSummariesIdentifier } from "../helpers/queueIdentifiers";

const LogTag = "EventListeners";
const LogMessage = (type, listener, message) => {
  console[type](type.toUpperCase(), [LogTag, listener], message);
};

exports.register = server => {
  const summaryModel = server.plugins.reviews.model_summary;
  const reviewsModel = server.plugins.reviews.model_review;
  const questionModel = server.plugins.reviews.model_question;
  const queueService = server.plugins.reviews.service_queue;
  const notificationService = server.plugins.reviews.service_notif;

  /**
   * Get reviews data - count + total rating
   * @param {object} data
   */
  const hydrateReviewsData = data => {
    return new Promise(async resolve => {
      const query = {
        status: true,
        parent: []
      };
      if (!isUndefined(data.productId)) {
        query.productId = data.productId;
      }

      if (!isUndefined(data.sellerId)) {
        query.sellerId = data.sellerId;
      }

      let value = await reviewsModel.aggregate(
        [
          { $match: query },
          {
            $group: {
              _id: null,
              totalRating: { $sum: { $add: ["$rating"] } },
              count: { $sum: 1 }
            }
          }
        ],
        err => {
          if (err) {
            return;
          }
        }
      );

      if (isUndefined(value[0])) {
        value = {
          count: 0,
          total: 0
        };
      } else {
        value = value[0];
      }

      data.ratingDistribution = await getRatingDistribution(query);
      //data.recommendPercent = await getRecommendPercent(query);
      data.reviews = { value: value.count, total: value.totalRating };
      resolve(data);
    });
  };

  /**
   * Get questions data.
   * @param {object} data
   */
  const hydrateQuestionsData = data => {
    return new Promise(async resolve => {
      const query = { status: true };
      if (!isUndefined(data.productId)) {
        query.productId = data.productId;
      }

      if (!isUndefined(data.sellerId)) {
        query.sellerId = data.sellerId;
      }

      query.parent = []; // get only parent elements

      data.questions = {
        total: await questionModel.countDocuments(query)
      };
      resolve(data);
    });
  };

  /**
   * Deprecated since ECOMDEV-2867
   * Calculate recommend percent
   */
  const getRecommendPercent = async query => {
    const cntVerifiedBuyer = await reviewsModel.countDocuments({ ...query, verifiedBuyer: true });
    const cntRecommendProduct = await reviewsModel.countDocuments({ ...query, recommendProduct: true });
    const result = cntVerifiedBuyer / (cntVerifiedBuyer + cntRecommendProduct) * 100;
    return isNaN(result) ? 0 : result;
  };

  const getRatingDistribution = async query => {
    const values = await reviewsModel.aggregate(
      [
        { $match: query },
        {
          $group: {
            _id: "$rating",
            Total: { $sum: 1 }
          }
        }
      ],
      err => {
        if (err) {
          return;
        }
      }
    );

    const result = {};
    for (const value of values) {
      result[value["_id"]] = value["Total"];
    }

    return result;
  };

  LogMessage("info", null, "Registering custom events and listeners");

  // register event
  server.event(["recalculate_summary"]);

  // recalculate summary event listener
  server.events.on("recalculate_summary", async eventData => {

    const findQuery = {};
    if (!isUndefined(eventData.productId)) {
      findQuery.productId = eventData.productId;
    }

    if (!isUndefined(eventData.sellerId)) {
      findQuery.sellerId = eventData.sellerId;
    }

    const summaryData = await summaryModel.findOne(findQuery);

    const data = {};
    if (!isUndefined(eventData.productId)) {
      data.productId = eventData.productId;
    }

    if (!isUndefined(eventData.sellerId)) {
      data.sellerId = eventData.sellerId;
    }

    try {
      if (!isNull(summaryData)) {
        if (eventData.type === "review") {
          await hydrateReviewsData(data);
        }
        else {
          await hydrateQuestionsData(data);
        }

        await summaryModel.updateMany(
          {
            productId: data.productId
          },
          { $set: data },
          {
            upsert: true
          }
        );
      } else {
        await hydrateReviewsData(data);
        await hydrateQuestionsData(data);
        new summaryModel(data).save();

        // attach brand on summary
        queueService.publish(QueueBrandsIdentifier, data.productId);
      }
      if (eventData.type === "review") {
        // send summaries to magento pim
        queueService.publish(QueueSummariesIdentifier, data.productId);
      }
    }
    catch (err) {
      LogMessage("error", "recalculate_summary", err);
    }
  });

  // register event send email
  server.event(["send_email"]);

  // send email event listener
  server.events.on("send_email", async eventData => {
    try {
      const reviewData = eventData.review;
      const destinationEmail = reviewData.context.customerEmail;
      const website = reviewData.context.websiteCode;
      
      // send email
      await notificationService[website].send(EmailHelper.getReviewApprovedTemplate(reviewData, destinationEmail));
    } catch (err) {
      LogMessage("error", "send_email", err);
    }
  });
};
