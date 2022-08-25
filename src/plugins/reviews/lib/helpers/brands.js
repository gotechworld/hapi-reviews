import { isUndefined } from "lodash";

module.exports = {
  // Process brands
  async processBrands(products, DataModel) {

    // group products by brand
    const grouped = {};
    for (const product of products) {
      if (isUndefined(grouped[product.brand_name])) {
        grouped[product.brand_name] = [];
      }

      if (!isNaN(product.id)) {
        grouped[product.brand_name].push(parseInt(product.id));
      }
    }

    for (const brand in grouped) {
      await DataModel.updateMany({ productId: { $in: grouped[brand] } }, { brand });
    }
  },

  async updateBrandsForModel(DataModel, CatalogService, messages) {
    const cnt = await DataModel.countDocuments();
    const limit = 50;

    if (cnt === 0) {
      messages.push("Finished: Empty data");
    }

    for (let j = 0; j < cnt / limit; j++) {
      const items = await DataModel.find().skip(j * limit).limit(limit).sort({ "_id": 1 });
      const productIds = items.map(item => item.productId);

      const params = { filter: [], fields: ["id", "brand_name"] };
      for (const productId of productIds) {
        if (!isNaN(productId)) {
          params.filter.push(`id:${productId}`);
        }
      }

      const response = await CatalogService.getProductsList(params);
      if (response.data.error)  {
        messages.push(`Error: ${response.data}`);
        continue;
      }

      await this.processBrands(response.data, DataModel);
    }

    return messages;
  }
};
