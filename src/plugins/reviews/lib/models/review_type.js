import { Schema } from "mongoose";

const schema = new Schema({
  type: String
});

exports.schema = schema;

exports.name = "Review Type";
