/**
 * Localhost Mock Data for UI/UX Testing & Previews
 * Used ONLY when running on localhost to populate folders, APKs,
 * documents, and Admin pending requests.
 */

export const localMockResources = [
  // 1. Placement Material
  {
    id: 'mock-place-1',
    title: 'Top 100 SDE Sheet & DSA Patterns',
    originalFileName: 'striver_sde_top100_patterns.pdf',
    category: 'Placement',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 2450000,
    fileSize: '2.45 MB',
    uploadedBy: 'Aditya Sharma',
    date: '2026-03-15',
    folderId: 'system-placement-material',
    tags: ['DSA', 'LeetCode', 'Interview']
  },
  {
    id: 'mock-place-2',
    title: 'Quant & Aptitude Formula Handbook 2026',
    originalFileName: 'quant_aptitude_formulae_2026.pdf',
    category: 'Placement',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 1820000,
    fileSize: '1.82 MB',
    uploadedBy: 'Neha Patel',
    date: '2026-02-28',
    folderId: 'system-placement-material',
    tags: ['Aptitude', 'Placement']
  },
  {
    id: 'mock-place-3',
    title: 'System Design Interview Cheatsheet',
    originalFileName: 'system_design_primer_notes.pdf',
    category: 'Placement',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 3200000,
    fileSize: '3.20 MB',
    uploadedBy: 'Rohan Mehta',
    date: '2026-01-20',
    folderId: 'system-placement-material',
    tags: ['System Design', 'High Level']
  },

  // 2. CSE 1st Year - Sem 1
  {
    id: 'mock-cse-1-1-1',
    title: 'Engineering Mathematics-I Complete Lecture Notes',
    originalFileName: 'maths1_calculus_matrices_notes.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 4100000,
    fileSize: '4.10 MB',
    uploadedBy: 'Prof. K. Verma',
    date: '2025-09-12',
    folderId: 'cse-1st-sem-1',
    tags: ['Maths', 'Semester 1']
  },
  {
    id: 'mock-cse-1-1-2',
    title: 'C Programming Syntax & Lab Solutions (ZIP)',
    originalFileName: 'c_programming_lab_solutions.zip',
    category: 'CSE',
    type: 'ZIP',
    mimeType: 'application/zip',
    url: '#',
    previewUrl: '#',
    size: 5800000,
    fileSize: '5.80 MB',
    uploadedBy: 'Simran Kaur',
    date: '2025-10-04',
    folderId: 'cse-1st-sem-1',
    tags: ['C Language', 'Lab']
  },

  // 3. CSE 1st Year - Sem 2
  {
    id: 'mock-cse-1-2-1',
    title: 'Applied Physics-II Wave Optics & Lasers',
    originalFileName: 'applied_physics_optics_lasers.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 3240000,
    fileSize: '3.24 MB',
    uploadedBy: 'Aditya Sharma',
    date: '2026-01-18',
    folderId: 'cse-1st-sem-2',
    tags: ['Physics', 'Sem 2']
  },
  {
    id: 'mock-cse-1-2-2',
    title: 'Basic Electrical Engineering Solved Papers (2021-2025)',
    originalFileName: 'bee_solved_papers_5years.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 2950000,
    fileSize: '2.95 MB',
    uploadedBy: 'Tanvi Kulkarni',
    date: '2026-02-10',
    folderId: 'cse-1st-sem-2',
    tags: ['BEE', 'Question Paper']
  },

  // 4. CSE 2nd Year - Sem 1 (Sem 3)
  {
    id: 'mock-cse-2-1-1',
    title: 'Data Structures & Algorithms Detailed Notes',
    originalFileName: 'dsa_trees_graphs_heaps_complete.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 6100000,
    fileSize: '6.10 MB',
    uploadedBy: 'Neha Patel',
    date: '2025-08-25',
    folderId: 'cse-2nd-sem-1',
    tags: ['DSA', 'Core CSE']
  },
  {
    id: 'mock-cse-2-1-2',
    title: 'Discrete Mathematics Proofs & Relations Handbook',
    originalFileName: 'discrete_mathematics_cheatsheet.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 2150000,
    fileSize: '2.15 MB',
    uploadedBy: 'Rohan Mehta',
    date: '2025-09-02',
    folderId: 'cse-2nd-sem-1',
    tags: ['Maths', 'Core']
  },

  // 5. CSE 2nd Year - Sem 2 (Sem 4)
  {
    id: 'mock-cse-2-2-1',
    title: 'Operating Systems Virtual Memory & Scheduling (PPTX)',
    originalFileName: 'os_scheduling_virtual_memory_slides.pptx',
    category: 'CSE',
    type: 'PPTX',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    url: '#',
    previewUrl: '#',
    size: 4800000,
    fileSize: '4.80 MB',
    uploadedBy: 'Aditya Sharma',
    date: '2026-02-14',
    folderId: 'cse-2nd-sem-2',
    tags: ['OS', 'Slides']
  },
  {
    id: 'mock-cse-2-2-2',
    title: 'Database Management Systems SQL & Normalization Guide',
    originalFileName: 'dbms_sql_normalization_notes.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 3800000,
    fileSize: '3.80 MB',
    uploadedBy: 'Devang Joshi',
    date: '2026-03-01',
    folderId: 'cse-2nd-sem-2',
    tags: ['DBMS', 'SQL']
  },

  // 6. CSE 3rd Year - Sem 1 (Sem 5)
  {
    id: 'mock-cse-3-1-1',
    title: 'Computer Networks Protocols & OSI Layer Reference',
    originalFileName: 'computer_networks_osi_tcp_ip.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 5200000,
    fileSize: '5.20 MB',
    uploadedBy: 'Simran Kaur',
    date: '2025-08-30',
    folderId: 'cse-3rd-sem-1',
    tags: ['Networks', 'TCP/IP']
  },
  {
    id: 'mock-cse-3-1-2',
    title: 'Software Engineering Agile & Scrum Architecture Notes',
    originalFileName: 'software_engineering_agile_uml.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 2700000,
    fileSize: '2.70 MB',
    uploadedBy: 'Neha Patel',
    date: '2025-09-15',
    folderId: 'cse-3rd-sem-1',
    tags: ['Agile', 'UML']
  },

  // 7. CSE 3rd Year - Sem 2 (Sem 6)
  {
    id: 'mock-cse-3-2-1',
    title: 'Cryptography & Network Security Complete Formula Sheet',
    originalFileName: 'cryptography_rsa_aes_ecc_guide.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 3400000,
    fileSize: '3.40 MB',
    uploadedBy: 'Aditya Sharma',
    date: '2026-02-18',
    folderId: 'cse-3rd-sem-2',
    tags: ['Crypto', 'Security']
  },
  {
    id: 'mock-cse-3-2-2',
    title: 'Theory of Computation Turing Machines & Regular Expressions',
    originalFileName: 'toc_automata_turing_machines.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 4200000,
    fileSize: '4.20 MB',
    uploadedBy: 'Tanvi Kulkarni',
    date: '2026-03-05',
    folderId: 'cse-3rd-sem-2',
    tags: ['TOC', 'GATE']
  },

  // 8. CSE 4th Year - Sem 1 & 2
  {
    id: 'mock-cse-4-1-1',
    title: 'Deep Learning & Transformer Architectures (BERT & GPT)',
    originalFileName: 'deep_learning_transformers_nlp.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 7800000,
    fileSize: '7.80 MB',
    uploadedBy: 'Aditya Sharma',
    date: '2025-10-10',
    folderId: 'cse-4th-sem-1',
    tags: ['AI', 'Transformers']
  },
  {
    id: 'mock-cse-4-2-1',
    title: 'Cloud Computing AWS & Docker Deployment Guide',
    originalFileName: 'cloud_aws_docker_k8s_guide.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 5600000,
    fileSize: '5.60 MB',
    uploadedBy: 'Rohan Mehta',
    date: '2026-03-12',
    folderId: 'cse-4th-sem-2',
    tags: ['Cloud', 'Docker']
  },

  // 9. CSE Other - APK & Student Utilities
  {
    id: 'mock-cse-other-1',
    title: 'SPIT Campus Companion Utility v2.4 (APK)',
    originalFileName: 'spit_campus_companion_v2.4.apk',
    category: 'Other',
    type: 'APK',
    mimeType: 'application/vnd.android.package-archive',
    url: '#',
    previewUrl: '#',
    size: 14200000,
    fileSize: '14.2 MB',
    uploadedBy: 'SPIT App Club',
    date: '2026-03-20',
    folderId: 'cse-other',
    tags: ['Android', 'APK', 'Campus App']
  },
  {
    id: 'mock-cse-other-2',
    title: 'SPIT Attendance Tracker & Timetable Tool (APK)',
    originalFileName: 'spit_attendance_tracker_v1.2.apk',
    category: 'Other',
    type: 'APK',
    mimeType: 'application/vnd.android.package-archive',
    url: '#',
    previewUrl: '#',
    size: 9800000,
    fileSize: '9.80 MB',
    uploadedBy: 'Kunal Deshmukh',
    date: '2026-02-15',
    folderId: 'cse-other',
    tags: ['APK', 'Utility']
  },

  // 10. EXTC Folders
  {
    id: 'mock-extc-1-1-1',
    title: 'Digital Electronics & Logic Gates Reference Notes',
    originalFileName: 'digital_electronics_morris_mano_notes.pdf',
    category: 'EXTC',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 3700000,
    fileSize: '3.70 MB',
    uploadedBy: 'Simran Kaur',
    date: '2025-09-08',
    folderId: 'extc-1st-sem-1',
    tags: ['Logic Gates', 'EXTC']
  },
  {
    id: 'mock-extc-2-1-1',
    title: 'Signals & Systems Fourier and Laplace Transforms',
    originalFileName: 'signals_and_systems_oppenheim_summary.pdf',
    category: 'EXTC',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 4500000,
    fileSize: '4.50 MB',
    uploadedBy: 'Prof. S. Rane',
    date: '2025-10-14',
    folderId: 'extc-2nd-sem-1',
    tags: ['Signals', 'Fourier']
  },
  {
    id: 'mock-extc-3-1-1',
    title: 'Digital Signal Processing MATLAB Experiment Scripts (ZIP)',
    originalFileName: 'dsp_matlab_filters_lab_scripts.zip',
    category: 'EXTC',
    type: 'ZIP',
    mimeType: 'application/zip',
    url: '#',
    previewUrl: '#',
    size: 8400000,
    fileSize: '8.40 MB',
    uploadedBy: 'Devang Joshi',
    date: '2026-02-22',
    folderId: 'extc-3rd-sem-1',
    tags: ['DSP', 'MATLAB']
  },
  {
    id: 'mock-extc-4-1-1',
    title: 'VLSI Design & Verilog Microcontroller Architecture',
    originalFileName: 'vlsi_verilog_fpga_notes.pdf',
    category: 'EXTC',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 6300000,
    fileSize: '6.30 MB',
    uploadedBy: 'Simran Kaur',
    date: '2026-01-28',
    folderId: 'extc-4th-sem-1',
    tags: ['VLSI', 'Verilog']
  },
  {
    id: 'mock-extc-other-1',
    title: 'Arduino & Raspberry Pi Robotics Lab Manual',
    originalFileName: 'embedded_robotics_lab_manual.pdf',
    category: 'EXTC',
    type: 'PDF',
    mimeType: 'application/pdf',
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    size: 4900000,
    fileSize: '4.90 MB',
    uploadedBy: 'EXTC Lab Incharge',
    date: '2026-03-01',
    folderId: 'extc-other',
    tags: ['Robotics', 'Embedded']
  }
];

