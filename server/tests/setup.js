import mongoose from "mongoose";
import { afterAll, afterEach, inject } from "vitest";

process.env.NODE_ENV = "production";
process.env.MONGODB_URI = inject("mongodbUri");
process.env.JWT_SECRET = "test-secret-for-weekly-planner";
process.env.CLIENT_URL = "http://localhost:5173";

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany()));
});

afterAll(async () => {
  await mongoose.disconnect();
});
