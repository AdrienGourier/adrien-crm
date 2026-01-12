# Adrien CRM

Personal CRM system for project management, idea capture, and Gantt chart visualization.

## Features

- **Project Management**: Kanban board with IDEA → TODO → IN_PROGRESS → DONE workflow
- **Ideas/Prompts**: Capture and convert ideas to projects
- **Gantt Chart**: Professional timeline visualization with:
  - Drag-and-drop task scheduling
  - Task dependencies (4 types: FS, SS, FF, SF)
  - Milestones
  - Filtering and export (CSV/JSON)
- **Jira Integration**: Sync projects with Jira tickets

## Tech Stack

- **Frontend**: React 18, SVAR React Gantt
- **Backend**: AWS Lambda (Python), API Gateway
- **Database**: DynamoDB
- **Auth**: AWS Cognito (integrated with adriengourier.com)

## Access

Accessible at `https://adriengourier.com/crm` for admin users only.

## Deployment

```bash
# Backend
cd backend
sam build && sam deploy

# Frontend
cd frontend
npm run build
aws s3 sync build s3://adrien-portfolio-website-XXXXX/crm
```