// Admin Pending Approval Requests
export const localMockPendingStories = [
  {
    id: 'pending-story-1',
    name: 'Rohan Verma',
    branch: 'CSE',
    subBranch: 'Core',
    passoutYear: '2025',
    company: 'Google',
    role: 'Associate Software Engineer',
    semester: '8',
    cgpa: '9.4',
    photo: '/images/file-3.jpg',
    status: 'Pending',
    requestType: 'create',
    createdAt: '2026-04-01T10:30:00Z',
    journey: {
      firstYear: 'Learned fundamentals of computer science and C++ in the SPIT programming club.',
      secondYear: 'Solved 300+ LeetCode problems and built full stack React/Node.js web apps.',
      thirdYear: 'Secured Google Summer of Code (GSoC) and interned during the summer break.',
      fourthYear: 'Cleared 4 rounds of Google on-campus interview (System Design + Hard DSA).',
      prep: 'Striver SDE Sheet, NeetCode 150, and Grokking System Design.',
      projects: '1. Distributed Key-Value Store\n2. Realtime Collaborative Code Editor',
      howSecured: 'Campus placement drive. 1 coding round (2 problems) + 3 technical interview rounds.'
    },
    resume: 'rohan_verma_google_resume.pdf',
    resumeFile: {
      fileName: 'rohan_verma_google_resume.pdf',
      fileSize: '1.45 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      {
        id: 'mat-pending-1-1',
        title: 'Google System Design Quick Reference',
        type: 'PDF',
        fileName: 'google_sysdesign_cheat.pdf',
        fileSize: '2.10 MB',
        url: '/sample-document.pdf'
      }
    ]
  },
  {
    id: 'pending-story-2',
    name: 'Ananya Deshmukh',
    branch: 'EXTC',
    subBranch: 'Embedded',
    passoutYear: '2025',
    company: 'Texas Instruments',
    role: 'Hardware Design Engineer',
    semester: '8',
    cgpa: '9.1',
    photo: '/images/file-4.jpg',
    status: 'Pending',
    requestType: 'edit',
    createdAt: '2026-04-02T14:15:00Z',
    journey: {
      firstYear: 'Explored breadboarding and analog electronics circuits.',
      secondYear: 'Focused on digital design and learned Verilog HDL for FPGA programming.',
      thirdYear: 'Completed a 6-month research internship on RISC-V SoC architecture.',
      fourthYear: 'Received a pre-placement offer (PPO) at Texas Instruments Bangalore.',
      prep: 'Morris Mano Digital Logic, Razavi Analog Circuits, and Microcontroller interfacing.',
      projects: '1. 32-bit Pipelined RISC-V Core\n2. High-speed SPI Flash Controller',
      howSecured: 'Shortlisted through campus test followed by 2 technical interview rounds on Verilog.'
    },
    resume: 'ananya_ti_resume.pdf',
    resumeFile: {
      fileName: 'ananya_ti_resume.pdf',
      fileSize: '1.20 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      {
        id: 'mat-pending-2-1',
        title: 'Verilog HDL Interview Questions Guide',
        type: 'PDF',
        fileName: 'verilog_ti_interview_guide.pdf',
        fileSize: '1.80 MB',
        url: '/sample-document.pdf'
      }
    ]
  },
  {
    id: 'pending-story-3',
    name: 'Kavya Iyer',
    branch: 'CSE',
    subBranch: 'AI',
    passoutYear: '2024',
    company: 'Amazon AWS',
    role: 'Cloud Solutions Architect',
    semester: 'Passed Out',
    cgpa: '9.3',
    photo: '/images/file-5.jpg',
    status: 'Pending',
    requestType: 'delete',
    createdAt: '2026-04-03T09:00:00Z',
    journey: {
      firstYear: 'Focused on Python, Linux terminal, and networking fundamentals.',
      secondYear: 'Built microservices and deployed Kubernetes clusters on local servers.',
      thirdYear: 'AWS Solutions Architect Associate certified. Cleared Amazon AWS internship.',
      fourthYear: 'Joined AWS Bangalore team as Full-Time Solutions Architect.',
      prep: 'AWS Whitepapers, Linux Kernel internals, and Cloud Architecture patterns.',
      projects: '1. Serverless Video Transcoder\n2. Zero-Trust Identity Federation Proxy',
      howSecured: 'Applied through Amazon Off-Campus Drive + Referral from SPIT Alumni.'
    },
    resume: 'kavya_amazon_aws.pdf',
    resumeFile: {
      fileName: 'kavya_amazon_aws.pdf',
      fileSize: '1.60 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: []
  }
];

