import cloudinary from "../config/cloudinary.js";
import logger from "./logger.js";

// Upload files to Cloudinary
export const uploadToCloudinary = async (files, folder_name) => {
  try {
    if (files.length > 0) {
      const uploadPromises = files.map((file) => {
        return cloudinary.uploader.upload(file.path, {
          folder: `loneliness/${folder_name}`,
        });
      });

      const results = await Promise.all(uploadPromises);
      return results;
    } else {
      return cloudinary.uploader.upload(files.path, {
        folder: `loneliness/${folder_name}`,
      });
    }
  } catch (error) {
    console.error("Detailed Cloudinary error:", error.message);
    throw error;
  }
};
// Update files on Cloudinary (replace with new files)
export const updateFiles = async (
  publicIds,
  files,
  folderPath,
  options = {}
) => {
  try {
    const deletePromises = publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId)
    );
    await Promise.all(deletePromises);

    const uploadPromises = files.map((file) => {
      const uploadOptions = { folder: folderPath, ...options };
      return cloudinary.uploader.upload(file.path, uploadOptions);
    });

    const results = await Promise.all(uploadPromises);
    results.forEach((result) => {
      logger.info(`File updated on Cloudinary: ${result.public_id}`);
    });
    return results;
  } catch (error) {
    logger.error(`Error updating files on Cloudinary: ${error.message}`);
    throw error;
  }
};

// Delete files from Cloudinary
export const deleteFiles = async (publicIds) => {
  try {
    const deletePromises = publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId)
    );
    const results = await Promise.all(deletePromises);
    results.forEach((result) => {
      logger.info(`File deleted from Cloudinary: ${result.public_id}`);
    });
    return results;
  } catch (error) {
    logger.error(`Error deleting files from Cloudinary: ${error.message}`);
    throw error;
  }
};
