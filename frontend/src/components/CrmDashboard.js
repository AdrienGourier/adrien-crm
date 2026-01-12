import React, { useState, useEffect, useCallback } from 'react';
import { Gantt } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { listProjects, createProject, updateProject, updateProjectStatus, deleteProject, listIdeas, createIdea, updateIdea, deleteIdea, listTasks, createTask, updateTask, deleteTask, batchUpdateTasks } from '../services/crmApi';
import jiraApi from '../services/jiraApi';

/**
 * CRM Dashboard - Main entry point for Personal CRM
 * Features: Project tracking, Ideas, Gantt board, Jira sync
 */
function CrmDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('projects');

  const tabs = [
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'ideas', label: 'Ideas', icon: '💡' },
    { id: 'gantt', label: 'Gantt', icon: '📊' },
    { id: 'jira', label: 'Jira Sync', icon: '🔄' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '24px', 
              background: 'linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }}>
              CRM
            </span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Personal Project Manager
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                {user.email}
              </span>
            )}
            <button 
              className="btn btn-secondary" 
              onClick={onLogout}
              style={{ padding: '6px 12px', minHeight: '36px' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{ 
        padding: '0 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id 
                  ? '2px solid var(--color-accent-primary)' 
                  : '2px solid transparent',
                color: activeTab === tab.id 
                  ? 'var(--color-accent-primary)' 
                  : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ 
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'ideas' && <IdeasTab />}
        {activeTab === 'gantt' && <GanttTab />}
        {activeTab === 'jira' && <JiraTab />}
      </main>
    </div>
  );
}

/**
 * Projects Tab - Kanban board for project status tracking
 */
