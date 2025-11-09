"""
Projects API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from backend.models.database import db
from backend.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=List[ProjectResponse])
async def list_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    projects = cursor.fetchall()
    conn.close()
    
    return [ProjectResponse(**dict(project)) for project in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a single project by ID."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    project = cursor.fetchone()
    conn.close()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(**dict(project))


@router.post("", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new project."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO projects (name, description, lead_user_id, deadline, color)
        VALUES (?, ?, ?, ?, ?)
    """, (
        project.name,
        project.description,
        project.lead_user_id,
        project.deadline,
        project.color
    ))
    
    project_id = cursor.lastrowid
    conn.commit()
    
    # Fetch the created project
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    created_project = cursor.fetchone()
    conn.close()
    
    db.log_audit(
        current_user['id'],
        "PROJECT_CREATED",
        "projects",
        project_id,
        f"Created project: {project.name}"
    )
    
    return ProjectResponse(**dict(created_project))


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    update_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a project."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Check if project exists
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    project = cursor.fetchone()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build update query dynamically
    updates = []
    params = []
    
    if update_data.name is not None:
        updates.append("name = ?")
        params.append(update_data.name)
    
    if update_data.description is not None:
        updates.append("description = ?")
        params.append(update_data.description)
    
    if update_data.lead_user_id is not None:
        updates.append("lead_user_id = ?")
        params.append(update_data.lead_user_id)
    
    if update_data.deadline is not None:
        updates.append("deadline = ?")
        params.append(update_data.deadline)
    
    if update_data.color is not None:
        updates.append("color = ?")
        params.append(update_data.color)
    
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(project_id)
        
        query = f"UPDATE projects SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()
    
    # Fetch updated project
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    updated_project = cursor.fetchone()
    conn.close()
    
    db.log_audit(
        current_user['id'],
        "PROJECT_UPDATED",
        "projects",
        project_id,
        "Project updated"
    )
    
    return ProjectResponse(**dict(updated_project))


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a project."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    conn.commit()
    conn.close()
    
    db.log_audit(
        current_user['id'],
        "PROJECT_DELETED",
        "projects",
        project_id,
        "Project deleted"
    )
    
    return {"success": True, "message": "Project deleted"}

