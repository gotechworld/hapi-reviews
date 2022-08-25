import { Schema } from "mongoose";

const schema = new Schema({
  type: String,
  locked: Boolean
});

exports.schema = schema;

exports.name = "Lock Model";
