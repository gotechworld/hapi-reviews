import apisauce from 'apisauce';
import http from 'http';
import https from 'https';
import _ from "lodash";
import Qs from "qs";

class AbstractService {

  /**
   * Constructor.
   * @param settings
   * @param auth
   */
  constructor(settings, auth) {

    // persist config on instance
    this.settings = settings;

    // persist review credentials on instance
    this.auth = auth;

    // http agents
    this._httpAgent = new http.Agent({ keepAlive: true });
    this._httpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });
  }

  /**
   * Http agent
   * @returns {http.Agent|agent.Agent}
   */
  get httpAgent() {

    return this._httpAgent;
  }

  /**
   * Https agent
   * @returns {https.Agent|Agent}
   */
  get httpsAgent() {

    return this._httpsAgent;
  }

  /**
   * Api Sauce client
   * @returns {ApisauceInstance | *}
   */
  get client() {

    return apisauce.create({
      baseURL: this.settings.baseUrl,
      headers: {
        'X-Service-Name': this.auth.name,
        'X-Service-Key': this.auth.key,
        'User-Agent': 'api-reviews/1.0.0'
      },
      httpAgent: this.httpAgent,
      httpsAgent: this.httpsAgent
    });;
  }

  /**
   * Add header
   * @param headerKey
   * @param headerValue
   */
  addHeader(httpClient, headerKey, headerValue) {

    httpClient.headers[headerKey] = headerValue
  }

  /**
   * Proxy call to client instance.
   * @param method
   * @param endpoint
   * @param data
   * @param axiosConfig
   * @param cacheable
   * @param additionalHeaders
   * @returns {Promise.<*>}
   */
  async call(method, endpoint = '/', data = {}, axiosConfig = {}, additionalHeaders = {}) {

    const httpClient = await this.client;
    if (Object.keys(additionalHeaders).length > 0) {
      for (let headerKey in additionalHeaders) {
        this.addHeader(httpClient, headerKey, additionalHeaders[headerKey])
      }
    }
    const result = await httpClient[method](endpoint, data, axiosConfig);

    return new Promise((resolve) => {

      resolve(result);
    });
  }

  formatUrlParams(params, inRequest = true, arrFormat = 'repeat') {

    let formattedParams = !_.isUndefined(params) && !_.isEmpty(params) ?
      Qs.stringify(params, { indices: false, encodeValuesOnly: true, arrayFormat: arrFormat }) :
      '';

    if (!_.isEmpty(params) && inRequest === true) {
      formattedParams = '?' + formattedParams;
    }
    return formattedParams;
  }
}

module.exports = AbstractService;