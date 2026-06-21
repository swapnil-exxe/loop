import { useState, useEffect, Fragment } from 'react';
import { Search, Download, Plus, X, BookOpen, CheckCircle, FileText, Globe, Code, FileSpreadsheet, Compass, Folder, Trash2, Edit } from 'lucide-react';
import { getResources, addPendingResource, deleteResource, fileToBase64, getFolders, addFolder, updateResource } from '../utils/db';

const dataURItoBlob = (dataURI) => {
  if (!dataURI || !dataURI.startsWith('data:')) return null;
  try {
    const parts = dataURI.split(',');
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const byteString = parts[0].indexOf('base64') >= 0 ? atob(parts[1]) : unescape(parts[1]);
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
  } catch (e) {
    console.error("Error converting data URI to blob:", e);
    return null;
  }
};

const getMimeTypeFromDataURI = (dataURI) => {
  if (!dataURI || !dataURI.startsWith('data:')) return '';
  try {
    return dataURI.split(',')[0].split(':')[1].split(';')[0];
  } catch (e) {
    return '';
  }
};

const getExtensionFromMime = (mime) => {
  switch (mime) {
    case 'application/pdf': return '.pdf';
    case 'image/jpeg':
    case 'image/jpg': return '.jpg';
    case 'image/png': return '.png';
    case 'image/gif': return '.gif';
    case 'text/plain': return '.txt';
    case 'application/msword': return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return '.docx';
    case 'application/vnd.ms-excel': return '.xls';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return '.xlsx';
    default: return '';
  }
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Folders Tree State (Supports nested folders!)
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([getResources(), getFolders()])
      .then(([resourcesData, foldersData]) => {
        setResources(resourcesData);
        setFolders(foldersData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading resources or folders:", err);
        setLoading(false);
      });
  }, []);

  const [currentFolderId, setCurrentFolderId] = useState(null); // null means root/all
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewerFile, setViewerFile] = useState(null);

  // Auth & Ownership
  const userSession = localStorage.getItem('loop_current_user');
  const currentUser = userSession ? JSON.parse(userSession) : null;
  const isAdmin = currentUser?.isAdmin;

  const [editingResource, setEditingResource] = useState(null);
  const [editResourceForm, setEditResourceForm] = useState({
    title: '',
    category: 'Coding',
    type: 'PDF',
    folderId: 'sem-1',
    link: ''
  });

  const isResourceOwner = (res) => {
    if (!currentUser) return false;
    const emailName = currentUser.email.split('@')[0].replace(/\./g, ' ').toLowerCase();
    const ownerName = (res.uploadedBy || '').toLowerCase();
    return emailName === ownerName || res.uploadedByEmail === currentUser.email;
  };

  const getFolderName = (folderId) => {
    if (!folderId) return '';
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return folderId;
    
    const path = [folder.name];
    let parentId = folder.parentId;
    while (parentId) {
      const parent = folders.find(f => f.id === parentId);
      if (parent) {
        path.unshift(parent.name);
        parentId = parent.parentId;
      } else {
        break;
      }
    }
    return path.join(' > ');
  };

  const startEditResource = (res) => {
    setEditingResource(res);
    setEditResourceForm({
      title: res.title || '',
      category: res.category || 'Coding',
      type: res.type || 'PDF',
      folderId: res.folderId || 'sem-1',
      link: res.link || ''
    });
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      await updateResource(editingResource.id, editResourceForm);
      alert('Resource updated successfully.');
    } else {
      const pendingData = {
        ...editResourceForm,
        requestType: 'edit',
        status: 'pending_edit',
        id: editingResource.id,
        uploadedBy: currentUser ? currentUser.email.split('@')[0].replace(/\./g, ' ') : editingResource.uploadedBy
      };
      await addPendingResource(pendingData);
      alert('Contributor Action: Your resource edits have been submitted to administrators for approval.');
    }
    setEditingResource(null);
    getResources().then(setResources).catch(console.error);
  };

  const processResourceFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    let determinedType = 'Note';
    if (extension === 'pdf') {
      determinedType = 'PDF';
    } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
      determinedType = 'Roadmap';
    }
    
    fileToBase64(file).then(base64Url => {
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
        type: determinedType,
        link: base64Url
      }));
    }).catch(err => {
      console.error("Error reading file:", err);
      alert("Failed to read file.");
    });
  };

  const handleDeleteResource = async (res) => {
    if (isAdmin) {
      if (window.confirm('Admin Action: Are you sure you want to delete this resource directly?')) {
        await deleteResource(res.id);
        alert('Resource deleted successfully.');
        // refresh resources
        getResources().then(setResources).catch(console.error);
      }
    } else {
      if (window.confirm('Contributor Action: Request administrator to delete this resource?')) {
        await addPendingResource({
          ...res,
          requestType: 'delete',
          status: 'pending_delete',
          uploadedByEmail: currentUser.email
        });
        alert('Your deletion request has been submitted to the administrator for approval.');
      }
    }
  };

  // Upload modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const formatEmailToName = (email) => {
    if (!email) return '';
    return email
      .split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'PDF',
    link: '',
    uploadedBy: currentUser ? formatEmailToName(currentUser.email) : '',
    folderId: 'sem-1'
  });

  useEffect(() => {
    if (isModalOpen || isNewFolderModalOpen || viewerFile || editingResource) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, isNewFolderModalOpen, viewerFile, editingResource]);

  // Helper to recursively get all children IDs of a folder to filter resources inside it
  const getFolderAndSubfolderIds = (folderId) => {
    if (!folderId) return [];
    const ids = [folderId];
    const children = folders.filter(f => f.parentId === folderId);
    children.forEach(child => {
      ids.push(...getFolderAndSubfolderIds(child.id));
    });
    return ids;
  };

  // Filter resources based on query, search and active folder
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If we're at root, we match all. If we're in a folder, match folder or any subfolder inside it
    const activeFolderIds = currentFolderId ? getFolderAndSubfolderIds(currentFolderId) : [];
    const matchesFolder = !currentFolderId || activeFolderIds.includes(res.folderId);
    
    return matchesSearch && matchesFolder;
  });

  // Helper to generate hierarchically indented dropdown options for upload selection
  const getFolderSelectOptions = () => {
    const options = [];
    const rootFolders = folders.filter(f => f.parentId === null);
    rootFolders.forEach(rf => {
      options.push({ id: rf.id, name: rf.name });
      const children = folders.filter(f => f.parentId === rf.id);
      children.forEach(cf => {
        options.push({ id: cf.id, name: `  — ${cf.name}` });
        const subChildren = folders.filter(f => f.parentId === cf.id);
        subChildren.forEach(scf => {
          options.push({ id: scf.id, name: `    — ${scf.name}` });
        });
      });
    });
    return options;
  };

  // Open Upload modal and pre-set folder ID to the current active folder context
  const openUploadModal = () => {
    setFormData(prev => ({
      ...prev,
      folderId: currentFolderId || 'sem-1',
      uploadedBy: prev.uploadedBy || (currentUser ? formatEmailToName(currentUser.email) : '')
    }));
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.uploadedBy) {
      alert('Please fill in all required fields');
      return;
    }

    const submission = {
      ...formData,
      category: 'General', // Keep category for schema compatibility
      link: formData.link.trim() || '#',
      uploadedByEmail: currentUser ? currentUser.email : ''
    };

    await addPendingResource(submission);
    setUploadSuccess(true);

    setTimeout(() => {
      setIsModalOpen(false);
      setUploadSuccess(false);
      setFormData({
        title: '',
        type: 'PDF',
        link: '',
        uploadedBy: currentUser ? formatEmailToName(currentUser.email) : '',
        folderId: currentFolderId || 'sem-1'
      });
    }, 2000);
  };

  // Icon mapping helper based on resource type
  const getResourceIcon = (type) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <FileText size={22} />;
      case 'SHEET':
        return <FileSpreadsheet size={22} />;
      case 'ROADMAP':
        return <Compass size={22} />;
      case 'NOTE':
      case 'NOTES':
        return <BookOpen size={22} />;
      case 'COURSE':
      case 'YOUTUBE':
        return <Globe size={22} />;
      default:
        return <Code size={22} />;
    }
  };

  return (
    <>
      <div className="container animate-fade-in" style={{ paddingTop: '6.5rem', paddingBottom: '5rem' }}>
      
      {/* Header and Add button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Resource Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Find and share coding sheets, notes, question banks, and roadmap guidelines.</p>
        </div>

        <button 
          onClick={openUploadModal}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <Plus size={16} />
          <span>Upload Resource</span>
        </button>
      </div>

      {/* Breadcrumbs Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <span 
          onClick={() => setCurrentFolderId(null)}
          style={{ 
            cursor: 'pointer', 
            fontWeight: !currentFolderId ? 600 : 400, 
            color: !currentFolderId ? 'var(--text-primary)' : 'var(--text-secondary)' 
          }}
        >
          All Years
        </span>
        {currentFolderId && (
          <>
            <span>/</span>
            {(() => {
              const path = [];
              let curr = folders.find(f => f.id === currentFolderId);
              while (curr) {
                path.unshift(curr);
                curr = folders.find(f => f.id === curr.parentId);
              }
              return path.map((f, idx) => (
                <Fragment key={f.id}>
                  {idx > 0 && <span style={{ margin: '0 0.25rem', color: 'var(--text-muted)' }}>/</span>}
                  <span 
                    onClick={() => setCurrentFolderId(f.id)}
                    style={{ 
                      cursor: 'pointer', 
                      fontWeight: f.id === currentFolderId ? 600 : 400, 
                      color: f.id === currentFolderId ? 'var(--text-primary)' : 'var(--text-secondary)' 
                    }}
                  >
                    {f.name}
                  </span>
                </Fragment>
              ));
            })()}
          </>
        )}
      </div>

      {/* Browse by Folders */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Folder size={18} style={{ color: '#8a2be2' }} />
          <span>{currentFolderId ? `${folders.find(f => f.id === currentFolderId)?.name} Folders` : 'Year Folders'}</span>
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Individual Folder Cards (filtered by currentFolderId) */}
          {folders.filter(f => f.parentId === currentFolderId).map(folder => {
            const subfolderIds = getFolderAndSubfolderIds(folder.id);
            const count = resources.filter(res => subfolderIds.includes(res.folderId)).length;
            return (
              <div 
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="loop-card folder-card"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  padding: '0.6rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Folder size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{folder.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {count} items
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add Folder Button Card */}
          <div 
            onClick={() => setIsNewFolderModalOpen(true)}
            className="loop-card folder-card"
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '1px dashed var(--border-color)',
              borderRadius: '16px',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              padding: '0.6rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Plus size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Add Folder</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Create custom filter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter Panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        marginBottom: '3rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '2rem'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', maxWidth: '500px', width: '100%' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by resource title, uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.75rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredResources.map((res) => (
            <div 
              key={res.id} 
              className="loop-card resource-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '190px'
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getResourceIcon(res.type)}
                  </div>
                  
                  <span className="badge" style={{ fontSize: '0.65rem' }}>
                    {res.category}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  lineHeight: '1.4',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  {res.title}
                </h3>
              </div>

              <div>
                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Shared by</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{res.uploadedBy}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => {
                        const mime = getMimeTypeFromDataURI(res.link);
                        let fileType = res.type;
                        let ext = '';
                        if (mime) {
                          ext = getExtensionFromMime(mime);
                          if (mime.startsWith('image/')) {
                            fileType = 'Image';
                          } else if (mime === 'application/pdf') {
                            fileType = 'PDF';
                          }
                        } else {
                          const isPdf = res.type === 'PDF' || res.type === 'Sheet' || res.type === 'Note' || res.type === 'Roadmap';
                          fileType = isPdf ? 'PDF' : res.type;
                          ext = isPdf ? '.pdf' : '.txt';
                        }
                        setViewerFile({
                          title: res.title,
                          type: fileType,
                          fileName: res.title + ext,
                          fileSize: '1.2 MB',
                          previewUrl: res.link || '#'
                        });
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                      title="View File"
                    >
                      <FileText size={14} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>View File</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (res.link && res.link !== '#') {
                          if (res.link.startsWith('data:')) {
                            const blob = dataURItoBlob(res.link);
                            if (blob) {
                              const blobUrl = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              const mime = getMimeTypeFromDataURI(res.link);
                              const ext = getExtensionFromMime(mime) || '.txt';
                              link.download = res.title + ext;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                            } else {
                              alert('Failed to process file data.');
                            }
                          } else {
                            // external URL - open in new tab
                            window.open(res.link, '_blank');
                          }
                        } else {
                          alert('No link or file data available for this resource.');
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title="Download File"
                    >
                      <Download size={14} />
                    </button>
                    {(isAdmin || isResourceOwner(res)) && (
                      <>
                        <button 
                          onClick={() => startEditResource(res)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}
                          title={isAdmin ? 'Edit Resource' : 'Request Edit'}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteResource(res)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff453a', borderColor: 'rgba(255, 69, 58, 0.2)', cursor: 'pointer' }}
                          title={isAdmin ? 'Delete Resource' : 'Request Deletion'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          borderRadius: '20px',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No study resources found matching the query.</p>
          <button onClick={() => { setSearchQuery(''); }} className="btn btn-secondary">
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>

    {/* Upload Modal */}
    {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '24px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            padding: '2.5rem 2rem'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <X size={20} />
            </button>

            {uploadSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <CheckCircle size={64} style={{ color: '#30d158' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Resource Submitted!</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '350px' }}>
                  Thank you! Your resource will be visible in the hub once approved by an administrator.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>
                  Upload Study Resource
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                  Contribute PDFs, notes, question sheets, roadmaps, or other preparation tools.
                </p>

                <div className="input-group">
                  <label className="input-label">Resource Title *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. DBMS Semester 4 Question Bank"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="input-group">
                    <label className="input-label">Category *</label>
                    <select 
                      className="input-field"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <option value="Coding">Coding</option>
                      <option value="Placement">Placement</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Web Development">Web Development</option>
                      <option value="College Subjects">College Subjects</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">File Type *</label>
                    <select 
                      className="input-field"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <option value="PDF">PDF Document</option>
                      <option value="Sheet">Cheat Sheet / Excel</option>
                      <option value="Roadmap">Roadmap Guide</option>
                      <option value="Note">Lecture Notes</option>
                      <option value="Course">Online Course link</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Folder / Year *</label>
                  <select 
                    className="input-field"
                    value={formData.folderId || 'sem-1'}
                    onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    {getFolderSelectOptions().map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Upload File / Document (Required)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <div 
                      onClick={() => document.getElementById('resource-file-upload-dialog')?.click()}
                      style={{
                        border: '1px dashed var(--border-color)',
                        borderRadius: '12px',
                        padding: formData.link ? '1rem' : '1.5rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100px',
                        color: 'var(--text-primary)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) processResourceFile(file);
                      }}
                    >
                      <input 
                        type="file" 
                        id="resource-file-upload-dialog" 
                        onChange={(e) => {
                           const file = e.target.files[0];
                           if (file) processResourceFile(file);
                         }} 
                        style={{ display: 'none' }}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                      />
                      {formData.link ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                            <span style={{
                              padding: '0.4rem',
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: formData.type === 'PDF' ? '#ff3b30' : '#007aff'
                            }}>
                              <FileText size={18} />
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {formData.title || 'Selected File'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {formData.type} File • Click to change
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (formData.link.startsWith('blob:')) {
                                URL.revokeObjectURL(formData.link);
                              }
                              setFormData({ ...formData, link: '' });
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem', color: '#ff453a', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="Remove File"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Plus size={22} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                            Click to select a file, or drop here
                          </p>
                        </>
                      )}
                    </div>
                    
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Or paste download/reference link directly"
                      value={formData.link.startsWith('blob:') ? '' : formData.link} 
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })} 
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Your Name (Uploader) *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. John Doe (Class of 2026)"
                    value={formData.uploadedBy}
                    onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    Submit Resource
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '400px',
            borderRadius: '24px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            padding: '2.5rem 2rem'
          }}>
            <button 
              onClick={() => setIsNewFolderModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <X size={20} />
            </button>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const trimmed = newFolderName.trim();
              if (!trimmed) return;
              // Check for duplicate folder name in the current folder context
              const duplicate = folders.some(f => f.name.toLowerCase() === trimmed.toLowerCase() && f.parentId === currentFolderId);
              if (duplicate) {
                alert('A folder with this name already exists in this folder.');
                return;
              }
              const newFolderObj = {
                id: trimmed.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
                name: trimmed,
                parentId: currentFolderId
              };
              await addFolder(newFolderObj);
              const updated = await getFolders();
              setFolders(updated);
              setNewFolderName('');
              setIsNewFolderModalOpen(false);
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Create New Folder
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Define a custom study folder (e.g. "5th Year" or "Interview Prep").
              </p>

              <div className="input-group">
                <label className="input-label">Folder Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 5th Year"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsNewFolderModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewerFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '800px',
            height: '85vh',
            borderRadius: '24px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setViewerFile(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <X size={24} />
            </button>

            {/* Header info */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', textAlign: 'left' }}>
              <span className="badge" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>{viewerFile.type} Preview</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{viewerFile.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {viewerFile.fileName ? `File: ${viewerFile.fileName}` : ''} {viewerFile.fileSize ? ` • Size: ${viewerFile.fileSize}` : ''}
              </p>
            </div>

            {/* Document Content Area */}
            <div style={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              backgroundColor: '#f9f9fa', 
              color: '#111112',
              borderRadius: '12px', 
              border: '1px solid #e5e5e7',
              padding: (viewerFile.previewUrl && viewerFile.previewUrl !== '#') || (viewerFile.url && viewerFile.url !== '#') ? '0' : '2rem',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {((viewerFile.previewUrl && viewerFile.previewUrl !== '#') || (viewerFile.url && viewerFile.url !== '#')) ? (
                // Render original uploaded file content
                viewerFile.type === 'Image' || (viewerFile.fileName && (viewerFile.fileName.endsWith('.png') || viewerFile.fileName.endsWith('.jpg') || viewerFile.fileName.endsWith('.jpeg'))) ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1, padding: '1rem' }}>
                    <img 
                      src={viewerFile.previewUrl || viewerFile.url} 
                      alt={viewerFile.title} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                    />
                  </div>
                ) : (
                  <iframe 
                    src={viewerFile.previewUrl || viewerFile.url} 
                    style={{ width: '100%', height: '100%', flexGrow: 1, border: 'none', borderRadius: '12px' }} 
                    title={viewerFile.title}
                  />
                )
              ) : (
                // Fallback / Pre-seeded Simulated Document Preview templates
                viewerFile.title.toLowerCase().includes('resume') || viewerFile.title.toLowerCase().includes('cv') || viewerFile.fileName?.toLowerCase().includes('resume') ? (
                  <div style={{ maxWidth: '650px', margin: '0 auto' }}>
                    {/* CV Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.25rem 0', letterSpacing: '-0.02em', color: '#111' }}>
                        SWAPNIL PATIL
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>
                        swapnil.patil@spit.ac.in | +91 98765 43210 | Mumbai, India
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#007aff', fontWeight: 600, margin: '0.25rem 0 0 0' }}>
                        github.com/swapnilpatil | linkedin.com/in/swapnil-patil
                      </p>
                    </div>

                    {/* CV Section: Education */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: '#222' }}>
                        EDUCATION
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                        <span>Sardar Patel Institute of Technology (SPIT)</span>
                        <span>2022 – 2026</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                        <span>B.Tech in Computer Engineering</span>
                        <span>GPA: 9.8 / 10.0</span>
                      </div>
                    </div>

                    {/* CV Section: Experience */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: '#222' }}>
                        PROFESSIONAL EXPERIENCE
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                        <span>NVIDIA – Software Engineer Intern</span>
                        <span>Summer 2025</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#333', margin: '0.25rem 0 0.5rem 0', fontStyle: 'italic' }}>
                        Deep Learning Frameworks Tools Team
                      </p>
                      <ul style={{ fontSize: '0.85rem', color: '#444', paddingLeft: '1.25rem', margin: 0 }}>
                        <li style={{ marginBottom: '0.25rem' }}>Accelerated CUDA training workloads for large-scale transformer architectures.</li>
                        <li>Developed visualization pipeline dashboards to track tensor convergence speeds during epochs.</li>
                      </ul>
                    </div>

                    {/* CV Section: Projects */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: '#222' }}>
                        PROJECTS
                      </h3>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        <span>Loop SPIT Placement Portal</span>
                      </div>
                      <ul style={{ fontSize: '0.85rem', color: '#444', paddingLeft: '1.25rem', margin: '0.25rem 0 0.5rem 0' }}>
                        <li>Created a peer-to-peer portal for seniors to share preparation strategies, notes, and PDF sheets.</li>
                        <li>Implemented a document index system with simulated resume previewing overlays.</li>
                      </ul>
                    </div>

                    {/* CV Section: Skills */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: '#222' }}>
                        TECHNICAL SKILLS
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#333', margin: 0 }}>
                        <strong>Languages:</strong> C++, Python, JavaScript (ES6+), SQL, Bash
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#333', margin: '0.25rem 0 0 0' }}>
                        <strong>Technologies:</strong> React, Node.js, Express, PyTorch, Git, CUDA, Docker
                      </p>
                    </div>
                  </div>
                ) : (
                  // Generic Study Guide / Notes Viewer
                  <div style={{ maxWidth: '650px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111', margin: '0 0 0.5rem 0' }}>
                        {viewerFile.title}
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>
                        SPIT Placement & Study Resources Network
                      </p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: '#333' }}>
                        1. CORE SYLLABUS OVERVIEW
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: '#333', lineHeight: '1.6' }}>
                        This document serves as a comprehensive study sheet compiled by SPIT seniors. It highlights high-yielding topics frequently asked during technical rounds, coding tests, and engineering exams.
                      </p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: '#333' }}>
                        2. KEY FORMULAS & THEOREMS
                      </h3>
                      <div style={{ backgroundColor: '#f0f0f3', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#222', borderLeft: '4px solid #007aff', marginBottom: '1rem' }}>
                        // Time Complexity Approximations<br />
                        - Quick Sort (Average Case): O(N log N)<br />
                        - Binary Search Tree Search: O(log N)<br />
                        - Floyd-Warshall Algorithm: O(V³)
                      </div>
                      <ul style={{ fontSize: '0.85rem', color: '#444', paddingLeft: '1.25rem' }}>
                        <li style={{ marginBottom: '0.25rem' }}>Understand spatial invariants and reference pointers.</li>
                        <li>Dry run edge cases including null inputs, circular arrays, and single-node structures.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: '#333' }}>
                        3. INTERVIEW QUESTIONS & PREPARATION TIPS
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: '#333', lineHeight: '1.6' }}>
                        Prepare standard behavioral answers (STAR method) and explain structural design patterns like Singleton, Observer, and Factory. Ensure you speak clearly during system design mock interviews.
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
            
            {/* Viewer Footer */}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Viewing file in secure sandbox.
              </span>
              <button 
                type="button" 
                onClick={() => setViewerFile(null)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.5rem', borderRadius: '8px' }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingResource && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '550px',
            borderRadius: '24px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            padding: '2rem',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4), 0 0 1px 1px rgba(255, 255, 255, 0.1) inset'
          }}>
            <button 
              onClick={() => setEditingResource(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>
              Edit Study Resource {!isAdmin && '(Requires Admin Approval)'}
            </h2>

            <form onSubmit={handleSaveResource}>
              <div className="input-group">
                <label className="input-label">Title *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editResourceForm.title} 
                  onChange={e => setEditResourceForm({ ...editResourceForm, title: e.target.value })} 
                  required
                />
              </div>

              <div className="form-grid-2col" style={{ marginBottom: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category *</label>
                  <select
                    className="input-field"
                    value={editResourceForm.category}
                    onChange={e => setEditResourceForm({ ...editResourceForm, category: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="Coding">Coding</option>
                    <option value="College Subjects">College Subjects</option>
                    <option value="Web Development">Web Development</option>
                    <option value="CSE">CSE</option>
                    <option value="Placement">Placement</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">File Type *</label>
                  <select
                    className="input-field"
                    value={editResourceForm.type}
                    onChange={e => setEditResourceForm({ ...editResourceForm, type: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="PDF">PDF</option>
                    <option value="Link">Link</option>
                    <option value="Note">Note</option>
                    <option value="Sheet">Sheet</option>
                    <option value="Roadmap">Roadmap</option>
                    <option value="Interview Questions">Interview Questions</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2col" style={{ marginBottom: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Folder Location *</label>
                  <select
                    className="input-field"
                    value={editResourceForm.folderId}
                    onChange={e => setEditResourceForm({ ...editResourceForm, folderId: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{getFolderName(f.id) || f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">File Link / URL</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editResourceForm.link} 
                    onChange={e => setEditResourceForm({ ...editResourceForm, link: e.target.value })} 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Save Resource Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom styled effects */}
      <style>{`
        .resource-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .resource-card:hover {
          transform: translateY(-5px);
          border-color: var(--text-secondary);
          box-shadow: var(--card-shadow);
        }
        .folder-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .folder-card:hover {
          transform: translateY(-2px);
          border-color: var(--text-primary) !important;
          box-shadow: var(--card-shadow);
        }
        .active-folder {
          box-shadow: var(--card-shadow);
        }
      `}</style>
    </>
  );
}
