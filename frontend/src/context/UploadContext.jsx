import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { uploadResourceStream } from '../utils/upload';

const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState([]);
  const [isDockMinimized, setIsDockMinimized] = useState(false);
  const activeControllersRef = useRef(new Map());

  const startUpload = useCallback(async ({ file, title, description, category, folderId, semester, year, tags }, onComplete) => {
    const uploadId = 'up-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const abortController = new AbortController();
    activeControllersRef.current.set(uploadId, abortController);

    const newUpload = {
      id: uploadId,
      file,
      fileName: file.name,
      fileSize: file.size,
      title: title || file.name,
      folderId,
      percent: 0,
      speedFormatted: 'Starting...',
      etaFormatted: 'Calculating...',
      remainingSecs: null,
      loadedFormatted: '0 B',
      totalFormatted: '',
      status: 'uploading', // 'uploading' | 'completed' | 'error' | 'cancelled'
      error: null,
      startedAt: Date.now()
    };

    setUploads(prev => [newUpload, ...prev]);
    setIsDockMinimized(false); // Pop up dock when new upload starts

    try {
      const result = await uploadResourceStream({
        file,
        title,
        description,
        category,
        folderId,
        semester,
        year,
        tags,
        onProgress: (stats) => {
          setUploads(prev => prev.map(u => {
            if (u.id !== uploadId) return u;
            return {
              ...u,
              percent: stats.percent,
              speedFormatted: stats.speedFormatted,
              etaFormatted: stats.etaFormatted,
              remainingSecs: stats.remainingSecs,
              loadedFormatted: stats.loadedFormatted,
              totalFormatted: stats.totalFormatted
            };
          }));
        },
        abortController
      });

      // Mark completed
      setUploads(prev => prev.map(u => {
        if (u.id !== uploadId) return u;
        return {
          ...u,
          percent: 100,
          status: 'completed',
          speedFormatted: 'Done',
          remainingSecs: 0,
          completedAt: Date.now()
        };
      }));

      // Notify any listening components (like Resources.jsx) to refresh
      window.dispatchEvent(new CustomEvent('loop_resource_uploaded', { detail: { folderId, resource: result } }));

      if (onComplete) onComplete(result);

      // Auto-remove completed upload after 8 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId));
      }, 8000);

      return result;
    } catch (err) {
      if (err.message === 'Upload cancelled') {
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'cancelled', speedFormatted: 'Cancelled' } : u));
      } else {
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u));
      }
      throw err;
    } finally {
      activeControllersRef.current.delete(uploadId);
    }
  }, []);

  const cancelUpload = useCallback((id) => {
    const controller = activeControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      activeControllersRef.current.delete(id);
    }
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const dismissUpload = useCallback((id) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const toggleDock = useCallback(() => {
    setIsDockMinimized(prev => !prev);
  }, []);

  return (
    <UploadContext.Provider value={{
      uploads,
      activeCount: uploads.filter(u => u.status === 'uploading').length,
      isDockMinimized,
      toggleDock,
      startUpload,
      cancelUpload,
      dismissUpload
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
