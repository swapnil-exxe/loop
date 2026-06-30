const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://loop-qnh9.onrender.com';
const API_URL = `${BASE_URL}/api`;

const fixRelativeUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/uploads/')) {
    return `${BASE_URL}${url}`;
  }
  return url;
};

const adjustUrls = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => adjustUrls(item));
  }
  if (typeof data === 'object') {
    const copy = { ...data };
    if (typeof copy.photo === 'string') {
      copy.photo = fixRelativeUrl(copy.photo);
    }
    if (typeof copy.resume === 'string') {
      copy.resume = fixRelativeUrl(copy.resume);
    }
    if (copy.resumeFile && typeof copy.resumeFile.url === 'string') {
      copy.resumeFile = {
        ...copy.resumeFile,
        url: fixRelativeUrl(copy.resumeFile.url)
      };
    }
    if (Array.isArray(copy.studyMaterials)) {
      copy.studyMaterials = copy.studyMaterials.map(mat => ({
        ...mat,
        url: typeof mat.url === 'string' ? fixRelativeUrl(mat.url) : mat.url
      }));
    }
    if (typeof copy.image === 'string') {
      copy.image = fixRelativeUrl(copy.image);
    }
    for (const key in copy) {
      if (copy[key] && typeof copy[key] === 'object' && key !== 'resumeFile' && key !== 'studyMaterials') {
        copy[key] = adjustUrls(copy[key]);
      }
    }
    return copy;
  }
  return data;
};


const authFetch = async (url, options = {}) => {
  const userSession = localStorage.getItem('loop_current_user');
  const headers = {
    ...options.headers,
  };
  if (userSession) {
    try {
      const { token } = JSON.parse(userSession);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error parsing session token:", e);
    }
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('loop_current_user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }
  return res;
};

const authFetchXHR = (url, options = {}, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', url);

    const userSession = localStorage.getItem('loop_current_user');
    const headers = { ...options.headers };
    if (userSession) {
      try {
        const { token } = JSON.parse(userSession);
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Error parsing session token in XHR:", e);
      }
    }

    Object.keys(headers).forEach(key => {
      if (headers[key] !== undefined) {
        xhr.setRequestHeader(key, headers[key]);
      }
    });

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    xhr.onload = () => {
      const responseBody = xhr.responseText;
      const ok = xhr.status >= 200 && xhr.status < 300;

      // Handle auth failures — delay redirect so the promise resolves first
      if ((xhr.status === 401 || xhr.status === 403) && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('loop_current_user');
        // Resolve with the error response so the caller can handle it
        let parsedJson = null;
        try { parsedJson = JSON.parse(responseBody); } catch (e) { parsedJson = { error: 'Session expired. Please login again.' }; }
        resolve({ ok: false, status: xhr.status, json: async () => parsedJson, text: async () => responseBody });
        // Delay navigation so we don't abort other in-flight requests
        setTimeout(() => { window.location.href = '/login'; }, 300);
        return;
      }

      let parsedJson = null;
      let parseAttempted = false;
      const getJson = async () => {
        if (!parseAttempted) {
          parseAttempted = true;
          try {
            parsedJson = JSON.parse(responseBody);
          } catch (e) {
            parsedJson = {};
          }
        }
        return parsedJson;
      };

      resolve({
        ok,
        status: xhr.status,
        json: getJson,
        text: async () => responseBody
      });
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Please try again.'));
    };

    xhr.timeout = 120000; // 2 minute timeout for large file uploads

    xhr.send(options.body || null);
  });
};



export const initDB = () => {
  // Database initialized and managed on backend side.
};

export const getStories = async () => {
  const res = await authFetch(`${API_URL}/stories`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  const data = await res.json();
  return adjustUrls(data);
};

export const getStoryById = async (id) => {
  const res = await authFetch(`${API_URL}/stories/${id}`);
  if (!res.ok) throw new Error('Failed to fetch story details');
  const data = await res.json();
  return adjustUrls(data);
};

export const addStory = async (story) => {
  const res = await authFetch(`${API_URL}/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add story');
  }
  return res.json();
};

export const deleteStory = async (id) => {
  const res = await authFetch(`${API_URL}/stories/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete story');
  return res.json();
};

export const updateStory = async (id, updatedStory) => {
  const res = await authFetch(`${API_URL}/stories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedStory)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update story');
  }
  return res.json();
};

// Pending Stories Helpers
export const getPendingStories = async () => {
  const res = await authFetch(`${API_URL}/pending-stories`);
  if (!res.ok) throw new Error('Failed to fetch pending stories');
  const data = await res.json();
  return adjustUrls(data);
};

export const addPendingStory = async (story, onProgress) => {
  const res = await authFetchXHR(`${API_URL}/pending-stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story)
  }, onProgress);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add pending story');
  }
  return res.json();
};

