const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

// Environment variables for Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET || 'loop-resources';
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : process.env.S3_ENDPOINT || '');
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// 200 MB limit (209,715,200 bytes)
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB in bytes

// Check if Cloudflare R2 is configured
const isR2Configured = Boolean(
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET_NAME &&
  (R2_ENDPOINT || R2_ACCOUNT_ID)
);

let r2Client = null;
if (isR2Configured) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });
}

// Supported file extensions and mime types
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

const ALLOWED_MIME_PREFIXES = [
  'image/',
  'text/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/json',
  'application/xml',
  'application/sql',
  'application/octet-stream' // fallback binary for code/archive types
];

const DISALLOWED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'bash', 'msi', 'com', 'scr', 'vbs', 'dll', 'so', 'dylib', 'apk', 'app'
]);

function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'resource';
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 100);
}

function getFileExtension(filename = '') {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop().toLowerCase().trim();
}

function isAllowedFile({ filename = '', mimeType = '' }) {
  const ext = getFileExtension(filename);
  const cleanMime = (mimeType || '').toLowerCase().split(';')[0].trim();

  // Explicitly block dangerous executable extensions
  if (DISALLOWED_EXTENSIONS.has(ext)) {
    return false;
  }

  // If an extension is present, it MUST be on the supported educational extension whitelist
  if (ext) {
    return SUPPORTED_EXTENSIONS.has(ext);
  }

  // If no extension is provided, require an explicit educational MIME type
  return ALLOWED_MIME_PREFIXES.some(prefix => prefix !== 'application/octet-stream' && cleanMime.startsWith(prefix));
}

