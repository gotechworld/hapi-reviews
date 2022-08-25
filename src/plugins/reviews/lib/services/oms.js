import AbstractService from "./abstract";

/**
 * Proxy routes to be used.
 * @type object
 */
const proxyRoutes = {
  v1: {
    // orders
    getOrders: "/v1.0/orders?{params}",
    getOrder: "/v1.0/orders/{id}",
  }
};

const itemsPerPage = 100;

class OmsService extends AbstractService {
  get itemsPerPage() {
    return itemsPerPage;
  }

  /**
   * Get orders list.
   *
   * @param {object} params
   * @param {number} customerId
   * @param {string} version
   */
  getOrdersList(params = {}, customerId, version = "v1") {
    params["items_per_page"] = itemsPerPage;
    params["customer_id"] = customerId;
    params["website_code"] = this.settings.website_code;

    return this.call(
      "get",
      `${proxyRoutes[version].getOrders.replace(
        "{params}",
        this.formatUrlParams(params, false, 'brackets')
      )}`,
      {},
      {}
    );
  }

  /**
   * Read order.
   *
   * @param {number} id Order id
   * @param {number} customerId
   * @param {string} version
   */
  getOrder(id, customerId, version = "v1") {
    return this.call(
      "get",
      proxyRoutes[version].getOrder.replace("{id}", id),
      { customer_id: customerId },
      {}
    );
  }
}

module.exports.class = OmsService;
