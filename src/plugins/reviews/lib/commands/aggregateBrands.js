import { class as AbstractCommand } from "./abstract";
import BrandsHelper from "../helpers/brands";
const CommandIdentifier = "aggregate_brands";

class AggregateBrands extends AbstractCommand {
  /**
   * Execute brands command.
   */
  async execute() {

    const SummaryModel = this.plugins.reviews.model_summary;
    const CatalogService = this.plugins.reviews.service_catalog;
    const ReviewModel = this.plugins.reviews.model_review;
    const QuestionModel = this.plugins.reviews.model_question;

    let messages = [];
    messages.push(`Begin: ${new Date().toISOString()}`);

    messages.push(`Update summaries`);
    messages = await BrandsHelper.updateBrandsForModel(SummaryModel, CatalogService, messages);
    messages.push(`Update reviews`);
    messages = await BrandsHelper.updateBrandsForModel(ReviewModel, CatalogService, messages);
    messages.push(`Update questions`);
    messages = await BrandsHelper.updateBrandsForModel(QuestionModel, CatalogService, messages);

    messages.push(`Finished: ${new Date().toISOString()}`);

    return messages;
  }

  /**
   * Return help message.
   */
  static help() {

    return (CommandIdentifier.toUpperCase() + "\n" + "Aggregate brands");
  }
}

exports.command = AggregateBrands;

exports.name = CommandIdentifier;
