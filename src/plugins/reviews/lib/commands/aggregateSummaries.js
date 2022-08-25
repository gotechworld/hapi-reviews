import { class as AbstractCommand } from "./abstract";
const CommandIdentifier = "aggregate_summaries";

class AggregateSummaries extends AbstractCommand {
  /**
   * Execute aggregate command.
   */
  async execute() {
    const reviewsModel = this.plugins.reviews.model_review;
    const questionModel = this.plugins.reviews.model_question;

    return new Promise(async (resolve, reject) => {
      const messages = [];
      messages.push(`Begin: ${new Date().toISOString()}`);

      const reviewsProductIds = await reviewsModel.distinct("productId", {
        status: 1
      });
      const questionsProductIds = await questionModel.distinct("productId", {
        status: 1
      });

      messages.push(
        `Having ${reviewsProductIds.length} distinct products for reviews`
      );

      for (const productId of reviewsProductIds) {
        await this.events.emit("recalculate_summary", {
          productId,
          type: "review"
        });
      }

      messages.push(
        `Having ${questionsProductIds.length} distinct products for questions`
      );

      for (const productId of questionsProductIds) {
        await this.events.emit("recalculate_summary", {
          productId,
          type: "question"
        });
      }

      messages.push(`Finished: ${new Date().toISOString()}`);

      resolve(messages);
    });
  }

  /**
   * Return help message.
   */
  static help() {
    return (
      CommandIdentifier.toUpperCase() +
      "\n" +
      "Force aggregate summaries values"
    );
  }
}

exports.command = AggregateSummaries;
exports.name = CommandIdentifier;
