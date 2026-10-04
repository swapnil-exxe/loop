import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, FileText, AlertCircle, Loader } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { getResourceFileUrl } from '../utils/db';

// Configure PDF.js worker using Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function FileViewerModal({ file, onClose }) {
  const [scale, setScale] = useState(1.0);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);

  const fileUrl = getResourceFileUrl(file);
  const mimeType = (file?.mimeType || '').toLowerCase();
  const fileType = file?.type || (mimeType === 'application/pdf' ? 'PDF' : mimeType.startsWith('image/') ? 'Image' : 'Document');
  const fileName = file?.originalFileName || file?.fileName || file?.title || '';
  const ext = fileName.split('.').pop().toLowerCase();
  const isPdf = fileType === 'PDF' || mimeType === 'application/pdf' || ext === 'pdf';
  const isImage = fileType === 'Image' || mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
  const isCodeOrText = ['txt', 'csv', 'java', 'py', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h', 'css', 'html', 'json', 'xml', 'sql', 'md'].includes(ext) || mimeType.startsWith('text/');
  const [textContent, setTextContent] = useState('');

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

        const res = await fetch(fileUrl, { headers });
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
        } else if (isCodeOrText && !isImage) {
          const text = await blob.text();
          if (!active) return;
          setTextContent(text.slice(0, 500000)); // safe 500KB cap for browser DOM
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!active) return;
        console.error('FileViewer error:', err);
        setError(err.message || 'Unable to render file preview.');
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileUrl, isPdf]);

  // Render PDF page on canvas when pageNum or scale changes
  useEffect(() => {
    if (!isPdf || !pdfDocRef.current || !canvasRef.current) return;

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
  }, [isPdf, pageNum, scale, loading]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file?.originalFileName || file?.fileName || `${file?.title || 'download'}.${isPdf ? 'pdf' : isImage ? 'png' : 'bin'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '1.5rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={containerRef}
        style={{
          width: isFullscreen ? '100vw' : '92vw',
          maxWidth: isFullscreen ? '100vw' : '1100px',
          height: isFullscreen ? '100vh' : '90vh',
          backgroundColor: '#161618',
          border: isFullscreen ? 'none' : '1px solid var(--border-color)',
          borderRadius: isFullscreen ? '0' : '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#ffffff'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1a1a1c'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <span className="badge" style={{
              backgroundColor: isPdf ? 'rgba(255, 69, 58, 0.2)' : isImage ? 'rgba(10, 132, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: isPdf ? '#ff453a' : isImage ? '#0a84ff' : '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px'
            }}>
              {isPdf ? 'PDF' : isImage ? 'Image' : 'Document'}
            </span>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                {file?.title || file?.originalFileName || 'File Preview'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#888', margin: '2px 0 0 0' }}>
                {file?.originalFileName || file?.fileName || ''} {file?.fileSizeFormatted ? `• ${file.fileSizeFormatted}` : file?.size ? `• ${(file.size / (1024*1024)).toFixed(1)} MB` : ''}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isPdf && !loading && !error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.5rem', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.2rem 0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPageNum(p => Math.max(1, p - 1))}
                  disabled={pageNum <= 1}
                  style={{ background: 'none', border: 'none', color: pageNum <= 1 ? '#555' : '#fff', cursor: pageNum <= 1 ? 'not-allowed' : 'pointer', padding: '4px' }}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.8rem', color: '#ccc', minWidth: '60px', textAlign: 'center' }}>
                  {pageNum} / {numPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                  disabled={pageNum >= numPages}
                  style={{ background: 'none', border: 'none', color: pageNum >= numPages ? '#555' : '#fff', cursor: pageNum >= numPages ? 'not-allowed' : 'pointer', padding: '4px' }}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {(isPdf || isImage) && !loading && !error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.5rem', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.2rem 0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span style={{ fontSize: '0.8rem', color: '#ccc', minWidth: '42px', textAlign: 'center' }}>
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setScale(s => Math.min(3.0, s + 0.25))}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}
              title="Download File"
            >
              <Download size={16} />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.25rem' }}
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Preview Stage */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0c0c0d',
          padding: '1.5rem',
          position: 'relative'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#aaa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ animation: 'spin 1s linear infinite' }}>
                <Loader size={36} color="var(--accent-color, #0a84ff)" />
              </div>
              <p style={{ fontSize: '0.9rem' }}>Loading file preview...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <AlertCircle size={44} color="#ff453a" style={{ marginBottom: '1rem' }} />
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Preview Unavailable</h4>
              <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {error}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={16} /> Download File Instead
              </button>
            </div>
          )}

          {/* PDF Canvas View */}
          {isPdf && !loading && !error && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
              <canvas
                ref={canvasRef}
                style={{
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}

          {/* Image View */}
          {isImage && !loading && !error && blobUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', overflow: 'auto' }}>
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

          {/* Text / Code File Preview */}
          {isCodeOrText && !isPdf && !isImage && !loading && !error && (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#121214',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1rem',
              overflow: 'auto',
              boxSizing: 'border-box'
            }}>
              <pre style={{
                margin: 0,
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
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

          {/* Non-previewable File Types (DOCX, PPTX, XLSX, ZIP, RAR, 7Z, etc.) */}
          {!isPdf && !isImage && !isCodeOrText && !loading && !error && (
            <div style={{ textAlign: 'center', maxWidth: '440px', padding: '2.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <FileText size={56} color="var(--accent-color, #0a84ff)" style={{ marginBottom: '1rem' }} />
              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{file?.title || file?.originalFileName}</h4>
              <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Preview not available for this file type ({ext ? ext.toUpperCase() : file?.mimeType || 'binary'}). You can download the file to open it with your device application.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <Download size={16} /> Download File
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '0.65rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#161618',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#777'
        }}>
          <span>SPIT LOOP Secure Resource Viewer</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
