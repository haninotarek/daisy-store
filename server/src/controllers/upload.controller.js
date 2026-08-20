import { asyncHandler } from '../utils/helpers.js';
import ApiError from '../utils/ApiError.js';
import { persistFile, storageMode } from '../services/upload.service.js';

// POST /api/admin/upload  (multipart, field name: "images", up to 12)
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw ApiError.badRequest('No files uploaded.');
  const urls = [];
  for (const file of req.files) urls.push(await persistFile(file));
  res.status(201).json({ urls, storage: storageMode });
});
