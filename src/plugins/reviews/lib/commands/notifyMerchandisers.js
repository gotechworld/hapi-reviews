import { class as AbstractCommand } from "./abstract";
import UtilsHelper from "../helpers/utils";
import EmailHelper from "../helpers/emailTemplates";
import { isUndefined, isEmpty, uniq, filter } from "lodash";

const CommandIdentifier = "notify_merchandisers";

class NotifyMerchandisers extends AbstractCommand {
  /**
   * Execute brands command.
   */
  async execute() {

    const { options } = this.plugins.reviews;
    const ReviewModel = this.plugins.reviews.model_review;
    const QuestionModel = this.plugins.reviews.model_question;
    const SummariesModel = this.plugins.reviews.model_summary;
    const CatalogService = this.plugins.reviews.service_catalog;
    const NotifService = this.plugins.reviews.service_notif;

    const messages = [];
    messages.push(`Begin: ${new Date().toISOString()}`);

    const query = {
      date: {
        $gte: UtilsHelper.getDate(false, "start", 1),
        $lte: UtilsHelper.getDate(false, "end", 1)
      },
      status: true
    };

    const reviews = await ReviewModel.find(query);
    const questions = await QuestionModel.find(query);
    const productIds = [];
    if (!isEmpty(reviews)) {
      productIds.push(...(reviews.map(review => review.productId)));
    }

    if (!isEmpty(questions)) {
      productIds.push(...(questions.map(question => question.productId)));
    }

    for (const [brand, email] of Object.entries(options.merchandisers)) {
      const summaries = await SummariesModel.find({ productId: { $in: uniq(productIds) }, brand });

      const params = {
        filter: summaries.map(summary => `id:${summary.productId}`),
        fields: ["id", "sku", "url_key"]
      };
      if (isEmpty(params.filter)) {
        continue;
      }

      const response = await CatalogService.getProductsList(params);
      if (!isUndefined(response.data.error) || isEmpty(response.data)) {
        continue;
      }

      const responseProductIds = response.data.map(product => parseInt(product.id));

      const reviewsData = [];
      for (const review of reviews) {
        if (responseProductIds.indexOf(review.productId) !== -1) {
          const product = filter(response.data, obj => parseInt(obj.id) === review.productId);
          reviewsData.push(`https://altex.ro/${product[0].url_key}/cpd/${product[0].sku}/#reviews`);
        }
      }

      const questionsData = [];
      for (const question of questions) {
        if (responseProductIds.indexOf(question.productId) !== -1) {
          const product = filter(response.data, obj => parseInt(obj.id) === question.productId);
          questionsData.push(`https://altex.ro/${product[0].url_key}/cpd/${product[0].sku}/#questions`);
        }
      }

      // send email
      await NotifService.send(
        EmailHelper.getMerchandiserTemplate(reviewsData, questionsData, email)
      );
    }

    messages.push(`Finished: ${new Date().toISOString()}`);

    return messages;
  }

  /**
   * Return help message.
   */
  static help() {

    return (CommandIdentifier.toUpperCase() + "\n" + "Notify merchandisers");
  }
}

exports.command = NotifyMerchandisers;

exports.name = CommandIdentifier;
