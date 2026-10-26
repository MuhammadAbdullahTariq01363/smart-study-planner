import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Subjects API
export const subjectApi = {
  getAll: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.patch(`/subjects/${id}`, data),
};

// Topics API
export const topicApi = {
  getBySubject: (subjectId) => api.get(`/subjects/${subjectId}/topics`),
  create: (subjectId, data) => api.post(`/subjects/${subjectId}/topics`, data),
  update: (subjectId, topicId, data) => api.patch(`/subjects/${subjectId}/topics/${topicId}`, data),
};

// Planner API
export const plannerApi = {
  generate: (subjectId, data = {}) => api.post(`/subjects/${subjectId}/plan/generate`, data),
  getPlan: (subjectId) => api.get(`/subjects/${subjectId}/plan`),
  updateSession: (sessionId, data) => api.patch(`/sessions/${sessionId}`, data),
};

// Notes API
export const notesApi = {
  getBySubject: (subjectId) => api.get(`/subjects/${subjectId}/notes`),
  upload: (subjectId, formData) => api.post(`/subjects/${subjectId}/notes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Tutor RAG API
export const tutorApi = {
  ask: (data) => api.post('/tutor/ask', data),
};

// Quiz API
export const quizApi = {
  generate: (topicId) => api.post(`/topics/${topicId}/quiz`),
  submit: (quizId, data) => api.post(`/quizzes/${quizId}/submit`, data),
};

// Progress API
export const progressApi = {
  getSubjectProgress: (subjectId) => api.get(`/subjects/${subjectId}/progress`),
};

export default api;
