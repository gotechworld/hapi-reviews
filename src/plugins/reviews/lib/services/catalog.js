import AbstractService from "./abstract";
import { isEmpty } from "lodash";

/**
 * Proxy routes to be used.
 * @type object
 */
const proxyRoutes = {
  getProducts: "/rest/products/getBulk"
};

class CatalogService extends AbstractService {

  /**
   * Get products list.
   *
   * @param params
   */
  getProductsList(params = {}) {

    let endpoint = proxyRoutes.getProducts;
    if (!isEmpty(params)) {
      endpoint += this.formatUrlParams(params, true);
    }

    return this.call("get", endpoint, {}, {});
  }
}

module.exports.class = CatalogService;
