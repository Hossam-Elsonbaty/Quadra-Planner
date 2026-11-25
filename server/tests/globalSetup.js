import { MongoMemoryServer } from "mongodb-memory-server";

export default async function globalSetup({ provide }) {
  const mongo = await MongoMemoryServer.create();
  provide("mongodbUri", mongo.getUri());
  return async () => {
    await mongo.stop();
  };
}
