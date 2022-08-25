import { Schema } from "mongoose";

const schema = new Schema({
  productId: {
    type: Number,
    index: true,
    unique: false
  },
  sellerId: {
    type: Number,
    index: true,
    unique: false
  },
  brand: {
    type: String
  },
  status: {
    type: Boolean,
    default: false,
    index: true
  },
  customer: {
    id: {
      type: Number,
      index: true
    },
    name: {
      type: String,
      required: true
    }
  },
  community: {
    upvotes: {
      default: 0,
      min: 0,
      type: Number,
      index: true
    },
    customers_upvoting: {
      type: Array
    },
    downvotes: {
      default: 0,
      min: 0,
      type: Number,
      index: true
    },
    customers_downvoting: {
      type: Array
    }
  },
  parent: {
    type: [Schema.Types.ObjectId],
    index: true
  },
  body: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  fromMerchandiser: {
    type: Boolean,
    default: false
  },
  sameQuestion: {
    type: Number,
    default: 0
  },
  customers_sameQuestion:{
    type: Array
  },
  context: {
    websiteCode: String,
    incrementId: String,
    customerEmail: String
  },
  categoryId: {
    type: Number,
    index: true,
    unique: false
  }
});

exports.schema = schema;

exports.name = "Question";
