const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// 200 MB maximum upload limit (209,715,200 bytes)
const MAX_FILE_SIZE = 200 * 1024 * 1024;

// 4 MB GridFS chunk size (optimal throughput & low MongoDB metadata overhead)
const CHUNK_SIZE_BYTES = 4 * 1024 * 1024;

// Supported file formats whitelist
const SUPPORTED_EXTENSIONS = new Set([
  // Documents
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
  // Spreadsheets
  'xls', 'xlsx', 'csv', 'ods',
  // Presentations
  'ppt', 'pptx', 'odp',
  // Images
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
  // Archives
  'zip', 'rar', '7z',
  // Code / Text
  'java', 'py', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h',
  'css', 'html', 'json', 'xml', 'sql', 'md'
]);

// Explicitly blocked dangerous executable formats
const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'msi', 'dll', 'com', 'scr', 'vbs', 'app', 'bin', 'ps1', 'jar'
]);

// Allowed MIME prefixes & specific types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/xml', 'text/markdown'
]);

/**
 * Check if a file extension and MIME type are permitted
 */
function isAllowedFile({ filename = '', mimeType = '' }) {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase().trim() : '';

  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return false;
  }

  if (ext && SUPPORTED_EXTENSIONS.has(ext)) {
    return true;
  }

  if (mimeType) {
    const cleanMime = mimeType.toLowerCase().split(';')[0].trim();
    if (ALLOWED_MIME_TYPES.has(cleanMime)) return true;
    if (cleanMime.startsWith('image/') || cleanMime.startsWith('text/')) return true;
    if (cleanMime.includes('pdf') || cleanMime.includes('document') || cleanMime.includes('sheet') || cleanMime.includes('presentation')) {
      return true;
    }
  }

  return false;
}

/**
 * Classify file into human-readable category for UI badges
 */
function getFileTypeCategory(mimeType = '', filename = '') {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase().trim() : '';
  const cleanMime = (mimeType || '').toLowerCase();

  if (ext === 'pdf' || cleanMime.includes('pdf')) return 'PDF';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) || cleanMime.startsWith('image/')) return 'Image';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || cleanMime.includes('spreadsheet') || cleanMime.includes('excel') || cleanMime.includes('csv')) return 'Sheet';
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext) || cleanMime.includes('word') || cleanMime.includes('officedocument.word')) return 'Document';
  if (['ppt', 'pptx', 'odp'].includes(ext) || cleanMime.includes('presentation') || cleanMime.includes('powerpoint')) return 'Presentation';
  if (['zip', 'rar', '7z'].includes(ext) || cleanMime.includes('zip') || cleanMime.includes('compressed')) return 'Archive';
  if (['java', 'py', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h', 'css', 'html', 'json', 'xml', 'sql', 'md'].includes(ext)) return 'Code';

  return 'Document';
}

/**
 * Format bytes to readable string
 */
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get or initialize GridFSBucket instance with 4 MB chunks
 */
let gridFsBucket = null;
function getGridFSBucket() {
  if (!gridFsBucket) {
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('MongoDB connection is not established.');
    }
    gridFsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'loop_resources',
      chunkSizeBytes: CHUNK_SIZE_BYTES
    });
  }
  return gridFsBucket;
}

/**
 * Stream incoming readable stream directly into MongoDB GridFS
 * Memory-efficient: never buffers the entire file in RAM.
 */
function uploadToGridFS(readableStream, filename, mimeType, metadata = {}) {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(filename, {
        chunkSizeBytes: CHUNK_SIZE_BYTES,
        contentType: mimeType || 'application/octet-stream',
        metadata: {
          ...metadata,
          uploadedAt: new Date()
        }
      });

      readableStream.pipe(uploadStream)
        .on('error', (err) => {
          console.error('[GridFS Upload] Stream error:', err);
          reject(err);
        })
        .on('finish', (file) => {
          resolve({
            storageKey: `gridfs:${uploadStream.id.toString()}`,
            gridFsFileId: uploadStream.id,
            fileId: uploadStream.id,
            filename: uploadStream.filename,
            size: uploadStream.length || file?.length || 0,
            contentType: mimeType
          });
        });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Stream file from MongoDB GridFS directly to HTTP response
 * Supports HTTP Range requests (206 Partial Content), ETag, and 304 caching.
 */
async function streamFromGridFS(storageKey, req, res, originalFileName, mimeType, isPrivate = false) {
  const bucket = getGridFSBucket();
  const rawId = storageKey.replace(/^gridfs:/, '');
  let objectId;
  try {
    objectId = new ObjectId(rawId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid file ID format.' });
  }

  const files = await bucket.find({ _id: objectId }).toArray();
  if (!files || files.length === 0) {
    return res.status(404).json({ error: 'File not found in storage.' });
  }

  const file = files[0];
  const fileSize = file.length;
  const contentType = mimeType || file.contentType || 'application/octet-stream';
  const filename = originalFileName || file.filename || 'download';

  // Construct ETag and Last-Modified headers
  const uploadTime = file.uploadDate ? new Date(file.uploadDate).getTime() : 0;
  const etag = `"${file._id.toString()}-${fileSize}-${uploadTime}"`;
  const lastModified = file.uploadDate ? new Date(file.uploadDate).toUTCString() : new Date().toUTCString();

  res.setHeader('Content-Type', contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', lastModified);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);

  // Cache-Control headers
  if (isPrivate) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  }

  // Handle Conditional GET (304 Not Modified)
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  // Handle HTTP Range Requests (206 Partial Content)
  const range = req.headers.range;
  if (range && range.startsWith('bytes=')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }

    const chunkSize = (end - start) + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);

    const downloadStream = bucket.openDownloadStream(objectId, {
      start,
      end: end + 1
    });

    downloadStream.on('error', (err) => {
      console.error('[GridFS Stream Range] Error:', err);
      if (!res.headersSent) res.status(500).end();
    });

    downloadStream.pipe(res);
  } else {
    // Full content delivery (200 OK)
    res.setHeader('Content-Length', fileSize);
    const downloadStream = bucket.openDownloadStream(objectId);

    downloadStream.on('error', (err) => {
      console.error('[GridFS Stream] Error:', err);
      if (!res.headersSent) res.status(500).end();
    });

    downloadStream.pipe(res);
  }
}

/**
 * Delete file from GridFS storage (or legacy local uploads if applicable)
 */
async function deleteFile(storageKey, storageProvider) {
  try {
    if (storageKey && storageKey.startsWith('gridfs:')) {
      const bucket = getGridFSBucket();
      const rawId = storageKey.replace(/^gridfs:/, '');
      await bucket.delete(new ObjectId(rawId));
      return true;
    }

    // Legacy local disk file cleanup
    if (storageKey && storageKey.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '..', storageKey);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.warn('[Storage Delete] Warning:', err.message);
    return false;
  }
}

module.exports = {
  MAX_FILE_SIZE,
  CHUNK_SIZE_BYTES,
  SUPPORTED_EXTENSIONS,
  BLOCKED_EXTENSIONS,
  isAllowedFile,
  getFileTypeCategory,
  formatBytes,
  getGridFSBucket,
  uploadToGridFS,
  streamFromGridFS,
  deleteFile
};
