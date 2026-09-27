import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface StorageDriver {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

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

function s3Driver(): StorageDriver {
  const client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT, // MinIO & most S3-compatible providers
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
  const bucket = process.env.S3_BUCKET!;
  return {
    async put(key, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
    },
    async get(key) {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return Buffer.from(await res.Body!.transformToByteArray());
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

export function getStorage(): StorageDriver {
  return process.env.STORAGE_DRIVER === "s3" ? s3Driver() : localDriver;
}