/**
 * Optimized MongoDB GridFS Streaming Upload Client
 *
 * Architecture:
 * - Direct HTTP streaming from browser into Node.js Express busboy stream into MongoDB GridFS
 * - No external storage services, no Cloudflare R2, no AWS S3, no API keys, no payment setup
 * - Real-time MB/s bandwidth speed calculation and accurate ETA countdown
 * - Instant request cancellation via AbortController
 * - High-speed 4 MB chunk streaming directly to MongoDB Atlas
 */

export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB (209,715,200 bytes)

export const SUPPORTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
  'xls', 'xlsx', 'csv', 'ods',
  'ppt', 'pptx', 'odp',
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
  'zip', 'rar', '7z',
  'java', 'py', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h',
  'css', 'html', 'json', 'xml', 'sql', 'md'
];

export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec <= 0) return 'Preparing...';
  const mbps = bytesPerSec / (1024 * 1024);
  if (mbps >= 1.0) {
    return `${mbps.toFixed(1)} MB/s`;
  }
  const kbps = bytesPerSec / 1024;
  return `${kbps.toFixed(0)} KB/s`;
};

export const formatEta = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return 'Calculating...';
  }
  if (seconds === 0) return 'Finishing...';
  if (seconds < 60) return `${Math.ceil(seconds)} sec`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s`;
};

export const getFileExtension = (filename = '') => {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop().toLowerCase().trim();
};

export const validateFile = (file) => {
  if (!file) {
    throw new Error('Please select a file to upload.');
  }

  // Strictly enforce 200 MB limit
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the maximum allowed size of 200 MB.');
  }

  if (file.size <= 0) {
    throw new Error('Selected file is empty (0 bytes).');
  }

  const ext = getFileExtension(file.name);
  if (ext && !SUPPORTED_EXTENSIONS.includes(ext)) {
    const cleanMime = (file.type || '').toLowerCase();
    const isCommonType = cleanMime.startsWith('image/') || 
                         cleanMime.startsWith('text/') || 
                         cleanMime.includes('pdf') || 
                         cleanMime.includes('document') ||
                         cleanMime.includes('sheet') ||
                         cleanMime.includes('presentation') ||
                         cleanMime.includes('zip');
    if (!isCommonType) {
      throw new Error(`Unsupported file type (.${ext}). Please upload an educational document, spreadsheet, presentation, image, archive, or code file.`);
    }
  }

  return true;
};

/**
 * Execute High-Speed Direct Stream Upload into MongoDB GridFS
 */
export function uploadResourceStream({
  file,
  title,
  description,
  category,
  folderId,
  semester,
  year,
  tags,
  apiUrl = 'https://loop-qnh9.onrender.com/api',
  onProgress,
  abortController
}) {
  validateFile(file);

  const cleanApiUrl = apiUrl.replace(/\/$/, '');
  const userSession = localStorage.getItem('loop_current_user');
  let token = null;
  let isAdmin = false;

  if (userSession) {
    try {
      const parsed = JSON.parse(userSession);
      token = parsed.token;
      isAdmin = Boolean(parsed.isAdmin || parsed.role === 'Admin' || parsed.role === 'Administrator');
    } catch (e) {}
  }

  const targetEndpoint = isAdmin 
    ? `${cleanApiUrl}/resources/upload-stream` 
    : `${cleanApiUrl}/pending-resources/upload-stream`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', targetEndpoint);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (abortController) {
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
    }

    let lastLoaded = 0;
    let lastTime = Date.now();
    let smoothedSpeed = 0;

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;

          if (timeDiff >= 0.3) {
            const currentSpeed = (event.loaded - lastLoaded) / timeDiff;
            smoothedSpeed = smoothedSpeed === 0 ? currentSpeed : (0.7 * smoothedSpeed + 0.3 * currentSpeed);
            lastLoaded = event.loaded;
            lastTime = now;
          }

          const remainingBytes = Math.max(0, event.total - event.loaded);
          const remainingSecs = smoothedSpeed > 0 ? Math.round(remainingBytes / smoothedSpeed) : null;

          if (onProgress) {
            onProgress({
              percent,
              loadedBytes: event.loaded,
              totalBytes: event.total,
              loadedFormatted: formatBytes(event.loaded),
              totalFormatted: formatBytes(event.total),
              speedFormatted: formatSpeed(smoothedSpeed),
              etaFormatted: formatEta(remainingSecs),
              remainingSecs
            });
          }
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) {
          onProgress({
            percent: 100,
            loadedBytes: file.size,
            totalBytes: file.size,
            loadedFormatted: formatBytes(file.size),
            totalFormatted: formatBytes(file.size),
            speedFormatted: 'Done',
            etaFormatted: 'Complete',
            remainingSecs: 0
          });
        }
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Upload failed with status ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Please check your connection.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out.'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', (title && title.trim()) || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('description', description || '');
    formData.append('category', category || 'General');
    formData.append('folderId', folderId || 'system-placement-material');
    if (semester) formData.append('semester', semester);
    if (year) formData.append('year', year);
    if (tags) {
      formData.append('tags', Array.isArray(tags) ? tags.join(', ') : tags);
    }

    xhr.send(formData);
  });
}

// Aliases for compatibility
export const uploadDirectGridFS = uploadResourceStream;
export const uploadDirectR2 = uploadResourceStream;
export default uploadResourceStream;
