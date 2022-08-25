import AbstractService from "./abstract";

/**
 * Proxy routes to be used.
 * @type object
 */
const proxyRoutes = {
  v1: {
    getCustomer: "/v1/customers/{id}"
  }
};

class CustomerService extends AbstractService {

  /**
   * Get customer.
   *
   * @param params
   */
  getCustomer(id, version = "v1") {
    return this.call(
      "get",
      proxyRoutes[version].getCustomer.replace("{id}", id),
      {},
      {}
    );
  }
}

module.exports.class = CustomerService;
