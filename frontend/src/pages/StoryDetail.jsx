import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Award, Code, BookOpen, Layers, X, Edit, Trash2, Plus } from 'lucide-react';
import { getStories, getStoryById, updateStory, deleteStory, addPendingStory, fileToBase64 } from '../utils/db';

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

export default function StoryDetail() {
  const { id } = useParams();
  const resolveUrl = (url) => {
    if (typeof url === 'string' && url.startsWith('/uploads/')) {
      return 'https://loop-qnh9.onrender.com' + url;
    }
    return url;
  };
  const navigate = useNavigate();
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [viewerFile, setViewerFile] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDownloadFile = (fileName, url) => {
    if (!url || url === '#') {
      alert('No file available for download.');
      return;
    }
    try {
      if (url.startsWith('data:')) {
        const blob = dataURItoBlob(url);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } else {
          alert('Failed to process file for download.');
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Download failed:", e);
      alert("Failed to download file.");
    }
  };

  useEffect(() => {
    let blobUrl = null;
    const fileUrl = resolveUrl(viewerFile?.previewUrl || viewerFile?.url);
    if (fileUrl) {
      if (fileUrl.startsWith('data:')) {
        const blob = dataURItoBlob(fileUrl);
        if (blob) {
          blobUrl = URL.createObjectURL(blob);
          setIframeUrl(blobUrl);
        } else {
          setIframeUrl(fileUrl);
        }
      } else {
        setIframeUrl(fileUrl);
      }
    } else {
      setIframeUrl(null);
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [viewerFile]);

  useEffect(() => {
    setLoading(true);
    getStoryById(id).then(found => {
      setStory(found || null);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  // Auth and Ownership
  const userSession = localStorage.getItem('loop_current_user');
  const currentUser = userSession ? JSON.parse(userSession) : null;
  const isAdmin = currentUser?.isAdmin;
  const isOwner = currentUser && story && (
    currentUser.email.split('@')[0].replace(/\./g, ' ').toLowerCase() === story.name.toLowerCase() ||
    story.uploadedByEmail === currentUser.email
  );
  const canModify = isAdmin || isOwner;

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    role: '',
    branch: 'CSE',
    passoutYear: '',
    semester: '',
    cgpa: '',
    journey: {
      firstYear: '',
      secondYear: '',
      thirdYear: '',
      fourthYear: '',
      prep: '',
      projects: '',
      howSecured: ''
    },
    studyMaterials: [],
    resume: ''
  });

  const [editMaterialInput, setEditMaterialInput] = useState({
    title: '',
    type: 'PDF',
    fileName: '',
    fileSize: '',
    previewUrl: ''
  });

  useEffect(() => {
    if (isEditing || viewerFile || activePreviewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditing, viewerFile, activePreviewImage]);

  const processMaterialFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    let determinedType = 'Notes';
    if (extension === 'pdf') {
      determinedType = 'PDF';
    } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
      determinedType = 'Image';
    }
    
    fileToBase64(file).then(base64Url => {
      setEditMaterialInput({
        title: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
        type: determinedType,
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        previewUrl: base64Url
      });
    }).catch(err => {
      console.error("Error reading file:", err);
      alert("Failed to read file.");
    });
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processMaterialFile(file);
  };

  const processResumeFile = (file) => {
    fileToBase64(file).then(base64Url => {
      setEditForm({
        ...editForm,
        resume: {
          fileName: file.name,
          fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          url: base64Url
        }
      });
    }).catch(err => {
      console.error("Error reading file:", err);
      alert("Failed to read file.");
    });
  };

  const startEdit = () => {
    setEditForm({
      name: story.name || '',
      company: story.company || '',
      role: story.role || '',
      branch: story.branch || 'CSE',
      passoutYear: story.passoutYear || '',
      semester: story.semester || '',
      cgpa: story.cgpa || '',
      journey: {
        firstYear: story.journey?.firstYear || '',
        secondYear: story.journey?.secondYear || '',
        thirdYear: story.journey?.thirdYear || '',
        fourthYear: story.journey?.fourthYear || '',
        prep: story.journey?.prep || '',
        projects: story.journey?.projects || '',
        howSecured: story.journey?.howSecured || ''
      },
      studyMaterials: story.studyMaterials || [],
      resume: story.resumeFile || story.resume || ''
    });
    setEditMaterialInput({ title: '', type: 'PDF', fileName: '', fileSize: '', previewUrl: '' });
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (isAdmin) {
      if (window.confirm('Admin Action: Are you sure you want to delete this story directly?')) {
        await deleteStory(story.id);
        alert('Story deleted successfully.');
        navigate('/stories');
      }
    } else if (isOwner) {
      if (window.confirm('Contributor Action: Request administrator to delete this story?')) {
        await addPendingStory({
          ...story,
          requestType: 'delete',
          status: 'pending_delete',
          uploadedByEmail: currentUser.email
        });
        alert('Your deletion request has been submitted to the administrator for approval.');
        navigate('/stories');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadProgress(0);
    try {
      const payload = { ...editForm };
      
      if (payload.resume && typeof payload.resume === 'object') {
        payload.resumeFile = {
          fileName: payload.resume.fileName,
          fileSize: payload.resume.fileSize,
          url: payload.resume.url
        };
        payload.resume = payload.resume.fileName;
      } else if (!payload.resume) {
        payload.resumeFile = null;
      }

      if (isAdmin) {
        await updateStory(story.id, payload);
        alert('Admin Action: Changes saved directly.');
        setIsEditing(false);
        // Reload current story
        getStoryById(id).then(found => {
          if (found) setStory(found);
        }).catch(console.error);
      } else {
        await addPendingStory({
          ...payload,
          id: story.id,
          requestType: 'edit',
          status: 'pending_edit',
          uploadedByEmail: currentUser.email
        }, (progress) => {
          setUploadProgress(progress);
        });
        alert('Contributor Action: Your edits have been submitted to administrators for approval.');
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error saving story changes:", err);
      alert(err.message || 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container skeleton-pulse" style={{ paddingTop: '6.5rem', paddingBottom: '6rem', maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ width: '120px', height: '1.5rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
        </div>
        <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '2.5rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '60px', height: '1.2rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
                <div style={{ width: '80px', height: '1.2rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
              </div>
              <div style={{ height: '3rem', width: '250px', backgroundColor: 'var(--border-color)', borderRadius: '4px', marginBottom: '1rem' }} />
              <div style={{ height: '1.5rem', width: '180px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
            </div>
            <div style={{ width: '110px', height: '110px', backgroundColor: 'var(--border-color)', borderRadius: '24px' }} />
          </div>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ height: '1.5rem', width: '120px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
            <div style={{ height: '100px', backgroundColor: 'var(--border-color)', borderRadius: '12px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ height: '1.5rem', width: '120px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
            <div style={{ height: '100px', backgroundColor: 'var(--border-color)', borderRadius: '12px' }} />
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.35; }
          }
          .skeleton-pulse {
            animation: pulse 1.5s infinite ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2>Senior profile not found</h2>
        <button onClick={() => navigate('/stories')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Stories
        </button>
      </div>
    );
  }

  // Format multi-line projects list
  const formatProjects = (projectsString) => {
    if (!projectsString) return null;
    return projectsString.split('\n').map((line, index) => (
      <p key={index} style={{ marginBottom: '0.75rem', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
        {line}
      </p>
    ));
  };

  return (
    <>
      <div className="container animate-fade-in" style={{ paddingTop: '6.5rem', paddingBottom: '6rem', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Back button */}
        <button 
          onClick={() => navigate('/stories')}
          className="btn btn-text"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Stories</span>
        </button>

        {/* Owner/Admin Options */}
        {canModify && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={startEdit}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: 'var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <Edit size={14} />
              <span>Edit Story</span>
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#ff453a',
                borderColor: 'rgba(255, 69, 58, 0.2)',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              <span>{isAdmin ? 'Delete Story' : 'Request Deletion'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Header (Notion Page Cover/Header Style) */}
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '2.5rem',
        marginBottom: '3rem'
      }}>
        <div className="story-header-flex" style={{
          display: 'flex',
          gap: '2.5rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}>
          {/* Details */}
          <div style={{ flexGrow: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ fontSize: '0.7rem' }}>
                {story.branch} {story.subBranch && `(${story.subBranch})`}
              </span>
              <span className="badge" style={{ fontSize: '0.7rem' }}>
                Class of {story.passoutYear}
              </span>
              <span className="badge" style={{ fontSize: '0.7rem', backgroundColor: 'var(--text-primary)', color: 'var(--accent-inverse)' }}>
                Placed
              </span>
            </div>
            
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.1
            }}>
              {story.name}
            </h1>

            <p style={{
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              {story.role} at <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{story.company}</span>
            </p>
          </div>
        </div>

        {/* Notion-style Page Properties Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '2.5rem',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Semester Placed
            </p>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>Semester {story.semester}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              CGPA
            </p>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>{story.cgpa || 'N/A'}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Company
            </p>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>{story.company}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Role
            </p>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>{story.role}</p>
          </div>
        </div>
      </header>

      {/* Main Notion-Style Reading Block */}
      <main style={{ fontFamily: 'var(--font-sans)' }}>
        
        {/* Intro Highlight (Notion Callout) */}
        <div className="glass-panel" style={{
          padding: '1.5rem 2rem',
          borderRadius: '16px',
          marginBottom: '3.5rem',
          borderLeft: '4px solid var(--text-primary)',
          fontSize: '1.1rem',
          lineHeight: '1.7',
          color: 'var(--text-secondary)',
          fontStyle: 'italic'
        }}>
          "My biggest advice to SPIT juniors is to stay consistent. Don't wait for companies to arrive. Start building projects in your second year and begin coding practice daily. Your hard work will compounding."
        </div>

        {/* 4-Year Journey Timeline */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>
            My Four-Year Journey
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative' }}>
            {/* Timeline vertical bar */}
            <div style={{
              position: 'absolute',
              left: '1.25rem',
              top: '1rem',
              bottom: '1rem',
              width: '1px',
              backgroundColor: 'var(--border-color)',
              zIndex: 0
            }} />

            {/* Year 1 */}
            <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)',
                border: '2px solid var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 700
              }}>1</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>First Year</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                  {story.journey.firstYear}
                </p>
              </div>
            </div>

            {/* Year 2 */}
            <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)',
                border: '2px solid var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 700
              }}>2</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Second Year</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                  {story.journey.secondYear}
                </p>
              </div>
            </div>

            {/* Year 3 */}
            <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)',
                border: '2px solid var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 700
              }}>3</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Third Year</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                  {story.journey.thirdYear}
                </p>
              </div>
            </div>

            {/* Year 4 */}
            <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)',
                border: '2px solid var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 700
              }}>4</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fourth Year</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                  {story.journey.fourthYear}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preparation Strategy */}
        <section style={{ marginBottom: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={24} />
            Preparation Strategy & Study Routine
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {story.journey.prep}
          </p>
        </section>

        {/* Projects Built */}
        {story.journey.projects && (
          <section style={{ marginBottom: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Code size={24} />
              Key Projects Built
            </h2>
            <div style={{
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              {formatProjects(story.journey.projects)}
            </div>
          </section>
        )}

        {/* The Recruitment Process */}
        <section style={{ marginBottom: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Layers size={24} />
            How I Secured the Role
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {story.journey.howSecured}
          </p>
        </section>

        {/* Custom Prompts / Sections */}
        {story.customSections && story.customSections.map((sec, index) => (
          <section key={index} style={{ marginBottom: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>
              {sec.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {sec.content}
            </p>
          </section>
        ))}

        {/* Resources Used List */}
        {story.resources && story.resources.length > 0 && (
          <section style={{ marginBottom: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BookOpen size={24} />
              Resources Used
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {story.resources.map((res, index) => (
                <div key={index} className="glass-panel" style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontWeight: 600 }}>{res.name}</span>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>{res.type}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Resume Preview & Download Section */}
        <section style={{ marginBottom: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>
            Resume
          </h2>

          <div className="loop-card" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 2rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-primary)'
              }}>
                <FileText size={28} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {typeof story.resume === 'object' ? story.resume.fileName : story.resume}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Approved standard format resume (PDF)</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  // Use resumeFile (actual uploaded file) if available, else fall back to resume string
                  const rf = story.resumeFile;
                  const resumeName = rf?.fileName || story.resume || 'resume.pdf';
                  const resumeSize = rf?.fileSize || '';
                  const resumeUrl = rf?.url || null;
                  setViewerFile({
                    title: 'Resume',
                    type: 'PDF',
                    fileName: resumeName,
                    fileSize: resumeSize,
                    previewUrl: resumeUrl || '#'
                  });
                }}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', gap: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="View Resume"
              >
                <FileText size={14} />
                <span>View Resume</span>
              </button>
              <button 
                onClick={() => {
                  const rf = story.resumeFile;
                  if (rf?.url && rf.url !== '#') {
                    if (rf.url.startsWith('data:')) {
                      const blob = dataURItoBlob(rf.url);
                      if (blob) {
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = rf.fileName || 'resume.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                      } else {
                        alert('Failed to process resume file.');
                      }
                    } else {
                      const link = document.createElement('a');
                      link.href = rf.url;
                      link.download = rf.fileName || 'resume.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  } else {
                    alert('No resume file was uploaded for this story.');
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', gap: '0.4rem' }}
              >
                <Download size={14} />
                <span>Download Resume</span>
              </button>
            </div>
          </div>

        </section>

        {/* Study Materials Uploaded Section */}
        {story.studyMaterials && story.studyMaterials.length > 0 && (
          <section style={{ paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>
              Study Materials Uploaded
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}>
              {story.studyMaterials.map((mat, index) => {
                const isImage = mat.type === 'Image' && mat.url && mat.url !== '#';
                if (isImage) {
                  return (
                    <div key={index} className="glass-panel" style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {mat.title}
                          </h4>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span className="badge" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                              {mat.type}
                            </span>
                            {mat.fileSize && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {mat.fileSize}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (mat.url && mat.url !== '#') {
                              handleDownloadFile(mat.fileName || mat.title + '.png', mat.url);
                            } else {
                              alert('No image file available.');
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title="Download Image"
                        >
                          <Download size={12} />
                        </button>
                      </div>
 
                      <div 
                        onClick={() => setActivePreviewImage({ title: mat.title, url: mat.url })}
                        style={{ 
                          width: '100%', 
                          height: '160px', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          border: '1px solid var(--border-color)',
                          cursor: 'zoom-in',
                          backgroundColor: 'var(--bg-primary)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        <img 
                          src={mat.url} 
                          alt={mat.title} 
                          style={{ height: '100%', width: '100%', objectFit: 'contain', transition: 'transform 0.2s' }}
                          className="material-preview-img"
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '0.5rem',
                          right: '0.5rem',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 500
                        }}>
                          Click to Expand
                        </div>
                      </div>
                    </div>
                  );
                }
 
                return (
                  <div key={index} className="glass-panel" style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '50px', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        backgroundColor: mat.type === 'PDF' ? '#ffe5e5' : '#e5f1ff', 
                        color: mat.type === 'PDF' ? '#ff3b30' : '#007aff', 
                        fontWeight: 'bold', 
                        fontSize: '0.7rem' 
                      }}>
                        {mat.type}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.3', marginBottom: '0.25rem' }}>
                          {mat.title}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            {mat.type}
                          </span>
                          {mat.fileSize && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {mat.fileSize}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
 
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        onClick={() => {
                          setViewerFile({
                            title: mat.title,
                            type: mat.type,
                            fileName: mat.fileName || mat.title + (mat.type === 'PDF' ? '.pdf' : '.txt'),
                            fileSize: mat.fileSize || '1.2 MB',
                            previewUrl: mat.url
                          });
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                        title="View File"
                      >
                        <FileText size={14} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>View File</span>
                      </button>
                      {mat.url && mat.url !== '#' && (
                        <button 
                          onClick={() => {
                            handleDownloadFile(mat.fileName || mat.title + (mat.type === 'PDF' ? '.pdf' : '.txt'), mat.url);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '32px', height: '32px' }}
                          title="Download File"
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>

    {/* Lightbox / Zoom Image Modal */}
      {activePreviewImage && (
        <div 
          onClick={() => setActivePreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '80%' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setActivePreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-2.5rem',
                right: 0,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              ✕ Close
            </button>
            <img 
              src={activePreviewImage.url} 
              alt={activePreviewImage.title} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
            />
            <h3 style={{ color: '#fff', textAlign: 'center', marginTop: '1rem', fontWeight: 600, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
              {activePreviewImage.title}
            </h3>
          </div>
        </div>
      )}

      {/* Edit Story Details Overlay Modal */}
      {isEditing && (
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
            maxWidth: '650px',
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
              onClick={() => setIsEditing(false)}
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

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'left' }}>
              Edit Story Details {!isAdmin && '(Requires Admin Approval)'}
            </h2>

            <form onSubmit={handleSave}>
              <div className="form-grid-2col" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editForm.name} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Company</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editForm.company} 
                    onChange={e => setEditForm({ ...editForm, company: e.target.value })} 
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2col" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Role</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editForm.role} 
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })} 
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Branch</label>
                  <select 
                    className="input-field" 
                    value={editForm.branch} 
                    onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="EXTC">EXTC</option>
                    <option value="AI & DS">AI & DS</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3col" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Passout Year</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editForm.passoutYear} 
                    onChange={e => setEditForm({ ...editForm, passoutYear: e.target.value })} 
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Semester</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editForm.semester} 
                    onChange={e => setEditForm({ ...editForm, semester: e.target.value })} 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">CGPA</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editForm.cgpa} 
                    onChange={e => setEditForm({ ...editForm, cgpa: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-grid-2col" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">1st Year Strategy</label>
                  <textarea 
                    className="input-field" 
                    rows={2} 
                    value={editForm.journey.firstYear} 
                    onChange={e => setEditForm({
                      ...editForm,
                      journey: { ...editForm.journey, firstYear: e.target.value }
                    })}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">2nd Year Strategy</label>
                  <textarea 
                    className="input-field" 
                    rows={2} 
                    value={editForm.journey.secondYear} 
                    onChange={e => setEditForm({
                      ...editForm,
                      journey: { ...editForm.journey, secondYear: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="form-grid-2col" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">3rd Year Strategy</label>
                  <textarea 
                    className="input-field" 
                    rows={2} 
                    value={editForm.journey.thirdYear} 
                    onChange={e => setEditForm({
                      ...editForm,
                      journey: { ...editForm.journey, thirdYear: e.target.value }
                    })}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">4th Year Strategy</label>
                  <textarea 
                    className="input-field" 
                    rows={2} 
                    value={editForm.journey.fourthYear} 
                    onChange={e => setEditForm({
                      ...editForm,
                      journey: { ...editForm.journey, fourthYear: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="input-group" style={{ textAlign: 'left' }}>
                <label className="input-label">Preparation Strategy & Tips *</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  value={editForm.journey.prep} 
                  onChange={e => setEditForm({
                    ...editForm,
                    journey: { ...editForm.journey, prep: e.target.value }
                  })}
                  required
                />
              </div>

              {/* Resume Section in Edit Modal */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Senior Resume File
                </h4>
                
                <div 
                  onClick={() => document.getElementById('story-detail-resume-upload')?.click()}
                  style={{
                    border: '1px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '1rem',
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
                    if (file) processResumeFile(file);
                  }}
                >
                  <input 
                    type="file" 
                    id="story-detail-resume-upload" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      fileToBase64(file).then(base64Url => {
                        setEditForm({
                          ...editForm,
                          resume: {
                            fileName: file.name,
                            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                            url: base64Url
                          }
                        });
                      }).catch(err => {
                        console.error("Error reading file:", err);
                        alert("Failed to read file.");
                      });
                    }} 
                    style={{ display: 'none' }}
                    accept=".pdf"
                  />
                  {editForm.resume ? (
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
                          color: '#ff3b30'
                        }}>
                          <FileText size={18} />
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {typeof editForm.resume === 'object' ? editForm.resume.fileName : editForm.resume}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {typeof editForm.resume === 'object' ? editForm.resume.fileSize : '1.2 MB'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditForm({ ...editForm, resume: '' });
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem', color: '#ff453a', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          title="Remove Resume"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileText size={22} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                        Click to upload Resume PDF
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Study Materials Section in Edit Modal */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Study Materials / Files
                </h4>
                
                {editForm.studyMaterials && editForm.studyMaterials.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {editForm.studyMaterials.map((material, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                          <span style={{
                            padding: '0.4rem',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)'
                          }}>
                            <FileText size={18} />
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{material.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {material.type} {material.fileName ? `• ${material.fileName}` : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedMaterials = editForm.studyMaterials.filter((_, i) => i !== idx);
                              setEditForm({ ...editForm, studyMaterials: updatedMaterials });
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem', color: '#ff453a', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="Remove File"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1.5rem', textAlign: 'left' }}>
                    No study materials attached.
                  </p>
                )}

                {/* Add Study Material block */}
                <div style={{
                  padding: '1.25rem',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  textAlign: 'left'
                }}>
                  <h5 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    Add Study Material
                  </h5>
                  
                  <div 
                    onClick={() => document.getElementById('story-detail-material-upload')?.click()}
                    style={{
                      border: '1px dashed var(--border-color)',
                      borderRadius: '12px',
                      padding: editMaterialInput.previewUrl ? '1rem' : '1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-primary)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '110px',
                      marginBottom: '1rem',
                      color: 'var(--text-primary)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) processMaterialFile(file);
                    }}
                  >
                    <input 
                      type="file" 
                      id="story-detail-material-upload" 
                      onChange={handleEditFileChange} 
                      style={{ display: 'none' }}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    
                    {editMaterialInput.previewUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                        {editMaterialInput.type === 'Image' ? (
                          <div style={{ position: 'relative', width: '100%', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img 
                              src={editMaterialInput.previewUrl} 
                              alt="Selected preview" 
                              style={{ maxHeight: '100%', maxWidth: '100px', objectFit: 'contain', borderRadius: '6px' }}
                            />
                          </div>
                        ) : (
                          <FileText size={36} style={{ color: 'var(--text-primary)' }} />
                        )}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                          {editMaterialInput.fileName}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {editMaterialInput.fileSize}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                        <Plus size={24} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                          Drag & drop file here, or click to browse
                        </span>
                      </div>
                    )}
                  </div>

                  {editMaterialInput.previewUrl && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-grid-2col" style={{ gap: '0.75rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label" style={{ fontSize: '0.7rem' }}>Material Title *</label>
                          <input 
                            type="text" 
                            value={editMaterialInput.title}
                            onChange={(e) => setEditMaterialInput({ ...editMaterialInput, title: e.target.value })}
                            className="input-field" 
                            placeholder="Material Title"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', backgroundColor: 'var(--bg-primary)' }}
                          />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label" style={{ fontSize: '0.7rem' }}>File Type *</label>
                          <select 
                            value={editMaterialInput.type}
                            onChange={(e) => setEditMaterialInput({ ...editMaterialInput, type: e.target.value })}
                            className="input-field"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', backgroundColor: 'var(--bg-primary)' }}
                          >
                            <option value="PDF">PDF Document</option>
                            <option value="Image">Image Roadmap</option>
                            <option value="Notes">Notes File</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setEditMaterialInput({ title: '', type: 'PDF', fileName: '', fileSize: '', previewUrl: '' })}
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
                        >
                          Clear File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editMaterialInput.title.trim()) {
                              const newMaterial = {
                                title: editMaterialInput.title.trim(),
                                type: editMaterialInput.type,
                                previewUrl: editMaterialInput.previewUrl,
                                url: editMaterialInput.previewUrl,
                                fileName: editMaterialInput.fileName || 'file.pdf',
                                fileSize: editMaterialInput.fileSize || '1.0 MB'
                              };
                              setEditForm({ ...editForm, studyMaterials: [...editForm.studyMaterials, newMaterial] });
                              setEditMaterialInput({ title: '', type: 'PDF', fileName: '', fileSize: '', previewUrl: '' });
                            } else {
                              alert('Please provide a title');
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem', borderRadius: '8px' }}
                        >
                          Add Material
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  marginTop: '1rem', 
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                      <svg width="24" height="24" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.2)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray="94.2"
                          strokeDashoffset={94.2 - (94.2 * uploadProgress) / 100}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        color: 'currentColor'
                      }}>
                        {uploadProgress}%
                      </div>
                    </div>
                    <span>{uploadProgress === 100 ? 'Saving...' : 'Submitting...'}</span>
                  </div>
                ) : `Save Story Changes ${!isAdmin ? '(Submit for Approval)' : ''}`}
              </button>
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
                      src={resolveUrl(viewerFile.previewUrl || viewerFile.url)} 
                      alt={viewerFile.title} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                    />
                  </div>
                ) : (
                  <iframe 
                    src={iframeUrl} 
                    style={{ width: '100%', height: '100%', flexGrow: 1, border: 'none', borderRadius: '12px' }} 
                    title={viewerFile.title}
                  />
                )
              ) : (
                // Fallback: no actual file uploaded, show a clean message
                viewerFile.title.toLowerCase().includes('resume') || viewerFile.title.toLowerCase().includes('cv') || viewerFile.fileName?.toLowerCase().includes('resume') ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', gap: '1rem' }}>
                  <FileText size={48} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333', margin: 0 }}>No Resume File Uploaded</h3>
                  <p style={{ fontSize: '0.9rem', color: '#777', maxWidth: '360px', margin: 0 }}>
                    This story was submitted without an attached resume file. The author may add one later.
                  </p>
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
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Viewing file in secure sandbox.
              </span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {((viewerFile.previewUrl && viewerFile.previewUrl !== '#') || (viewerFile.url && viewerFile.url !== '#')) && (
                  <button 
                    type="button" 
                    onClick={() => handleDownloadFile(viewerFile.fileName || viewerFile.title, viewerFile.previewUrl || viewerFile.url)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </button>
                )}
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
        </div>
      )}

      {/* Media styling adjustments */}
      <style>{`
        .material-preview-img:hover {
          transform: scale(1.02);
        }
        @media (max-width: 768px) {
          header h1 {
            font-size: 2.25rem !important;
          }
          .story-header-flex {
            gap: 1.25rem !important;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          main section {
            margin-bottom: 2.5rem !important;
          }
          main h2 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </>
  );
}
