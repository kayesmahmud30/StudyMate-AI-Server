import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db("studymate_ai");

  console.log("✅ Connected to MongoDB");
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error("Database not initialised. Call connectDB() first.");
  return db;
}
