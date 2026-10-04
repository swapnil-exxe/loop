import { useState, useRef, useCallback } from 'react';
import { uploadResourceStream, validateFile } from '../utils/upload';

/**
 * Custom React hook for MongoDB GridFS Stream Uploads
 *
 * States managed:
 * 'idle' | 'initializing' | 'uploading' | 'completing' | 'success' | 'error' | 'cancelled'
 */
export function useMultipartUpload() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState({
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
    loadedFormatted: '0 B',
    totalFormatted: '',
    speedFormatted: 'Preparing...',
    etaFormatted: 'Calculating...',
    remainingSecs: null
  });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const abortControllerRef = useRef(null);

  const startUpload = useCallback(async ({
    file,
    title,
    description,
    category,
    folderId,
    semester,
    year,
    tags,
    apiUrl
  }) => {
    try {
      validateFile(file);
      setError(null);
      setResult(null);
      setStatus('initializing');
      setProgress({
        percent: 0,
        loadedBytes: 0,
        totalBytes: file.size,
        loadedFormatted: '0 B',
        totalFormatted: '',
        speedFormatted: 'Starting upload...',
        etaFormatted: 'Calculating...',
        remainingSecs: null
      });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStatus('uploading');

      const uploadedResource = await uploadResourceStream({
        file,
        title,
        description,
        category,
        folderId,
        semester,
        year,
        tags,
        apiUrl,
        onProgress: (stats) => {
          if (stats.percent >= 99 && status !== 'completing') {
            setStatus('completing');
          }
          setProgress(prev => ({ ...prev, ...stats }));
        },
        abortController: controller
      });

      setStatus('success');
      setResult(uploadedResource);
      return uploadedResource;
    } catch (err) {
      if (err.message === 'Upload cancelled' || abortControllerRef.current?.signal?.aborted) {
        setStatus('cancelled');
        setError('Upload was cancelled.');
      } else {
        setStatus('error');
        setError(err.message || 'Upload failed.');
      }
      throw err;
    } finally {
      abortControllerRef.current = null;
    }
  }, [status]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('cancelled');
      setError('Upload was cancelled by user.');
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setError(null);
    setResult(null);
    setProgress({
      percent: 0,
      loadedBytes: 0,
      totalBytes: 0,
      loadedFormatted: '0 B',
      totalFormatted: '',
      speedFormatted: 'Preparing...',
      etaFormatted: 'Calculating...',
      remainingSecs: null
    });
  }, []);

  return {
    status,
    isIdle: status === 'idle',
    isInitializing: status === 'initializing',
    isUploading: status === 'uploading',
    isCompleting: status === 'completing',
    isSuccess: status === 'success',
    isError: status === 'error',
    isCancelled: status === 'cancelled',
    progress,
    error,
    result,
    startUpload,
    cancelUpload,
    reset
  };
}