export const localMockPendingResources = [
  {
    id: 'pending-res-1',
    title: 'SPIT Placement Aptitude & Quant Formula Handbook 2026',
    originalFileName: 'spit_aptitude_quant_formula_2026.pdf',
    category: 'Placement',
    type: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '2.80 MB',
    size: 2800000,
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    uploadedBy: 'Pooja Nair',
    folderId: 'system-placement-material',
    status: 'Pending',
    requestType: 'create',
    createdAt: '2026-04-03T11:20:00Z'
  },
  {
    id: 'pending-res-2',
    title: 'SPIT Student Portal Android Companion App (APK)',
    originalFileName: 'spit_student_portal_v2.0.apk',
    category: 'Other',
    type: 'APK',
    mimeType: 'application/vnd.android.package-archive',
    fileSize: '16.5 MB',
    size: 16500000,
    url: '#',
    previewUrl: '#',
    uploadedBy: 'Siddharth Rao',
    folderId: 'cse-other',
    status: 'Pending',
    requestType: 'create',
    createdAt: '2026-04-02T16:45:00Z'
  },
  {
    id: 'pending-res-3',
    title: 'Theory of Computation 2018-2024 GATE Solved Papers',
    originalFileName: 'toc_gate_solved_papers_2018_2024.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '4.90 MB',
    size: 4900000,
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    uploadedBy: 'Tanvi Kulkarni',
    folderId: 'cse-3rd-sem-2',
    status: 'Pending',
    requestType: 'edit',
    createdAt: '2026-04-01T18:10:00Z'
  },
  {
    id: 'pending-res-4',
    title: 'Outdated Chemistry Lab Manual 2020',
    originalFileName: 'chemistry_lab_manual_2020.pdf',
    category: 'CSE',
    type: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '3.10 MB',
    size: 3100000,
    url: '/sample-document.pdf',
    previewUrl: '/sample-document.pdf',
    uploadedBy: 'Aditya Sharma',
    folderId: 'cse-1st-sem-1',
    status: 'Pending',
    requestType: 'delete',
    createdAt: '2026-03-31T09:30:00Z'
  }
];

