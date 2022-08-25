import { Schema } from "mongoose";

const schema = new Schema({
  productId: {
    type: Number,
    index: true,
    unique: false,
    required: true
  },
  reviewId: {
    type: String,
    index: true,
    unique: false,
    required: false
  },
  questionId: {
    type: String,
    index: true,
    unique: false,
    required: false
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
  date: {
    type: Date,
    default: Date.now
  }
});

exports.schema = schema;

exports.name = "Report";
