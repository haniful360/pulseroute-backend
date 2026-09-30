import config from "../config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

export const cloudinaryUtils = cloudinary;

/**
 * Uploads a file buffer to Cloudinary CDN and returns the secure URL
 * @param fileBuffer Buffer from multer (memoryStorage)
 * @param folder Cloudinary folder name (e.g. 'pulseroute/drivers')
 * @param filename Optional public_id/filename
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder = "pulseroute",
  filename?: string,
): Promise<string> => {
  // Re-verify config in case env loaded dynamically
  if (!config.cloudinary_name || !config.cloudinary_api_key || !config.cloudinary_api_secret) {
    cloudinary.config({
      cloud_name: config.cloudinary_name,
      api_key: config.cloudinary_api_key,
      api_secret: config.cloudinary_api_secret,
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            error || new Error("Failed to upload image to Cloudinary"),
          );
        }
        resolve(result.secure_url);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Uploads a base64 string or returns existing URL
 */
export const uploadBase64OrUrlToCloudinary = async (
  fileOrUrl: string,
  folder = "pulseroute",
): Promise<string> => {
  if (!fileOrUrl) return "";
  if (fileOrUrl.startsWith("http://") || fileOrUrl.startsWith("https://")) {
    return fileOrUrl;
  }
  if (!config.cloudinary_name || !config.cloudinary_api_key || !config.cloudinary_api_secret) {
    cloudinary.config({
      cloud_name: config.cloudinary_name,
      api_key: config.cloudinary_api_key,
      api_secret: config.cloudinary_api_secret,
    });
  }
  try {
    const result = await cloudinary.uploader.upload(fileOrUrl, {
      folder,
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (err) {
    console.warn("Cloudinary upload notice (retaining original):", err);
    return fileOrUrl;
  }
};
