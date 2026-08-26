export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/login';
    }
    let errMsg = data.error?.message || 'API Error';
    if (data.error?.details) {
      const details = Object.entries(data.error.details)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join(' | ');
      errMsg += ` - ${details}`;
    }
    throw new Error(errMsg);
  }
  return data.data;
};

export const apiUpload = (endpoint, formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${endpoint}`, true);
    
    // For cookies/credentials
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data.data);
        } else {
          if (xhr.status === 401) window.location.href = '/login';
          reject(new Error(data.error?.message || 'Upload Error'));
        }
      } catch (err) {
        reject(new Error('Invalid response from server'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network Error'));
    };

    xhr.send(formData);
  });
};