function validateFileSize(size) {
  const numSize = Number(size);
  if (isNaN(numSize) || numSize <= 0) {
    throw new Error('Invalid file size.');
  }
  if (numSize > MAX_FILE_SIZE) {
    throw new Error('File exceeds the maximum allowed size of 200 MB.');
  }
  return true;
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileTypeCategory(mimeType = '', filename = '') {
  const ext = getFileExtension(filename);
  const cleanMime = (mimeType || '').toLowerCase();

  if (ext === 'pdf' || cleanMime === 'application/pdf') return 'PDF';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || cleanMime.startsWith('image/')) return 'Image';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || cleanMime.includes('spreadsheet') || cleanMime.includes('excel')) return 'Sheet';
  if (['ppt', 'pptx', 'odp'].includes(ext) || cleanMime.includes('presentation') || cleanMime.includes('powerpoint')) return 'Presentation';
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext) || cleanMime.includes('word') || cleanMime.includes('document')) return 'Document';
  if (['zip', 'rar', '7z'].includes(ext) || cleanMime.includes('zip') || cleanMime.includes('compressed')) return 'Archive';
  if (['java', 'py', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h', 'css', 'html', 'json', 'xml', 'sql', 'md'].includes(ext)) return 'Code';
  if (ext === 'txt' || cleanMime.startsWith('text/')) return 'Document';
  return 'Document';
}

const R2StorageService = {
  MAX_FILE_SIZE,
  isR2Configured: () => isR2Configured,

  /**
   * Set custom S3 client (used for testing or mock clients)
   */
  setClient(customClient) {
    r2Client = customClient;
  },

  getClient() {
    return r2Client;
  },

  getBucketName() {
    return R2_BUCKET_NAME;
  },

  /**
   * 1. Initialize Multipart Upload on Cloudflare R2
   */
  async initiateMultipartUpload({ filename, mimeType, size, folderId, userId }) {
    validateFileSize(size);

    if (!isAllowedFile({ filename, mimeType })) {
      throw new Error('Unsupported file format. Please upload an educational document, spreadsheet, presentation, image, archive, or code file.');
    }

    const safeExt = getFileExtension(filename) || 'bin';
    const safeBase = sanitizeFilename(filename.replace(/\.[^/.]+$/, ''));
    const uniqueId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');
    const storageKey = `resources/${folderId || 'general'}/${Date.now()}-${uniqueId}-${safeBase}.${safeExt}`;

    if (!isR2Configured && !r2Client) {
      throw new Error('Cloudflare R2 storage credentials are not configured on the server.');
    }

    const command = new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
      ContentType: mimeType || 'application/octet-stream',
      Metadata: {
        originalfilename: encodeURIComponent(filename),
        uploadedby: String(userId || 'anonymous'),
        folderid: String(folderId || 'general')
      }
    });

    const response = await r2Client.send(command);

    return {
      uploadId: response.UploadId,
      objectKey: storageKey,
      bucket: R2_BUCKET_NAME,
      maxFileSize: MAX_FILE_SIZE,
      partSize: 10 * 1024 * 1024 // 10 MB recommended part size for 200 MB files
    };
  },

  /**
   * 2. Generate Presigned URL for an Individual Multipart Part (PUT)
   */
  async getPresignedPartUrl({ objectKey, uploadId, partNumber, expiresIn = 3600 }) {
    if (!objectKey || !uploadId || !partNumber) {
      throw new Error('objectKey, uploadId, and partNumber are required.');
    }

    if (!isR2Configured && !r2Client) {
      throw new Error('Cloudflare R2 storage credentials are not configured on the server.');
    }

    const command = new UploadPartCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: Number(partNumber)
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return {
      partNumber: Number(partNumber),
      uploadUrl: presignedUrl,
      expiresIn
    };
  },

  /**
   * 3. Complete Multipart Upload on Cloudflare R2
   */
  async completeMultipartUpload({ objectKey, uploadId, parts }) {
    if (!objectKey || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      throw new Error('objectKey, uploadId, and completed parts array are required.');
    }

    if (!isR2Configured && !r2Client) {
      throw new Error('Cloudflare R2 storage credentials are not configured on the server.');
    }

    // Sort parts in ascending order by PartNumber (strictly required by S3/R2 specification)
    const sortedParts = parts
      .map(p => ({
        PartNumber: Number(p.PartNumber || p.partNumber),
        ETag: String(p.ETag || p.etag).replace(/^"|"$/g, '"') // ensure clean quoted ETag
      }))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts
      }
    });

    const response = await r2Client.send(command);
    return {
      location: response.Location || '',
      etag: response.ETag,
      objectKey: response.Key || objectKey
    };
  },

  /**
   * 4. Abort Multipart Upload on Cloudflare R2
   */
  async abortMultipartUpload({ objectKey, uploadId }) {
    if (!objectKey || !uploadId) return false;

    if (!isR2Configured && !r2Client) return false;

    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        UploadId: uploadId
      });
      await r2Client.send(command);
      return true;
    } catch (err) {
      console.warn(`[R2] Warning aborting multipart upload (${uploadId}):`, err.message);
      return false;
    }
  },

  /**
   * 5. Get Temporary Signed Download/Preview URL
   */
  async getPresignedDownloadUrl({ objectKey, originalFileName = 'file', expiresIn = 7200 }) {
    if (!objectKey) return null;

    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${objectKey}`;
    }

    if (!isR2Configured && !r2Client) return null;

    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(originalFileName)}"`
      });
      return await getSignedUrl(r2Client, command, { expiresIn });
    } catch (err) {
      console.error('[R2] Error generating download URL:', err.message);
      return null;
    }
  },

  /**
   * 6. Delete Object from Cloudflare R2
   */
  async deleteObject(objectKey) {
    if (!objectKey) return false;

    if (!isR2Configured && !r2Client) return false;

    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey
      });
      await r2Client.send(command);
      return true;
    } catch (err) {
      console.warn(`[R2] Warning deleting object (${objectKey}):`, err.message);
      return false;
    }
  },

  validateFileSize,
  isAllowedFile,
  formatBytes,
  getFileTypeCategory,
  getFileExtension,
  sanitizeFilename
};

module.exports = R2StorageService;
