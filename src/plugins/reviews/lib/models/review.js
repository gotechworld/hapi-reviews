import { Schema } from "mongoose";

/** review statuses */
const STATUS_ACTIVE = true;
const STATUS_INACTIVE = false;

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
  terms: {
    type: Boolean,
    default: false,
    index: false
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
  type: {
    id: {
      type: String
    },
    type: {
      type: String
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
    customers_downvoting:{
      type: Array
    }
  },
  parent: {
    type: [Schema.Types.ObjectId],
    index: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  verifiedBuyer: {
    type: Boolean,
    default: false
  },
  verifyProcessed: {
    type: Boolean,
    default: false
  },
  body: String,
  title: String,
  recommendProduct: {
    type: Boolean
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
  context: {
    websiteCode: String,
    incrementId: String,
    customerEmail: String
  },
  categoryId: {
    type: Number,
    index: true,
    unique: false
  },
  images: {
    type: Array
  },
  approvedBy: {
    type: String
  }
});

exports.STATUS_ACTIVE = STATUS_ACTIVE;
exports.STATUS_INACTIVE = STATUS_INACTIVE;

exports.schema = schema;

exports.name = "Review";