export const localMockAchievements = [
  {
    id: '1',
    title: 'Smart India Hackathon 2025 Winners',
    description: 'A team of six SPIT students won the first prize of Rs 1 Lakh at the SIH 2025 Finals held in Bangalore for their AI-driven agricultural mapping solution.',
    date: '2025-12-18',
    category: 'Hackathon Winners',
    image: '/images/file-1.jpg',
    imageFit: 'cover',
    imagePosition: 'sliders:50,0,1;45,0,1'
  },
  {
    id: '2',
    title: 'Record at SPIT',
    description: 'Sardar Patel Institute of Technology (SPIT), Mumbai, has consistently maintained one of the strongest placement records among engineering colleges in Maharashtra. In the current academic year, the institute achieved an impressive 95% placement rate, reflecting the high employability and industry readiness of its students.\n\nThe Computer Science & Engineering (CSE), Computer Engineering (CE), and Electronics & Telecommunication (EXTC) branches recorded an outstanding average annual package of ₹15 LPA, while the highest package reached an exceptional ₹44 LPA.',
    date: '2026-04-10',
    category: 'Placement Successes',
    image: '/images/placement-record.jpg',
    imageFit: 'cover',
    imagePosition: 'center'
  },
  {
    id: '3',
    title: 'GSoC 2025 Selection Milestones',
    description: 'Eight students from Sardar Patel Institute of Technology have been selected for Google Summer of Code 2025, working with Apache, Linux, and CNCF.',
    date: '2025-05-04',
    category: 'Internship Achievements',
    image: '/images/recruiters-partners.png',
    imageFit: 'cover',
    imagePosition: 'center'
  },
  {
    id: '4',
    title: 'ACM ICPC Regional Finalists',
    description: 'Team "SPIT_Overflow" represented the college at the ICPC Amritapuri Regionals, securing a rank in the top 30 coding teams across India.',
    date: '2025-11-23',
    category: 'Competition Winners',
    image: '/images/spit-college.jpg',
    imageFit: 'cover',
    imagePosition: 'center'
  }
];

