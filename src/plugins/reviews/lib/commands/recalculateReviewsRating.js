import { class as AbstractCommand } from "./abstract";
const CommandIdentifier = "recalculate_reviews_rating";

class RecalculateReviewsRating extends AbstractCommand {
  /**
   * Execute recalculate reviews rating command.
   */
  async execute() {
    const reviewsModel = this.plugins.reviews.model_review;
    const lockModel = this.plugins.reviews.model_lock;

    return new Promise(async (resolve, reject) => {
      const messages = [];
      messages.push(`Begin: ${new Date().toISOString()}`);

      //check if command has been run
      const lockObject = await lockModel.findOne({"type": "recalculate_reviews"},{});
      if (lockObject && lockObject.locked) {
        messages.push(`This is one time only command. It has been run before`);
      } else {
        //get all reviews
        const reviewsProduct = await reviewsModel.find({}, {});

        //update reviews rating
        for (const product of reviewsProduct) {
          //compute new rating for maximum of 5 stars
          var newRating = (product.rating * 5) / 7;
          var query = {_id: product.id};
          var dataObject = {};
          dataObject.rating = Math.round(newRating);

          await reviewsModel.findOneAndUpdate(query, dataObject, {new: true});
        }

        await lockModel.update({"type": "recalculate_reviews"}, {"locked": true}, {upsert: true});
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
      "Recalculate reviews rating command"
    );
  }
}

exports.command = RecalculateReviewsRating;
exports.name = CommandIdentifier;
