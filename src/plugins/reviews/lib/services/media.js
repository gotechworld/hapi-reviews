import AbstractService from "./abstract";
import { isEmpty } from "lodash";
import axios from "axios";
import FormData from "form-data";

/**
 * Proxy routes to be used.
 * @type object
 */
const proxyRoutes = {
  reviewsPath: "/reviews-files/"
};

class MediaService extends AbstractService {

  /**
   * Upload image to mediaserver.
   *
   * @param params
   */
  async uploadImage(base64File, reviewId) {
    let endpoint = this.settings.baseUrl + proxyRoutes.reviewsPath + reviewId;
    let splitFile = base64File.split(',');
    let fileExtension = splitFile[0].replace('data:image/', '').replace(';base64', '');
    let decodedFile = new Buffer(splitFile[1], 'base64');
    let form = new FormData();

    form.append('file', decodedFile, {filename: 'image.'+fileExtension});

    const headers = {
        headers: {
          'X-REQUEST-ID': this.settings.token,
          ... form.getHeaders()
      }
    }

    let response = await axios.post(endpoint, form, headers);

    return response.data;
  }
}

module.exports.class = MediaService;
