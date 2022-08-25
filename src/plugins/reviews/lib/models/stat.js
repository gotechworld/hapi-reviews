import { Schema } from "mongoose";

const schema = new Schema({
  today: {
    reviews: {
      type: Number,
      required: true
    },
    questions: {
      type: Number,
      required: true
    },
    approvedReviews: {
      type: Number,
      required: true
    },
    approvedQuestions: {
      type: Number,
      required: true
    }
  },
  total: {
    reviews: {
      type: Number,
      required: true
    },
    questions: {
      type: Number,
      required: true
    },
    approvedReviews: {
      type: Number,
      required: true
    },
    approvedQuestions: {
      type: Number,
      required: true
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

exports.schema = schema;

exports.name = "Stats";
