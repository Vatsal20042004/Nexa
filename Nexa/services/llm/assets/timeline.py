from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class Milestone(BaseModel):
    title: str = Field(..., description="Title of the milestone")
    due_date: date = Field(..., description="Deadline for the milestone")
    assigned_to: str = Field(..., description="Name of the employee responsible")
    status: str = Field(..., description="Current status of the milestone (e.g., completed, pending)")
    critical_comment: Optional[str] = Field(None, description="Any critical comment related to this milestone")

class EmployeeSummary(BaseModel):
    name: str = Field(..., description="Full name of the employee")
    role: str = Field(..., description="Role or designation of the employee")
    strengths: List[str] = Field(..., description="List of strengths")
    weaknesses: List[str] = Field(..., description="List of weaknesses")
    critical_comment: Optional[str] = Field(None, description="Critical feedback or comment")
    last_milestone: Optional[str] = Field(None, description="Most recent milestone completed")
    comments: Optional[str] = Field(None, description="General comments or notes")

class ProjectTimelineOutput(BaseModel):
    project_name: str = Field(..., description="Name of the project")
    timeline_image_path: str = Field(..., description="Path to the saved timeline chart image")
    milestones: List[Milestone] = Field(..., description="List of project milestones")
    employee_summaries: List[EmployeeSummary] = Field(..., description="List of employee summaries")