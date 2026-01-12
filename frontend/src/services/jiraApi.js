/**
 * Jira API Service
 * Handles all Jira integration API calls for the CRM
 * ACRM-27: Jira API Integration Service
 */
import { apiConfig } from '../config';

const JIRA_BASE_URL = `${apiConfig.baseUrl}/api/crm/jira`;

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

// ==================== Connection ====================

/**
 * Test Jira connection
 */
export const testConnection = async () => {
  const response = await fetch(`${JIRA_BASE_URL}/test`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// ==================== Projects ====================

/**
 * List all Jira projects
 */
export const listProjects = async () => {
  const response = await fetch(`${JIRA_BASE_URL}/projects`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Get project details
 * @param {string} projectKey - Jira project key (e.g., "TALA", "ACRM")
 */
export const getProject = async (projectKey) => {
  const response = await fetch(`${JIRA_BASE_URL}/projects/${projectKey}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Get issues for a project with status counts
 * @param {string} projectKey 
 * @param {Object} options - { maxResults }
 */
export const getProjectIssues = async (projectKey, options = {}) => {
  const params = new URLSearchParams();
  if (options.maxResults) params.append('maxResults', options.maxResults);
  
  const queryString = params.toString();
  const url = `${JIRA_BASE_URL}/projects/${projectKey}/issues${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Get issue types for a project
 * @param {string} projectKey 
 */
export const getIssueTypes = async (projectKey) => {
  const response = await fetch(`${JIRA_BASE_URL}/projects/${projectKey}/issue-types`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Get sprints for a project
 * @param {string} projectKey 
 */
export const getSprints = async (projectKey) => {
  const response = await fetch(`${JIRA_BASE_URL}/projects/${projectKey}/sprints`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// ==================== Issues ====================

/**
 * Create a new Jira issue
 * @param {Object} issueData - { projectKey, summary, issueType, description, priority, labels, parentKey }
 */
export const createIssue = async (issueData) => {
  const response = await fetch(`${JIRA_BASE_URL}/issues`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(issueData),
  });
  return handleResponse(response);
};

// ==================== Cache ====================

/**
 * Refresh/invalidate Jira cache
 * ACRM-31: Data Caching Layer
 */
export const refreshCache = async () => {
  const response = await fetch(`${JIRA_BASE_URL}/cache/refresh`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// ==================== Export ====================

const jiraApi = {
  testConnection,
  listProjects,
  getProject,
  getProjectIssues,
  getIssueTypes,
  getSprints,
  createIssue,
  refreshCache,
};

export default jiraApi;
