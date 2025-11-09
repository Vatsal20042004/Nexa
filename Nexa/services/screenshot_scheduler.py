"""
Scheduled screenshot capture module.
"""
import os
import time
import threading
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable
import logging


class ScheduledScreenshotCapture:
    """
    Manages scheduled screenshot capture with configurable intervals.
    """
    
    def __init__(self, screenshot_callback: Callable, storage_callback: Optional[Callable] = None):
        """
        Initialize the scheduled screenshot capture.
        
        Args:
            screenshot_callback: Function to call for taking screenshots.
                Should accept (output_path: str) and return extracted text.
            storage_callback: Optional function to call after each screenshot.
                Should accept (screenshot_session_id, image_path, extracted_text).
        """
        self.screenshot_callback = screenshot_callback
        self.storage_callback = storage_callback
        self.active_sessions: Dict[int, Dict[str, Any]] = {}
        self._lock = threading.Lock()
    
    def start_session(
        self,
        screenshot_session_id: int,
        output_dir: str,
        interval_minutes: int,
        duration_minutes: Optional[int] = None
    ):
        """
        Start a scheduled screenshot capture session.
        
        Args:
            screenshot_session_id: Unique ID for this screenshot session
            output_dir: Directory to save screenshots
            interval_minutes: Interval between screenshots in minutes
            duration_minutes: Total duration in minutes (None = infinite)
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        with self._lock:
            if screenshot_session_id in self.active_sessions:
                logging.warning(f"Screenshot session {screenshot_session_id} already active")
                return
            
            # Calculate end time if duration is specified
            end_time = None
            if duration_minutes:
                end_time = datetime.now() + timedelta(minutes=duration_minutes)
            
            # Create session info
            session_info = {
                "screenshot_session_id": screenshot_session_id,
                "output_dir": output_dir,
                "interval_minutes": interval_minutes,
                "duration_minutes": duration_minutes,
                "end_time": end_time,
                "stop_flag": False,
                "thread": None
            }
            
            # Start capture thread
            thread = threading.Thread(
                target=self._capture_loop,
                args=(session_info,),
                daemon=True
            )
            session_info["thread"] = thread
            self.active_sessions[screenshot_session_id] = session_info
            thread.start()
            
            logging.info(f"Started screenshot session {screenshot_session_id} "
                        f"with interval={interval_minutes}min, duration={duration_minutes}min")
    
    def stop_session(self, screenshot_session_id: int):
        """
        Stop a scheduled screenshot capture session.
        
        Args:
            screenshot_session_id: ID of the session to stop
        """
        with self._lock:
            if screenshot_session_id not in self.active_sessions:
                logging.warning(f"Screenshot session {screenshot_session_id} not found")
                return
            
            session_info = self.active_sessions[screenshot_session_id]
            session_info["stop_flag"] = True
            
            logging.info(f"Stopping screenshot session {screenshot_session_id}")
    
    def _capture_loop(self, session_info: Dict[str, Any]):
        """
        Main loop for capturing screenshots at intervals.
        
        Args:
            session_info: Dictionary containing session configuration
        """
        screenshot_session_id = session_info["screenshot_session_id"]
        output_dir = session_info["output_dir"]
        interval_seconds = session_info["interval_minutes"] * 60
        end_time = session_info["end_time"]
        
        screenshot_count = 0
        
        while not session_info["stop_flag"]:
            # Check if duration expired
            if end_time and datetime.now() >= end_time:
                logging.info(f"Screenshot session {screenshot_session_id} duration expired")
                break
            
            try:
                # Take screenshot
                timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                screenshot_filename = f"screenshot_{screenshot_count:04d}_{timestamp_str}.png"
                screenshot_path = os.path.join(output_dir, screenshot_filename)
                
                # Call screenshot callback
                extracted_text = self.screenshot_callback(screenshot_path)
                
                # Call storage callback if provided
                if self.storage_callback:
                    self.storage_callback(screenshot_session_id, screenshot_path, extracted_text)
                
                screenshot_count += 1
                logging.info(f"Captured screenshot {screenshot_count} for session {screenshot_session_id}")
                
            except Exception as e:
                logging.exception(f"Error capturing screenshot: {e}")
            
            # Wait for next interval
            time.sleep(interval_seconds)
        
        # Clean up session
        with self._lock:
            if screenshot_session_id in self.active_sessions:
                del self.active_sessions[screenshot_session_id]
        
        logging.info(f"Screenshot session {screenshot_session_id} completed with {screenshot_count} screenshots")
    
    def is_session_active(self, screenshot_session_id: int) -> bool:
        """Check if a screenshot session is currently active."""
        with self._lock:
            return screenshot_session_id in self.active_sessions
    
    def get_active_sessions(self) -> list:
        """Get list of active screenshot session IDs."""
        with self._lock:
            return list(self.active_sessions.keys())
