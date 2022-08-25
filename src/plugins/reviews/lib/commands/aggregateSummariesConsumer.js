import { class as AbstractCommand } from "./abstract";
import { isArray, isUndefined } from "lodash";
import { QueueSummariesIdentifier } from "../helpers/queueIdentifiers";

const CommandIdentifier = "aggregate_summary";

class AggregateSummariesConsumer extends AbstractCommand {
  /**
   * Execute aggregate command.
   * eslint-disable-next-line require-await
   */
  async execute() {
    const queueService = this.plugins.reviews.service_queue;
    const magentoService = this.plugins.reviews.service_magento;
    const summaryModel = this.plugins.reviews.model_summary;
    const catalogService = this.plugins.reviews.service_catalog;
    const productService = this.plugins.reviews.service_product;
    const server = this; // keep the context throught the execution

    queueService.consume(QueueSummariesIdentifier, async message => {
      const productId = message.content.toString();
      try {
        const summary = await summaryModel.find({ productId });
        const params = { filter: [`id:${productId}`], fields: ["sku"] };
        const response = await catalogService.getProductsList(params);
        if (response.status === 200 && isArray(response.data) && response.data.length === 1) {
          const productSku = response.data[0].sku;

          if (summary[0].reviews.value && summary[0].reviews.total) {
            await magentoService.updateReviewsAttributes(productSku, summary[0].reviews.value, summary[0].reviews.total);
            await productService.updateRatingInEngineY(productSku, summary[0].reviews.value, summary[0].reviews.total);
          }
        } else {
          server.log(["info"], "Catalog response: " + response.status);
          //queueService.nack(QueueSummariesIdentifier, message)
        }
      } catch (error) {
        server.log(error);
      } finally {
        queueService.ack(QueueSummariesIdentifier, message);
      }
    });
  }

  /**
   * Return help message.
   */
  static help() {

    return (CommandIdentifier.toUpperCase() + "\n" + "Aggregate summary from queue");
  }
}

exports.command = AggregateSummariesConsumer;

exports.name = CommandIdentifier;
