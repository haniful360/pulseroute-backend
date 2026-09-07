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
