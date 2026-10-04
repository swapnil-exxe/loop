import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, FileText, Award, Code, BookOpen, Layers, X, Edit, Trash2, Plus, ExternalLink,
  Briefcase, Sparkles, Building2, Calendar, Star, GraduationCap, CheckCircle2, Eye
} from 'lucide-react';
import { getStories, getStoryById, updateStory, deleteStory, addPendingStory, fileToBase64 } from '../utils/db';

const getResourceLink = (res) => {
  if (!res) return null;
  const raw = res.url || res.link || (typeof res.name === 'string' ? res.name : '');
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  if (/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
};

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
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStoryFiles = () => {
    if (!story) return [];
    const list = [];
    const rf = story.resumeFile;
    const resumeName = rf?.fileName || story.resume || 'Resume.pdf';
    const resumeUrl = rf?.url ? resolveUrl(rf.url) : (story.resume && story.resume.startsWith('http') ? story.resume : (story.resume && story.resume.startsWith('/uploads/') ? resolveUrl(story.resume) : null));
    list.push({
      id: `resume-${story.id}`,
      title: `${story.name}'s Resume`,
      fileName: resumeName,
      type: 'PDF',
      mimeType: 'application/pdf',
      fileSize: rf?.fileSize || '',
      url: resumeUrl || '#',
      previewUrl: resumeUrl || '#'
    });

    if (Array.isArray(story.studyMaterials)) {
      story.studyMaterials.forEach((m, idx) => {
        list.push({
          id: `mat-${story.id}-${idx}`,
          title: m.title || `Material ${idx + 1}`,
          fileName: m.fileName || m.title,
          type: m.type || 'Document',
          fileSize: m.fileSize || '',
          url: m.url ? resolveUrl(m.url) : '#',
          previewUrl: m.url ? resolveUrl(m.url) : '#'
        });
      });
    }
    return list;
  };

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
    if (isEditing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditing]);

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
    const lines = projectsString.split('\n').filter(l => l.trim().length > 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {lines.map((line, index) => {
          const cleanLine = line.replace(/^\d+[\.\)]\s*/, '');
          return (
            <div 
              key={index} 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                {index + 1}
              </div>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                {cleanLine}
              </p>
            </div>
          );
        })}
      </div>
    );
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

      {/* Profile Header */}
      <header style={{
        marginBottom: '3rem'
      }}>
        <div style={{
          padding: '2.5rem',
          borderRadius: '24px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle gradient background accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #0071e3, #5e5ce6, #30d158)'
          }} />

          {/* Top metadata pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              {story.branch} {story.subBranch && `(${story.subBranch})`}
            </span>
            <span style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              Class of {story.passoutYear}
            </span>
            <span style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              backgroundColor: 'rgba(48, 209, 88, 0.12)',
              border: '1px solid rgba(48, 209, 88, 0.3)',
              color: '#30d158',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <CheckCircle2 size={13} /> Placed
            </span>
          </div>
          
          <h1 style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '0.6rem',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
            lineHeight: 1.15
          }}>
            {story.name}
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            margin: '0 0 1.5rem 0'
          }}>
            <span>{story.role}</span>
            <span style={{ color: 'var(--text-muted)' }}>at</span>
            <span style={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              {story.company}
            </span>
          </p>

          {/* 4-Tile Bento Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.85rem',
            marginTop: '1.5rem'
          }}>
            <div style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                <Building2 size={13} /> Company
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                {story.company}
              </p>
            </div>

            <div style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                <Briefcase size={13} /> Role
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                {story.role}
              </p>
            </div>

            <div style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                <Calendar size={13} /> Semester Placed
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                Semester {story.semester}
              </p>
            </div>

            <div style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                <Star size={13} /> CGPA
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                {story.cgpa || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Reading Block */}
      <main style={{ fontFamily: 'var(--font-sans)' }}>
        
        {/* Senior Advice Card */}
        <div style={{
          padding: '1.75rem 2rem',
          borderRadius: '18px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: '5px solid #0071e3',
          marginBottom: '3.5rem',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem', color: '#0071e3', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Sparkles size={15} /> Senior Advice to Juniors
          </div>
          <p style={{
            fontSize: '1.12rem',
            lineHeight: '1.7',
            color: 'var(--text-primary)',
            fontStyle: 'italic',
            fontWeight: 500,
            margin: 0
          }}>
            "My biggest advice to SPIT juniors is to stay consistent. Don't wait for companies to arrive. Start building projects in your second year and begin coding practice daily. Your hard work will compounding."
          </p>
        </div>

        {/* 4-Year Journey Timeline */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
              <GraduationCap size={20} color="var(--text-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', margin: 0 }}>
                My Four-Year Journey
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                How preparation, projects, and coursework evolved from Semester 1 to Placements
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Year 1 */}
            <div style={{
              display: 'flex',
              gap: '1.25rem',
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--accent-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 800
              }}>1</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  First Year — Exploration & Foundations
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.7', margin: 0 }}>
                  {story.journey.firstYear}
                </p>
              </div>
            </div>

            {/* Year 2 */}
            <div style={{
              display: 'flex',
              gap: '1.25rem',
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--accent-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 800
              }}>2</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Second Year — Core DSA & Skill Building
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.7', margin: 0 }}>
                  {story.journey.secondYear}
                </p>
              </div>
            </div>

            {/* Year 3 */}
            <div style={{
              display: 'flex',
              gap: '1.25rem',
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--accent-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 800
              }}>3</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Third Year — Deep Dive & Internships
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.7', margin: 0 }}>
                  {story.journey.thirdYear}
                </p>
              </div>
            </div>

            {/* Year 4 */}
            <div style={{
              display: 'flex',
              gap: '1.25rem',
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--accent-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
                fontWeight: 800
              }}>4</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Fourth Year — Placements & Job Offers
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.7', margin: 0 }}>
                  {story.journey.fourthYear}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preparation Strategy */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{
            padding: '2rem',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <Award size={18} color="var(--text-primary)" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', margin: 0 }}>
                Preparation Strategy & Study Routine
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.75', margin: 0 }}>
              {story.journey.prep}
            </p>
          </div>
        </section>

        {/* Key Projects Built */}
        {story.journey.projects && (
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  <Code size={18} color="var(--text-primary)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', margin: 0 }}>
                  Key Projects Built
                </h2>
              </div>
              {formatProjects(story.journey.projects)}
            </div>
          </section>
        )}

        {/* The Recruitment Process */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{
            padding: '2rem',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <Layers size={18} color="var(--text-primary)" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', margin: 0 }}>
                How I Secured the Role
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.75', margin: 0 }}>
              {story.journey.howSecured}
            </p>
          </div>
        </section>

        {/* Custom Prompts / Sections */}
        {story.customSections && story.customSections.map((sec, index) => (
          <section key={index} style={{ marginBottom: '3.5rem' }}>
            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                {sec.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.75', whiteSpace: 'pre-wrap', margin: 0 }}>
                {sec.content}
              </p>
            </div>
          </section>
        ))}

        {/* Resources Used List */}
        {story.resources && story.resources.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  <BookOpen size={18} color="var(--text-primary)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', margin: 0 }}>
                  Resources Used
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {story.resources.map((res, index) => {
                  const link = getResourceLink(res);
                  return link ? (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${link} in a new tab`}
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.9rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{res.name}</span>
                      {res.type && <span className="badge" style={{ fontSize: '0.65rem' }}>{res.type}</span>}
                      <ExternalLink size={14} style={{ color: 'var(--text-secondary)' }} />
                    </a>
                  ) : (
                    <div key={index} style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.9rem',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}>
                      <span style={{ fontWeight: 600 }}>{res.name}</span>
                      {res.type && <span className="badge" style={{ fontSize: '0.65rem' }}>{res.type}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Resume Preview & Download Section */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{
            padding: '2rem',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <FileText size={18} color="var(--text-primary)" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', margin: 0 }}>
                Verified Resume
              </h2>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 59, 48, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff3b30'
                }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.2rem 0', color: 'var(--text-primary)' }}>
                    {typeof story.resume === 'object' ? story.resume.fileName : story.resume}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#30d158', fontWeight: 600 }}>• Standard Verified Format</span>
                    <span>PDF Document</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    const allFiles = getStoryFiles();
                    const resumeDoc = allFiles[0];
                    navigate(`/preview/${resumeDoc.id}?storyId=${story.id}`, {
                      state: {
                        file: resumeDoc,
                        files: allFiles,
                        storyTitle: story.name
                      }
                    });
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', gap: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '10px' }}
                  title="View Resume"
                >
                  <Eye size={14} />
                  <span>View Resume</span>
                </button>
                <button 
                  onClick={() => {
                    const rf = story.resumeFile;
                    if (rf?.url && rf.url !== '#') {
                      handleDownloadFile(rf.fileName || 'resume.pdf', rf.url);
                    } else if (story.resume && story.resume !== '#') {
                      handleDownloadFile(story.resume, story.resume);
                    } else {
                      alert('No resume file was uploaded for this story.');
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', gap: '0.4rem', borderRadius: '10px', fontWeight: 600 }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Study Materials Uploaded Section */}
        {story.studyMaterials && story.studyMaterials.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  <BookOpen size={18} color="var(--text-primary)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', margin: 0 }}>
                  Study Materials Uploaded
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {story.studyMaterials.map((mat, index) => {
                  const isImage = mat.type === 'Image' && mat.url && mat.url !== '#';
                  return (
                    <div key={index} style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                            {mat.title}
                          </h4>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span className="badge" style={{ fontSize: '0.65rem' }}>
                              {mat.type}
                            </span>
                            {mat.fileSize && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                {mat.fileSize}
                              </span>
                            )}
                          </div>
                        </div>

                        {mat.url && mat.url !== '#' && (
                          <button 
                            onClick={() => handleDownloadFile(mat.fileName || mat.title, mat.url)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Download File"
                          >
                            <Download size={13} />
                          </button>
                        )}
                      </div>

                      {isImage && (
                        <div 
                          onClick={() => {
                            const allFiles = getStoryFiles();
                            const matDoc = allFiles[index + 1] || { ...mat, id: `mat-${story.id}-${index}`, type: 'Image' };
                            navigate(`/preview/${matDoc.id}?storyId=${story.id}`, {
                              state: {
                                file: matDoc,
                                files: allFiles,
                                storyTitle: story.name
                              }
                            });
                          }}
                          style={{
                            width: '100%',
                            height: '140px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          <img 
                            src={mat.url} 
                            alt={mat.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const allFiles = getStoryFiles();
                          const matDoc = allFiles[index + 1] || { ...mat, id: `mat-${story.id}-${index}` };
                          navigate(`/preview/${matDoc.id}?storyId=${story.id}`, {
                            state: {
                              file: matDoc,
                              files: allFiles,
                              storyTitle: story.name
                            }
                          });
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <Eye size={13} />
                        <span>View Document</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

      </main>
    </div>



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
