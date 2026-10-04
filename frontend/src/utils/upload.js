/**
 * Cloudflare R2 Direct Multipart Upload Client
 *
 * High-speed direct browser-to-R2 upload architecture:
 * - Direct S3/R2 PUT transfer without routing large payloads through Node/Express
 * - Controlled concurrency (3-4 simultaneous parts)
 * - Part slicing (10 MB chunks) with automatic part-level retries & exponential backoff
 * - Real-time MB/s moving-average bandwidth calculation and accurate ETA
 * - Graceful cancellation and R2 multipart abort cleanup
 */

export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB (209,715,200 bytes)
export const DEFAULT_PART_SIZE = 10 * 1024 * 1024; // 10 MB per part (min 5 MB)
export const MAX_CONCURRENCY = 4; // 3–5 concurrent parts
export const MAX_RETRIES_PER_PART = 3;

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

  // Frontend 200 MB strict enforcement
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the maximum allowed size of 200 MB.');
  }

  if (file.size <= 0) {
    throw new Error('Selected file is empty (0 bytes).');
  }

  const ext = getFileExtension(file.name);
  if (ext && !SUPPORTED_EXTENSIONS.includes(ext)) {
    // If extension is known and unsupported, throw warning
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

const getAuthHeaders = () => {
  const userSession = localStorage.getItem('loop_current_user');
  const headers = { 'Content-Type': 'application/json' };
  if (userSession) {
    try {
      const { token } = JSON.parse(userSession);
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {}
  }
  return headers;
};

/**
 * Execute Direct Cloudflare R2 Multipart Upload
 */
export async function uploadDirectR2({
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
  const headers = getAuthHeaders();

  // 1. Initiate Multipart Upload with Node/Express authorization
  let initRes = null;
  let is404Fallback = false;

  try {
    initRes = await fetch(`${cleanApiUrl}/resources/upload/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        folderId: folderId || 'system-placement-material'
      }),
      signal: abortController?.signal
    });

    if (initRes.status === 404) {
      // Try alias route
      const aliasRes = await fetch(`${cleanApiUrl}/resources/init-upload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          folderId: folderId || 'system-placement-material'
        }),
        signal: abortController?.signal
      });

      if (aliasRes.status === 404) {
        is404Fallback = true;
      } else {
        initRes = aliasRes;
      }
    }
  } catch (netErr) {
    if (abortController?.signal?.aborted) throw netErr;
    console.warn('[Upload] Initiate request failed, falling back to legacy endpoint:', netErr);
    return uploadLegacyFallback({ file, title, description, category, folderId, semester, year, tags, apiUrl: cleanApiUrl, onProgress, abortController });
  }

  // If backend returns 404 (Render has not yet deployed the new R2 endpoints)
  if (is404Fallback || (initRes && initRes.status === 404)) {
    console.warn('[Upload] Backend returned 404 for multipart initiate. Falling back to active server upload endpoint.');
    return uploadLegacyFallback({ file, title, description, category, folderId, semester, year, tags, apiUrl: cleanApiUrl, onProgress, abortController });
  }

  if (!initRes || !initRes.ok) {
    const err = await (initRes ? initRes.json().catch(() => ({})) : Promise.resolve({}));
    throw new Error(err.error || `Upload authorization failed (${initRes?.status || 'Network Error'})`);
  }

  const initData = await initRes.json();
  const { uploadId, objectKey, provider } = initData;

  // If backend instructed fallback to legacy stream/upload
  if (provider === 'gridfs' || provider === 'legacy') {
    return uploadLegacyFallback({ file, title, description, category, folderId, semester, year, tags, apiUrl: cleanApiUrl, onProgress, abortController });
  }

  const partSize = initData.partSize || DEFAULT_PART_SIZE;
  const totalParts = Math.max(1, Math.ceil(file.size / partSize));
  const concurrency = initData.maxConcurrency || MAX_CONCURRENCY;

  // Track state across chunks
  const completedParts = [];
  const partProgress = new Array(totalParts).fill(0);
  let startTime = Date.now();
  let lastSpeedCalcTime = startTime;
  let lastSpeedCalcBytes = 0;
  let smoothedSpeed = 0;

  const emitProgress = () => {
    if (!onProgress) return;
    const loadedBytes = partProgress.reduce((sum, p) => sum + p, 0);
    const totalBytes = file.size;
    const percent = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));

    const now = Date.now();
    const timeDelta = (now - lastSpeedCalcTime) / 1000;
    if (timeDelta >= 0.3) {
      const bytesDelta = loadedBytes - lastSpeedCalcBytes;
      const currentSpeed = bytesDelta / timeDelta;
      smoothedSpeed = smoothedSpeed === 0 ? currentSpeed : (0.7 * smoothedSpeed + 0.3 * currentSpeed);
      lastSpeedCalcTime = now;
      lastSpeedCalcBytes = loadedBytes;
    }

    const remainingBytes = Math.max(0, totalBytes - loadedBytes);
    const remainingSecs = smoothedSpeed > 0 ? Math.round(remainingBytes / smoothedSpeed) : null;

    onProgress({
      percent,
      loadedBytes,
      totalBytes,
      loadedFormatted: formatBytes(loadedBytes),
      totalFormatted: formatBytes(totalBytes),
      speedFormatted: formatSpeed(smoothedSpeed),
      etaFormatted: formatEta(remainingSecs),
      remainingSecs
    });
  };

  // Helper: Upload a single chunk with retry
  const uploadChunk = async (partNumber) => {
    const startByte = (partNumber - 1) * partSize;
    const endByte = Math.min(file.size, startByte + partSize);
    const chunkBlob = file.slice(startByte, endByte);
    const chunkSize = endByte - startByte;

    let attempt = 0;
    while (attempt < MAX_RETRIES_PER_PART) {
      if (abortController?.signal?.aborted) {
        throw new Error('Upload cancelled');
      }

      try {
        // Request presigned PUT URL for this part from backend
        const urlRes = await fetch(`${cleanApiUrl}/resources/upload/part-url`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ uploadId, objectKey, partNumber }),
          signal: abortController?.signal
        });

        if (!urlRes.ok) {
          const urlErr = await urlRes.json().catch(() => ({}));
          throw new Error(urlErr.error || `Failed to acquire upload URL for Part ${partNumber}`);
        }

        const { uploadUrl } = await urlRes.json();

        // Direct PUT to Cloudflare R2 using XMLHttpRequest to monitor precise byte transfer
        const etag = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

          if (abortController) {
            abortController.signal.addEventListener('abort', () => {
              xhr.abort();
              reject(new Error('Upload cancelled'));
            });
          }

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              partProgress[partNumber - 1] = event.loaded;
              emitProgress();
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              partProgress[partNumber - 1] = chunkSize;
              emitProgress();
              // Cloudflare R2 returns ETag in response headers
              const resEtag = xhr.getResponseHeader('ETag');
              resolve(resEtag || `"${partNumber}"`);
            } else {
              reject(new Error(`Part ${partNumber} failed with HTTP status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error(`Network error uploading Part ${partNumber}`));
          xhr.ontimeout = () => reject(new Error(`Timeout uploading Part ${partNumber}`));

          xhr.send(chunkBlob);
        });

        completedParts.push({ PartNumber: partNumber, ETag: etag });
        return; // Success
      } catch (err) {
        if (err.message === 'Upload cancelled' || abortController?.signal?.aborted) {
          throw err;
        }

        attempt++;
        if (attempt >= MAX_RETRIES_PER_PART) {
          throw new Error(`Upload failed on Part ${partNumber} after ${MAX_RETRIES_PER_PART} attempts: ${err.message}`);
        }

        // Exponential backoff: wait 1s, 2s before retry
        const backoffMs = Math.pow(2, attempt) * 500;
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }
  };

  try {
    // 2. Controlled concurrency queue: upload parts (3-4 concurrently)
    const queue = [];
    for (let p = 1; p <= totalParts; p++) {
      queue.push(p);
    }

    const workers = new Array(Math.min(concurrency, totalParts)).fill(null).map(async () => {
      while (queue.length > 0) {
        const nextPartNumber = queue.shift();
        if (nextPartNumber) {
          await uploadChunk(nextPartNumber);
        }
      }
    });

    await Promise.all(workers);

    // 3. Complete Multipart Upload on backend
    if (onProgress) {
      onProgress({ percent: 99, speedFormatted: 'Finalizing...', etaFormatted: 'A few seconds...' });
    }

    const completeRes = await fetch(`${cleanApiUrl}/resources/upload/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        uploadId,
        objectKey,
        parts: completedParts,
        filename: file.name,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        description,
        category,
        folderId,
        semester,
        year,
        tags,
        size: file.size,
        mimeType: file.type || 'application/octet-stream'
      }),
      signal: abortController?.signal
    });

    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => ({}));
      throw new Error(err.error || `Failed to finalize R2 upload (${completeRes.status})`);
    }

    const finalResource = await completeRes.json();

    if (onProgress) {
      onProgress({
        percent: 100,
        loadedBytes: file.size,
        totalBytes: file.size,
        speedFormatted: 'Done',
        etaFormatted: 'Complete'
      });
    }

    return finalResource;
  } catch (err) {
    // Abort R2 multipart upload to free up temporary parts on Cloudflare
    if (uploadId && objectKey) {
      try {
        await fetch(`${cleanApiUrl}/resources/upload/abort`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ uploadId, objectKey })
        });
      } catch (abortErr) {
        console.warn('Could not abort R2 upload:', abortErr.message);
      }
    }
    throw err;
  }
}

