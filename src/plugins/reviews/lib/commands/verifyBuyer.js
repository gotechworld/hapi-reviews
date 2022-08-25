import { class as AbstractCommand } from "./abstract";
import { get, includes, isArray } from "lodash";
import UtilsHelper from "../helpers/utils";

const CommandIdentifier = "verify_buyer";

const interval = Date.now() + (-1 * 24 * 3600 * 1000); // (currentDate - 1) days
const VERIFIED_BUYER_DATE_START = new Date(interval).toJSON().substring(0, 10);

class VerifyBuyer extends AbstractCommand {
  /**
   * Verify Buyer command.
   * This check is made by aggregate_review but if from some reasons fails we can use this command.
   */
  async execute() {
    const omsService = this.plugins.reviews.service_oms;
    const reviewModel = this.plugins.reviews.model_review;
    const catalogService = this.plugins.reviews.service_catalog;

    const { argv } = arguments[0];
    const startFrom = get(argv, "startFrom", VERIFIED_BUYER_DATE_START);

    console.log(`Start from [${startFrom}].`);
    try {
      const reviews = await reviewModel.find({
        $or: [{verifyProcessed: null}, {verifyProcessed: false}],
        verifiedBuyer: false,
        date: { $gte: UtilsHelper.getDate(startFrom, "start")}
      });

      console.log(`[${reviews.length}] reviews to update.`);
      let updated = 0;
      for (const review of reviews) {
        const productSku = await VerifyBuyer.getProductSku(catalogService, review.productId);
        if (!productSku) {
          continue;
        }

        const customerOrders = await VerifyBuyer.getOrdersByCustomerId(omsService, review.customer.id);
        let found = false;
        // update verifiedBuyer:true if an order was found
        for (const order of customerOrders) {
          const orderSkus = get(order, "additional_data.product_skus", []);
          if (includes(orderSkus, productSku)) {
            updated++;
            found = true;
            break;
          }
        }
        const query = { _id: review._id };
        await reviewModel.findOneAndUpdate(query, { verifiedBuyer: found, verifyProcessed: true });

        if (!found) {
          console.log(`[${productSku}] product SKU NOT found for customer id [${review.customer.id}].`);
        }

      }
      console.log(`[${updated}]/[${reviews.length}] reviews with verified buyer update / total.`);
    } catch (e) {
      console.log(`Cannot update Review due to ${e}`);
      console.log(e);
    }

    console.log(`Done.`);
  }

  /**
   * Get Product SKU by product Id.
   * @param catalogService
   * @param productId
   * @returns {*}
   */
  static async getProductSku(catalogService, productId) {
    const params = { filter: [`id:${productId}`], fields: ["sku", "brand_name", "category_ids"] };
    const response = await catalogService.getProductsList(params);
    if (
      200 !== response.status
      || !isArray(response.data)
      || 1 !== response.data.length) {
      console.log(`Cannot fetch Info from CATALOG API [${JSON.stringify(params)}]`);
      return null;
    }

    const productData = response.data[0];

    return productData.sku;
  }

  /**
   *
   * @param omsService
   * @param customerId
   * @returns {*[]|*}
   */
  static async getOrdersByCustomerId(omsService, customerId) {
    const interval = Date.now() + (-30 * 24 * 3600 * 1000); // date - 30 days
    const formattedDate = new Date(interval).toJSON().substring(0, 10);
    const requestData = await omsService.getOrdersList(
      {
        created_at_from: formattedDate,
        status: ["fully_confirmed"]
      },
      customerId
    );

    if (requestData.status === 200) {
      return requestData.data.data.orders;
    }

    return [];
  }

  /**
   * Return help message.
   */
  static help() {

    return (
      CommandIdentifier.toUpperCase() +
      "\n" +
      "Check product acquisition (in the last 30 days - in OMS by customer id and product sku)" +
      " for reviews placed in the last [1] day (can be set via startFrom parameter default is 1)" +
      " that were not processed already (verifyProcessed: false or not set) reviews" +
      " and set verifiedBuyer accordingly." +
      " If a product_id is not found in Catalog API verifyProcessed will remain as before." +
      " This check is made by aggregate_review but if from some reasons fails we can use this command."
    );
  }
}

exports.command = VerifyBuyer;
exports.name = CommandIdentifier;
