import AbstractService from "./abstract";

/**
 * Proxy routes to be used.
 * @type object
 */
const proxyRoutes = {
  v1: {
    updateAttribute: "/v1.0/eav/products/{sku}/"
  }
};

class MagentoService extends AbstractService {

  /**
   * update reviews attributes in ecom api
   *
   * @param sku
   * @param reviewsCount
   * @param reviewsValue
   * @param version
   */
  async updateReviewsAttributes(sku, reviewsCount = 0, reviewsValue = 0, version = "v1") {
    const endpoint = proxyRoutes[version].updateAttribute.replace("{sku}", sku);
    const storeId = 0;
    const data = `attributes[reviews_count]=${reviewsCount}&attributes[reviews_value]=${reviewsValue}&store_id=${storeId}`;

    const response = await this.call(
      "put",
      endpoint,
      data,
      {},
      this.settings.headers
    );

    if (response.data.status === "error") {
      throw JSON.stringify(response.messages);
    }

    return response;
  }
}

module.exports.class = MagentoService;
