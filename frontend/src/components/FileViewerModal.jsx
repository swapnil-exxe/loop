import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, 
  Maximize2, Minimize2, FileText, AlertCircle, Loader, FileCode,
  FileSpreadsheet, Image as ImageIcon, Presentation
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { getResourceFileUrl, downloadResourceFile, formatBytes } from '../utils/db';

// Configure PDF.js worker using Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function FileViewerModal({ 
  file, 
  files = [], 
  onClose,
  onNavigate
}) {
  const [scale, setScale] = useState(1.0);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState('');

  const canvasRef = useRef(null);
  const stageScrollRef = useRef(null);
  const pdfDocRef = useRef(null);

  // File identity and format determination
  const fileUrl = getResourceFileUrl(file);
  const mimeType = (file?.mimeType || '').toLowerCase();
  const fileType = file?.type || '';
  const fileName = file?.originalFileName || file?.fileName || file?.title || '';
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';

  const isPdf = ext === 'pdf' || mimeType === 'application/pdf' || fileType === 'PDF';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) || mimeType.startsWith('image/');
  const isCodeOrText = ['txt', 'csv', 'java', 'py', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h', 'css', 'html', 'json', 'xml', 'sql', 'md', 'log'].includes(ext) || mimeType.startsWith('text/');
  const isOfficeDoc = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'odt', 'ods', 'odp'].includes(ext);

  // Index and sibling files within the current folder
  const currentIndex = files.findIndex(f => f.id === file?.id);
  const totalFilesInFolder = files.length;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < totalFilesInFolder - 1;

  const handlePrev = (e) => {
    e?.stopPropagation?.();
    if (hasPrevious && onNavigate) {
      onNavigate(files[currentIndex - 1]);
    }
  };

  const handleNext = (e) => {
    e?.stopPropagation?.();
    if (hasNext && onNavigate) {
      onNavigate(files[currentIndex + 1]);
    }
  };

  // Lock body scroll completely while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard navigation (Escape, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrevious, hasNext, currentIndex]);

  // Fetch file with authorization header to create clean blob URL
  useEffect(() => {
    let active = true;
    let createdUrl = null;

    if (!fileUrl || fileUrl === '#') {
      setError('File link is not available.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setTextContent('');
    setScale(1.0);
    setPageNum(1);
    setNumPages(0);
    pdfDocRef.current = null;

    // Fast-path for non-previewable office binaries (PPTX, DOCX, XLSX, ZIP)
    if (isOfficeDoc || (!isPdf && !isImage && !isCodeOrText)) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 25000); // 25s safeguard against infinite spinner

    const loadFile = async () => {
      try {
        const userSession = localStorage.getItem('loop_current_user');
        const headers = {};
        if (userSession) {
          try {
            const { token } = JSON.parse(userSession);
            if (token) headers['Authorization'] = `Bearer ${token}`;
          } catch (e) {}
        }

        const res = await fetch(fileUrl, { 
          headers, 
          signal: abortController.signal 
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Failed to load file content (${res.status})`);
        }

        const blob = await res.blob();
        if (!active) return;

        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);

        if (isPdf) {
          const arrayBuffer = await blob.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const doc = await loadingTask.promise;
          if (!active) return;
          pdfDocRef.current = doc;
          setNumPages(doc.numPages);
          setPageNum(1);
          setLoading(false);
        } else if (isCodeOrText) {
          const text = await blob.text();
          if (!active) return;
          setTextContent(text.slice(0, 500000));
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!active) return;
        if (err.name === 'AbortError') {
          setError('Preview timed out. You can download the file to view it locally.');
        } else {
          console.error('FileViewer preview load error:', err);
          setError(err.message || 'Unable to preview this file in browser.');
        }
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      abortController.abort();
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file?.id, fileUrl, isPdf, isImage, isCodeOrText, isOfficeDoc]);

  // Render PDF page on canvas with responsive fit-to-width/aspect ratio calculation
  useEffect(() => {
    if (!isPdf || !pdfDocRef.current || !canvasRef.current || loading || error) return;

    let renderTask = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        if (isCancelled) return;

        // Base unscaled viewport
        const baseViewport = page.getViewport({ scale: 1.0 });
        
        // Calculate available display dimensions inside the scroll stage
        const containerWidth = stageScrollRef.current ? (stageScrollRef.current.clientWidth - 48) : 900;
        const autoFitScale = Math.min(1.4, Math.max(0.75, containerWidth / baseViewport.width));
        const effectiveScale = autoFitScale * scale;

        const viewport = page.getViewport({ scale: effectiveScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        if (!isCancelled && err.name !== 'RenderingCancelledException') {
          console.error('PDF page render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [isPdf, pageNum, scale, loading, error]);

  // Safe Binary Download Handler (prevents duplicate clicks and event propagation)
  const handleDownload = async (e) => {
    e?.stopPropagation?.();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadResourceFile(file);
    } catch (err) {
      console.error('Modal download error:', err);
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const getFormatBadge = () => {
    if (isPdf) return { label: 'PDF', bg: 'rgba(255, 69, 58, 0.25)', text: '#ff453a' };
    if (isImage) return { label: (ext || 'IMAGE').toUpperCase(), bg: 'rgba(10, 132, 255, 0.25)', text: '#0a84ff' };
    if (isCodeOrText) return { label: (ext || 'CODE').toUpperCase(), bg: 'rgba(48, 209, 88, 0.25)', text: '#30d158' };
    if (ext === 'pptx' || ext === 'ppt') return { label: 'PPTX', bg: 'rgba(255, 149, 0, 0.25)', text: '#ff9500' };
    if (ext === 'docx' || ext === 'doc') return { label: 'DOCX', bg: 'rgba(0, 122, 255, 0.25)', text: '#007aff' };
    if (ext === 'xlsx' || ext === 'xls') return { label: 'XLSX', bg: 'rgba(52, 199, 89, 0.25)', text: '#34c759' };
    return { label: (ext || 'FILE').toUpperCase(), bg: 'rgba(255, 255, 255, 0.15)', text: '#ffffff' };
  };

  const badge = getFormatBadge();

  // Pure Full-Viewport Modal via Portal
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#09090b',
        zIndex: 2147483647, // Maximum stacking context (guarantees viewer is above navbar, footer, modals)
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: 'var(--font-sans, sans-serif)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ======================================================== */}
      {/* 1. SLIM, FIXED TOP VIEWER TOOLBAR                         */}
      {/* ======================================================== */}
      <header style={{
        height: '56px',
        minHeight: '56px',
        backgroundColor: '#18181b',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        zIndex: 100,
        flexShrink: 0,
        gap: '1rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Left: File Name & Format Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, overflow: 'hidden' }}>
          <span style={{
            backgroundColor: badge.bg,
            color: badge.text,
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            letterSpacing: '0.04em',
            flexShrink: 0
          }}>
            {badge.label}
          </span>

          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              color: '#ffffff',
              marginRight: '0.6rem'
            }}>
              {file?.title || file?.originalFileName || 'File Preview'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              {file?.fileSizeFormatted ? `(${file.fileSizeFormatted})` : file?.size ? `(${formatBytes(file.size)})` : ''}
            </span>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* PDF Page Navigation */}
          {isPdf && !loading && !error && numPages > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '0.15rem 0.4rem',
              marginRight: '0.25rem'
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPageNum(p => Math.max(1, p - 1));
                }}
                disabled={pageNum <= 1}
                style={{
                  background: 'none',
                  border: 'none',
                  color: pageNum <= 1 ? '#52525b' : '#fff',
                  cursor: pageNum <= 1 ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex'
                }}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.78rem', color: '#e4e4e7', minWidth: '56px', textAlign: 'center' }}>
                {pageNum} / {numPages}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPageNum(p => Math.min(numPages, p + 1));
                }}
                disabled={pageNum >= numPages}
                style={{
                  background: 'none',
                  border: 'none',
                  color: pageNum >= numPages ? '#52525b' : '#fff',
                  cursor: pageNum >= numPages ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex'
                }}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Zoom Controls (PDF and Image) */}
          {(isPdf || isImage) && !loading && !error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '0.15rem 0.4rem',
              marginRight: '0.25rem'
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setScale(s => Math.max(0.5, s - 0.25));
                }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex' }}
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: '0.78rem', color: '#e4e4e7', minWidth: '42px', textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setScale(s => Math.min(3.0, s + 0.25));
                }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex' }}
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          )}

          {/* Folder File Navigation (Previous / Next) */}
          {totalFilesInFolder > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '0.15rem 0.35rem',
              marginRight: '0.25rem'
            }}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrevious}
                style={{
                  background: 'none',
                  border: 'none',
                  color: !hasPrevious ? '#52525b' : '#fff',
                  cursor: !hasPrevious ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Previous File (Left Arrow)"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.76rem', color: '#a1a1aa', padding: '0 4px', minWidth: '48px', textAlign: 'center' }}>
                {currentIndex >= 0 ? `${currentIndex + 1} of ${totalFilesInFolder}` : '•'}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                style={{
                  background: 'none',
                  border: 'none',
                  color: !hasNext ? '#52525b' : '#fff',
                  cursor: !hasNext ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Next File (Right Arrow)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Prominent Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            style={{
              backgroundColor: 'var(--accent-color, #0a84ff)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.95rem',
              cursor: downloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'opacity 0.15s ease'
            }}
            title="Download Original File"
          >
            <Download size={14} />
            <span>{downloading ? 'Downloading...' : 'Download'}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.45rem 0.65rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              marginLeft: '0.25rem'
            }}
            title="Close Viewer (Esc)"
          >
            <X size={16} />
            <span className="hide-on-mobile">Close</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. DEDICATED FULL-VIEWPORT SCROLLABLE STAGE               */}
      {/* Uses remaining 100% height without any clipping/overlap  */}
      {/* ======================================================== */}
      <main 
        ref={stageScrollRef}
        style={{
          flex: 1,
          width: '100%',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          overflowX: 'auto',
          backgroundColor: '#0c0c0e',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: (loading || error || isOfficeDoc || (!isPdf && !isImage && !isCodeOrText)) ? 'center' : 'flex-start',
          padding: '2rem 1.5rem',
          boxSizing: 'border-box',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Indicator */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            color: '#a1a1aa', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '0.85rem' 
          }}>
            <div style={{ animation: 'spin 1s linear infinite' }}>
              <Loader size={36} color="var(--accent-color, #0a84ff)" />
            </div>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>Loading file preview...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            textAlign: 'center',
            maxWidth: '440px',
            padding: '2.5rem 2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <AlertCircle size={44} color="#ff453a" style={{ marginBottom: '0.85rem' }} />
            <h4 style={{ color: '#fff', fontSize: '1.15rem', margin: '0 0 0.5rem 0' }}>Preview Unavailable</h4>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                backgroundColor: 'var(--accent-color, #0a84ff)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <Download size={16} /> Download File
            </button>
          </div>
        )}

        {/* 1. PDF Canvas View (Centered, aspect-ratio preserved, vertical scrolling supported) */}
        {isPdf && !loading && !error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            paddingBottom: '2.5rem'
          }}>
            <canvas
              ref={canvasRef}
              style={{
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.85)',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                maxWidth: '100%',
                display: 'block'
              }}
            />
          </div>
        )}

        {/* 2. Image View (Contained, centered, zoom supported) */}
        {isImage && !loading && !error && blobUrl && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            paddingBottom: '2rem'
          }}>
            <img
              src={blobUrl}
              alt={file?.title || 'Preview'}
              style={{
                transform: `scale(${scale})`,
                transition: 'transform 0.15s ease',
                maxWidth: scale <= 1.0 ? '100%' : 'none',
                maxHeight: scale <= 1.0 ? 'calc(100vh - 120px)' : 'none',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)'
              }}
            />
          </div>
        )}

        {/* 3. Text & Code File View */}
        {isCodeOrText && !isPdf && !isImage && !loading && !error && (
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            minHeight: '75vh',
            backgroundColor: '#111113',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            overflow: 'auto',
            boxSizing: 'border-box',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <pre style={{
              margin: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.88rem',
              lineHeight: '1.65',
              color: '#e4e4e7',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              <code>{textContent || 'Empty file'}</code>
            </pre>
          </div>
        )}

        {/* 4. Format-Aware Fallback (PPTX, DOCX, XLSX, ZIP, etc.) */}
        {!isPdf && !isImage && !isCodeOrText && !loading && !error && (
          <div style={{
            textAlign: 'center',
            maxWidth: '480px',
            padding: '3rem 2.25rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              backgroundColor: badge.bg,
              color: badge.text,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              {ext === 'pptx' || ext === 'ppt' ? <Presentation size={34} /> :
               ext === 'xlsx' || ext === 'xls' ? <FileSpreadsheet size={34} /> :
               isCodeOrText ? <FileCode size={34} /> :
               <FileText size={34} />}
            </div>

            <h4 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
              {file?.title || file?.originalFileName}
            </h4>

            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 1.75rem 0', lineHeight: '1.55' }}>
              Preview is not available for this file type ({badge.label}). You can download the file to open it with your device application.
            </p>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              style={{
                backgroundColor: 'var(--accent-color, #0a84ff)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: downloading ? 'wait' : 'pointer',
                transition: 'opacity 0.15s ease'
              }}
            >
              <Download size={18} />
              <span>{downloading ? 'Downloading...' : 'Download File'}</span>
            </button>
          </div>
        )}
      </main>
    </div>,
    document.body
  );
}
