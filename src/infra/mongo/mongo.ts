import { MongoClient, Db, Collection, Document } from 'mongodb';
import fs from 'fs';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongo(mongoUri?: string, mongoDb?: string): Promise<Db> {
  if (db) {
    return db;
  }
  const mongoHost = process.env.MONGO_HOST || '';
  const mongoDbName = mongoDb || process.env.MONGO_DB || '';
  const mongoUriInternal = `mongodb://${mongoHost}/${mongoDbName}`;
  const uri = mongoUri || mongoUriInternal;
  const caPath = './certs/rds-combined-ca-bundle.pem';
  let options: any = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    authMechanism: 'SCRAM-SHA-1',
  };
  if (fs.existsSync(caPath)) {
    options.tlsCAFile = caPath;
    console.info('[Mongo] Usando CA bundle para TLS:', caPath);
  } else {
    console.warn('[Mongo] CA bundle não encontrado, usando TLS com certificados inválidos permitidos.');
  }
  client = new MongoClient(uri, options);
  await client.connect();
  db = client.db(mongoDbName);
  return db;
}

export async function getCollection<TSchema extends Document = Document>(name: string, mongoUri?: string, mongoDb?: string): Promise<Collection<TSchema>> {
  const database = await getMongo(mongoUri, mongoDb);
  return database.collection<TSchema>(name);
}
