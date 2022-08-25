import BrandsHelper from "../helpers/brands";
import { class as AbstractCommand } from "./abstract";
import { isArray, isUndefined } from "lodash";
import { QueueBrandsIdentifier } from "../helpers/queueIdentifiers";

const CommandIdentifier = "aggregate_brand";

class AggregateBrandsConsumer extends AbstractCommand {
  /**
   * Execute aggregate command.
   */
  // eslint-disable-next-line require-await
  async execute() {

    const QueueService = this.plugins.reviews.service_queue;
    const CatalogService = this.plugins.reviews.service_catalog;
    const SummaryModel = this.plugins.reviews.model_summary;

    QueueService.consume(QueueBrandsIdentifier, async message => {

      const productId = message.content.toString();
      QueueService.ack(QueueBrandsIdentifier, message);

      const summary = await SummaryModel.find({ productId });
      if (isUndefined(summary.brand)) {
        const params = { filter: [`id:${productId}`], fields: ["id", "brand_name"] };
        const response = await CatalogService.getProductsList(params);
        if (response.status === 200 && isArray(response.data) && response.data.length === 1) {
          await BrandsHelper.processBrands(response.data, SummaryModel);
        }
      }
    });
  }

  /**
   * Return help message.
   */
  static help() {

    return (CommandIdentifier.toUpperCase() + "\n" + "Aggregate brand from queue");
  }
}

exports.command = AggregateBrandsConsumer;

exports.name = CommandIdentifier;