export const localMockFolders = [
  // 1. Root System Folders
  {
    id: 'system-placement-material',
    name: 'Placement Material',
    description: 'Official SPIT Placement Study Material, Interview Sheets, and Preparation Roadmaps',
    ownerId: null,
    ownerEmail: '',
    ownerName: '',
    folderType: 'system',
    visibility: 'public',
    allowContributions: true,
    parentId: null,
    isSystemFolder: true
  },
  {
    id: 'system-cse-ce',
    name: 'CSE/CE',
    description: 'Computer Science & Computer Engineering Academic Materials & Notes',
    ownerId: null,
    ownerEmail: '',
    ownerName: '',
    folderType: 'system',
    visibility: 'public',
    allowContributions: true,
    parentId: null,
    isSystemFolder: true
  },
  {
    id: 'system-extc',
    name: 'EXTC',
    description: 'Electronics & Telecommunication Engineering Academic Materials & Notes',
    ownerId: null,
    ownerEmail: '',
    ownerName: '',
    folderType: 'system',
    visibility: 'public',
    allowContributions: true,
    parentId: null,
    isSystemFolder: true
  },

  // 2. Root Private Folders
  {
    id: 'priv-folder-1',
    name: 'My Personal Vault & Resume Drafts',
    description: 'Confidential resume revisions, offer letters, and personal competitive programming notes.',
    ownerId: 'admin',
    ownerEmail: 'admin@spit.ac.in',
    ownerName: 'Admin',
    folderType: 'user',
    visibility: 'private',
    allowContributions: false,
    parentId: null,
    isSystemFolder: false
  },
  {
    id: 'priv-folder-2',
    name: 'System Design Interview Cheatsheets',
    description: 'High-level architecture diagrams, caching strategies, and distributed systems review.',
    ownerId: 'admin',
    ownerEmail: 'admin@spit.ac.in',
    ownerName: 'Admin',
    folderType: 'user',
    visibility: 'private',
    allowContributions: false,
    parentId: null,
    isSystemFolder: false
  },

  // 3. Root Public Community Folders
  {
    id: 'pub-folder-1',
    name: 'Competitive Programming & Codeforces 2026',
    description: 'Curated CP problem lists, contest debriefs, and advanced graph algorithms.',
    ownerId: 'aditya',
    ownerEmail: 'aditya.sharma@spit.ac.in',
    ownerName: 'Aditya Sharma',
    folderType: 'user',
    visibility: 'public',
    allowContributions: true,
    parentId: null,
    isSystemFolder: false
  },
  {
    id: 'pub-folder-2',
    name: 'Off-Campus Tech Drives & Referral Hub',
    description: 'Community sourced referral templates, interview round experiences, and active job links.',
    ownerId: 'rohan',
    ownerEmail: 'rohan.mehta@spit.ac.in',
    ownerName: 'Rohan Mehta',
    folderType: 'user',
    visibility: 'public',
    allowContributions: true,
    parentId: null,
    isSystemFolder: false
  },
  {
    id: 'pub-folder-3',
    name: 'Android & Cloud Engineering Vault',
    description: 'Production Android APK companions, Gradle configs, and AWS terraform scripts.',
    ownerId: 'simran',
    ownerEmail: 'simran.kaur@spit.ac.in',
    ownerName: 'Simran Kaur',
    folderType: 'user',
    visibility: 'public',
    allowContributions: true,
    parentId: null,
    isSystemFolder: false
  },

  // 4. Subfolders
  { id: 'cse-1st-year', name: '1st Year', parentId: 'system-cse-ce', folderType: 'system', visibility: 'public' },
  { id: 'cse-1st-sem-1', name: 'Semester 1', parentId: 'cse-1st-year', folderType: 'system', visibility: 'public' },
  { id: 'cse-1st-sem-2', name: 'Semester 2', parentId: 'cse-1st-year', folderType: 'system', visibility: 'public' },
  { id: 'cse-2nd-year', name: '2nd Year', parentId: 'system-cse-ce', folderType: 'system', visibility: 'public' },
  { id: 'cse-2nd-sem-1', name: 'Semester 1', parentId: 'cse-2nd-year', folderType: 'system', visibility: 'public' },
  { id: 'cse-2nd-sem-2', name: 'Semester 2', parentId: 'cse-2nd-year', folderType: 'system', visibility: 'public' },
  { id: 'cse-3rd-year', name: '3rd Year', parentId: 'system-cse-ce', folderType: 'system', visibility: 'public' },
  { id: 'cse-3rd-sem-1', name: 'Semester 1', parentId: 'cse-3rd-year', folderType: 'system', visibility: 'public' },
  { id: 'cse-3rd-sem-2', name: 'Semester 2', parentId: 'cse-3rd-year', folderType: 'system', visibility: 'public' },
  { id: 'cse-4th-year', name: '4th Year', parentId: 'system-cse-ce', folderType: 'system', visibility: 'public' },
  { id: 'cse-4th-sem-1', name: 'Semester 1', parentId: 'cse-4th-year', folderType: 'system', visibility: 'public' },
  { id: 'cse-4th-sem-2', name: 'Semester 2', parentId: 'cse-4th-year', folderType: 'system', visibility: 'public' }
];