/**
 * Fallback Upload for active server endpoints
 * Handles direct base64 / json posting to /resources or /pending-resources with full XHR progress
 */
async function uploadLegacyFallback({ file, title, description, category, folderId, semester, year, tags, apiUrl, onProgress, abortController }) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size is ${formatBytes(file.size)}. Maximum allowed size is 200 MB.`);
  }

  const userSession = localStorage.getItem('loop_current_user');
  let isAdmin = false;
  let token = null;
  if (userSession) {
    try {
      const parsed = JSON.parse(userSession);
      isAdmin = parsed.isAdmin || parsed.role === 'Administrator' || parsed.role === 'Admin';
      token = parsed.token;
    } catch (e) {}
  }

  const targetEndpoint = isAdmin ? `${apiUrl}/resources` : `${apiUrl}/pending-resources`;

  // Emit reading status
  if (onProgress) {
    onProgress({
      percent: 5,
      loadedBytes: 0,
      totalBytes: file.size,
      loadedFormatted: '0 B',
      totalFormatted: formatBytes(file.size),
      speedFormatted: 'Preparing...',
      etaFormatted: 'Starting...'
    });
  }

  // Read file into Data URL
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const readPct = Math.min(20, Math.round((e.loaded / e.total) * 20));
        onProgress({
          percent: readPct,
          loadedBytes: Math.round(e.loaded * 0.2),
          totalBytes: file.size,
          loadedFormatted: formatBytes(e.loaded),
          totalFormatted: formatBytes(file.size),
          speedFormatted: 'Reading file...',
          etaFormatted: 'A few moments...'
        });
      }
    };
    reader.readAsDataURL(file);
  });

  if (abortController?.signal?.aborted) {
    throw new Error('Upload cancelled');
  }

  const payload = {
    title: title || file.name.replace(/\.[^/.]+$/, ''),
    description: description || '',
    category: category || 'General',
    folderId: folderId || 'system-placement-material',
    link: dataUrl,
    originalFileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size
  };
  if (semester) payload.semester = semester;
  if (year) payload.year = year;
  if (tags) payload.tags = tags;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', targetEndpoint);
    xhr.setRequestHeader('Content-Type', 'application/json');
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
          // Map progress smoothly from 20% to 95%
          const pct = Math.min(95, 20 + Math.round((event.loaded / event.total) * 75));
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          if (timeDiff >= 0.3) {
            const currentSpeed = (event.loaded - lastLoaded) / timeDiff;
            smoothedSpeed = smoothedSpeed === 0 ? currentSpeed : (0.7 * smoothedSpeed + 0.3 * currentSpeed);
            lastLoaded = event.loaded;
            lastTime = now;
          }
          const remainingSecs = smoothedSpeed > 0 ? Math.round((event.total - event.loaded) / smoothedSpeed) : null;

          if (onProgress) {
            onProgress({
              percent: pct,
              loadedBytes: Math.min(file.size, Math.round((event.loaded / event.total) * file.size)),
              totalBytes: file.size,
              loadedFormatted: formatBytes(Math.min(file.size, Math.round((event.loaded / event.total) * file.size))),
              totalFormatted: formatBytes(file.size),
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
            etaFormatted: 'Complete'
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

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    xhr.send(JSON.stringify(payload));
  });
}

/**
 * Fallback Stream (Delegates to legacy upload or streaming)
 */
function uploadFallbackStream(params) {
  return uploadLegacyFallback(params);
}
