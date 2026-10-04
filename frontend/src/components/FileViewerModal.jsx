import React, { useState, useEffect, useRef } from 'react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState('');

  const canvasRef = useRef(null);
  const modalContainerRef = useRef(null);
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
    }, 25000); // 25s timeout safeguard against infinite spinner

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
          throw new Error(`Failed to load file preview (${res.status})`);
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
          setTextContent(text.slice(0, 500000)); // safe 500KB cap for browser DOM
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

  // Render PDF page on canvas when pageNum or scale changes
  useEffect(() => {
    if (!isPdf || !pdfDocRef.current || !canvasRef.current || loading || error) return;

    let renderTask = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
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
          console.error('Page render error:', err);
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

  // Fullscreen toggle
  const toggleFullscreen = (e) => {
    e?.stopPropagation?.();
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Safe Binary Download Handler (prevents duplicate clicks and event propagation)
  const handleDownload = async (e) => {
    e?.stopPropagation?.();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadResourceFile(file);
    } catch (err) {
      console.error('Modal download error:', err);
      // Fallback direct window download
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const getFormatBadge = () => {
    if (isPdf) return { label: 'PDF', bg: 'rgba(255, 69, 58, 0.2)', text: '#ff453a' };
    if (isImage) return { label: (ext || 'IMAGE').toUpperCase(), bg: 'rgba(10, 132, 255, 0.2)', text: '#0a84ff' };
    if (isCodeOrText) return { label: (ext || 'CODE').toUpperCase(), bg: 'rgba(48, 209, 88, 0.2)', text: '#30d158' };
    if (ext === 'pptx' || ext === 'ppt') return { label: 'PPTX', bg: 'rgba(255, 149, 0, 0.2)', text: '#ff9500' };
    if (ext === 'docx' || ext === 'doc') return { label: 'DOCX', bg: 'rgba(0, 122, 255, 0.2)', text: '#007aff' };
    if (ext === 'xlsx' || ext === 'xls') return { label: 'XLSX', bg: 'rgba(52, 199, 89, 0.2)', text: '#34c759' };
    return { label: (ext || 'FILE').toUpperCase(), bg: 'rgba(255, 255, 255, 0.12)', text: '#ffffff' };
  };

  const badge = getFormatBadge();

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '1.5rem',
        overflow: 'hidden'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div 
        ref={modalContainerRef}
        style={{
          width: isFullscreen ? '100vw' : '92vw',
          maxWidth: isFullscreen ? '100vw' : '1080px',
          height: isFullscreen ? '100vh' : '88vh',
          maxHeight: isFullscreen ? '100vh' : '820px',
          backgroundColor: '#151517',
          border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: isFullscreen ? '0' : '18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          color: '#ffffff',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* HEADER BAR                                                */}
        {/* ======================================================== */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1b1b1e',
          flexShrink: 0,
          gap: '1rem',
          zIndex: 10
        }}>
          {/* File Name & Metadata Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, overflow: 'hidden' }}>
            <span style={{
              backgroundColor: badge.bg,
              color: badge.text,
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.22rem 0.55rem',
              borderRadius: '6px',
              letterSpacing: '0.04em',
              flexShrink: 0
            }}>
              {badge.label}
            </span>

            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: 700, 
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {file?.title || file?.originalFileName || 'File Preview'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#8e8e93', marginTop: '1px' }}>
                {file?.originalFileName || file?.fileName || ''}
                {file?.fileSizeFormatted ? ` • ${file.fileSizeFormatted}` : file?.size ? ` • ${formatBytes(file.size)}` : ''}
              </div>
            </div>
          </div>

          {/* Action & Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            {/* PDF Page Navigation */}
            {isPdf && !loading && !error && numPages > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
                    color: pageNum <= 1 ? '#444' : '#fff',
                    cursor: pageNum <= 1 ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    display: 'flex'
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.76rem', color: '#ccc', minWidth: '54px', textAlign: 'center' }}>
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
                    color: pageNum >= numPages ? '#444' : '#fff',
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
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
                <span style={{ fontSize: '0.76rem', color: '#ccc', minWidth: '40px', textAlign: 'center' }}>
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

            {/* Folder Previous / Next Navigation in Header */}
            {totalFilesInFolder > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
                    color: !hasPrevious ? '#444' : '#fff',
                    cursor: !hasPrevious ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Previous File in Folder"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.74rem', color: '#aaa', padding: '0 4px', minWidth: '46px', textAlign: 'center' }}>
                  {currentIndex >= 0 ? `${currentIndex + 1} / ${totalFilesInFolder}` : '•'}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasNext}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: !hasNext ? '#444' : '#fff',
                    cursor: !hasNext ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Next File in Folder"
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
                padding: '0.45rem 0.85rem',
                cursor: downloading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'opacity 0.15s ease'
              }}
              title="Download Original File"
            >
              <Download size={14} />
              <span>{downloading ? 'Downloading...' : 'Download'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
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
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '0.2rem'
              }}
              title="Close Preview (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PREVIEW CONTAINER STAGE (Overflow strictly contained)     */}
        {/* ======================================================== */}
        <div style={{
          flex: 1,
          width: '100%',
          overflow: 'auto',
          backgroundColor: '#0c0c0e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          {/* Loading Indicator */}
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              color: '#8e8e93', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }}>
              <div style={{ animation: 'spin 1s linear infinite' }}>
                <Loader size={34} color="var(--accent-color, #0a84ff)" />
              </div>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>Loading file preview...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{
              textAlign: 'center',
              maxWidth: '420px',
              padding: '2rem 1.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <AlertCircle size={40} color="#ff453a" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: '0 0 0.4rem 0' }}>Preview Unavailable</h4>
              <p style={{ color: '#999', fontSize: '0.82rem', margin: '0 0 1.25rem 0', lineHeight: '1.45' }}>
                {error}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                style={{
                  backgroundColor: 'var(--accent-color, #0a84ff)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} /> Download File
              </button>
            </div>
          )}

          {/* 1. PDF Canvas View */}
          {isPdf && !loading && !error && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              minHeight: '100%',
              boxSizing: 'border-box'
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}

          {/* 2. Image View (contained, no distortion, no overflow) */}
          {isImage && !loading && !error && blobUrl && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              overflow: 'auto',
              boxSizing: 'border-box'
            }}>
              <img
                src={blobUrl}
                alt={file?.title || 'Preview'}
                style={{
                  transform: `scale(${scale})`,
                  transition: 'transform 0.15s ease',
                  maxWidth: scale <= 1.0 ? '100%' : 'none',
                  maxHeight: scale <= 1.0 ? '100%' : 'none',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                }}
              />
            </div>
          )}

          {/* 3. Text & Code File View */}
          {isCodeOrText && !isPdf && !isImage && !loading && !error && (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#111113',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.25rem',
              overflow: 'auto',
              boxSizing: 'border-box'
            }}>
              <pre style={{
                margin: 0,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.85rem',
                lineHeight: '1.6',
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
              maxWidth: '460px',
              padding: '2.5rem 2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxSizing: 'border-box'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                backgroundColor: badge.bg,
                color: badge.text,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                {ext === 'pptx' || ext === 'ppt' ? <Presentation size={32} /> :
                 ext === 'xlsx' || ext === 'xls' ? <FileSpreadsheet size={32} /> :
                 isCodeOrText ? <FileCode size={32} /> :
                 <FileText size={32} />}
              </div>

              <h4 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                {file?.title || file?.originalFileName}
              </h4>

              <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 1.75rem 0', lineHeight: '1.5' }}>
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
                  padding: '0.7rem 1.75rem',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: downloading ? 'wait' : 'pointer',
                  transition: 'opacity 0.15s ease'
                }}
              >
                <Download size={17} />
                <span>{downloading ? 'Downloading...' : 'Download File'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* FOOTER BAR                                                */}
        {/* ======================================================== */}
        <div style={{
          padding: '0.65rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#1b1b1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#8e8e93',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>SPIT LOOP Secure Resource Viewer</span>
            {file?.folderId && <span>• Folder: {file.folderId}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {totalFilesInFolder > 0 && (
              <span>File {currentIndex + 1} of {totalFilesInFolder}</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #a1a1aa)',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