export const localMockStories = [
  {
    id: '1',
    name: 'Aditya Sharma',
    branch: 'CSE',
    subBranch: 'AI',
    passoutYear: '2025',
    company: 'NVIDIA',
    role: 'AI Research Engineer',
    semester: '7',
    cgpa: '9.6',
    photo: '/images/file-1.jpg',
    journey: {
      firstYear: 'Spent the first year getting familiar with college life. Explored web development and basic C++ programming. Joined the SPIT Coding Club and began participating in local hackathons to understand teamwork.',
      secondYear: 'Fascinated by Machine Learning, I completed Andrew Karpathy\'s neural networks series. Maintained a high GPA while taking statistics and linear algebra courses, which laid the foundation for DL.',
      thirdYear: 'Dived deep into deep learning research and worked under an SPIT professor. Built an edge-AI computer vision project. Prepared for the internship season by practicing medium-hard LeetCode questions.',
      fourthYear: 'Secured an AI Research internship at NVIDIA, which was later converted into a full-time offer (PPO). Currently mentoring juniors in the Coding club and working on my final year capstone project.',
      prep: 'Focused heavily on mathematics behind Deep Learning (Linear Algebra, Calculus). Practiced DSA on LeetCode (around 450 questions), and solved Striver\'s SDE sheet.',
      projects: '1. "Edge-YOLO": Embedded object detection optimized for microcontrollers.\n2. "Spit-BERT": A semantic search engine for the SPIT college library catalog.',
      howSecured: 'Applied through the SPIT campus placement drive. Cleared 1 resume filtering round, 1 coding test (2 hard DSA questions), and 3 technical interviews focusing on ML system design and math.'
    },
    resources: [
      { name: 'LeetCode 75', type: 'DSA' },
      { name: 'Andrej Karpathy\'s Neural Networks (YouTube)', type: 'AI' },
      { name: 'Deep Learning Book by Ian Goodfellow', type: 'Books' }
    ],
    resume: 'aditya_sharma_nvidia.pdf',
    resumeFile: {
      fileName: 'aditya_sharma_nvidia.pdf',
      fileSize: '1.24 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      { title: 'NVIDIA Interview Prep Cheat Sheet', type: 'PDF', fileName: 'nvidia_prep_sheet.pdf', fileSize: '1.24 MB', url: '/sample-document.pdf' },
      { title: 'Deep Learning & Math Roadmap', type: 'Image', fileName: 'dl_math_roadmap.png', fileSize: '3.42 MB', url: '/images/file-5.jpg' }
    ]
  },
  {
    id: '2',
    name: 'Neha Patel',
    branch: 'CSE',
    subBranch: 'DS',
    passoutYear: '2025',
    company: 'Microsoft',
    role: 'Software Engineer',
    semester: '7',
    cgpa: '9.2',
    photo: '/images/file-2.jpg',
    journey: {
      firstYear: 'Learnt Python and HTML/CSS. Participated in my first SPIT coding contest. Made great friends and focused on adapting to the college curriculum.',
      secondYear: 'Dived into Data Structures and Algorithms. Started resolving LeetCode problems daily. Built a full-stack React project for the SPIT Hackathon, winning the runner-up prize.',
      thirdYear: 'Prepared rigorously for summer internships. Practiced System Design (LLD & HLD), solved over 350 DSA problems, and participated in Codeforces rounds.',
      fourthYear: 'Cracked the Microsoft on-campus drive! Cleared technical rounds focusing on Trees, Graphs, and System Architecture. Received a full-time offer for the Hyderabad campus.',
      prep: 'Striver\'s A-Z DSA sheet, NeetCode 150, System Design Primer by Donne Martin, and peer mock interviews conducted by SPIT seniors.',
      projects: '1. "CloudSync": Real-time collaborative document editor using WebSockets and CRDTs.\n2. "CampusMart": Microservices-based campus marketplace with Redis caching.',
      howSecured: 'SPIT On-Campus Placement Drive: Online Assessment (3 coding questions), followed by 3 rounds of technical interviews and 1 AA (As-Appropriate) managerial round.'
    },
    resources: [
      { name: 'Striver\'s A-Z DSA Sheet', type: 'DSA' },
      { name: 'System Design Primer (GitHub)', type: 'System Design' },
      { name: 'NeetCode.io', type: 'Coding Practice' }
    ],
    resume: 'neha_patel_microsoft.pdf',
    resumeFile: {
      fileName: 'neha_patel_microsoft.pdf',
      fileSize: '1.15 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      { title: 'Microsoft SDE Interview Questions', type: 'PDF', fileName: 'ms_interview_questions.pdf', fileSize: '2.10 MB', url: '/sample-document.pdf' }
    ]
  },
  {
    id: '3',
    name: 'Rohan Mehta',
    branch: 'CE',
    subBranch: 'CSE',
    passoutYear: '2024',
    company: 'J.P. Morgan',
    role: 'Quantitative Analyst',
    semester: '8',
    cgpa: '8.4',
    photo: '/images/file-3.jpg',
    journey: {
      firstYear: 'Balanced academics with mathematics and algorithmic coding. Focused on probability, discrete math, and C++ OOP concepts.',
      secondYear: 'Deep dived into financial engineering and statistical modelling in Python. Explored quant finance literature and algorithmic trading platforms.',
      thirdYear: 'Secured JP Morgan Chase Summer Analyst internship. Worked on algorithmic execution trading systems with real-time financial telemetry.',
      fourthYear: 'Converted internship into a pre-placement offer (PPO). Currently mentoring junior SPIT students in quantitative finance interview prep.',
      prep: 'Fifty Challenging Problems in Probability, Heard on the Street quant guide, LeetCode Hard DSA, and options pricing models.',
      projects: '1. "VolTrader": High-frequency options implied volatility arbitrage engine in C++20.\n2. "RiskEngine": Value-at-Risk Monte Carlo simulator in Python NumPy.',
      howSecured: 'J.P. Morgan Quantitative Research Campus Drive: Math and Quant Aptitude Test, 2 Technical Rounds on Probability & C++, and 1 Executive Director behavioral round.'
    },
    resources: [
      { name: 'Fifty Challenging Problems in Probability', type: 'Mathematics' },
      { name: 'Heard on the Street (Quant Guide)', type: 'Quantitative Finance' },
      { name: 'LeetCode Math Tag', type: 'DSA' }
    ],
    resume: 'rohan_mehta_jpmorgan.pdf',
    resumeFile: {
      fileName: 'rohan_mehta_jpmorgan.pdf',
      fileSize: '1.45 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      { title: 'JP Morgan Quant Probability Questions', type: 'PDF', fileName: 'jpm_quant_prob.pdf', fileSize: '1.80 MB', url: '/sample-document.pdf' }
    ]
  },
  {
    id: '4',
    name: 'Simran Kaur',
    branch: 'EXTC',
    subBranch: 'EXTC',
    passoutYear: '2025',
    company: 'Qualcomm',
    role: 'Hardware Design Engineer',
    semester: '7',
    cgpa: '8.9',
    photo: '/images/file-4.jpg',
    journey: {
      firstYear: 'Built electronic and digital circuit prototypes in the college hardware lab. Explored Verilog and 8051 microcontrollers.',
      secondYear: 'Designed FPGA pipelines on Xilinx Vivado and mastered computer architecture, static timing analysis, and digital logic synthesis.',
      thirdYear: 'Qualcomm on-campus summer internship in SoC verification and digital logic synthesis for Snapdragon mobile processors.',
      fourthYear: 'Full-time offer confirmed. Leading the SPIT IEEE Student Branch technical council as technical advisor for junior batches.',
      prep: 'Morris Mano Digital Design, VLSI design principles, SystemVerilog verification, and Computer Organization & Architecture.',
      projects: '1. "RISC-V-Core": 5-stage pipelined 32-bit RISC-V CPU implemented in Verilog on Artix-7 FPGA.\n2. "UART-SoC": Hardware UART transceiver with FIFO buffers.',
      howSecured: 'Qualcomm Campus Recruitment: Digital Electronics & Verilog Screening Exam, 3 Technical Rounds on STA and Verilog, and HR interview.'
    },
    resources: [
      { name: 'Digital Design by Morris Mano', type: 'Books' },
      { name: 'Neso Academy (YouTube)', type: 'College Subjects' },
      { name: 'GeeksforGeeks C Language Section', type: 'Coding' }
    ],
    resume: 'simran_kaur_qualcomm.pdf',
    resumeFile: {
      fileName: 'simran_kaur_qualcomm.pdf',
      fileSize: '1.30 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      { title: 'Qualcomm Digital Electronics Handout', type: 'PDF', fileName: 'qualcomm_digital_handout.pdf', fileSize: '2.50 MB', url: '/sample-document.pdf' }
    ]
  },
  {
    id: '5',
    name: 'Swapnil Patil',
    branch: 'CSE',
    subBranch: 'CSE',
    passoutYear: '2026',
    company: 'Google',
    role: 'Software Development Engineer',
    semester: '6',
    cgpa: '9.5',
    photo: '/images/file-5.jpg',
    journey: {
      firstYear: 'Mastered standard template library (STL) in C++, participated in Google Kickstart, and built deep problem solving foundations.',
      secondYear: 'Built distributed key-value storage and high-throughput backend services. Solved 600+ problems on LeetCode and Codeforces (Expert).',
      thirdYear: 'Google SWE Summer Internship in Cloud Networking. Worked on traffic engineering and routing protocol optimizations. Received return PPO offer.',
      fourthYear: 'Mentoring junior SPIT students on competitive programming, data structures, and navigating campus hiring rounds.',
      prep: 'Advanced Graphs, Dynamic Programming, Distributed Systems, Google Interview question sets, and clean code principles.',
      projects: '1. "Raft-KV": Distributed consensus key-value store in Go.\n2. "FlowMesh": High-throughput L7 reverse proxy with rate limiting and circuit breaking.',
      howSecured: 'Google Campus Referral + Drive: 2 Online Coding Rounds followed by 4 Virtual Onsite Technical Rounds testing DSA and System Scalability.'
    },
    resources: [
      { name: 'Codeforces Catalog', type: 'CP' },
      { name: 'Designing Data-Intensive Applications', type: 'Books' },
      { name: 'CSES Problem Set', type: 'DSA' }
    ],
    resume: 'swapnil_patil_google.pdf',
    resumeFile: {
      fileName: 'swapnil_patil_google.pdf',
      fileSize: '1.60 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      { title: 'Google Interview DSA Guide', type: 'PDF', fileName: 'google_dsa_guide.pdf', fileSize: '3.10 MB', url: '/sample-document.pdf' }
    ]
  },
  {
    id: '6',
    name: 'Manthan Palkar',
    branch: 'CSE',
    subBranch: 'CSE',
    passoutYear: '2025',
    company: 'Amazon AWS',
    role: 'Cloud Solutions Engineer',
    semester: '7',
    cgpa: '8.6',
    photo: '/images/file-1.jpg',
    journey: {
      firstYear: 'Learned Linux systems, bash scripting, network fundamentals, and modern web application stacks.',
      secondYear: 'Deployed production Kubernetes clusters and built scalable microservices architectures with Docker and Terraform.',
      thirdYear: 'AWS cloud architecture internship, passed AWS Certified Solutions Architect Associate exam with 900+ score.',
      fourthYear: 'Received full-time AWS offer for Bangalore campus. Active technical mentor for SPIT cloud computing club.',
      prep: 'AWS whitepapers, High Availability design, Linux system internals, networking protocols (TCP/IP, BGP), and distributed database design.',
      projects: '1. "ZeroTrust-Gateway": Identity-aware proxy for Kubernetes internal services.\n2. "LambdaStream": Event-driven real-time video processing pipeline on AWS.',
      howSecured: 'Amazon On-Campus Drive: Online Assessment (Coding + Work Style Simulation), followed by 3 Technical Rounds on Cloud Architecture and Amazon Leadership Principles.'
    },
    resources: [
      { name: 'AWS SkillBuilder', type: 'Cloud' },
      { name: 'Linux System Programming', type: 'Systems' },
      { name: 'Amazon Leadership Principles Guide', type: 'Interview' }
    ],
    resume: 'manthan_palkar_amazon.pdf',
    resumeFile: {
      fileName: 'manthan_palkar_amazon.pdf',
      fileSize: '1.20 MB',
      url: '/sample-document.pdf'
    },
    studyMaterials: [
      { title: 'AWS Cloud Architecture Prep Notes', type: 'PDF', fileName: 'aws_cloud_prep.pdf', fileSize: '2.40 MB', url: '/sample-document.pdf' }
    ]
  }
];

