const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const R2StorageService = require('./r2StorageService');

// Environment configurations
const S3_BUCKET = process.env.S3_BUCKET || '';
const S3_REGION = process.env.S3_REGION || 'auto';
const S3_ENDPOINT = process.env.S3_ENDPOINT || '';
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';

const hasS3Config = Boolean(S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);

let s3Client = null;
if (hasS3Config) {
  const clientConfig = {
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY
    }
  };
  if (S3_ENDPOINT) {
    clientConfig.endpoint = S3_ENDPOINT;
  }
  s3Client = new S3Client(clientConfig);
}

// GridFS bucket instance
let gridFsBucket = null;
function getGridFSBucket() {
  if (!gridFsBucket) {
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established for storage');
    }
    gridFsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'loop_resources'
    });
  }
  return gridFsBucket;
}

// Format bytes helper
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Validate file type
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
];

function isAllowedMime(mimeType) {
  if (!mimeType) return false;
  const cleanMime = mimeType.toLowerCase().split(';')[0].trim();
  return ALLOWED_MIME_TYPES.includes(cleanMime);
}

function getFileTypeCategory(mimeType, filename = '') {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'Image';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Sheet';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext) || mimeType.includes('word') || mimeType === 'text/plain') return 'Document';
  if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation')) return 'Presentation';
  return 'Document';
}

/**
 * Storage Service Interface
 */
const StorageService = {
  isS3Active: () => hasS3Config,

  // S3 Presigned URL for Direct Upload
  async getPresignedUploadUrl({ filename, mimeType, size, folderId, userId }) {
    if (!hasS3Config) {
      return null;
    }
    const cleanExt = (filename.split('.').pop() || 'bin').toLowerCase();
    const storageKey = `resources/${folderId || 'general'}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${cleanExt}`;
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: storageKey,
      ContentType: mimeType,
      Metadata: {
        originalName: filename,
        uploadedBy: String(userId || 'anonymous')
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      provider: 's3',
      storageKey,
      uploadUrl,
      publicUrl: S3_ENDPOINT ? `${S3_ENDPOINT}/${S3_BUCKET}/${storageKey}` : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${storageKey}`
    };
  },

  // Get Signed Download/Preview URL
  async getDownloadUrl(storageKey, originalFileName = 'file', storageProvider = 'r2') {
    if (storageProvider === 'r2' || R2StorageService.isR2Configured()) {
      const r2Url = await R2StorageService.getPresignedDownloadUrl({ objectKey: storageKey, originalFileName });
      if (r2Url) return r2Url;
    }
    if (hasS3Config && storageKey && !storageKey.startsWith('gridfs:')) {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: storageKey,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(originalFileName)}"`
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 7200 }); // 2 hours
    }
    // For GridFS, backend stream route is used
    return null;
  },

  // GridFS Upload Stream
  uploadToGridFS(readableStream, filename, mimeType, metadata = {}) {
    return new Promise((resolve, reject) => {
      try {
        const bucket = getGridFSBucket();
        const uploadStream = bucket.openUploadStream(filename, {
          chunkSizeBytes: 2 * 1024 * 1024, // 2 MB chunks (8x fewer roundtrips to Atlas)
          contentType: mimeType,
          metadata: {
            ...metadata,
            uploadedAt: new Date()
          }
        });

        readableStream.pipe(uploadStream)
          .on('error', (err) => {
            console.error('GridFS upload error:', err);
            reject(err);
          })
          .on('finish', (file) => {
            resolve({
              storageKey: `gridfs:${uploadStream.id.toString()}`,
              fileId: uploadStream.id,
              filename: uploadStream.filename,
              size: uploadStream.length || file?.length || 0
            });
          });
      } catch (err) {
        reject(err);
      }
    });
  },

  // GridFS Download Stream with HTTP Range support
  async streamFromGridFS(storageKey, req, res, originalFileName, mimeType) {
    const bucket = getGridFSBucket();
    const rawId = storageKey.replace('gridfs:', '');
    let objectId;
    try {
      objectId = new ObjectId(rawId);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found in storage' });
    }

    const file = files[0];
    const fileSize = file.length;
    const contentType = mimeType || file.contentType || 'application/octet-stream';
    const filename = originalFileName || file.filename || 'download';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);

    // Handle HTTP Range requests (crucial for PDF fast page loading, video, audio)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
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
      downloadStream.pipe(res);
    } else {
      res.setHeader('Content-Length', fileSize);
      const downloadStream = bucket.openDownloadStream(objectId);
      downloadStream.pipe(res);
    }
  },

  // Delete file from storage
  async deleteFile(storageKey, storageProvider) {
    try {
      if (storageProvider === 'r2' || (!storageKey.startsWith('gridfs:') && R2StorageService.isR2Configured())) {
        const deleted = await R2StorageService.deleteObject(storageKey);
        if (deleted) return true;
      }

      if ((storageProvider === 's3' || (!storageKey.startsWith('gridfs:') && hasS3Config)) && hasS3Config) {
        const command = new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: storageKey
        });
        await s3Client.send(command);
        return true;
      }

      if (storageKey.startsWith('gridfs:')) {
        const bucket = getGridFSBucket();
        const rawId = storageKey.replace('gridfs:', '');
        await bucket.delete(new ObjectId(rawId));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Storage deletion warning:', err.message);
      return false;
    }
  },

  formatBytes,
  isAllowedMime,
  getFileTypeCategory
};

module.exports = StorageService;
