import { class as AbstractCommand } from "./abstract";
const CommandIdentifier = "add_default_review_types";

class AddDefaultReviewTypes extends AbstractCommand {
  /**
   * Execute recalculate reviews rating command.
   */
  async execute() {
    const typeModel = this.plugins.reviews.model_review_type;

    return new Promise(async (resolve, reject) => {
      const messages = [];
      messages.push(`Begin: ${new Date().toISOString()}`);

      const values = [
        "Calitate Produs",
        "Calitate Servicii Livrare",
        "Calitate servicii Magazin",
        "Calitate servicii Curier",
        "Calitate servicii call center"
      ];

      for (const value of values) {
        const existingTypes = await typeModel.find({"type": value},{});
        if (existingTypes.length == 0) {
          var dataInstance = new typeModel({"type": value});
          await dataInstance.save();
        }
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
      "Add default review types"
    );
  }
}

exports.command = AddDefaultReviewTypes;
exports.name = CommandIdentifier;
