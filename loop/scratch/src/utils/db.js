const API_URL = '/api';

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

export const initDB = () => {
  // Database initialized and managed on backend side.
};

// Stories Helpers
export const getStories = async () => {
  const res = await authFetch(`${API_URL}/stories`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
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
  return res.json();
};

export const addPendingStory = async (story) => {
  const res = await authFetch(`${API_URL}/pending-stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story)
  });
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
  return res.json();
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
  return res.json();
};

export const addPendingResource = async (resource) => {
  const res = await authFetch(`${API_URL}/pending-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resource)
  });
  if (!res.ok) throw new Error('Failed to add pending resource');
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
  return res.json();
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
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