function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);

  const statuses = [
    { id: 'IDEA', label: 'Idea', color: '#9333ea' },
    { id: 'TODO', label: 'To Do', color: '#3b82f6' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b' },
    { id: 'DONE', label: 'Done', color: '#10b981' },
  ];

  const priorityColors = {
    CRITICAL: '#ef4444',
    HIGH: '#f59e0b',
    MEDIUM: '#3b82f6',
    LOW: '#6b7280',
  };

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listProjects();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.status === newStatus) {
      setDraggedProject(null);
      return;
    }

    try {
      await updateProjectStatus(draggedProject.projectId, newStatus);
      setProjects(prev => prev.map(p => 
        p.projectId === draggedProject.projectId 
          ? { ...p, status: newStatus }
          : p
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update project status');
    }
    setDraggedProject(null);
  };

  const handleCreateProject = async (projectData) => {
    try {
      const newProject = await createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.projectId !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleUpdateProject = async (projectId, updates) => {
    try {
      const updatedProject = await updateProject(projectId, updates);
      setProjects(prev => prev.map(p => 
        p.projectId === projectId ? updatedProject : p
      ));
      setSelectedProject(null);
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const getProjectsByStatus = (statusId) => {
    return projects.filter(p => p.status === statusId);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading projects...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
          Projects 
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 400, 
            color: 'var(--color-text-muted)',
            marginLeft: '8px'
          }}>
            ({projects.length})
          </span>
        </h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '6px' }}>
            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
          </svg>
          New Project
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px',
        minHeight: '400px'
      }}>
        {statuses.map(status => (
          <div 
            key={status.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.id)}
            style={{
              background: 'var(--color-bg-secondary)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--color-border)',
              transition: 'border-color 0.2s ease'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: status.color 
              }} />
              <span style={{ 
                fontWeight: 600, 
                color: 'var(--color-text-primary)',
                fontSize: '14px'
              }}>
                {status.label}
              </span>
              <span style={{ 
                color: 'var(--color-text-muted)',
                fontSize: '12px',
                marginLeft: 'auto'
              }}>
                {getProjectsByStatus(status.id).length}
              </span>
            </div>
            
            {/* Project Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {getProjectsByStatus(status.id).map(project => (
                <ProjectCard 
                  key={project.projectId}
                  project={project}
                  priorityColors={priorityColors}
                  onDragStart={(e) => handleDragStart(e, project)}
                  onClick={() => setSelectedProject(project)}
                  onDelete={() => handleDeleteProject(project.projectId)}
                />
              ))}
              
              {getProjectsByStatus(status.id).length === 0 && (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '13px',
                  border: '2px dashed var(--color-border)',
                  borderRadius: '6px'
                }}>
                  Drop projects here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}

      {/* Project Detail/Edit Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={(updates) => handleUpdateProject(selectedProject.projectId, updates)}
          onDelete={() => {
            handleDeleteProject(selectedProject.projectId);
            setSelectedProject(null);
          }}
          priorityColors={priorityColors}
        />
      )}
    </div>
  );
}

/**
 * Project Card Component
 */
function ProjectCard({ project, priorityColors, onDragStart, onClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: 'var(--color-bg-primary)',
        borderRadius: '6px',
        padding: '12px',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'border-color 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-primary)'}
      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '13px', 
          color: 'var(--color-text-primary)',
          fontWeight: 500,
          flex: 1
        }}>
          {project.name}
        </h4>
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              borderRadius: '4px'
            }}
          >
            ⋮
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              minWidth: '120px'
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onClick(); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {project.description && (
        <p style={{ 
          margin: '0 0 8px', 
          fontSize: '12px', 
          color: 'var(--color-text-muted)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {project.description}
        </p>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {project.priority && (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: `${priorityColors[project.priority]}20`,
            color: priorityColors[project.priority],
            fontWeight: 500
          }}>
            {project.priority}
          </span>
        )}
        {project.linkedJiraProject && (
          <a
            href={`https://gouriertradingproject.atlassian.net/jira/software/projects/${project.linkedJiraProject.key}/boards`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.1) 0%, rgba(38, 132, 255, 0.1) 100%)',
              color: '#0052CC',
              fontWeight: 500,
              textDecoration: 'none'
            }}
            title={`View ${project.linkedJiraProject.name} in Jira`}
          >
            {project.linkedJiraProject.avatarUrl && (
              <img src={project.linkedJiraProject.avatarUrl} alt="" style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
            )}
            {project.linkedJiraProject.key}
          </a>
        )}
        {project.jiraKey && !project.linkedJiraProject && (
          <a
            href={`https://gouriertradingproject.atlassian.net/browse/${project.jiraKey}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0, 82, 204, 0.1)',
              color: '#0052CC',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            {project.jiraKey}
          </a>
        )}
        {project.progress > 0 && (
          <div style={{ 
            flex: 1, 
            minWidth: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              flex: 1,
              height: '4px',
              background: 'var(--color-border)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${project.progress}%`,
                height: '100%',
                background: 'var(--color-accent-primary)',
                borderRadius: '2px'
              }} />
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              {project.progress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Create Project Modal
 */
function CreateProjectModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'IDEA',
    priority: 'MEDIUM',
    jiraKey: '',
    linkedJiraProject: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jiraProjects, setJiraProjects] = useState([]);
  const [loadingJira, setLoadingJira] = useState(true);

  // Load Jira projects on mount
  useEffect(() => {
    const loadJiraProjects = async () => {
      try {
        const result = await jiraApi.listProjects();
        setJiraProjects(result.projects || []);
      } catch (err) {
        console.error('Error loading Jira projects:', err);
      } finally {
        setLoadingJira(false);
      }
    };
    loadJiraProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await onCreate({
        ...formData,
        jiraKey: formData.jiraKey || undefined,
        linkedJiraProject: formData.linkedJiraProject || undefined
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJiraProjectSelect = (e) => {
    const projectKey = e.target.value;
    if (projectKey) {
      const selected = jiraProjects.find(p => p.key === projectKey);
      setFormData({
        ...formData,
        linkedJiraProject: selected ? { key: selected.key, name: selected.name, avatarUrl: selected.avatarUrl } : null
      });
    } else {
      setFormData({ ...formData, linkedJiraProject: null });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          border: '1px solid var(--color-border)'
        }}
      >
        <h3 style={{ margin: '0 0 20px', color: 'var(--color-text-primary)' }}>
          Create New Project
        </h3>
        
        {error && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#ef4444',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              className="input"
              style={{ width: '100%' }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              className="input"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px',
                color: 'var(--color-text-secondary)'
              }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="IDEA">Idea</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px',
                color: 'var(--color-text-secondary)'
              }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              Link to Jira Project (optional)
            </label>
            <select
              value={formData.linkedJiraProject?.key || ''}
              onChange={handleJiraProjectSelect}
              className="input"
              style={{ width: '100%' }}
              disabled={loadingJira}
            >
              <option value="">{loadingJira ? 'Loading Jira projects...' : 'Select a Jira project'}</option>
              {jiraProjects.map(project => (
                <option key={project.key} value={project.key}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
            {formData.linkedJiraProject && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                background: 'rgba(0, 82, 204, 0.05)', 
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {formData.linkedJiraProject.avatarUrl && (
                  <img src={formData.linkedJiraProject.avatarUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '3px' }} />
                )}
                <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                  {formData.linkedJiraProject.name}
                </span>
                <a 
                  href={`https://gouriertradingproject.atlassian.net/jira/software/projects/${formData.linkedJiraProject.key}/boards`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    marginLeft: 'auto', 
                    fontSize: '12px', 
                    color: 'var(--color-accent-primary)',
                    textDecoration: 'none'
                  }}
                >
                  View Board →
                </a>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              Jira Issue Key (optional)
            </label>
            <input
              type="text"
              value={formData.jiraKey}
              onChange={(e) => setFormData({ ...formData, jiraKey: e.target.value })}
              placeholder="e.g. ACRM-123"
              className="input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Jira Status Dashboard Widget - ACRM-29
 * Displays Jira project status, issue counts, and sprint progress
 */
function JiraStatusWidget({ projectKey }) {
  const [data, setData] = useState({ issues: [], total: 0, statusCounts: {} });
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [issuesResult, sprintsResult] = await Promise.all([
          jiraApi.getProjectIssues(projectKey, { maxResults: 20 }),
          jiraApi.getSprints(projectKey).catch(() => ({ sprints: [] }))
        ]);
        setData(issuesResult);
        setSprints(sprintsResult.sprints || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectKey]);

  const activeSprint = sprints.find(s => s.state === 'active');
  const totalIssues = data.total || 0;
  const doneCount = data.statusCounts['Done'] || 0;
  const inProgressCount = data.statusCounts['In Progress'] || 0;
  const todoCount = totalIssues - doneCount - inProgressCount;

  if (loading) {
    return (
      <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading Jira status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '13px' }}>
        Failed to load Jira status: {error}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        Jira Status Dashboard
      </h4>

      {/* Issue Status Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ 
          padding: '12px', 
          background: 'rgba(59, 130, 246, 0.08)', 
          borderRadius: '8px',
          borderLeft: '3px solid #3b82f6'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{todoCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>To Do</div>
        </div>
        <div style={{ 
          padding: '12px', 
          background: 'rgba(245, 158, 11, 0.08)', 
          borderRadius: '8px',
          borderLeft: '3px solid #f59e0b'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{inProgressCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>In Progress</div>
        </div>
        <div style={{ 
          padding: '12px', 
          background: 'rgba(16, 185, 129, 0.08)', 
          borderRadius: '8px',
          borderLeft: '3px solid #10b981'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{doneCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Done</div>
        </div>
      </div>

      {/* Active Sprint Progress */}
      {activeSprint && (
        <div style={{ 
          padding: '12px 16px', 
          background: 'var(--color-bg-secondary)', 
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              🏃 {activeSprint.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {totalIssues > 0 ? Math.round((doneCount / totalIssues) * 100) : 0}% Complete
            </span>
          </div>
          <div style={{ 
            height: '6px', 
            background: 'var(--color-border)', 
            borderRadius: '3px', 
            overflow: 'hidden' 
          }}>
            <div style={{
              height: '100%',
              width: `${totalIssues > 0 ? (doneCount / totalIssues) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          {activeSprint.endDate && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              Ends: {new Date(activeSprint.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Recent Issues */}
      {data.issues.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Recent Activity ({Math.min(5, data.issues.length)} of {data.total})
          </div>
          <div style={{ 
            background: 'var(--color-bg-secondary)', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {data.issues.slice(0, 5).map((issue, idx) => (
              <a
                key={issue.key}
                href={`https://gouriertradingproject.atlassian.net/browse/${issue.key}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  textDecoration: 'none',
                  borderBottom: idx < Math.min(4, data.issues.length - 1) ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  color: '#0052CC',
                  minWidth: '70px'
                }}>
                  {issue.key}
                </span>
                <span style={{ 
                  flex: 1, 
                  fontSize: '13px', 
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {issue.summary}
                </span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 500,
                  background: issue.statusCategory === 'Done' ? 'rgba(16, 185, 129, 0.15)' 
                            : issue.statusCategory === 'In Progress' ? 'rgba(245, 158, 11, 0.15)' 
                            : 'rgba(100, 100, 100, 0.1)',
                  color: issue.statusCategory === 'Done' ? '#10b981' 
                       : issue.statusCategory === 'In Progress' ? '#f59e0b' 
                       : 'var(--color-text-muted)'
                }}>
                  {issue.status}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Project Detail/Edit Modal
 */
function ProjectDetailModal({ project, onClose, onUpdate, onDelete, priorityColors }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    status: project.status || 'IDEA',
    priority: project.priority || 'MEDIUM',
    jiraKey: project.jiraKey || '',
    linkedJiraProject: project.linkedJiraProject || null,
    startDate: project.startDate || '',
    endDate: project.endDate || '',
    progress: project.progress || 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jiraProjects, setJiraProjects] = useState([]);
  const [loadingJira, setLoadingJira] = useState(true);

  // Load Jira projects when editing
  useEffect(() => {
    if (isEditing) {
      const loadJiraProjects = async () => {
        try {
          const result = await jiraApi.listProjects();
          setJiraProjects(result.projects || []);
        } catch (err) {
          console.error('Error loading Jira projects:', err);
        } finally {
          setLoadingJira(false);
        }
      };
      loadJiraProjects();
    }
  }, [isEditing]);

  const statusLabels = {
    IDEA: 'Idea',
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done'
  };

  const statusColors = {
    IDEA: '#9333ea',
    TODO: '#3b82f6',
    IN_PROGRESS: '#f59e0b',
    DONE: '#10b981'
  };

  const handleJiraProjectSelect = (e) => {
    const projectKey = e.target.value;
    if (projectKey) {
      const selected = jiraProjects.find(p => p.key === projectKey);
      setFormData({
        ...formData,
        linkedJiraProject: selected ? { key: selected.key, name: selected.name, avatarUrl: selected.avatarUrl } : null
      });
    } else {
      setFormData({ ...formData, linkedJiraProject: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await onUpdate({
        ...formData,
        jiraKey: formData.jiraKey || undefined,
        linkedJiraProject: formData.linkedJiraProject || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: statusColors[project.status]
            }} />
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {isEditing ? 'Edit Project' : 'Project Details'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '18px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="IDEA">Idea</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Jira Issue Key
                  </label>
                  <input
                    type="text"
                    value={formData.jiraKey}
                    onChange={(e) => setFormData({ ...formData, jiraKey: e.target.value })}
                    placeholder="e.g. ACRM-123"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Jira Project Linking */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Linked Jira Project
                </label>
                <select
                  value={formData.linkedJiraProject?.key || ''}
                  onChange={handleJiraProjectSelect}
                  className="input"
                  style={{ width: '100%' }}
                  disabled={loadingJira}
                >
                  <option value="">{loadingJira ? 'Loading Jira projects...' : 'No linked project'}</option>
                  {jiraProjects.map(proj => (
                    <option key={proj.key} value={proj.key}>
                      {proj.key} - {proj.name}
                    </option>
                  ))}
                </select>
                {formData.linkedJiraProject && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: 'rgba(0, 82, 204, 0.05)', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {formData.linkedJiraProject.avatarUrl && (
                      <img src={formData.linkedJiraProject.avatarUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '3px' }} />
                    )}
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {formData.linkedJiraProject.name}
                    </span>
                    <a 
                      href={`https://gouriertradingproject.atlassian.net/jira/software/projects/${formData.linkedJiraProject.key}/boards`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        marginLeft: 'auto', 
                        fontSize: '12px', 
                        color: 'var(--color-accent-primary)',
                        textDecoration: 'none'
                      }}
                    >
                      View Board →
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* View Mode */}
              <h2 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)' }}>{project.name}</h2>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: `${statusColors[project.status]}20`,
                  color: statusColors[project.status],
                  fontWeight: 500
                }}>
                  {statusLabels[project.status]}
                </span>
                {project.priority && (
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: `${priorityColors[project.priority]}20`,
                    color: priorityColors[project.priority],
                    fontWeight: 500
                  }}>
                    {project.priority}
                  </span>
                )}
                {project.linkedJiraProject && (
                  <a
                    href={`https://gouriertradingproject.atlassian.net/jira/software/projects/${project.linkedJiraProject.key}/boards`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.1) 0%, rgba(38, 132, 255, 0.1) 100%)',
                      color: '#0052CC',
                      fontWeight: 500,
                      textDecoration: 'none'
                    }}
                  >
                    {project.linkedJiraProject.avatarUrl && (
                      <img src={project.linkedJiraProject.avatarUrl} alt="" style={{ width: '14px', height: '14px', borderRadius: '2px' }} />
                    )}
                    {project.linkedJiraProject.key}
                  </a>
                )}
                {project.jiraKey && (
                  <a
                    href={`https://gouriertradingproject.atlassian.net/browse/${project.jiraKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: 'rgba(0, 82, 204, 0.1)',
                      color: '#0052CC',
                      fontWeight: 500,
                      textDecoration: 'none'
                    }}
                  >
                    {project.jiraKey}
                  </a>
                )}
              </div>

              {/* Linked Jira Project Card */}
              {project.linkedJiraProject && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '12px 16px', 
                  background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.05) 0%, rgba(38, 132, 255, 0.05) 100%)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 82, 204, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {project.linkedJiraProject.avatarUrl && (
                        <img src={project.linkedJiraProject.avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />
                      )}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {project.linkedJiraProject.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          Linked Jira Project
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://gouriertradingproject.atlassian.net/jira/software/projects/${project.linkedJiraProject.key}/boards`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
                    >
                      Open Jira Board →
                    </a>
                  </div>
                </div>
              )}

              {/* Jira Status Dashboard Widget - ACRM-29 */}
              {project.linkedJiraProject && (
                <JiraStatusWidget projectKey={project.linkedJiraProject.key} />
              )}

              {project.description && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Description</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{project.description}</p>
                </div>
              )}

              {/* Progress */}
              {project.progress > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Progress</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: 'var(--color-border)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${project.progress}%`,
                        height: '100%',
                        background: 'var(--color-accent-primary)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {project.progress}%
                    </span>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Start Date</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>End Date</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>{formatDate(project.endDate)}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div style={{ 
                padding: '12px',
                background: 'var(--color-bg-primary)',
                borderRadius: '6px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Created</span>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {formatDate(project.createdAt)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Last Updated</span>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {formatDate(project.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Delete Button */}
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={onDelete}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: 0
                  }}
                >
                  Delete this project
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Ideas Tab - Capture and manage ideas/prompts
 */
function IdeasTab() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideaToConvert, setIdeaToConvert] = useState(null);
  const [ideaToJira, setIdeaToJira] = useState(null); // ACRM-30
  const [statusFilter, setStatusFilter] = useState('');

  const statusConfig = {
    NEW: { label: 'New', color: '#9333ea' },
    REVIEWING: { label: 'Reviewing', color: '#f59e0b' },
    ACCEPTED: { label: 'Accepted', color: '#10b981' },
    REJECTED: { label: 'Rejected', color: '#ef4444' },
    PROCESSED: { label: 'Processed', color: '#6b7280' },
  };

  const loadIdeas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = statusFilter ? { status: statusFilter } : {};
      const data = await listIdeas(filters);
      setIdeas(data.ideas || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading ideas:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const handleCreateIdea = async (ideaData) => {
    try {
      const newIdea = await createIdea(ideaData);
      setIdeas(prev => [newIdea, ...prev]);
      setShowCaptureModal(false);
    } catch (err) {
      console.error('Error creating idea:', err);
      throw err;
    }
  };

  const handleUpdateIdea = async (ideaId, updates) => {
    try {
      const updatedIdea = await updateIdea(ideaId, updates);
      setIdeas(prev => prev.map(i => i.ideaId === ideaId ? updatedIdea : i));
      setSelectedIdea(null);
    } catch (err) {
      console.error('Error updating idea:', err);
      throw err;
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;
    try {
      await deleteIdea(ideaId);
      setIdeas(prev => prev.filter(i => i.ideaId !== ideaId));
      setSelectedIdea(null);
    } catch (err) {
      console.error('Error deleting idea:', err);
      setError('Failed to delete idea');
    }
  };

  const handleConvertToProject = async (projectData, ideaId) => {
    try {
      // Create the new project
      const newProject = await createProject(projectData);
      
      // Update the idea: link to project and mark as PROCESSED
      const updatedIdea = await updateIdea(ideaId, {
        status: 'PROCESSED',
        projectId: newProject.projectId
      });
      
      // Update local state
      setIdeas(prev => prev.map(i => i.ideaId === ideaId ? updatedIdea : i));
      setIdeaToConvert(null);
      setSelectedIdea(null);
      
      return newProject;
    } catch (err) {
      console.error('Error converting idea to project:', err);
      throw err;
    }
  };

  // ACRM-30: Handle Jira ticket creation
  const handleCreateJiraTicket = async (jiraKey) => {
    try {
      // Update the idea with the Jira key and mark as processed
      const updatedIdea = await updateIdea(ideaToJira.ideaId, {
        jiraKey: jiraKey,
        status: 'PROCESSED'
      });
      
      // Update local state
      setIdeas(prev => prev.map(i => i.ideaId === ideaToJira.ideaId ? updatedIdea : i));
      setIdeaToJira(null);
      setSelectedIdea(null);
    } catch (err) {
      console.error('Error updating idea with Jira key:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading ideas...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            Ideas & Prompts
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px' }}>
              ({ideas.length})
            </span>
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ minWidth: '140px', padding: '6px 10px', fontSize: '13px' }}
          >
            <option value="">All Statuses</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCaptureModal(true)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '6px' }}>
            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
          </svg>
          Capture Idea
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          marginBottom: '16px'
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            {statusFilter ? `No ${statusConfig[statusFilter]?.label.toLowerCase()} ideas` : 'No ideas captured yet'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Capture your project ideas and prompts here.
            <br />
            They can be converted to projects or Jira tickets.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCaptureModal(true)}>
            Capture Your First Idea
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ideas.map(idea => (
            <IdeaCard
              key={idea.ideaId}
              idea={idea}
              statusConfig={statusConfig}
              onClick={() => setSelectedIdea(idea)}
              onDelete={() => handleDeleteIdea(idea.ideaId)}
            />
          ))}
        </div>
      )}

      {/* Capture Idea Modal */}
      {showCaptureModal && (
        <CaptureIdeaModal
          onClose={() => setShowCaptureModal(false)}
          onCreate={handleCreateIdea}
        />
      )}

      {/* Idea Detail Modal */}
      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          statusConfig={statusConfig}
          onClose={() => setSelectedIdea(null)}
          onUpdate={(updates) => handleUpdateIdea(selectedIdea.ideaId, updates)}
          onDelete={() => handleDeleteIdea(selectedIdea.ideaId)}
          onConvertToProject={() => {
            setIdeaToConvert(selectedIdea);
            setSelectedIdea(null);
          }}
          onCreateJiraTicket={() => {
            setIdeaToJira(selectedIdea);
            setSelectedIdea(null);
          }}
        />
      )}

      {/* Convert to Project Modal */}
      {ideaToConvert && (
        <ConvertToProjectModal
          idea={ideaToConvert}
          onClose={() => setIdeaToConvert(null)}
          onConvert={(projectData) => handleConvertToProject(projectData, ideaToConvert.ideaId)}
        />
      )}

      {/* Create Jira Ticket Modal - ACRM-30 */}
      {ideaToJira && (
        <CreateJiraTicketModal
          idea={ideaToJira}
          onClose={() => setIdeaToJira(null)}
          onCreated={handleCreateJiraTicket}
        />
      )}
    </div>
  );
}

/**
 * Idea Card Component
 */
function IdeaCard({ idea, statusConfig, onClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const status = statusConfig[idea.status] || { label: idea.status, color: '#6b7280' };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-primary)'}
      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>💡</span>
            <h4 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '15px', fontWeight: 500 }}>
              {idea.title}
            </h4>
          </div>
          {idea.content && (
            <p style={{
              margin: '0 0 12px',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {idea.content}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: `${status.color}20`,
              color: status.color,
              fontWeight: 500
            }}>
              {status.label}
            </span>
            {idea.source && idea.source !== 'MANUAL' && (
              <span style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-muted)'
              }}>
                {idea.source}
              </span>
            )}
            {idea.createdAt && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {formatDate(idea.createdAt)}
              </span>
            )}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              cursor: 'pointer',
              color: 'var(--color-text-muted)'
            }}
          >
            ⋮
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              minWidth: '100px'
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onClick(); }}
                style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '13px' }}
              >
                View
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Capture Idea Modal
 */
function CaptureIdeaModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'NEW',
    priority: 'MEDIUM',
    source: 'MANUAL'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Idea title is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreate(formData);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          border: '1px solid var(--color-border)'
        }}
      >
        <h3 style={{ margin: '0 0 20px', color: 'var(--color-text-primary)' }}>
          💡 Capture New Idea
        </h3>

        {error && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#ef4444',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's the idea?"
              className="input"
              style={{ width: '100%' }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Details / Prompt
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe the idea, add context, or paste a prompt..."
              className="input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="MANUAL">Manual</option>
                <option value="TERMINAL">Terminal</option>
                <option value="JIRA">Jira</option>
                <option value="API">API</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Capturing...' : 'Capture Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Idea Detail Modal
 */
function IdeaDetailModal({ idea, statusConfig, onClose, onUpdate, onDelete, onConvertToProject, onCreateJiraTicket }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: idea.title || '',
    content: idea.content || '',
    status: idea.status || 'NEW',
    priority: idea.priority || 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const status = statusConfig[idea.status] || { label: idea.status, color: '#6b7280' };
  const canConvert = idea.status !== 'PROCESSED' && idea.status !== 'REJECTED';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Idea title is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {isEditing ? 'Edit Idea' : 'Idea Details'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                Edit
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input"
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input" style={{ width: '100%' }}>
                    <option value="NEW">New</option>
                    <option value="REVIEWING">Reviewing</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PROCESSED">Processed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="input" style={{ width: '100%' }}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <>
              <h2 style={{ margin: '0 0 12px', color: 'var(--color-text-primary)' }}>{idea.title}</h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: `${status.color}20`, color: status.color, fontWeight: 500 }}>
                  {status.label}
                </span>
                {idea.priority && (
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
                    {idea.priority}
                  </span>
                )}
                {idea.source && (
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}>
                    Source: {idea.source}
                  </span>
                )}
              </div>
              {idea.content && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Content / Prompt</h4>
                  <div style={{ padding: '12px', background: 'var(--color-bg-primary)', borderRadius: '6px', whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)', fontSize: '14px', lineHeight: 1.6 }}>
                    {idea.content}
                  </div>
                </div>
              )}
              <div style={{ padding: '12px', background: 'var(--color-bg-primary)', borderRadius: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Created</span>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{formatDate(idea.createdAt)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Updated</span>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{formatDate(idea.updatedAt)}</p>
                </div>
              </div>

              {/* Convert to Project Button */}
              {canConvert && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={onConvertToProject}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                      <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                    Convert to Project
                  </button>
                  <button
                    onClick={onCreateJiraTicket}
                    className="btn btn-secondary"
                    style={{ 
                      flex: 1,
                      background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.1) 0%, rgba(38, 132, 255, 0.1) 100%)',
                      border: '1px solid rgba(0, 82, 204, 0.3)',
                      color: '#0052CC'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M12.001 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/>
                    </svg>
                    Create Jira Ticket
                  </button>
                </div>
              )}

              {/* Already processed indicator */}
              {idea.status === 'PROCESSED' && idea.projectId && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '12px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px' }}>
                    <span>✓</span>
                    <span>Converted to project</span>
                  </div>
                </div>
              )}

              {/* Jira ticket indicator */}
              {idea.jiraKey && (
                <div style={{ 
                  marginTop: idea.status === 'PROCESSED' ? '12px' : '20px', 
                  padding: '12px', 
                  background: 'rgba(0, 82, 204, 0.05)', 
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 82, 204, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0052CC', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>J</span>
                      <span>Jira ticket created</span>
                    </div>
                    <a 
                      href={`https://gouriertradingproject.atlassian.net/browse/${idea.jiraKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#0052CC', 
                        fontWeight: 500, 
                        fontSize: '13px',
                        textDecoration: 'none'
                      }}
                    >
                      {idea.jiraKey} →
                    </a>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                  Delete this idea
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Convert to Project Modal
 * Pre-fills project form with idea data
 */
function ConvertToProjectModal({ idea, onClose, onConvert }) {
  const [formData, setFormData] = useState({
    name: idea.title || '',
    description: idea.content || '',
    status: 'IDEA',
    priority: idea.priority || 'MEDIUM',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConvert({
        ...formData,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📁
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Convert to Project</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Create a new project from this idea
            </p>
          </div>
        </div>

        {/* Source Idea Info */}
        <div style={{
          padding: '12px',
          background: 'var(--color-bg-primary)',
          borderRadius: '6px',
          marginBottom: '20px',
          borderLeft: '3px solid var(--color-accent-primary)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Source Idea</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{idea.title}</div>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#ef4444',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              style={{ width: '100%' }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="IDEA">Idea</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Create Jira Ticket Modal - ACRM-30
 * Allows converting prompts/ideas into Jira tickets
 */
function CreateJiraTicketModal({ idea, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    summary: idea.title || '',
    description: idea.content || '',
    projectKey: '',
    issueType: 'Task',
    priority: idea.priority === 'CRITICAL' ? 'Highest' : idea.priority === 'HIGH' ? 'High' : idea.priority === 'LOW' ? 'Low' : 'Medium'
  });
  const [jiraProjects, setJiraProjects] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [error, setError] = useState(null);

  // Load Jira projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const result = await jiraApi.listProjects();
        setJiraProjects(result.projects || []);
      } catch (err) {
        setError('Failed to load Jira projects: ' + err.message);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  // Load issue types when project is selected
  useEffect(() => {
    if (formData.projectKey) {
      const loadIssueTypes = async () => {
        setLoadingTypes(true);
        try {
          const result = await jiraApi.getIssueTypes(formData.projectKey);
          setIssueTypes(result.issueTypes || []);
        } catch (err) {
          console.error('Failed to load issue types:', err);
        } finally {
          setLoadingTypes(false);
        }
      };
      loadIssueTypes();
    }
  }, [formData.projectKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.summary.trim()) {
      setError('Summary is required');
      return;
    }
    if (!formData.projectKey) {
      setError('Please select a Jira project');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await jiraApi.createIssue({
        projectKey: formData.projectKey,
        summary: formData.summary,
        issueType: formData.issueType,
        description: formData.description,
        priority: formData.priority
      });

      await onCreated(result.key);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '550px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.05) 0%, rgba(38, 132, 255, 0.05) 100%)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0052CC 0%, #2684FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            J
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Create Jira Ticket</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              from idea: {idea.title?.substring(0, 40)}{idea.title?.length > 40 ? '...' : ''}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Project Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Jira Project *
              </label>
              <select
                value={formData.projectKey}
                onChange={(e) => setFormData({ ...formData, projectKey: e.target.value, issueType: 'Task' })}
                className="input"
                style={{ width: '100%' }}
                disabled={loadingProjects}
              >
                <option value="">{loadingProjects ? 'Loading projects...' : 'Select a project'}</option>
                {jiraProjects.map(p => (
                  <option key={p.key} value={p.key}>{p.key} - {p.name}</option>
                ))}
              </select>
            </div>

            {/* Issue Type Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Issue Type *
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                disabled={!formData.projectKey || loadingTypes}
              >
                {loadingTypes ? (
                  <option value="">Loading issue types...</option>
                ) : issueTypes.length > 0 ? (
                  issueTypes.filter(t => !t.subtask).map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Epic">Epic</option>
                    <option value="Story">Story</option>
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                  </>
                )}
              </select>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Summary *
              </label>
              <input
                type="text"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                placeholder="Brief summary of the ticket"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                placeholder="Detailed description..."
              />
            </div>

            {/* Priority */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="Lowest">Lowest</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Highest">Highest</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !formData.projectKey}
                style={{ 
                  background: 'linear-gradient(135deg, #0052CC 0%, #2684FF 100%)',
                  border: 'none'
                }}
              >
                {loading ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Gantt Tab - Project timeline visualization
 */
function GanttTab() {
  const [tasks, setTasks] = useState([]);
  const [links, setLinks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState('month');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [savingTask, setSavingTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // all, task, milestone
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, in-progress, not-started

  // Calculate at-risk and milestone statistics
  const today = new Date();
  const tasksAtRisk = tasks.filter(t => {
    if (t.progress === 100 || t.type === 'milestone') return false;
    const endDate = new Date(t.end);
    const daysUntilDue = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue < 0 || (daysUntilDue <= 3 && t.progress < 75);
  });
  const milestones = tasks.filter(t => t.type === 'milestone');
  const upcomingMilestones = milestones.filter(m => new Date(m.start) >= today);

  // Apply filters to tasks
  const filteredTasks = tasks.filter(t => {
    // Type filter
    if (typeFilter === 'task' && t.type === 'milestone') return false;
    if (typeFilter === 'milestone' && t.type !== 'milestone') return false;
    
    // Status filter
    if (statusFilter === 'completed' && t.progress !== 100) return false;
    if (statusFilter === 'in-progress' && (t.progress === 0 || t.progress === 100)) return false;
    if (statusFilter === 'not-started' && t.progress !== 0) return false;
    
    return true;
  });

  // Export functions
  const exportToCSV = () => {
    const headers = ['Task Name', 'Type', 'Project', 'Start Date', 'End Date', 'Progress', 'Status'];
    const rows = filteredTasks.map(t => {
      const project = projects.find(p => p.projectId === t.projectId);
      const status = t.progress === 100 ? 'Completed' : t.progress > 0 ? 'In Progress' : 'Not Started';
      return [
        t.text,
        t.type || 'task',
        project?.name || 'Unknown',
        t.start.toISOString().split('T')[0],
        t.end.toISOString().split('T')[0],
        `${t.progress}%`,
        status
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gantt-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      tasks: filteredTasks.map(t => {
        const project = projects.find(p => p.projectId === t.projectId);
        return {
          id: t.id,
          name: t.text,
          type: t.type || 'task',
          project: project?.name || 'Unknown',
          startDate: t.start.toISOString(),
          endDate: t.end.toISOString(),
          progress: t.progress,
          dependencies: links.filter(l => l.target === t.id).map(l => ({
            dependsOn: tasks.find(dt => dt.id === l.source)?.text || l.source,
            type: l.type
          }))
        };
      }),
      summary: {
        totalTasks: filteredTasks.filter(t => t.type !== 'milestone').length,
        totalMilestones: filteredTasks.filter(t => t.type === 'milestone').length,
        completed: filteredTasks.filter(t => t.progress === 100).length,
        averageProgress: Math.round(filteredTasks.filter(t => t.type !== 'milestone').reduce((sum, t) => sum + (t.progress || 0), 0) / Math.max(1, filteredTasks.filter(t => t.type !== 'milestone').length))
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gantt-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Define scale configurations for different zoom levels
  const scaleConfigs = {
    day: [
      { unit: 'week', step: 1, format: 'MMM d' },
      { unit: 'day', step: 1, format: 'd' },
    ],
    week: [
      { unit: 'month', step: 1, format: 'MMMM yyyy' },
      { unit: 'week', step: 1, format: "'Week' w" },
    ],
    month: [
      { unit: 'year', step: 1, format: 'yyyy' },
      { unit: 'month', step: 1, format: 'MMMM' },
    ],
    quarter: [
      { unit: 'year', step: 1, format: 'yyyy' },
      { unit: 'quarter', step: 1, format: "'Q'q" },
    ],
    year: [
      { unit: 'year', step: 1, format: 'yyyy' },
    ],
  };

  // Load projects and tasks
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          listProjects(),
          listTasks(selectedProjectId !== 'all' ? { projectId: selectedProjectId } : {})
        ]);
        
        setProjects(projectsRes.projects || []);
        
        // Transform tasks for Gantt chart
        const ganttTasks = (tasksRes.tasks || []).map(task => ({
          id: task.taskId,
          text: task.text,
          start: new Date(task.startDate),
          end: new Date(task.endDate),
          duration: task.duration || 1,
          progress: task.progress || 0,
          type: task.type || 'task',
          parent: task.parent || 0,
          projectId: task.projectId,
          color: task.color,
          order: task.order || 0,
        }));
        
        // Transform dependencies to links
        const ganttLinks = [];
        (tasksRes.tasks || []).forEach(task => {
          if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach((dep, idx) => {
              // Dependencies can be either string (taskId) or object {taskId, type}
              const depId = typeof dep === 'object' ? dep.taskId : dep;
              const depType = typeof dep === 'object' ? dep.type : 'e2s'; // Default: Finish-to-Start
              ganttLinks.push({
                id: `${task.taskId}-${depId}-${idx}`,
                source: depId,
                target: task.taskId,
                type: depType, // e2s=Finish-to-Start, s2s=Start-to-Start, e2e=End-to-End, s2e=Start-to-End
              });
            });
          }
        });
        
        setTasks(ganttTasks);
        setLinks(ganttLinks);
        setError(null);
      } catch (err) {
        console.error('Error loading Gantt data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [selectedProjectId]);

  // Handle task update from Gantt drag/resize
  const handleTaskUpdate = useCallback(async ({ id, task, diff, inProgress }) => {
    // Only process when drag/resize is complete
    if (inProgress) {
      return true; // Allow the visual update to continue
    }
    
    setSavingTask(id);
    try {
      // Calculate new dates from the updated task
      const updates = {};
      if (task.start) updates.startDate = task.start.toISOString();
      if (task.end) updates.endDate = task.end.toISOString();
      if (task.duration !== undefined) updates.duration = task.duration;
      if (task.progress !== undefined) updates.progress = task.progress;
      if (task.text !== undefined) updates.text = task.text;
      
      await updateTask(id, updates);
      
      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, ...task } : t
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to save changes. Please try again.');
      return false; // Revert the change
    } finally {
      setSavingTask(null);
    }
  }, []);

  // Handle progress bar drag
  const handleProgressUpdate = useCallback(async ({ id, task }) => {
    setSavingTask(id);
    try {
      await updateTask(id, { progress: task.progress });
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, progress: task.progress } : t
      ));
      return true;
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to save progress. Please try again.');
      return false;
    } finally {
      setSavingTask(null);
    }
  }, []);

  // Handle link (dependency) creation
  const handleAddLink = useCallback(async ({ id, link }) => {
    try {
      // Get the target task and add the source as a dependency
      const targetTask = tasks.find(t => t.id === link.target);
      if (targetTask) {
        const currentDeps = targetTask.dependencies || [];
        // Store as object with taskId and type
        const newDep = { taskId: link.source, type: link.type || 'e2s' };
        const newDeps = [...currentDeps, newDep];
        await updateTask(link.target, { dependencies: newDeps });
        
        setLinks(prev => [...prev, { id, ...link }]);
      }
      return true;
    } catch (err) {
      console.error('Error adding dependency:', err);
      setError('Failed to add dependency.');
      return false;
    }
  }, [tasks]);

  // Handle link deletion
  const handleDeleteLink = useCallback(async ({ id }) => {
    try {
      const linkToDelete = links.find(l => l.id === id);
      if (linkToDelete) {
        const targetTask = tasks.find(t => t.id === linkToDelete.target);
        if (targetTask) {
          // Handle both old (string) and new (object) dependency formats
          const newDeps = (targetTask.dependencies || []).filter(d => {
            const depId = typeof d === 'object' ? d.taskId : d;
            return depId !== linkToDelete.source;
          });
          await updateTask(linkToDelete.target, { dependencies: newDeps });
        }
      }
      setLinks(prev => prev.filter(l => l.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting dependency:', err);
      setError('Failed to remove dependency.');
      return false;
    }
  }, [links, tasks]);

  // Handle task click for editing
  const handleSelectTask = useCallback(({ id }) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setEditingTask(task);
    }
  }, [tasks]);

  // Handle task delete
  const handleTaskDelete = useCallback(async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setLinks(prev => prev.filter(l => l.source !== taskId && l.target !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  }, []);

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.projectId === projectId);
    return project ? project.name : 'Unknown Project';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading Gantt chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Gantt Chart</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Project Filter */}
          <select 
            className="btn btn-secondary" 
            style={{ minWidth: '150px' }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.projectId} value={p.projectId}>{p.name}</option>
            ))}
          </select>
          
          {/* Zoom Level */}
          <select 
            className="btn btn-secondary" 
            style={{ minWidth: '120px' }}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(e.target.value)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
          
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAddMilestoneModal(true)}
            disabled={projects.length === 0}
            title="Add Milestone"
          >
            ◆ Milestone
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddTaskModal(true)}
            disabled={projects.length === 0}
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Filter and Export Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 16px',
        background: 'var(--color-bg-secondary)',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Filters:</span>
          
          {/* Type Filter */}
          <select 
            className="btn btn-secondary" 
            style={{ minWidth: '100px', fontSize: '13px', padding: '4px 8px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="task">Tasks Only</option>
            <option value="milestone">Milestones</option>
          </select>
          
          {/* Status Filter */}
          <select 
            className="btn btn-secondary" 
            style={{ minWidth: '120px', fontSize: '13px', padding: '4px 8px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="not-started">Not Started</option>
          </select>
          
          {(typeFilter !== 'all' || statusFilter !== 'all') && (
            <button 
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '4px 10px' }}
              onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
            >
              Clear Filters
            </button>
          )}
          
          {filteredTasks.length !== tasks.length && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Showing {filteredTasks.length} of {tasks.length}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '4px 10px' }}
            onClick={exportToCSV}
            disabled={filteredTasks.length === 0}
            title="Export to CSV spreadsheet"
          >
            📊 CSV
          </button>
          <button 
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '4px 10px' }}
            onClick={exportToJSON}
            disabled={filteredTasks.length === 0}
            title="Export to JSON (includes dependencies)"
          >
            📄 JSON
          </button>
        </div>
      </div>

      {/* At-Risk Tasks Warning */}
      {tasksAtRisk.length > 0 && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#ffc107' }}>{tasksAtRisk.length} task{tasksAtRisk.length > 1 ? 's' : ''} at risk</strong>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {tasksAtRisk.slice(0, 3).map(t => t.text).join(', ')}
              {tasksAtRisk.length > 3 && ` and ${tasksAtRisk.length - 3} more...`}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Milestones Info */}
      {upcomingMilestones.length > 0 && (
        <div style={{
          background: 'rgba(138, 43, 226, 0.1)',
          border: '1px solid rgba(138, 43, 226, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>◆</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#8a2be2' }}>{upcomingMilestones.length} upcoming milestone{upcomingMilestones.length > 1 ? 's' : ''}</strong>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {upcomingMilestones.slice(0, 3).map(m => {
                const date = new Date(m.start);
                return `${m.text} (${date.toLocaleDateString()})`;
              }).join(' • ')}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(220, 53, 69, 0.1)',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#dc3545',
        }}>
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Gantt Chart or Empty State */}
      {filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            {tasks.length === 0 ? 'No tasks to display' : 'No tasks match filters'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            {tasks.length === 0 ? (
              projects.length === 0 
                ? 'Create a project first, then add tasks to see them on the Gantt chart.'
                : 'Add tasks to your projects to visualize them on the timeline.'
            ) : (
              'Try adjusting the filters above to see more tasks.'
            )}
            {tasks.length === 0 && <><br />Drag and drop to adjust schedules.</>}
          </p>
          {tasks.length === 0 ? (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddTaskModal(true)}
              disabled={projects.length === 0}
            >
              {projects.length === 0 ? 'Create Project First' : 'Add First Task'}
            </button>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div 
          className="card" 
          style={{ 
            padding: 0, 
            overflow: 'hidden',
            height: 'calc(100vh - 280px)',
            minHeight: '400px',
            position: 'relative',
          }}
        >
          {/* Saving indicator */}
          {savingTask && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'var(--color-accent-primary)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span className="spinner" style={{ width: '12px', height: '12px' }} />
              Saving...
            </div>
          )}
          <Gantt
            tasks={filteredTasks}
            links={links.filter(l => filteredTasks.some(t => t.id === l.source) && filteredTasks.some(t => t.id === l.target))}
            scales={scaleConfigs[zoomLevel]}
            cellWidth={zoomLevel === 'day' ? 40 : zoomLevel === 'week' ? 60 : 80}
            cellHeight={36}
            columns={[
              { id: 'text', header: 'Task Name', width: 200 },
              { id: 'start', header: 'Start', width: 100, align: 'center' },
              { id: 'end', header: 'End', width: 100, align: 'center' },
              { id: 'progress', header: 'Progress', width: 80, align: 'center' },
            ]}
            start={new Date(new Date().setMonth(new Date().getMonth() - 1))}
            end={new Date(new Date().setMonth(new Date().getMonth() + 6))}
            onAction={{
              'update-task': handleTaskUpdate,
              'add-link': handleAddLink,
              'delete-link': handleDeleteLink,
              'select-task': handleSelectTask,
            }}
          />
        </div>
      )}

      {/* Task Stats */}
      {tasks.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '16px', 
          marginTop: '24px' 
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
              {tasks.filter(t => t.type !== 'milestone').length}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Tasks</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8a2be2' }}>
              {milestones.length}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Milestones</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {tasks.filter(t => t.progress === 100).length}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Completed</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
              {tasksAtRisk.length}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>At Risk</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
              {Math.round(tasks.filter(t => t.type !== 'milestone').reduce((sum, t) => sum + (t.progress || 0), 0) / Math.max(1, tasks.filter(t => t.type !== 'milestone').length))}%
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Avg Progress</div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <AddTaskModal 
          projects={projects}
          selectedProjectId={selectedProjectId !== 'all' ? selectedProjectId : null}
          onClose={() => setShowAddTaskModal(false)}
          onTaskCreated={(newTask) => {
            setTasks(prev => [...prev, {
              id: newTask.taskId,
              text: newTask.text,
              start: new Date(newTask.startDate),
              end: new Date(newTask.endDate),
              duration: newTask.duration || 1,
              progress: newTask.progress || 0,
              type: newTask.type || 'task',
              parent: newTask.parent || 0,
              projectId: newTask.projectId,
            }]);
            setShowAddTaskModal(false);
          }}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal 
          task={editingTask}
          projects={projects}
          allTasks={tasks}
          links={links}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={(updatedTask) => {
            setTasks(prev => prev.map(t => 
              t.id === updatedTask.taskId ? {
                ...t,
                text: updatedTask.text,
                start: new Date(updatedTask.startDate),
                end: new Date(updatedTask.endDate),
                duration: updatedTask.duration || 1,
                progress: updatedTask.progress || 0,
                type: updatedTask.type || 'task',
                projectId: updatedTask.projectId,
              } : t
            ));
            setEditingTask(null);
          }}
          onTaskDeleted={(taskId) => {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setLinks(prev => prev.filter(l => l.source !== taskId && l.target !== taskId));
            setEditingTask(null);
          }}
        />
      )}

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <AddMilestoneModal 
          projects={projects}
          selectedProjectId={selectedProjectId !== 'all' ? selectedProjectId : null}
          onClose={() => setShowAddMilestoneModal(false)}
          onMilestoneCreated={(newMilestone) => {
            setTasks(prev => [...prev, {
              id: newMilestone.taskId,
              text: newMilestone.text,
              start: new Date(newMilestone.startDate),
              end: new Date(newMilestone.endDate),
              duration: 0,
              progress: 0,
              type: 'milestone',
              parent: 0,
              projectId: newMilestone.projectId,
            }]);
            setShowAddMilestoneModal(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Add Task Modal
 */
function AddTaskModal({ projects, selectedProjectId, onClose, onTaskCreated }) {
  const [formData, setFormData] = useState({
    projectId: selectedProjectId || (projects[0]?.projectId || ''),
    text: '',
    type: 'task',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim() || !formData.projectId) return;

    setSaving(true);
    setError(null);

    try {
      const newTask = await createTask({
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        duration: Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)),
      });
      onTaskCreated(newTask);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        className="card" 
        style={{ 
          width: '90%', 
          maxWidth: '500px', 
          maxHeight: '90vh', 
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Add New Task</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#dc3545',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Project *
            </label>
            <select
              className="form-control"
              value={formData.projectId}
              onChange={e => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              required
            >
              <option value="">Select a project</option>
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Task Name *
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.text}
              onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter task name"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Task Type
            </label>
            <select
              className="form-control"
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="task">Task</option>
              <option value="milestone">Milestone</option>
              <option value="summary">Summary (Parent)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                Start Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                End Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.endDate}
                onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={e => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Notes
            </label>
            <textarea
              className="form-control"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this task"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving || !formData.text.trim() || !formData.projectId}
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Add Milestone Modal - Simplified form for creating milestones
 */
function AddMilestoneModal({ projects, selectedProjectId, onClose, onMilestoneCreated }) {
  const [formData, setFormData] = useState({
    projectId: selectedProjectId || (projects[0]?.projectId || ''),
    text: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim() || !formData.projectId) return;

    setSaving(true);
    setError(null);

    try {
      const milestoneDate = new Date(formData.date).toISOString();
      const newMilestone = await createTask({
        projectId: formData.projectId,
        text: formData.text,
        type: 'milestone',
        startDate: milestoneDate,
        endDate: milestoneDate,
        duration: 0,
        progress: 0,
        notes: formData.notes,
      });
      onMilestoneCreated(newMilestone);
    } catch (err) {
      console.error('Error creating milestone:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        className="card" 
        style={{ 
          width: '90%', 
          maxWidth: '450px', 
          maxHeight: '90vh', 
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#8a2be2' }}>◆</span> Add Milestone
          </h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#dc3545',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Project *
            </label>
            <select
              className="form-control"
              value={formData.projectId}
              onChange={e => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              required
            >
              <option value="">Select a project</option>
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Milestone Name *
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.text}
              onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="e.g., MVP Launch, Beta Release, Sprint Review"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Target Date *
            </label>
            <input
              type="date"
              className="form-control"
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Notes
            </label>
            <textarea
              className="form-control"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional details about this milestone"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving || !formData.text.trim() || !formData.projectId}
              style={{ background: '#8a2be2', borderColor: '#8a2be2' }}
            >
              {saving ? 'Creating...' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Edit Task Modal - For editing existing tasks
 */
function EditTaskModal({ task, projects, allTasks, links, onClose, onTaskUpdated, onTaskDeleted }) {
  const [formData, setFormData] = useState({
    projectId: task.projectId || '',
    text: task.text || '',
    type: task.type || 'task',
    startDate: task.start ? task.start.toISOString().split('T')[0] : '',
    endDate: task.end ? task.end.toISOString().split('T')[0] : '',
    progress: task.progress || 0,
    notes: task.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get incoming and outgoing dependencies
  const incomingDeps = links.filter(l => l.target === task.id);
  const outgoingDeps = links.filter(l => l.source === task.id);

  const getTaskName = (taskId) => {
    const t = allTasks.find(at => at.id === taskId);
    return t ? t.text : 'Unknown';
  };

  const getLinkTypeName = (type) => {
    const types = {
      'e2s': 'Finish → Start',
      's2s': 'Start → Start',
      'e2e': 'Finish → Finish',
      's2e': 'Start → Finish',
    };
    return types[type] || type;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await updateTask(task.id, {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        duration: Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)),
      });
      onTaskUpdated(updated);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteTask(task.id);
      onTaskDeleted(task.id);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        className="card" 
        style={{ 
          width: '90%', 
          maxWidth: '500px', 
          maxHeight: '90vh', 
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Edit Task</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#dc3545',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Project
            </label>
            <select
              className="form-control"
              value={formData.projectId}
              onChange={e => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Task Name *
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.text}
              onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter task name"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Task Type
            </label>
            <select
              className="form-control"
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="task">Task</option>
              <option value="milestone">Milestone</option>
              <option value="summary">Summary (Parent)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                Start Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                End Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.endDate}
                onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={e => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Notes
            </label>
            <textarea
              className="form-control"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this task"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Dependencies Section */}
          {(incomingDeps.length > 0 || outgoingDeps.length > 0) && (
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px', 
              background: 'var(--color-bg-tertiary)', 
              borderRadius: '8px' 
            }}>
              <label style={{ display: 'block', marginBottom: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Dependencies
              </label>
              
              {/* Incoming dependencies (this task depends on) */}
              {incomingDeps.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    This task depends on:
                  </div>
                  {incomingDeps.map(dep => (
                    <div key={dep.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '6px 10px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: 'var(--color-accent-primary)' }}>←</span>
                      <span style={{ flex: 1, color: 'var(--color-text-primary)' }}>
                        {getTaskName(dep.source)}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px', 
                        background: 'var(--color-bg-tertiary)', 
                        borderRadius: '3px',
                        color: 'var(--color-text-muted)',
                      }}>
                        {getLinkTypeName(dep.type)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Outgoing dependencies (other tasks depend on this) */}
              {outgoingDeps.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    Tasks that depend on this:
                  </div>
                  {outgoingDeps.map(dep => (
                    <div key={dep.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '6px 10px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: '#28a745' }}>→</span>
                      <span style={{ flex: 1, color: 'var(--color-text-primary)' }}>
                        {getTaskName(dep.target)}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px', 
                        background: 'var(--color-bg-tertiary)', 
                        borderRadius: '3px',
                        color: 'var(--color-text-muted)',
                      }}>
                        {getLinkTypeName(dep.type)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
                Tip: Drag between task bars in the Gantt chart to add dependencies
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm ? (
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <p style={{ margin: '0 0 12px', color: '#dc3545' }}>
                Are you sure you want to delete this task? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ background: '#dc3545', color: 'white' }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setShowDeleteConfirm(true)}
                style={{ background: 'transparent', color: '#dc3545', border: '1px solid #dc3545' }}
              >
                Delete Task
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving || !formData.text.trim()}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/**
 * Jira Tab - Synchronization status and controls
 * ACRM-27: Jira API Integration
 */
function JiraTab() {
  const [connectionStatus, setConnectionStatus] = useState({ loading: true, connected: false, user: null, error: null });
  const [jiraProjects, setJiraProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectIssues, setProjectIssues] = useState({ issues: [], total: 0, statusCounts: {} });
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Test Jira connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await jiraApi.testConnection();
        setConnectionStatus({
          loading: false,
          connected: result.connected,
          user: result.user,
          error: null
        });
        
        if (result.connected) {
          // Load Jira projects
          const projectsResult = await jiraApi.listProjects();
          setJiraProjects(projectsResult.projects || []);
        }
      } catch (err) {
        setConnectionStatus({
          loading: false,
          connected: false,
          user: null,
          error: err.message
        });
      }
    };
    testConnection();
  }, []);

  // Load issues when a project is selected
  const loadProjectIssues = async (projectKey) => {
    setLoadingIssues(true);
    try {
      const result = await jiraApi.getProjectIssues(projectKey, { maxResults: 50 });
      setProjectIssues(result);
    } catch (err) {
      console.error('Error loading issues:', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    loadProjectIssues(project.key);
  };

  const handleRefresh = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    try {
      const result = await jiraApi.testConnection();
      setConnectionStatus({
        loading: false,
        connected: result.connected,
        user: result.user,
        error: null
      });
      
      if (result.connected) {
        const projectsResult = await jiraApi.listProjects();
        setJiraProjects(projectsResult.projects || []);
        
        if (selectedProject) {
          loadProjectIssues(selectedProject.key);
        }
      }
    } catch (err) {
      setConnectionStatus({
        loading: false,
        connected: false,
        user: null,
        error: err.message
      });
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Jira Integration</h2>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={connectionStatus.loading}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '6px' }}>
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
          {connectionStatus.loading ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Connection Status */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0052CC 0%, #2684FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            J
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Jira Cloud
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {connectionStatus.user?.emailAddress || 'gouriertradingproject.atlassian.net'}
            </div>
          </div>
          <div style={{ 
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: connectionStatus.loading 
              ? 'var(--color-text-muted)' 
              : connectionStatus.connected 
                ? 'var(--color-accent-success)' 
                : 'var(--color-danger)',
            fontSize: '13px'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: connectionStatus.loading 
                ? 'var(--color-text-muted)' 
                : connectionStatus.connected 
                  ? 'var(--color-accent-success)' 
                  : 'var(--color-danger)'
            }} />
            {connectionStatus.loading ? 'Checking...' : connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        {connectionStatus.error && (
          <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,0,0,0.1)', borderRadius: '4px', color: 'var(--color-danger)', fontSize: '13px' }}>
            Error: {connectionStatus.error}
          </div>
        )}
      </div>

      {/* Jira Projects Grid */}
      <h3 style={{ 
        color: 'var(--color-text-primary)', 
        marginBottom: '16px',
        fontSize: '16px'
      }}>
        Jira Projects ({jiraProjects.length})
      </h3>
      
      {jiraProjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            {connectionStatus.loading ? 'Loading projects...' : 'No Jira projects found.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {jiraProjects.map(project => (
            <div 
              key={project.id} 
              className="card" 
              onClick={() => handleProjectSelect(project)}
              style={{ 
                cursor: 'pointer', 
                border: selectedProject?.key === project.key ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {project.avatarUrl && (
                  <img src={project.avatarUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
                )}
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{project.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{project.key}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Project Issues */}
      {selectedProject && (
        <>
          <h3 style={{ 
            color: 'var(--color-text-primary)', 
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            {selectedProject.name} Issues ({projectIssues.total})
          </h3>

          {/* Status counts */}
          {Object.keys(projectIssues.statusCounts).length > 0 && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {Object.entries(projectIssues.statusCounts).map(([status, count]) => (
                <div key={status} className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: status === 'Done' ? 'var(--color-accent-success)' : status === 'In Progress' ? 'var(--color-accent-warning)' : 'var(--color-text-muted)'
                  }} />
                  <span style={{ fontSize: '13px' }}>{status}: <strong>{count}</strong></span>
                </div>
              ))}
            </div>
          )}

          {/* Issues table */}
          <div className="card" style={{ overflow: 'auto' }}>
            {loadingIssues ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>Loading issues...</p>
            ) : projectIssues.issues.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>No issues found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '13px' }}>Key</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '13px' }}>Summary</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '13px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '13px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '13px' }}>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {projectIssues.issues.map(issue => (
                    <tr key={issue.key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <a 
                          href={`https://gouriertradingproject.atlassian.net/browse/${issue.key}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-accent-primary)', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {issue.key}
                        </a>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--color-text-primary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.summary}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{issue.issueType}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: issue.statusCategory === 'Done' ? 'rgba(0,200,83,0.15)' : issue.statusCategory === 'In Progress' ? 'rgba(255,171,0,0.15)' : 'rgba(128,128,128,0.15)',
                          color: issue.statusCategory === 'Done' ? 'var(--color-accent-success)' : issue.statusCategory === 'In Progress' ? 'var(--color-accent-warning)' : 'var(--color-text-secondary)'
                        }}>
                          {issue.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{issue.assignee || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CrmDashboard;
