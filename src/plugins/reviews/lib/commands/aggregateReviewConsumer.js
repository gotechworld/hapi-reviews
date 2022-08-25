import { class as AbstractCommand } from "./abstract";
import { get, includes, isArray, isUndefined } from "lodash";
import { QueueReviewsIdentifier } from "../helpers/queueIdentifiers";

const CommandIdentifier = "aggregate_review";

class AggregateReview extends AbstractCommand {
  /**
   * Execute aggregate command.
   */
  async execute() {
    const queueService = this.plugins.reviews.service_queue;
    const omsService = this.plugins.reviews.service_oms;
    const catalogService = this.plugins.reviews.service_catalog;
    const customerService = this.plugins.reviews.service_customer;
    const reviewModel = this.plugins.reviews.model_review;
    const questionModel = this.plugins.reviews.model_question;
    const mediaService = this.plugins.reviews.service_media;

    queueService.consume(QueueReviewsIdentifier, async message => {
      let msg = '';
      try {
        msg = JSON.parse(message.content.toString());
      } catch (err) {
        console.log(`[ERROR] Processing message[${message.content.toString()}]`);
        console.log(err.message);
        queueService.nack(QueueReviewsIdentifier, message);

        return;
      }

      console.log(`START [${msg.productId}] product id, review_id: [${msg._id}]`);
      try {
        // get catalog product info by product id
        const params = { filter: [`id:${msg.productId}`], fields: ["sku", "brand_name", "category_ids"] };
        const response = await catalogService.getProductsList(params);
        if (
          200 !== response.status
          || !isArray(response.data)
          || 1 !== response.data.length
        ) {
          throw `Cannot fetch Info from CATALOG API [${JSON.stringify(params)}] for message: ${JSON.stringify(msg)}`;
        }

        const productData = response.data[0];
        const productSku = productData.sku;
        // set brand name
        let updateObject = {
          brand: productData["brand_name"]
        };

        // set categoryId with the last category in category_ids
        const productCategoryIds = productData["category_ids"];
        if (productCategoryIds.length > 0) {
          updateObject.categoryId = productCategoryIds[productCategoryIds.length - 1];
        }

        // set fromMerchandiser for main review/ question
        if (0 != msg.parent.length) {
          const customerRequest = await customerService.getCustomer(msg.customer.id);
          if (200 === customerRequest.status) {
            const customerData = customerRequest.data.data;
            const customerBrand = get(customerData, "additional_data.brand", "");

            if (customerBrand.toLowerCase() === productData["brand_name"].toLowerCase()) {
              updateObject.fromMerchandiser = true;
            }
          }
        }

        // set verifiedBuyer for main review - not to responses
        if (0 == msg.parent.length && "review" === msg.type) {
          // get orders from oms
          const interval = Date.now() + (-30 * 24 * 3600 * 1000); // date - 30 days
          const formattedDate = new Date(interval).toJSON().substring(0, 10);
          const requestData = await omsService.getOrdersList(
            {
              created_at_from: formattedDate,
              status: ["fully_confirmed"]
            },
            msg.customer.id
          );

          if (200 === requestData.status) {
            const { orders } = requestData.data.data;
            let foundOrder = false;
            for (const order of orders) {
              const orderSkus = get(order, "additional_data.product_skus", []);
              if (includes(orderSkus, productSku)) {
                updateObject.verifiedBuyer = true;
                foundOrder = true;
                break;
              }
            }
            if (!foundOrder) {
              console.log(`[${productSku}] product SKU NOT found for customer id [${msg.customer.id}].`);
            }
          }
        }

        // set images
        const images = [];
        if (!isUndefined(msg.images) && 0 != msg.images.length) {
          for (const image of msg.images) {
            const imageData = await mediaService.uploadImage(image, msg._id);
            if (imageData.status == "success") {
              images.push(imageData.name);
            }
          }
          updateObject.images = images;
        }

        // apply updates collected in updateObject
        if ("review" === msg.type) {
          await reviewModel.findOneAndUpdate({ _id: msg._id }, updateObject);
        } else {
          await questionModel.findOneAndUpdate({ _id: msg._id }, updateObject);
        }

      } catch (e) {
        console.log(`Cannot update Review for message: ${JSON.stringify(msg)} due to ${e}`);
      } finally {
        queueService.ack(QueueReviewsIdentifier, message);
      }
    });
  }

  /**
   * Return help message.
   */
  static help() {

    return (
      CommandIdentifier.toUpperCase() +
      "\n" +
      "Check product aquisition and check answers if from merchandisers"
    );
  }
}

exports.command = AggregateReview;

exports.name = CommandIdentifier;
