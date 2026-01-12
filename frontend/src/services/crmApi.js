/**
 * CRM API Service
 * Handles all API calls for the Personal CRM system
 */
import { apiConfig } from '../config';

const CRM_BASE_URL = `${apiConfig.baseUrl}/api/crm`;

/**
 * Get auth headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('idToken') || sessionStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }
  return response.json();
};

// ==================== Projects API ====================

/**
 * List all projects
 * @param {Object} filters - Optional filters { status, priority }
 */
export const listProjects = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  
  const queryString = params.toString();
  const url = `${CRM_BASE_URL}/projects${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Get a single project by ID
 * @param {string} projectId 
 */
export const getProject = async (projectId) => {
  const response = await fetch(`${CRM_BASE_URL}/projects/${projectId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Create a new project
 * @param {Object} projectData - { name, description, status, priority, startDate, endDate, tags, jiraKey }
 */
export const createProject = async (projectData) => {
  const response = await fetch(`${CRM_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData),
  });
  
  return handleResponse(response);
};

/**
 * Update a project
 * @param {string} projectId 
 * @param {Object} updates - Fields to update
 */
export const updateProject = async (projectId, updates) => {
  const response = await fetch(`${CRM_BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  
  return handleResponse(response);
};

/**
 * Update project status only
 * @param {string} projectId 
 * @param {string} status - IDEA | TODO | IN_PROGRESS | DONE
 */
export const updateProjectStatus = async (projectId, status) => {
  const response = await fetch(`${CRM_BASE_URL}/projects/${projectId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  
  return handleResponse(response);
};

/**
 * Delete a project
 * @param {string} projectId 
 */
export const deleteProject = async (projectId) => {
  const response = await fetch(`${CRM_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

// ==================== Ideas API ====================

/**
 * List all ideas
 * @param {Object} filters - Optional filters { status, projectId }
 */
export const listIdeas = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.projectId) params.append('projectId', filters.projectId);
  
  const queryString = params.toString();
  const url = `${CRM_BASE_URL}/ideas${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Get pending ideas for processing
 */
export const getPendingIdeas = async () => {
  const response = await fetch(`${CRM_BASE_URL}/ideas/pending`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Get a single idea by ID
 * @param {string} ideaId 
 */
export const getIdea = async (ideaId) => {
  const response = await fetch(`${CRM_BASE_URL}/ideas/${ideaId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Create a new idea
 * @param {Object} ideaData - { title, content, status, source, projectId, tags, priority }
 */
export const createIdea = async (ideaData) => {
  const response = await fetch(`${CRM_BASE_URL}/ideas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(ideaData),
  });
  
  return handleResponse(response);
};

/**
 * Update an idea
 * @param {string} ideaId 
 * @param {Object} updates - Fields to update
 */
export const updateIdea = async (ideaId, updates) => {
  const response = await fetch(`${CRM_BASE_URL}/ideas/${ideaId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  
  return handleResponse(response);
};

/**
 * Delete an idea
 * @param {string} ideaId 
 */
export const deleteIdea = async (ideaId) => {
  const response = await fetch(`${CRM_BASE_URL}/ideas/${ideaId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

// ==================== Tasks API ====================

/**
 * List tasks, optionally filtered by projectId
 * @param {Object} filters - Optional filters { projectId }
 */
export const listTasks = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.projectId) params.append('projectId', filters.projectId);
  
  const queryString = params.toString();
  const url = `${CRM_BASE_URL}/tasks${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Get a single task by ID
 * @param {string} taskId 
 */
export const getTask = async (taskId) => {
  const response = await fetch(`${CRM_BASE_URL}/tasks/${taskId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Create a new task
 * @param {Object} taskData - { projectId, text, type, startDate, endDate, duration, progress, parent, dependencies }
 */
export const createTask = async (taskData) => {
  const response = await fetch(`${CRM_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  
  return handleResponse(response);
};

/**
 * Update a task
 * @param {string} taskId 
 * @param {Object} updates - Fields to update
 */
export const updateTask = async (taskId, updates) => {
  const response = await fetch(`${CRM_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  
  return handleResponse(response);
};

/**
 * Batch update multiple tasks (for drag-drop reordering)
 * @param {Array} tasks - Array of { taskId, startDate, endDate, duration, progress, order, dependencies }
 */
export const batchUpdateTasks = async (tasks) => {
  const response = await fetch(`${CRM_BASE_URL}/tasks/batch`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tasks }),
  });
  
  return handleResponse(response);
};

/**
 * Delete a task
 * @param {string} taskId 
 */
export const deleteTask = async (taskId) => {
  const response = await fetch(`${CRM_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
};

// ==================== Export all functions ====================

const crmApi = {
  // Projects
  listProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  // Ideas
  listIdeas,
  getPendingIdeas,
  getIdea,
  createIdea,
  updateIdea,
  deleteIdea,
  // Tasks
  listTasks,
  getTask,
  createTask,
  updateTask,
  batchUpdateTasks,
  deleteTask,
};

export default crmApi;
