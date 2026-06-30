import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Filter, Upload, X, ArrowRight, Plus, Briefcase, CheckCircle, FileText, Search } from 'lucide-react';
import { getStories, addPendingStory, fileToBase64 } from '../utils/db';

export default function Stories() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load initial branch filter from location state (if navigated from Landing)
  const initialBranch = location.state?.initialBranch || 'ALL';

  const userSession = localStorage.getItem('loop_current_user');
  const currentUser = userSession ? JSON.parse(userSession) : null;

  const [stories, setStories] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState(
    initialBranch === 'ALL' ? ['CSE', 'CE', 'EXTC'] : [initialBranch]
  );
  const [selectedSubBranches, setSelectedSubBranches] = useState(['CSE', 'AI', 'DS']);
  const [minYear, setMinYear] = useState('ALL');
  const [maxYear, setMaxYear] = useState('ALL');
  const [minCGPA, setMinCGPA] = useState(4.0);
  const yearOptions = ['ALL', ...Array.from({ length: 36 }, (_, i) => 2000 + i)];
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(() => {
    return !!location.state?.openUploadModal;
  });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    branch: 'CSE',
    subBranch: 'CSE',
    passoutYear: '2026',
    company: '',
    role: '',
    semester: '7',
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
    resources: [],
    studyMaterials: []
  });

  // Resource input state
  const [resourceInput, setResourceInput] = useState({ name: '', type: 'DSA' });
  // Study material input state
  const [materialInput, setMaterialInput] = useState({ title: '', type: 'PDF', fileName: '', fileSize: '', previewUrl: '' });
  const [resumeUploadFile, setResumeUploadFile] = useState(null);
  // Custom journey sections state
  const [customSections, setCustomSections] = useState([]);

  // File upload change handler
  const processMaterialFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    let determinedType = 'Notes';
    if (extension === 'pdf') {
      determinedType = 'PDF';
    } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
      determinedType = 'Image';
    } else if (file.name.toLowerCase().includes('roadmap')) {
      determinedType = 'Roadmap';
    }
    
    fileToBase64(file).then(base64Url => {
      setMaterialInput({
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processMaterialFile(file);
  };

  const processResumeFile = (file) => {
    fileToBase64(file).then(base64Url => {
      setResumeUploadFile({
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: base64Url
      });
    }).catch(err => {
      console.error("Error reading file:", err);
      alert("Failed to read file.");
    });
  };

  const handleAddCustomSection = () => {
    setCustomSections([...customSections, { title: '', content: '' }]);
  };

  const handleUpdateCustomSection = (index, field, value) => {
    const nextSections = [...customSections];
    nextSections[index][field] = value;
    setCustomSections(nextSections);
  };

  const handleRemoveCustomSection = (index) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };

  useEffect(() => {
    setLoading(true);
    getStories()
      .then(data => {
        setStories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching stories:", err);
        setLoading(false);
      });
    if (location.state?.openUploadModal) {
      // Clear location state to prevent modal reopening on page reloads
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 250);
    return () => clearTimeout(handler);
  }, [inputValue]);

  // Filtered stories based on sidebar selections + search query
  const filteredStories = stories.filter(story => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = (story.name || '').toLowerCase().includes(q);
      const inCompany = (story.company || '').toLowerCase().includes(q);
      const inRole = (story.role || '').toLowerCase().includes(q);
      const inBranch = (story.branch || '').toLowerCase().includes(q);
      const inSubBranch = (story.subBranch || '').toLowerCase().includes(q);
      const inResources = (story.resources || []).some(r =>
        (r.name || '').toLowerCase().includes(q) || (r.type || '').toLowerCase().includes(q)
      );
      const inPrep = (story.journey?.prep || '').toLowerCase().includes(q);
      const inHowSecured = (story.journey?.howSecured || '').toLowerCase().includes(q);
      if (!inName && !inCompany && !inRole && !inBranch && !inSubBranch && !inResources && !inPrep && !inHowSecured) return false;
    }

    // Branch Match
    const branchMatch = selectedBranches.includes(story.branch);
    if (!branchMatch) return false;
    
    // If the story is CSE, also check if its subBranch is in selectedSubBranches
    if (story.branch === 'CSE' && story.subBranch) {
      const subMatch = selectedSubBranches.includes(story.subBranch);
      if (!subMatch) return false;
    }
    
    // Year Match
    const year = parseInt(story.passoutYear);
    const minMatch = minYear === 'ALL' || isNaN(year) || year >= parseInt(minYear);
    const maxMatch = maxYear === 'ALL' || isNaN(year) || year <= parseInt(maxYear);
    const yearMatch = minMatch && maxMatch;
    if (!yearMatch) return false;
    
    // CGPA Match
    const cgpaVal = parseFloat(story.cgpa);
    const cgpaMatch = (!isNaN(cgpaVal)) ? (cgpaVal >= minCGPA) : true;
    if (!cgpaMatch) return false;
    
    return true;
  });

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.role) {
      alert('Please fill in the required fields (Name, Company, Role)');
      return;
    }

    setSubmitting(true);
    const photoUrl = '/images/file-1.jpg';

    // Auto-add staged material if user selected a file but forgot to click '+'
    let finalStudyMaterials = [...formData.studyMaterials];
    if (materialInput.title.trim() && materialInput.previewUrl) {
      // Check if it's already added to prevent duplicate
      const isAlreadyAdded = finalStudyMaterials.some(m => m.previewUrl === materialInput.previewUrl);
      if (!isAlreadyAdded) {
        finalStudyMaterials.push({
          title: materialInput.title.trim(),
          type: materialInput.type,
          fileName: materialInput.fileName,
          fileSize: materialInput.fileSize,
          url: materialInput.previewUrl,
          previewUrl: materialInput.previewUrl
        });
      }
    }

    const submission = {
      ...formData,
      studyMaterials: finalStudyMaterials.map(m => ({
        title: m.title,
        type: m.type,
        fileName: m.fileName,
        fileSize: m.fileSize,
        url: m.url || m.previewUrl || ''
      })),
      photo: photoUrl,
      requestType: 'add',
      customSections: customSections.filter(sec => sec.title.trim() && sec.content.trim()),
      resume: resumeUploadFile
        ? resumeUploadFile.fileName
        : `${formData.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`,
      resumeFile: resumeUploadFile || null,
      uploadedByEmail: currentUser ? currentUser.email : ''
    };
    
    try {
      setUploadProgress(0);
      await addPendingStory(submission, (progress) => {
        setUploadProgress(progress);
      });
      setUploadSuccess(true);
    } catch (err) {
      console.error('Error submitting story:', err);
      alert(err.message);
      setSubmitting(false);
      return;
    }
    
    // Reset form
    setTimeout(() => {
      setIsModalOpen(false);
      setUploadSuccess(false);
      setSubmitting(false);
      setCustomSections([]);
      setResumeUploadFile(null);
      setFormData({
        name: '',
        branch: 'CSE',
        subBranch: 'CSE',
        passoutYear: '2026',
        company: '',
        role: '',
        semester: '7',
        cgpa: '',
        journey: { firstYear: '', secondYear: '', thirdYear: '', fourthYear: '', prep: '', projects: '', howSecured: '' },
        resources: [],
        studyMaterials: []
      });
    }, 2500);
  };

  const handleAddResource = () => {
    if (!resourceInput.name.trim()) return;
    setFormData({
      ...formData,
      resources: [...formData.resources, { ...resourceInput }]
    });
    setResourceInput({ name: '', type: 'DSA' });
  };

  const handleAddMaterial = () => {
    if (!materialInput.title.trim()) return;
    setFormData({
      ...formData,
      studyMaterials: [...formData.studyMaterials, { ...materialInput, url: materialInput.previewUrl || '#' }]
    });
    setMaterialInput({ title: '', type: 'PDF', fileName: '', fileSize: '', previewUrl: '' });
  };

  return (
    <div className="container" style={{ paddingTop: '6.5rem', paddingBottom: '5rem' }}>
      {/* Header and Filter panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Senior Stories</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Explore authentic placement and internship journeys from SPIT alumni.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <Upload size={16} />
          <span>Share Your Journey</span>
        </button>
      </div>

      {/* Sidebar and Stories List Container */}
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        marginTop: '2rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* Sidebar Filters */}
        <div className="loop-card" style={{
          width: '260px',
          flexShrink: 0,
          padding: '1.75rem',
          borderRadius: '24px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          position: 'sticky',
          top: '6rem'
        }}>
          <div>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              marginBottom: '1.25rem',
              letterSpacing: '0.05em',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Filter size={16} />
              Filters
            </h3>

            {/* Branch Checkboxes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Branch
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {['CSE', 'CE', 'EXTC'].map((branch) => (
                  <div key={branch} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedBranches.includes(branch)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBranches([...selectedBranches, branch]);
                          } else {
                            setSelectedBranches(selectedBranches.filter(b => b !== branch));
                          }
                        }}
                        style={{
                          accentColor: 'var(--text-primary)',
                          width: '15px',
                          height: '15px',
                          cursor: 'pointer'
                        }}
                      />
                      <span>{branch}</span>
                    </label>

                    {/* Sub-Branch Checkboxes (For CSE only, visible when CSE is checked) */}
                    {branch === 'CSE' && selectedBranches.includes('CSE') && (
                      <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '1px solid var(--border-color)', marginLeft: '0.4rem', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                        {['CSE', 'AI', 'DS'].map((sub) => (
                          <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedSubBranches.includes(sub)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubBranches([...selectedSubBranches, sub]);
                                } else {
                                  setSelectedSubBranches(selectedSubBranches.filter(s => s !== sub));
                                }
                              }}
                              style={{
                                accentColor: 'var(--text-primary)',
                                width: '13px',
                                height: '13px',
                                cursor: 'pointer'
                              }}
                            />
                            <span>{sub}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Passout Year Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Passout Year
              </h4>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <select 
                  className="input-field" 
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', flexGrow: 1, height: 'auto', backgroundColor: 'var(--bg-primary)' }}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>to</span>
                <select 
                  className="input-field" 
                  value={maxYear}
                  onChange={(e) => setMaxYear(e.target.value)}
                  style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', flexGrow: 1, height: 'auto', backgroundColor: 'var(--bg-primary)' }}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CGPA Threshold */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Min CGPA
                </h4>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {minCGPA.toFixed(1)}+
                </span>
              </div>
              <input 
                type="range" 
                min="4.0" 
                max="10.0" 
                step="0.5" 
                value={minCGPA} 
                onChange={(e) => setMinCGPA(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <span>4.0</span>
                <span>7.0</span>
                <span>10.0</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setSelectedBranches(['CSE', 'CE', 'EXTC']);
              setSelectedSubBranches(['CSE', 'AI', 'DS']);
              setMinYear('ALL');
              setMaxYear('ALL');
              setMinCGPA(4.0);
              setInputValue('');
              setSearchQuery('');
            }}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            Reset Filters
          </button>
        </div>

        {/* Stories List (on the right) */}
        <div style={{ flexGrow: 1, minWidth: '320px' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by name, company, role, branch, resource…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{ paddingLeft: '2.5rem', paddingRight: inputValue ? '2.5rem' : '1rem', borderRadius: '14px', fontSize: '0.9rem' }}
            />
            {inputValue && (
              <button
                onClick={() => {
                  setInputValue('');
                  setSearchQuery('');
                }}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Results count */}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {loading ? 'Searching stories...' : `${filteredStories.length} ${filteredStories.length === 1 ? 'story' : 'stories'} found${searchQuery ? ` for "${searchQuery}"` : ''}`}
          </p>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}>
              {[1, 2, 3].map((n) => (
                <div 
                  key={n} 
                  className="loop-card skeleton-pulse"
                  style={{
                    padding: '1.75rem 2rem',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '140px',
                    position: 'relative',
                    border: '1px solid var(--border-color)',
                    borderRadius: '24px',
                    backgroundColor: 'var(--bg-secondary)',
                    gap: '2rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flexGrow: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <div style={{ height: '1.75rem', width: '200px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <div style={{ height: '1.2rem', width: '60px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
                        <div style={{ height: '1.2rem', width: '80px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ height: '1rem', width: '150px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ height: '1.2rem', width: '120px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
                      <div style={{ height: '1.2rem', width: '60px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ width: '130px', height: '2.5rem', backgroundColor: 'var(--border-color)', borderRadius: '12px' }} />
                </div>
              ))}
            </div>
          ) : filteredStories.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}>
              {filteredStories.map((story) => (
                <div 
                  key={story.id} 
                  className="loop-card hinge-card animate-fade-in"
                  style={{
                    padding: '1.75rem 2rem',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '140px',
                    position: 'relative',
                    border: '1px solid var(--border-color)',
                    borderRadius: '24px',
                    backgroundColor: 'var(--bg-secondary)',
                    gap: '2rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flexGrow: 1, minWidth: '260px' }}>
                    {/* Profile Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                        {story.name}
                      </h2>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>
                          {story.branch} {story.subBranch && `(${story.subBranch})`}
                        </span>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>
                          Class of {story.passoutYear}
                        </span>
                      </div>
                    </div>

                    {/* Company stats chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Briefcase size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{story.company}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>•</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{story.role}</span>
                    </div>

                    {/* Other metadata */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ fontSize: '0.65rem' }}>Semester {story.semester} Placed</span>
                      {story.cgpa && <span className="badge" style={{ fontSize: '0.65rem' }}>CGPA: {story.cgpa}</span>}
                    </div>
                  </div>

                  {/* Action button */}
                  <div style={{ flexShrink: 0 }}>
                    <button 
                      onClick={() => navigate(`/stories/${story.id}`)}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid var(--border-color)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>Read Journey</span>
                      <ArrowRight size={14} />
                    </button>
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
              <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No student stories found matching the filter.</p>
              <button onClick={() => {
                setSelectedBranches(['CSE', 'CE', 'EXTC']);
                setSelectedSubBranches(['CSE', 'AI', 'DS']);
                setMinYear(2021);
                setMaxYear(2026);
                setMinCGPA(6.0);
              }} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Story Modal */}
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
          padding: '1.5rem',
          overflowY: 'auto'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '650px',
            borderRadius: '24px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            maxHeight: '90vh',
            overflowY: 'auto',
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
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Submission Sent!</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  Thank you for contributing. Your placement journey has been sent to the SPIT administrators for approval.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>
                  Share Your Story
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                  Help juniors prepare by sharing your interview prep, milestones, and materials.
                </p>

                {/* Form Fields - Step 1: Personal Details */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                  1. Profile Details
                </h3>

                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className={formData.branch === 'CSE' ? 'form-grid-3col' : 'form-grid-2col'}>
                  <div className="input-group">
                    <label className="input-label">Branch *</label>
                    <select 
                      className="input-field"
                      value={formData.branch}
                      onChange={(e) => {
                        const nextBranch = e.target.value;
                        setFormData({ 
                          ...formData, 
                          branch: nextBranch, 
                          subBranch: nextBranch === 'CSE' ? 'CSE' : '' 
                        });
                      }}
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <option value="CSE">CSE</option>
                      <option value="CE">CE</option>
                      <option value="EXTC">EXTC</option>
                    </select>
                  </div>

                  {formData.branch === 'CSE' && (
                    <div className="input-group">
                      <label className="input-label">Sub-Category *</label>
                      <select
                        className="input-field"
                        value={formData.subBranch || 'CSE'}
                        onChange={(e) => setFormData({ ...formData, subBranch: e.target.value })}
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <option value="CSE">CSE</option>
                        <option value="AI">AI</option>
                        <option value="DS">DS</option>
                      </select>
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label">Passout Year *</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="2026"
                      value={formData.passoutYear}
                      onChange={(e) => setFormData({ ...formData, passoutYear: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-4col">
                  <div className="input-group">
                    <label className="input-label">Company *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Microsoft"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Role *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Software Engineer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Semester Placed *</label>
                    <select 
                      className="input-field"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    >
                      {['1','2','3','4','5','6','7','8'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">CGPA (Optional)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. 9.4"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    />
                  </div>
                </div>

                {/* Step 2: The Journey */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: '2rem 0 1.25rem 0' }}>
                  2. Your Journey (Year by Year)
                </h3>

                <div className="input-group">
                  <label className="input-label">First Year Journey *</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="Exploration, core subjects, clubs joined..."
                    value={formData.journey.firstYear}
                    onChange={(e) => setFormData({
                      ...formData,
                      journey: { ...formData.journey, firstYear: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Second Year Journey *</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="DSA start, tech stack selection, core projects..."
                    value={formData.journey.secondYear}
                    onChange={(e) => setFormData({
                      ...formData,
                      journey: { ...formData.journey, secondYear: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Third Year Journey *</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="Internship prep, online tests, cracking placement drives..."
                    value={formData.journey.thirdYear}
                    onChange={(e) => setFormData({
                      ...formData,
                      journey: { ...formData.journey, thirdYear: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Fourth Year Journey *</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="PPO conversion, capstone project, final plans..."
                    value={formData.journey.fourthYear}
                    onChange={(e) => setFormData({
                      ...formData,
                      journey: { ...formData.journey, fourthYear: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Preparation & Strategy *</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="DSA sheets, systems subjects revised, resume tips..."
                    value={formData.journey.prep}
                    onChange={(e) => setFormData({
                      ...formData,
                      journey: { ...formData.journey, prep: e.target.value }
                    })}
                    required
                  />
                </div>



                <div className="input-group">
                  <label className="input-label">How You Secured the Placement *</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="Rounds details, interview questions asked, advice..."
                    value={formData.journey.howSecured}
                    onChange={(e) => setFormData({
                      ...formData,
                      journey: { ...formData.journey, howSecured: e.target.value }
                    })}
                    required
                  />
                </div>

                {/* Custom Prompts Builder (Add More Columns/Sections) */}
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    Custom Sections & Prompts
                  </h4>
                  {customSections.map((sec, index) => (
                    <div key={index} style={{
                      padding: '1.25rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      backgroundColor: 'var(--bg-primary)',
                      marginBottom: '1.25rem',
                      position: 'relative'
                    }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSection(index)}
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                      
                      <div className="input-group" style={{ marginBottom: '0.75rem', paddingRight: '2rem' }}>
                        <label className="input-label">Section Headline *</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Hackathons & Competitions, Key Open Source Contributions..."
                          value={sec.title}
                          onChange={(e) => handleUpdateCustomSection(index, 'title', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Section Details *</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          placeholder="Write the details / strategy for this custom prompt..."
                          value={sec.content}
                          onChange={(e) => handleUpdateCustomSection(index, 'content', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddCustomSection}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px dashed var(--border-color)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Plus size={16} />
                    <span>Add Custom Prompts / Sections</span>
                  </button>
                </div>

                {/* Step 3: Resources and Uploads */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: '2rem 0 1.25rem 0' }}>
                  3. Resources & Materials Used
                </h3>

                {/* Resources Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Add Resource Used (e.g. LeetCode, Striver Sheet)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Resource Name"
                      value={resourceInput.name}
                      onChange={(e) => setResourceInput({ ...resourceInput, name: e.target.value })}
                      style={{ flexGrow: 1 }}
                    />
                    <select 
                      className="input-field"
                      value={resourceInput.type}
                      onChange={(e) => setResourceInput({ ...resourceInput, type: e.target.value })}
                      style={{ width: '130px' }}
                    >
                      <option value="DSA">DSA</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Books">Books</option>
                      <option value="System Design">System Design</option>
                      <option value="Web Dev">Web Dev</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={handleAddResource} 
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {/* Resources preview list */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {formData.resources.map((res, index) => (
                      <span key={index} className="badge" style={{ fontSize: '0.7rem' }}>
                        {res.name} ({res.type})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dedicated Resume Upload Input */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <label className="input-label">Upload Senior Resume (PDF) *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <div 
                      onClick={() => document.getElementById('resume-file-upload')?.click()}
                      style={{
                        border: '1px dashed var(--border-color)',
                        borderRadius: '12px',
                        padding: resumeUploadFile ? '1rem' : '1.5rem',
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
                        id="resume-file-upload" 
                        onChange={(e) => {
                           const file = e.target.files[0];
                           if (!file) return;
                           
                           fileToBase64(file).then(base64Url => {
                             setResumeUploadFile({
                               fileName: file.name,
                               fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                               url: base64Url
                             });
                           }).catch(err => {
                             console.error("Error reading file:", err);
                             alert("Failed to read file.");
                           });
                         }} 
                        style={{ display: 'none' }}
                        accept=".pdf"
                      />
                      {resumeUploadFile ? (
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
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{resumeUploadFile.fileName}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{resumeUploadFile.fileSize}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (resumeUploadFile.url && resumeUploadFile.url.startsWith('blob:')) {
                                URL.revokeObjectURL(resumeUploadFile.url);
                              }
                              setResumeUploadFile(null);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem', color: '#ff453a', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="Remove Resume"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <FileText size={22} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                            Click to select your Resume PDF (Required)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Study Materials Input */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <label className="input-label">Upload Study Material (PDF, PNG, JPG) *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    
                    {/* Mock Dropzone File Selector */}
                    <div 
                      onClick={() => document.getElementById('material-file-upload')?.click()}
                      style={{
                        border: '1px dashed var(--border-color)',
                        borderRadius: '12px',
                        padding: materialInput.previewUrl ? '1rem' : '1.5rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-primary)',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '120px'
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
                        id="material-file-upload" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }}
                        accept=".pdf,.png,.jpg,.jpeg"
                      />
                      {materialInput.previewUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                          {materialInput.type === 'Image' ? (
                            <div style={{ position: 'relative', width: '100%', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <img 
                                src={materialInput.previewUrl} 
                                alt="Preview" 
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} 
                              />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{
                                width: '48px',
                                height: '60px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: materialInput.type === 'PDF' ? '#ffe5e5' : '#e5f1ff',
                                color: materialInput.type === 'PDF' ? '#ff3b30' : '#007aff',
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}>
                                {materialInput.type}
                              </div>
                            </div>
                          )}
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                            {materialInput.fileName}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {materialInput.fileSize} • Click to change file
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload size={22} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                            Click to select or drop a study material file (PDF or Image)
                          </p>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Material Title"
                        value={materialInput.title}
                        onChange={(e) => setMaterialInput({ ...materialInput, title: e.target.value })}
                        style={{ flexGrow: 1 }}
                      />
                      <select 
                        className="input-field"
                        value={materialInput.type}
                        onChange={(e) => setMaterialInput({ ...materialInput, type: e.target.value })}
                        style={{ width: '130px' }}
                      >
                        <option value="PDF">PDF</option>
                        <option value="Image">Image</option>
                        <option value="Roadmap">Roadmap</option>
                        <option value="Notes">Notes</option>
                        <option value="Interview Questions">Interview Qs</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={handleAddMaterial} 
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Materials preview list */}
                  {formData.studyMaterials.length > 0 && (
                    <div style={{ 
                      marginTop: '1.25rem', 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                      gap: '0.75rem' 
                    }}>
                      {formData.studyMaterials.map((mat, index) => (
                        <div 
                          key={index} 
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '0.75rem 0.5rem',
                            position: 'relative',
                            backgroundColor: 'var(--bg-primary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            textAlign: 'center'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (mat.url && mat.url.startsWith('blob:')) {
                                URL.revokeObjectURL(mat.url);
                              }
                              setFormData({
                                ...formData,
                                studyMaterials: formData.studyMaterials.filter((_, i) => i !== index)
                              });
                            }}
                            style={{
                              position: 'absolute',
                              top: '0.25rem',
                              right: '0.25rem',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              fontSize: '0.65rem'
                            }}
                          >
                            ✕
                          </button>
                          
                          {mat.type === 'Image' && mat.url && mat.url !== '#' ? (
                            <div style={{ width: '100%', height: '55px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', overflow: 'hidden' }}>
                              <img 
                                src={mat.url} 
                                alt={mat.title} 
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                              />
                            </div>
                          ) : (
                            <div style={{ 
                              width: '36px', 
                              height: '45px', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '4px', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              backgroundColor: mat.type === 'PDF' ? '#ffe5e5' : '#e5f1ff', 
                              color: mat.type === 'PDF' ? '#ff3b30' : '#007aff', 
                              fontWeight: 'bold', 
                              fontSize: '0.6rem' 
                            }}>
                              {mat.type}
                            </div>
                          )}
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.25rem' }}>
                            {mat.title}
                          </span>
                          {mat.fileSize && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                              {mat.fileSize}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="btn btn-secondary"
                      style={{ padding: '0.8rem 1.5rem' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="btn btn-primary"
                      style={{ 
                        padding: '0.8rem 2rem',
                        opacity: submitting ? 0.7 : 1,
                        cursor: submitting ? 'not-allowed' : 'pointer'
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
                      ) : 'Submit Journey'}
                    </button>
                  </div>
                  {submitting && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#ff4d4d',
                      margin: '0.2rem 0 0 0',
                      opacity: 0.9,
                      textAlign: 'right',
                      fontWeight: '500'
                    }}>
                      ⚠️ Keep this tab active. Switching or minimizing tabs will pause the upload.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Styled card interactions */}
      <style>{`
        .hinge-card {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hinge-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);
          border-color: var(--text-secondary);
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.35; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
        @media (max-width: 576px) {
          .hinge-card {
            height: auto !important;
            min-height: 480px;
          }
          div[style*="height: '55%'"] {
            height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
}
