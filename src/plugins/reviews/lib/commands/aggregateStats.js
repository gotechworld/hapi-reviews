import UtilsHelper from "../helpers/utils";
import { class as AbstractCommand } from "./abstract";
import StatsHelper from "../helpers/stats";
const CommandIdentifier = "aggregate_stats";

class AggregateStats extends AbstractCommand {
  /**
   * Execute stats command.
   */
  async execute() {

    const StatModel = this.plugins.reviews.model_stat;
    const ReviewModel = this.plugins.reviews.model_review;
    const QuestionModel = this.plugins.reviews.model_question;

    const messages = [];
    const query = { date: {
      $gte: UtilsHelper.getDate(false, "start", 1),
      $lte: UtilsHelper.getDate(false, "end", 1)
    } };

    messages.push(`Begin: ${new Date().toISOString()}`);

    const dataObject = await StatsHelper.getStatObject(query, ReviewModel, QuestionModel);

    // subtract 1 day because cron will run next day
    dataObject.date = UtilsHelper.getDate(false, false, 1);
    const dataInstance = new StatModel(dataObject);
    await dataInstance.save();

    messages.push(`Finished: ${new Date().toISOString()}`);

    return messages;
  }

  /**
   * Return help message.
   */
  static help() {

    return (CommandIdentifier.toUpperCase() + "\n" + "Aggregate stats");
  }
}

exports.command = AggregateStats;

exports.name = CommandIdentifier;
