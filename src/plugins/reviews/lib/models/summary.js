import { Schema } from "mongoose";

const schema = new Schema({
  productId: { type: Number, index: true, unique: true },
  sellerId: { type: Number, index: true, unqieu: true },
  reviews: {
    total: { type: Number, default: 0 },
    value: { type: Number, default: 0 }
  },
  questions: {
    total: { type: Number, default: 0 }
  },
  recommendPercent: { type: Number, default: 0 },
  ratingDistribution: { type: Object, default: {} },
  brand: { type: String, index: true }
});

exports.schema = schema;

exports.name = "Summary";
