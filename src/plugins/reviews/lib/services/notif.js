import AbstractService from "./abstract";

/**
 * Proxy routes to be used.
 * @type object
 */
const proxyRoutes = {
  v1: {
    sendEmail: "/api/v1/send/email"
  }
};

class NotifService extends AbstractService {

  /**
   * Sending email.
   *
   * @param data
   * @param version
   */
  async send(data = {}, version = "v1") {

    const endpoint = proxyRoutes[version].sendEmail;

    const response = await this.call("post", endpoint, data, {});
    if (response.data.status === "error") {
      throw JSON.stringify(response.messages);
    }

    return response;
  }
}

module.exports.class = NotifService;
