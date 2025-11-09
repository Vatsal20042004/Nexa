"""
Pydantic models for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class UserRole(str, Enum):
    EMPLOYEE = "employee"
    TEAM_LEADER = "team_leader"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    PROCESSED = "processed"


class UploadType(str, Enum):
    MORNING = "morning"
    EVENING = "evening"
    GENERAL = "general"


# ============= Auth Models =============
class UserRegister(BaseModel):
    username: str
    password: str
    name: str
    role: UserRole


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    role: str
    work_hours: Optional[str] = "09:00-17:00"
    comments: Optional[str] = None
    created_at: datetime


class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse] = None
    session_token: Optional[str] = None


# ============= Daily Session Models =============
class DailySessionCreate(BaseModel):
    date: date
    github_username: Optional[str] = None
    github_repo: Optional[str] = None


class DailySessionResponse(BaseModel):
    id: int
    user_id: int
    date: date
    status: str
    github_username: Optional[str] = None
    github_repo: Optional[str] = None
    created_at: datetime
    submitted_at: Optional[datetime] = None


# ============= Upload Models =============
class TranscriptUploadResponse(BaseModel):
    id: int
    filename: str
    upload_type: Optional[str]
    content_preview: str
    uploaded_at: datetime


class VideoUploadResponse(BaseModel):
    id: int
    filename: str
    duration_seconds: Optional[float]
    uploaded_at: datetime


class ScreenshotScheduleCreate(BaseModel):
    interval_minutes: int = Field(gt=0, le=60, description="Screenshot interval in minutes")
    duration_minutes: int = Field(gt=0, le=480, description="Total duration in minutes")


class ScreenshotScheduleResponse(BaseModel):
    id: int
    status: str
    interval_minutes: int
    duration_minutes: int
    started_at: datetime
    screenshots_count: int


# ============= Task Models =============
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    completed: Optional[bool] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: str
    status: str
    due_date: Optional[date]
    start_time: Optional[str] = None  # ISO datetime string
    end_time: Optional[str] = None    # ISO datetime string
    project_id: Optional[str] = None
    assignee: Optional[str] = None
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    session_id: int
    user_id: int


class GeneratedTasksResponse(BaseModel):
    """Response from LLM task generation."""
    tasks: List[TaskResponse]
    session_id: int
    generated_at: datetime
    total_count: int


# ============= Chat Models =============
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: datetime


# ============= Settings Models =============
class UserSettingsUpdate(BaseModel):
    work_hours: Optional[str] = None
    comments: Optional[str] = None
    name: Optional[str] = None


# ============= Calendar Models =============
class CalendarView(str, Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class CalendarRequest(BaseModel):
    view: CalendarView
    date: date


class CalendarResponse(BaseModel):
    view: str
    start_date: date
    end_date: date
    tasks: List[TaskResponse]


# ============= LLM Task Generation Models =============
class LLMGeneratedTask(BaseModel):
    """Single task from LLM generation."""
    title: str
    description: str
    priority: TaskPriority
    estimated_hours: Optional[float] = None
    dependencies: Optional[List[str]] = None


class LLMTaskGenerationResult(BaseModel):
    """Result from LLM task generation (Pydantic format)."""
    tasks: List[LLMGeneratedTask]
    summary: str
    total_estimated_hours: Optional[float] = None
    notes: Optional[str] = None


# ============= Process Session Models =============
class ProcessSessionRequest(BaseModel):
    """Request to process a daily session and generate tasks."""
    session_id: int
    custom_instructions: Optional[str] = None


class ProcessSessionResponse(BaseModel):
    success: bool
    message: str
    tasks_generated: int
    tasks: List[TaskResponse]
    llm_summary: Optional[str] = None


# ============= Team Leader Models =============
class TeamMemberActivity(BaseModel):
    user_id: int
    username: str
    name: str
    date: date
    session_status: str
    tasks_count: int
    completed_tasks: int


class TeamOverviewResponse(BaseModel):
    team_members: List[TeamMemberActivity]
    total_members: int
    date: date


# ============= Project Models =============
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    lead_user_id: Optional[int] = None
    deadline: Optional[date] = None
    color: Optional[str] = "#3B82F6"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    lead_user_id: Optional[int] = None
    deadline: Optional[date] = None
    color: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    lead_user_id: Optional[int]
    deadline: Optional[date]
    color: str
    created_at: datetime
    updated_at: datetime


# ============= Announcement Models =============
class AnnouncementType(str, Enum):
    TASK_ASSIGNED = "task_assigned"
    GENERAL = "general"


class AnnouncementCreate(BaseModel):
    project_id: Optional[int] = None
    title: str
    body: str
    type: AnnouncementType = AnnouncementType.GENERAL


class AnnouncementResponse(BaseModel):
    id: int
    project_id: Optional[int]
    title: str
    body: str
    from_user_id: int
    type: str
    created_at: datetime


# ============= Team Leader New Models =============
class TeamMemberCreate(BaseModel):
    member_user_id: int
    role: Optional[str] = None
    email: Optional[str] = None


class TeamMemberResponse(BaseModel):
    id: int
    team_leader_id: int
    member_user_id: int
    name: str
    username: str
    role: Optional[str]
    email: Optional[str]
    added_at: datetime


class TeamMemberContextCreate(BaseModel):
    member_user_id: int
    context_type: str
    title: str
    content: str
    file_path: Optional[str] = None
    metadata: Optional[str] = None


class TeamLeaderChatRequest(BaseModel):
    message: str
    mentioned_members: List[int] = []
    response_mode: str = "precise"
    session_id: Optional[str] = None


class TeamLeaderChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: datetime


class TimelineChartRequest(BaseModel):
    project_name: str
    documents: List[str]  # File paths or text content
    selected_member_ids: List[int]
    text_input: Optional[str] = None


class Milestone(BaseModel):
    title: str
    due_date: date
    assigned_to: str
    status: str
    critical_comment: Optional[str] = None


class EmployeeSummary(BaseModel):
    name: str
    role: str
    strengths: List[str]
    weaknesses: List[str]
    critical_comment: Optional[str] = None
    last_milestone: Optional[str] = None
    comments: Optional[str] = None


class TimelineChartResponse(BaseModel):
    project_name: str
    image_path: str
    image_base64: Optional[str] = None
    summary_text: str
    milestones: List[Milestone]
    employee_summaries: List[EmployeeSummary]
    created_at: datetime