export const approveStory = async (id) => {
  const res = await authFetch(`${API_URL}/pending-stories/${id}/approve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve story');
  return res.json();
};

export const rejectPendingStory = async (id) => {
  const res = await authFetch(`${API_URL}/pending-stories/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to reject pending story');
  return res.json();
};

// Resources Helpers
export const getResources = async () => {
  const res = await authFetch(`${API_URL}/resources`);
  if (!res.ok) throw new Error('Failed to fetch resources');
  const data = await res.json();
  return adjustUrls(data);
};

export const getResourceById = async (id) => {
  const res = await authFetch(`${API_URL}/resources/${id}`);
  if (!res.ok) throw new Error('Failed to fetch resource details');
  const data = await res.json();
  return adjustUrls(data);
};

export const addResource = async (resource) => {
  const res = await authFetch(`${API_URL}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resource)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add resource');
  }
  return res.json();
};

export const deleteResource = async (id) => {
  const res = await authFetch(`${API_URL}/resources/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete resource');
  return res.json();
};

export const updateResource = async (id, updatedResource) => {
  const res = await authFetch(`${API_URL}/resources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedResource)
  });
  if (!res.ok) throw new Error('Failed to update resource');
  return res.json();
};

// Pending Resources Helpers
export const getPendingResources = async () => {
  const res = await authFetch(`${API_URL}/pending-resources`);
  if (!res.ok) throw new Error('Failed to fetch pending resources');
  const data = await res.json();
  return adjustUrls(data);
};

export const addPendingResource = async (resource, onProgress) => {
  const res = await authFetchXHR(`${API_URL}/pending-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resource)
  }, onProgress);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add pending resource');
  }
  return res.json();
};

export const approveResource = async (id) => {
  const res = await authFetch(`${API_URL}/pending-resources/${id}/approve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve resource');
  return res.json();
};

export const rejectPendingResource = async (id) => {
  const res = await authFetch(`${API_URL}/pending-resources/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to reject pending resource');
  return res.json();
};

// Achievements Helpers
export const getAchievements = async () => {
  const res = await authFetch(`${API_URL}/achievements`);
  if (!res.ok) throw new Error('Failed to fetch achievements');
  const data = await res.json();
  return adjustUrls(data);
};

export const addAchievement = async (achievement) => {
  const res = await authFetch(`${API_URL}/achievements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(achievement)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add achievement');
  }
  return res.json();
};

export const deleteAchievement = async (id) => {
  const res = await authFetch(`${API_URL}/achievements/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete achievement');
  return res.json();
};

export const updateAchievement = async (id, updatedAchievement) => {
  const res = await authFetch(`${API_URL}/achievements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedAchievement)
  });
  if (!res.ok) throw new Error('Failed to update achievement');
  return res.json();
};

// User Management Helpers
export const getUsers = async () => {
  const res = await authFetch(`${API_URL}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const addUser = async (user) => {
  const res = await authFetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add user');
  }
  return res.json();
};

export const deleteUser = async (email) => {
  const res = await authFetch(`${API_URL}/users/${email}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to authenticate');
  }
  return res.json();
};

export const onboardUser = async (email, profileData) => {
  const res = await authFetch(`${API_URL}/users/${email}/onboard`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit onboarding form');
  }
  return res.json();
};

export const requestProfileEdit = async (email, profileData) => {
  const res = await authFetch(`${API_URL}/users/${email}/edit-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to request profile edit');
  }
  return res.json();
};

export const approveProfileEdit = async (email) => {
  const res = await authFetch(`${API_URL}/users/${email}/approve-edit`, {
    method: 'POST'
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to approve profile edit');
  }
  return res.json();
};

export const rejectProfileEdit = async (email) => {
  const res = await authFetch(`${API_URL}/users/${email}/reject-edit`, {
    method: 'POST'
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to reject profile edit');
  }
  return res.json();
};

export const requestRegistration = async (email, password) => {
  const res = await fetch(`${API_URL}/users/register-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit registration request');
  }
  return res.json();
};

export const approveRegistration = async (email) => {
  const res = await authFetch(`${API_URL}/users/${email}/approve-registration`, {
    method: 'POST'
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to approve registration');
  }
  return res.json();
};

export const updateUser = async (email, userData) => {
  const res = await authFetch(`${API_URL}/users/${email}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update user');
  }
  return res.json();
};

// Folder Management Helpers (New APIs)
export const getFolders = async () => {
  const res = await authFetch(`${API_URL}/folders`);
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
};

export const addFolder = async (folder) => {
  const res = await authFetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(folder)
  });
  if (!res.ok) throw new Error('Failed to add folder');
  return res.json();
};

export const deleteFolder = async (id) => {
  const res = await authFetch(`${API_URL}/folders/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete folder');
  return res.json();
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1600;
            const MAX_HEIGHT = 1600;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedBase64);
          } catch (err) {
            resolve(e.target.result);
          }
        };
        img.onerror = () => {
          resolve(reader.result);
        };
      };
      reader.onerror = (error) => reject(error);
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    }
  });
};
