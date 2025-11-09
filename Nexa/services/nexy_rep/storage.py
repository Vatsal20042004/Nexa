# storage.py
import sqlite3
from datetime import datetime
from typing import Optional

def init_db(db_path: str) -> None:
    """
    Initialize the SQLite database if not exists.
    
    Args:
        db_path (str): Path to the database file.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS captured_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME NOT NULL,
            image_path TEXT NOT NULL,
            extracted_text TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def ensure_conversation_table(db_path: str) -> None:
    """
    Ensure the conversations table exists.

    Schema:
      - id: PK
      - session_id: text
      - timestamp: datetime
      - role: text ('user'|'assistant')
      - message: text
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id)")
    conn.commit()
    conn.close()


def store_chat_message(db_path: str, session_id: str, role: str, message: str, timestamp: Optional[datetime] = None) -> None:
    """
    Store a chat message (user or assistant) for a session.
    """
    if timestamp is None:
        timestamp = datetime.now()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO conversations (session_id, timestamp, role, message)
        VALUES (?, ?, ?, ?)
        """,
        (session_id, timestamp, role, message)
    )
    conn.commit()
    conn.close()


def get_chat_history(db_path: str, session_id: str, limit: int | None = None):
    """
    Retrieve chat history for a session ordered by timestamp ascending.

    Returns list of tuples: (timestamp, role, message)
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    q = "SELECT timestamp, role, message FROM conversations WHERE session_id = ? ORDER BY timestamp ASC"
    if limit:
        q = q + " LIMIT %d" % int(limit)
    cursor.execute(q, (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def store_data(
    db_path: str,
    timestamp: datetime,
    image_path: str,
    extracted_text: str
) -> None:
    """
    Store the data in the SQLite database.
    
    Args:
        db_path (str): Path to the database.
        timestamp (datetime): Timestamp of capture.
        image_path (str): Path to stored image.
        extracted_text (str): Extracted text.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO captured_data (timestamp, image_path, extracted_text)
        VALUES (?, ?, ?)
    """, (timestamp, image_path, extracted_text))
    conn.commit()
    conn.close()


def ensure_daily_updates_table(db_path: str):
    """Create daily_updates table if it doesn't exist."""
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            content TEXT NOT NULL,
            file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def ensure_event_contexts_table(db_path: str):
    """Create event_contexts table if it doesn't exist."""
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_contexts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            context TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def store_daily_update(db_path: str, user_id: str, timestamp, content: str, file_path: str = None):
    """Store a daily update in the database."""
    import sqlite3
    from datetime import datetime
    
    ensure_daily_updates_table(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    ts_str = timestamp.isoformat() if isinstance(timestamp, datetime) else str(timestamp)
    
    cursor.execute("""
        INSERT INTO daily_updates (user_id, timestamp, content, file_path)
        VALUES (?, ?, ?, ?)
    """, (user_id, ts_str, content, file_path))
    
    conn.commit()
    conn.close()

def get_user_daily_updates(db_path: str, user_id: str, limit: int = None):
    """Retrieve all daily updates for a user."""
    import sqlite3
    
    ensure_daily_updates_table(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
        SELECT timestamp, content, file_path
        FROM daily_updates
        WHERE user_id = ?
        ORDER BY timestamp DESC
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return rows

def store_event_context(db_path: str, user_id: str, timestamp, context: str, description: str = None):
    """Store an event context in the database."""
    import sqlite3
    from datetime import datetime
    
    ensure_event_contexts_table(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    ts_str = timestamp.isoformat() if isinstance(timestamp, datetime) else str(timestamp)
    
    cursor.execute("""
        INSERT INTO event_contexts (user_id, timestamp, context, description)
        VALUES (?, ?, ?, ?)
    """, (user_id, ts_str, context, description))
    
    conn.commit()
    conn.close()