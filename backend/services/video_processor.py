"""
Video processing service that extracts frames and performs OCR.
This keeps the old screenshot functionality intact.
"""
import os
import cv2
from datetime import datetime
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class VideoProcessor:
    """Process video files by extracting frames and running OCR."""
    
    def __init__(self, config=None):
        self.config = config
        
    def extract_frames_from_video(
        self, 
        video_path: str, 
        output_dir: str,
        interval_seconds: int = 30
    ) -> List[str]:
        """
        Extract frames from video at specified intervals.
        
        Args:
            video_path: Path to the video file
            output_dir: Directory to save extracted frames
            interval_seconds: Interval between frame extractions (default 30 seconds)
            
        Returns:
            List of paths to extracted frame images
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
            
        frame_paths = []
        
        try:
            # Open video file
            video = cv2.VideoCapture(video_path)
            if not video.isOpened():
                logger.error(f"Could not open video: {video_path}")
                return frame_paths
            
            # Get video properties
            fps = video.get(cv2.CAP_PROP_FPS)
            total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            logger.info(f"Video FPS: {fps}, Total frames: {total_frames}, Duration: {duration}s")
            
            # Calculate frame interval
            frame_interval = int(fps * interval_seconds)
            
            frame_count = 0
            extracted_count = 0
            
            while True:
                ret, frame = video.read()
                if not ret:
                    break
                
                # Extract frame at intervals
                if frame_count % frame_interval == 0:
                    timestamp = frame_count / fps
                    frame_filename = f"frame_{extracted_count:04d}_t{int(timestamp)}s.jpg"
                    frame_path = os.path.join(output_dir, frame_filename)
                    
                    cv2.imwrite(frame_path, frame)
                    frame_paths.append(frame_path)
                    extracted_count += 1
                    logger.debug(f"Extracted frame at {timestamp}s: {frame_path}")
                
                frame_count += 1
            
            video.release()
            logger.info(f"Extracted {extracted_count} frames from video")
            
        except Exception as e:
            logger.exception(f"Error extracting frames from video: {e}")
            
        return frame_paths
    
    def process_video_with_ocr(
        self,
        video_path: str,
        output_dir: str,
        interval_seconds: int = 30,
        store: bool = True
    ) -> Dict[str, Any]:
        """
        Process video by extracting frames and running OCR on each.
        
        Args:
            video_path: Path to video file
            output_dir: Directory for extracted frames
            interval_seconds: Seconds between frame extractions
            store: Whether to keep extracted frames
            
        Returns:
            Dictionary with extracted text and frame info
        """
        timestamp = datetime.now()
        
        # Extract frames
        frame_paths = self.extract_frames_from_video(
            video_path, 
            output_dir, 
            interval_seconds
        )
        
        if not frame_paths:
            return {
                'timestamp': timestamp,
                'frame_count': 0,
                'extracted_texts': [],
                'combined_text': '',
                'error': 'No frames extracted'
            }
        
        # Run OCR on each frame
        extracted_texts = []
        
        try:
            # Lazy import OCR
            from Nexa.services.nexy_rep.ocr import extract_text_from_image
            
            for frame_path in frame_paths:
                try:
                    text = extract_text_from_image(frame_path)
                    if text.strip():
                        extracted_texts.append({
                            'frame_path': frame_path,
                            'text': text
                        })
                except Exception as e:
                    logger.error(f"OCR failed for frame {frame_path}: {e}")
                    
                # Clean up frame if not storing
                if not store and os.path.exists(frame_path):
                    os.remove(frame_path)
                    
        except Exception as e:
            logger.exception(f"OCR processing failed: {e}")
            return {
                'timestamp': timestamp,
                'frame_count': len(frame_paths),
                'extracted_texts': [],
                'combined_text': '',
                'error': f'OCR unavailable: {str(e)}'
            }
        
        # Combine all extracted text
        combined_text = "\n\n".join([item['text'] for item in extracted_texts])
        
        result = {
            'timestamp': timestamp,
            'frame_count': len(frame_paths),
            'extracted_texts': extracted_texts,
            'combined_text': combined_text,
            'frame_paths': frame_paths if store else []
        }
        
        return result


def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds."""
    try:
        video = cv2.VideoCapture(video_path)
        if not video.isOpened():
            return 0.0
        
        fps = video.get(cv2.CAP_PROP_FPS)
        total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0.0
        
        video.release()
        return duration
    except Exception as e:
        logger.error(f"Error getting video duration: {e}")
        return 0.0