export const localMockUsers = [
  // Administrators
  {
    id: 'u-1',
    email: 'admin@spit.ac.in',
    name: 'College Placement Administrator',
    role: 'Administrator',
    branch: 'All Branches',
    currentYear: 'Faculty / Staff',
    status: 'Active',
    onboarded: true
  },
  // Seniors / Contributors
  {
    id: 'u-2',
    email: 'aditya.sharma@spit.ac.in',
    name: 'Aditya Sharma',
    role: 'Senior / Contributor',
    branch: 'CSE',
    currentYear: 'Fourth Year',
    status: 'Active',
    onboarded: true
  },
  {
    id: 'u-3',
    email: 'neha.patel@spit.ac.in',
    name: 'Neha Patel',
    role: 'Senior / Contributor',
    branch: 'CSE',
    currentYear: 'Fourth Year',
    status: 'Active',
    onboarded: true
  },
  {
    id: 'u-4',
    email: 'rohan.mehta@spit.ac.in',
    name: 'Rohan Mehta',
    role: 'Senior / Contributor',
    branch: 'EXTC',
    currentYear: 'Fourth Year',
    status: 'Active',
    onboarded: true
  },
  {
    id: 'u-5',
    email: 'simran.kaur@spit.ac.in',
    name: 'Simran Kaur',
    role: 'Senior / Contributor',
    branch: 'CSE',
    currentYear: 'Fourth Year',
    status: 'Active',
    onboarded: true
  },
  {
    id: 'u-6',
    email: 'swapnil.patil@spit.ac.in',
    name: 'Swapnil Patil',
    role: 'Senior / Contributor',
    branch: 'CSE',
    currentYear: 'Fourth Year',
    status: 'Active',
    onboarded: true
  },
  {
    id: 'u-7',
    email: 'manthan.palkar@spit.ac.in',
    name: 'Manthan Palkar',
    role: 'Senior / Contributor',
    branch: 'CSE',
    currentYear: 'Fourth Year',
    status: 'Active',
    onboarded: true
  },
  // Students
  {
    id: 'u-8',
    email: 'karan.verma@spit.ac.in',
    name: 'Karan Verma',
    role: 'Student',
    branch: 'CSE',
    currentYear: 'Third Year',
    status: 'Active',
    onboarded: true
  },
  {
    id: 'u-9',
    email: 'ananya.joshi@spit.ac.in',
    name: 'Ananya Joshi',
    role: 'Student',
    branch: 'CE',
    currentYear: 'Second Year',
    status: 'Active',
    onboarded: true
  },
  {
    id: 'u-10',
    email: 'sid.deshmukh@spit.ac.in',
    name: 'Siddharth Deshmukh',
    role: 'Student',
    branch: 'EXTC',
    currentYear: 'Third Year',
    status: 'Active',
    onboarded: true
  },
  // Pending Access Requests
  {
    id: 'u-11',
    email: 'priya.deshmukh@spit.ac.in',
    name: 'Priya Deshmukh',
    role: 'Student',
    branch: 'CSE',
    currentYear: 'First Year',
    status: 'Pending',
    onboarded: false
  },
  {
    id: 'u-12',
    email: 'rahul.iyer@spit.ac.in',
    name: 'Rahul Iyer',
    role: 'Student',
    branch: 'EXTC',
    currentYear: 'Second Year',
    status: 'Pending',
    onboarded: false
  }
];


