import AbstractService from "./abstract";
import { isUndefined} from "lodash";
/**
 * Proxy routes to be used.
 * @type object
 */
const proxyRoutes = {
    updateAttribute: "/catalog/v1/data/products"
};

class ProductService extends AbstractService {

  /**
   * update reviews in elastic search
   *
   * @param sku
   * @param reviewsCount
   * @param reviewsValue
   */
  async updateRatingInEngineY(sku, reviewsCount = 0, reviewsValue = 0) {
    const endpoint = proxyRoutes.updateAttribute.replace("{sku}", sku);
    const storeId = 1;

    const data = {
      "items": [
        {
          "sku": sku,
          "rating_number": reviewsCount,
          "rating_value": reviewsValue
        }
      ],
      "websiteId": storeId
    };

    const buff = new Buffer(this.settings.basicAuth);
    const base64data = buff.toString('base64');

    const response = await this.call(
      "patch",
      endpoint,
      data,
      {},
      {Authorization: "Basic " + base64data}
    );

    if (isUndefined(response.data) || response.data.errors > 0) {
      throw JSON.stringify("[Enginey_handler_error]" + response.messages);
    }

    return response;
  }
}

module.exports.class = ProductService;
