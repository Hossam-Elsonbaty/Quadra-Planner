import mongoose from "mongoose";

let connectionPromise;

export default async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise && mongoose.connection.readyState === 2) {
    return connectionPromise;
  }
  connectionPromise = undefined;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");

  connectionPromise = mongoose.connect(uri).then(() => mongoose.connection);

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}
