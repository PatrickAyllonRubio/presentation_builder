import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Cursos ────────────────────────────────────────────────────────────────────
export const courseService = {
  list: () => api.get('/courses/').then((r) => r.data),
  get: (id) => api.get(`/courses/${id}`).then((r) => r.data),
  create: (data) => api.post('/courses/', data).then((r) => r.data),
  update: (id, data) => api.patch(`/courses/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// ── Módulos ───────────────────────────────────────────────────────────────────
export const moduleService = {
  list: (courseId) => api.get(`/courses/${courseId}/modules/`).then((r) => r.data),
  get: (courseId, moduleId) => api.get(`/courses/${courseId}/modules/${moduleId}`).then((r) => r.data),
  create: (courseId, data) => api.post(`/courses/${courseId}/modules/`, data).then((r) => r.data),
  update: (courseId, moduleId, data) => api.patch(`/courses/${courseId}/modules/${moduleId}`, data).then((r) => r.data),
  delete: (courseId, moduleId) => api.delete(`/courses/${courseId}/modules/${moduleId}`),
};

// ── Presentaciones ────────────────────────────────────────────────────────────
export const presentationService = {
  list: (moduleId) => api.get(`/modules/${moduleId}/presentations/`).then((r) => r.data),
  get: (moduleId, presentationId) => api.get(`/modules/${moduleId}/presentations/${presentationId}`).then((r) => r.data),
  create: (moduleId, data) => api.post(`/modules/${moduleId}/presentations/`, data).then((r) => r.data),
  update: (moduleId, presentationId, data) => api.patch(`/modules/${moduleId}/presentations/${presentationId}`, data).then((r) => r.data),
  delete: (moduleId, presentationId) => api.delete(`/modules/${moduleId}/presentations/${presentationId}`),
  saveGuion: (moduleId, presentationId, guion) =>
    api.patch(`/modules/${moduleId}/presentations/${presentationId}`, { guion }).then((r) => r.data),
};

// ── Recursos (archivos) ───────────────────────────────────────────────────────
export const resourceService = {
  list: (moduleId, presentationId) =>
    api.get(`/modules/${moduleId}/presentations/${presentationId}/resources`).then((r) => r.data),
  upload: (moduleId, presentationId, resourceType, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(
      `/modules/${moduleId}/presentations/${presentationId}/resources?resource_type=${resourceType}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then((r) => r.data);
  },
  delete: (moduleId, presentationId, resourceId) =>
    api.delete(`/modules/${moduleId}/presentations/${presentationId}/resources/${resourceId}`),
};
