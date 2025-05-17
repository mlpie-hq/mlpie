"""
Logging utilities for the MLPie platform.

This module provides professional, colorful and well-structured logging for MLPie.
"""

import logging
import sys
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional

# ANSI color codes
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"
    
    # Foreground colors
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    
    # Bright foreground colors
    BRIGHT_BLACK = "\033[90m"
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"
    
    # Background colors
    BG_BLACK = "\033[40m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_YELLOW = "\033[43m"
    BG_BLUE = "\033[44m"
    BG_MAGENTA = "\033[45m"
    BG_CYAN = "\033[46m"
    BG_WHITE = "\033[47m"

    @staticmethod
    def should_use_colors() -> bool:
        """Determine if we should use colors based on environment and terminal."""
        # Check NO_COLOR environment variable (standard for disabling color)
        if os.environ.get("NO_COLOR") is not None:
            return False
            
        # Check if output is redirected
        if not sys.stdout.isatty():
            return False
            
        # Check for known color-supporting environment variables
        term = os.environ.get("TERM", "").lower()
        if term in ("xterm", "xterm-color", "xterm-256color", "screen", "screen-256color", "tmux", "tmux-256color"):
            return True
            
        # Force colors with environment variable
        if os.environ.get("FORCE_COLOR") is not None:
            return True
            
        return False

# Emojis for different log levels and actions
class Emojis:
    # Log level indicators
    DEBUG = "🔍 "
    WARNING = "⚠️ "
    ERROR = "❌ "
    CRITICAL = "🔥 "
    INFO = ""  # No emoji for standard info messages
    
    # Status indicators
    SUCCESS = "✅ "
    FAILURE = "❗ "
    
    # Operation types
    INIT = "🚀 "
    START = "▶️ "
    END = "⏹️ "
    
    # Data/Entity types
    DATABASE = "💾 "
    CONFIG = "⚙️ "
    PIPELINE = "🔄 "
    PROJECT = "📁 "
    DATASET = "📊 "
    ENVIRONMENT = "🌐 "
    JOB = "⚙️ "
    
    # System components
    SCHEDULER = "⏰ "
    PLUGINS = "🔌 "
    SECRETS = "🔒 "
    
    # Operations
    SCANNING = "🔎 "
    SYNC = "🔄 "
    VALIDATION = "✓ "
    ERROR_VALIDATION = "✗ "
    CREATE = "➕ "
    UPDATE = "🔄 "
    DELETE = "🗑️ "
    
    # Git operations
    GIT_CLONE = "📥 "
    GIT_PULL = "⬇️ "
    GIT_PUSH = "⬆️ "
    GIT_COMMIT = "📝 "
    REPOSITORY = "📦 "
    
    # ML operations
    TRAINING = "🧠 "
    INFERENCE = "🔮 "
    EVALUATION = "📊 "
    
    # Data operations
    DATA_LOADING = "📥 "
    DATA_TRANSFORMATION = "🔄 "
    DATA_VALIDATION = "✓ "

class PrettyFormatter(logging.Formatter):
    """
    A pretty logging formatter with colors, emojis and visual structures.
    """
    
    def __init__(self, use_colors: bool = True):
        """
        Initialize the formatter.
        
        Args:
            use_colors: Whether to use colors in formatting
        """
        super().__init__()
        self.use_colors = use_colors and Colors.should_use_colors()
        
        # Level to color mapping
        self.level_colors = {
            logging.DEBUG: Colors.CYAN,
            logging.INFO: Colors.GREEN,
            logging.WARNING: Colors.YELLOW,
            logging.ERROR: Colors.RED,
            logging.CRITICAL: Colors.BRIGHT_RED + Colors.BOLD
        }
        
        # Level to emoji mapping - only use emoji for non-INFO levels
        self.level_emojis = {
            logging.DEBUG: Emojis.DEBUG,
            logging.INFO: Emojis.INFO,  # Now empty string
            logging.WARNING: Emojis.WARNING,
            logging.ERROR: Emojis.ERROR,
            logging.CRITICAL: Emojis.CRITICAL
        }
        
        # Track section depth for indentation
        self.section_depth = 0
        self.section_start_times = {}
        
    def apply_color(self, text: str, color: str) -> str:
        """Apply color to text if colors are enabled."""
        if self.use_colors:
            return f"{color}{text}{Colors.RESET}"
        return text
    
    def _colorize_level(self, levelname: str, level: int) -> str:
        """Colorize the level name based on its severity."""
        color = self.level_colors.get(level, Colors.RESET)
        emoji = self.level_emojis.get(level, "")
        
        # Make all level names same width for alignment
        levelname = f"{levelname:8}"
        
        return f"{emoji}{self.apply_color(levelname, color)}"
    
    def formatTime(self, record, datefmt=None):
        """Format the time with milliseconds."""
        if datefmt:
            return datetime.fromtimestamp(record.created).strftime(datefmt)
        else:
            return datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    
    def format(self, record):
        """Format the log record with colors and structure."""
        # Format the timestamp
        timestamp = self.formatTime(record)
        timestamp_str = self.apply_color(timestamp, Colors.DIM)
        
        # Format the level
        level_str = self._colorize_level(record.levelname, record.levelno)
        
        # Format the logger name
        logger_name = record.name
        if "." in logger_name:
            # Abbreviate long module paths
            parts = logger_name.split(".")
            if len(parts) > 2:
                logger_name = ".".join([p[0] for p in parts[:-2]] + parts[-2:])
        
        logger_str = self.apply_color(f"{logger_name:25}", Colors.BRIGHT_BLUE)
        
        # Process the message
        message = record.getMessage()
        
        # Special formatting for section headers
        if message.startswith("=====") and message.endswith("====="):
            # It's a section header
            title = message.strip("= ")
            box_width = len(title) + 8
            
            # Create a box around the section title
            box_top = self.apply_color("┌" + "─" * (box_width - 2) + "┐", Colors.BRIGHT_WHITE)
            box_bottom = self.apply_color("└" + "─" * (box_width - 2) + "┘", Colors.BRIGHT_WHITE)
            title_line = self.apply_color(f"│  {title}  │", Colors.BRIGHT_WHITE)
            
            # Use the name of the section to find appropriate emoji
            emoji = ""
            if "plugin" in title.lower():
                emoji = Emojis.PLUGINS
            elif "secret" in title.lower():
                emoji = Emojis.SECRETS
            elif "database" in title.lower():
                emoji = Emojis.DATABASE
            elif "config" in title.lower():
                emoji = Emojis.CONFIG
            elif "project" in title.lower():
                emoji = Emojis.PROJECT
            elif "pipeline" in title.lower():
                emoji = Emojis.PIPELINE
            elif "dataset" in title.lower():
                emoji = Emojis.DATASET
            elif "environment" in title.lower():
                emoji = Emojis.ENVIRONMENT
            elif "repository" in title.lower() or "git" in title.lower():
                emoji = Emojis.REPOSITORY
            elif "scan" in title.lower():
                emoji = Emojis.SCANNING
            elif "sync" in title.lower():
                emoji = Emojis.SYNC
            elif "job" in title.lower():
                emoji = Emojis.JOB
            elif "training" in title.lower():
                emoji = Emojis.TRAINING
            elif "inference" in title.lower():
                emoji = Emojis.INFERENCE
            elif "evaluation" in title.lower():
                emoji = Emojis.EVALUATION
            
            # Format the final message
            formatted_message = f"\n{timestamp_str} {level_str} {logger_str} {box_top}\n"
            formatted_message += f"{timestamp_str} {level_str} {logger_str} {title_line} {emoji}\n"
            formatted_message += f"{timestamp_str} {level_str} {logger_str} {box_bottom}"
            
            # Store section start time
            self.section_start_times[title] = time.time()
            return formatted_message
        
        # Check for section completion or success messages
        elif "initialized successfully" in message.lower() or "completed successfully" in message.lower():
            # Find section name
            section_name = None
            for key in self.section_start_times.keys():
                if key.lower() in message.lower():
                    section_name = key
                    break
            
            # Calculate duration if we have a start time
            duration_info = ""
            if section_name and section_name in self.section_start_times:
                duration = time.time() - self.section_start_times[section_name]
                duration_info = self.apply_color(f" (completed in {duration:.2f}s)", Colors.DIM)
                del self.section_start_times[section_name]
            
            # Format success message
            message = self.apply_color(f"{Emojis.SUCCESS} {message}{duration_info}", Colors.BRIGHT_GREEN)
        
        # Detect standard initialization messages
        elif message.startswith("Initializing"):
            message = f"{Emojis.INIT} {self.apply_color(message, Colors.BRIGHT_CYAN)}"
        
        # Detect validation errors
        elif "validation error" in message.lower():
            message = f"{Emojis.ERROR_VALIDATION} {self.apply_color(message, Colors.BRIGHT_RED)}"
        
        # Detect general failure messages
        elif "failed" in message.lower() or "error" in message.lower():
            if record.levelno >= logging.ERROR:
                message = f"{Emojis.FAILURE} {message}"
        
        # Detect create/update/delete operations
        elif "creating" in message.lower() or "created" in message.lower():
            message = f"{Emojis.CREATE} {message}"
        elif "updating" in message.lower() or "updated" in message.lower():
            message = f"{Emojis.UPDATE} {message}"
        elif "deleting" in message.lower() or "deleted" in message.lower():
            message = f"{Emojis.DELETE} {message}"
        
        # Detect Git operations
        elif "cloning" in message.lower() or "cloned" in message.lower():
            message = f"{Emojis.GIT_CLONE} {message}"
        elif "pulling" in message.lower() or "pulled" in message.lower():
            message = f"{Emojis.GIT_PULL} {message}"
        elif "pushing" in message.lower() or "pushed" in message.lower():
            message = f"{Emojis.GIT_PUSH} {message}"
        elif "commit" in message.lower():
            message = f"{Emojis.GIT_COMMIT} {message}"
        
        # Detect scanning messages
        elif "scanning" in message.lower() and any(entity in message.lower() for entity in ["repository", "project", "dataset", "pipeline"]):
            message = f"{Emojis.SCANNING} {message}"
        
        # Detect synchronization messages
        elif "syncing" in message.lower() or "synchronizing" in message.lower():
            message = f"{Emojis.SYNC} {message}"
        
        # Entity-specific messages - use more precise detection
        elif any(term in message.lower() for term in [" pipeline ", "pipeline:", "pipelines "]):
            if not any(skip in message.lower() for skip in ["scanning", "initializing"]):
                message = f"{Emojis.PIPELINE} {message}"
        elif any(term in message.lower() for term in [" project ", "project:", "projects "]):
            if not any(skip in message.lower() for skip in ["scanning", "initializing"]):
                message = f"{Emojis.PROJECT} {message}"
        elif any(term in message.lower() for term in [" dataset ", "dataset:", "datasets "]):
            if not any(skip in message.lower() for skip in ["scanning", "initializing"]):
                message = f"{Emojis.DATASET} {message}"
        elif any(term in message.lower() for term in [" environment ", "environment:", "environments "]):
            if not any(skip in message.lower() for skip in ["scanning", "initializing"]):
                message = f"{Emojis.ENVIRONMENT} {message}"
        elif any(term in message.lower() for term in [" job ", "job:", "jobs "]):
            if not any(skip in message.lower() for skip in ["scanning", "initializing"]):
                message = f"{Emojis.JOB} {message}"
        elif any(term in message.lower() for term in ["training ", "train:", "train "]):
            message = f"{Emojis.TRAINING} {message}"
        elif any(term in message.lower() for term in ["inference ", "predict:", "prediction "]):
            message = f"{Emojis.INFERENCE} {message}"
        elif any(term in message.lower() for term in ["evaluation ", "evaluate:", "metrics "]):
            message = f"{Emojis.EVALUATION} {message}"
        
        # Standard indentation for message
        indent = ""
        
        # Format the final message
        return f"{timestamp_str} {level_str} {logger_str} {indent}{message}"

class SectionLogger:
    """
    A logger that adds section management to a standard logger.
    """
    
    def __init__(self, logger):
        """
        Initialize the section logger with a standard logger.
        
        Args:
            logger: The standard logger to wrap
        """
        self.logger = logger
        self._sections = []
    
    def section(self, title: str, level: int = logging.INFO):
        """
        Start a new section in the logs.
        
        Args:
            title: The title of the section
            level: The logging level to use for the section
        """
        section_title = f"===== {title} ====="
        self.logger.log(level, section_title)
        self._sections.append(title)
        return self
    
    def end_section(self, success: bool = True, level: int = logging.INFO, title: str = None):
        """
        End the current section.
        
        Args:
            success: Whether the section completed successfully
            level: The logging level to use for the end marker
            title: The title of the section (if None, use the last section from the stack)
        """
        section_title = title
        
        # If no title provided, try to get it from the section stack
        if section_title is None and self._sections:
            section_title = self._sections.pop()
        
        # Log the section end message
        if section_title:
            if success:
                self.logger.log(level, f"{section_title} completed successfully")
            else:
                self.logger.log(logging.ERROR, f"{section_title} failed")
        else:
            # Generic message if no title is available
            if success:
                self.logger.log(level, "Operation completed successfully")
            else:
                self.logger.log(logging.ERROR, "Operation failed")
            
        return self
    
    def __getattr__(self, name):
        """Pass through any other attributes to the underlying logger."""
        return getattr(self.logger, name)


# Initialize our pretty formatter
pretty_formatter = PrettyFormatter(use_colors=True)

# Configure root logger
root_logger = logging.getLogger()
if not root_logger.handlers:
    # Add a handler to the root logger
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(pretty_formatter)
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

# Get the MLPie logger as a child of the root logger
mlpie_logger = logging.getLogger("mlpie")

# Monkeypatch the Logger class to add section methods to all loggers
def _section(self, title: str, level: int = logging.INFO):
    """Add section method to all loggers."""
    section_title = f"===== {title} ====="
    self.log(level, section_title)
    return self

def _end_section(self, success: bool = True, level: int = logging.INFO, title: str = None):
    """Add end_section method to all loggers."""
    if title is None:
        # Use a generic successful/failed message when no title is provided
        if success:
            self.log(level, "Operation completed successfully")
        else:
            self.log(logging.ERROR, "Operation failed")
    else:
        if success:
            self.log(level, f"{title} completed successfully")
        else:
            self.log(logging.ERROR, f"{title} failed")
    return self

# Monkey-patch the Logger class to add our section methods
logging.Logger.section = _section
logging.Logger.end_section = _end_section

# Create a wrapped version of the MLPie logger for backward compatibility
logger = SectionLogger(mlpie_logger)

# Export the logger
__all__ = ["logger", "SectionLogger"] 