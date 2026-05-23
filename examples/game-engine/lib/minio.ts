import { Client } from "minio";

type StoredAsset = {
  pathname: string;
  url: string;
  size: number;
  uploadedAt: string;
};

let minioClient: Client | null = null;
let bucketReadyPromise: Promise<void> | null = null;

function getBucketName(): string {
  return process.env.MINIO_BUCKET || "json-render";
}

function getPublicBaseUrl(): string {
  if (process.env.MINIO_PUBLIC_BASE_URL) {
    return process.env.MINIO_PUBLIC_BASE_URL.replace(/\/$/, "");
  }

  const endpoint = process.env.MINIO_ENDPOINT || "127.0.0.1";
  const port = process.env.MINIO_PORT || "9000";
  const useSSL = process.env.MINIO_USE_SSL === "true";
  const protocol = useSSL ? "https" : "http";
  const needsPort = !(useSSL && port === "443") && !(!useSSL && port === "80");

  return `${protocol}://${endpoint}${needsPort ? `:${port}` : ""}`;
}

function encodePathname(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getMinioClient(): Client {
  if (minioClient) {
    return minioClient;
  }

  const endPoint = process.env.MINIO_ENDPOINT || "127.0.0.1";
  const port = Number(process.env.MINIO_PORT || "9000");
  const useSSL = process.env.MINIO_USE_SSL === "true";
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be configured");
  }

  minioClient = new Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });

  return minioClient;
}

async function ensureBucketReady(): Promise<void> {
  if (bucketReadyPromise) {
    return bucketReadyPromise;
  }

  bucketReadyPromise = (async () => {
    const client = getMinioClient();
    const bucket = getBucketName();
    const exists = await client.bucketExists(bucket);

    if (!exists) {
      await client.makeBucket(bucket);
    }
  })();

  return bucketReadyPromise;
}

export async function uploadAsset(
  pathname: string,
  file: File,
): Promise<StoredAsset> {
  await ensureBucketReady();

  const client = getMinioClient();
  const bucket = getBucketName();
  const content = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  await client.putObject(bucket, pathname, content, content.length, {
    "Content-Type": contentType,
  });

  return {
    pathname,
    url: `${getPublicBaseUrl()}/${bucket}/${encodePathname(pathname)}`,
    size: content.length,
    uploadedAt: new Date().toISOString(),
  };
}

export async function listAssets(prefix: string): Promise<StoredAsset[]> {
  await ensureBucketReady();

  const client = getMinioClient();
  const bucket = getBucketName();

  return new Promise((resolve, reject) => {
    const assets: StoredAsset[] = [];
    const stream = client.listObjectsV2(bucket, prefix, true);

    stream.on("data", (object) => {
      if (!object.name) return;

      assets.push({
        pathname: object.name,
        url: `${getPublicBaseUrl()}/${bucket}/${encodePathname(object.name)}`,
        size: object.size ?? 0,
        uploadedAt:
          object.lastModified?.toISOString() || new Date().toISOString(),
      });
    });

    stream.on("error", reject);
    stream.on("end", () => resolve(assets));
  });
}
