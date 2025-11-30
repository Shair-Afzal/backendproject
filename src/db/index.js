import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import dotenv from "dotenv";

dotenv.config();
const connectdb = async () => {
  const url = process.env.MONGODB_URL;
  try {
    const connectioninstance = await mongoose.connect(`${url}/${DB_NAME}`);

    console.log("mongo db connected", connectioninstance.connection.host);
  } catch (err) {
    console.log("ERROR:", err);
    process.exit(1);
  }
};

export default connectdb;
