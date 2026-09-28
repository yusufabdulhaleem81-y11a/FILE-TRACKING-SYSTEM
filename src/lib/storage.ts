import fs from "node:fs/promises";
import path from "node:path";

export interface StorageDriver {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

// Development driver — local disk.
// PRODUCTION: replace with the S3 driver, run `npm i @aws-sdk/client-s3`,
// and set STORAGE_DRIVER=s3 (serverless hosting has ephemeral disks).
const localDriver: StorageDriver = {
  async put(key, body) {
    const full = path.join(process.cwd(), process.env.STORAGE_DIR ?? "storage", key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  },
  async get(key) {
    return fs.readFile(path.join(process.cwd(), process.env.STORAGE_DIR ?? "storage", key));
  },
  async delete(key) {
    await fs.rm(path.join(process.cwd(), process.env.STORAGE_DIR ?? "storage", key), { force: true });
  },
};

export function getStorage(): StorageDriver {
  return localDriver;
}