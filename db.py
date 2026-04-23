import sqlite3, json, os, secrets
from datetime import datetime, timezone, date, timedelta

DB_PATH = os.environ.get("DB_PATH", "/tmp/boroprep.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            google_id TEXT,
            role TEXT DEFAULT 'student',
            accessibility TEXT DEFAULT '{}',
            language TEXT DEFAULT 'en',
            streak INTEGER DEFAULT 0,
            last_studied DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            topic TEXT,
            correct INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            last_studied TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            question_id TEXT,
            rating INTEGER,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS parent_links (
            parent_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            PRIMARY KEY (parent_id, student_id)
        );
        CREATE TABLE IF NOT EXISTS badges (
            user_id TEXT NOT NULL,
            badge TEXT NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, badge)
        );
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id TEXT NOT NULL,
            student_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            topic TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    # Migrations
    for col, definition in [
        ("xp", "INTEGER DEFAULT 0"),
        ("streak_freeze_week", "TEXT"),  # ISO year-week like "2026-17"
        ("last_active", "TEXT DEFAULT ''"),
    ]:
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {definition}")
            conn.commit()
        except Exception:
            pass
    conn.close()

def create_user(name, email, password_hash=None, google_id=None, role="student"):
    conn = get_conn()
    uid = secrets.token_hex(16)
    conn.execute(
        "INSERT INTO users (id, name, email, password_hash, google_id, role) VALUES (?,?,?,?,?,?)",
        (uid, name, email, password_hash, google_id, role)
    )
    conn.commit()
    conn.close()
    return uid

def get_user_by_email(email):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(uid):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_google_id(gid):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE google_id=?", (gid,)).fetchone()
    conn.close()
    return dict(row) if row else None

def create_session(user_id):
    token = secrets.token_hex(32)
    conn = get_conn()
    conn.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,datetime('now','+30 days'))",
        (token, user_id)
    )
    conn.commit()
    conn.close()
    return token

def get_session(token):
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM sessions WHERE token=? AND expires_at > datetime('now')", (token,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def update_streak(user_id):
    """Increment streak, granting one freeze per calendar week if a day was missed."""
    conn = get_conn()
    row = conn.execute("SELECT streak, last_studied, streak_freeze_week FROM users WHERE id=?", (user_id,)).fetchone()
    if not row:
        conn.close()
        return
    today = date.today()
    last = date.fromisoformat(row["last_studied"]) if row["last_studied"] else None
    streak = row["streak"] or 0
    current_week = today.strftime("%G-%V")  # ISO year-week

    if last is None or last < today:
        gap = (today - last).days if last else 999
        if gap == 1:
            streak += 1
        elif gap == 2 and row["streak_freeze_week"] != current_week:
            # Use weekly freeze — streak preserved
            conn.execute("UPDATE users SET streak_freeze_week=? WHERE id=?", (current_week, user_id))
        elif gap > 1:
            streak = 1  # reset
        else:
            streak = max(streak, 1)
        conn.execute(
            "UPDATE users SET streak=?, last_studied=? WHERE id=?",
            (streak, today.isoformat(), user_id)
        )
        conn.commit()
    conn.close()

def save_progress(user_id, subject, topic, correct, attempts):
    conn = get_conn()
    existing = conn.execute(
        "SELECT id FROM progress WHERE user_id=? AND subject=? AND topic=?",
        (user_id, subject, topic)
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE progress SET correct=correct+?, attempts=attempts+?, last_studied=CURRENT_TIMESTAMP WHERE id=?",
            (correct, attempts, existing["id"])
        )
    else:
        conn.execute(
            "INSERT INTO progress (user_id, subject, topic, correct, attempts) VALUES (?,?,?,?,?)",
            (user_id, subject, topic, correct, attempts)
        )
    conn.commit()
    conn.close()
    update_streak(user_id)

def get_progress(user_id):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM progress WHERE user_id=? ORDER BY last_studied DESC", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_feedback(user_id, question_id, rating, comment):
    conn = get_conn()
    conn.execute(
        "INSERT INTO feedback (user_id, question_id, rating, comment) VALUES (?,?,?,?)",
        (user_id, question_id, rating, comment)
    )
    conn.commit()
    conn.close()

def link_parent_student(parent_id, student_id):
    conn = get_conn()
    conn.execute("INSERT OR IGNORE INTO parent_links (parent_id, student_id) VALUES (?,?)", (parent_id, student_id))
    conn.commit()
    conn.close()

def get_children(parent_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT u.* FROM users u JOIN parent_links p ON u.id=p.student_id WHERE p.parent_id=?",
        (parent_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def award_badge(user_id, badge):
    conn = get_conn()
    conn.execute("INSERT OR IGNORE INTO badges (user_id, badge) VALUES (?,?)", (user_id, badge))
    conn.commit()
    conn.close()

def get_badges(user_id):
    conn = get_conn()
    rows = conn.execute("SELECT badge, earned_at FROM badges WHERE user_id=?", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_assignment(teacher_id, student_email, subject, topic):
    conn = get_conn()
    conn.execute(
        "INSERT INTO assignments (teacher_id, student_email, subject, topic) VALUES (?,?,?,?)",
        (teacher_id, student_email, subject, topic)
    )
    conn.commit()
    conn.close()

def get_assignments(teacher_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM assignments WHERE teacher_id=? ORDER BY created_at DESC", (teacher_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_students():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM users WHERE role='student'").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_xp(user_id, amount):
    conn = get_conn()
    conn.execute("UPDATE users SET xp = COALESCE(xp,0) + ? WHERE id=?", (amount, user_id))
    conn.commit()
    row = conn.execute("SELECT xp FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return row["xp"] if row else 0

def get_leaderboard(limit=10):
    conn = get_conn()
    rows = conn.execute(
        "SELECT name, COALESCE(xp,0) as xp, streak FROM users ORDER BY xp DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def link_student(teacher_id, student_email):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT id, name FROM users WHERE email=? AND role='student'", (student_email,))
    student = c.fetchone()
    if not student:
        conn.close()
        return None, "No student found with that email"
    c.execute("""CREATE TABLE IF NOT EXISTS teacher_students
                 (teacher_id TEXT, student_id TEXT, PRIMARY KEY(teacher_id, student_id))""")
    c.execute("INSERT OR IGNORE INTO teacher_students(teacher_id,student_id) VALUES(?,?)",
              (teacher_id, student["id"]))
    conn.commit()
    conn.close()
    return {"id": student["id"], "name": student["name"]}, None

def get_teacher_students(teacher_id):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS teacher_students
                 (teacher_id TEXT, student_id TEXT, PRIMARY KEY(teacher_id, student_id))""")
    conn.commit()
    c.execute("""
        SELECT u.id, u.name, u.email,
               COALESCE(u.streak, 0) as streak,
               COALESCE(u.xp, 0) as xp,
               COALESCE(u.last_active, '') as last_active
        FROM teacher_students ts
        JOIN users u ON u.id = ts.student_id
        WHERE ts.teacher_id = ?
        ORDER BY u.name
    """, (teacher_id,))
    rows = c.fetchall()
    conn.close()
    result = []
    for r in rows:
        prog = get_progress(r["id"])
        total = sum(p["attempts"] for p in prog)
        correct = sum(p["correct"] for p in prog)
        accuracy = round(correct / total * 100) if total > 0 else 0
        subjects = list({p["subject"] for p in prog})
        result.append({
            "id": r["id"], "name": r["name"], "email": r["email"],
            "streak": r["streak"], "xp": r["xp"], "last_active": r["last_active"],
            "total_questions": total, "accuracy": accuracy,
            "subjects": subjects[:3]
        })
    return result

def unlink_student(teacher_id, student_id):
    conn = get_conn()
    conn.execute("DELETE FROM teacher_students WHERE teacher_id=? AND student_id=?",
                 (teacher_id, student_id))
    conn.commit()
    conn.close()

def save_push_subscription(user_id, subscription_json):
    conn = get_conn(); c = conn.cursor()
    try: c.execute("ALTER TABLE users ADD COLUMN push_sub TEXT DEFAULT ''")
    except: pass
    conn.commit()
    c.execute("UPDATE users SET push_sub=? WHERE id=?", (subscription_json, user_id))
    conn.commit()
    conn.close()

def get_push_subscriptions():
    conn = get_conn(); c = conn.cursor()
    try: c.execute("ALTER TABLE users ADD COLUMN push_sub TEXT DEFAULT ''")
    except: pass
    conn.commit()
    c.execute("SELECT id, push_sub FROM users WHERE push_sub != '' AND push_sub IS NOT NULL")
    rows = c.fetchall()
    conn.close()
    return rows

def get_daily_challenge_done(user_id, date_str):
    conn = get_conn(); c = conn.cursor()
    try: c.execute("ALTER TABLE users ADD COLUMN daily_challenge_date TEXT DEFAULT ''")
    except: pass
    try: c.execute("ALTER TABLE users ADD COLUMN daily_challenge_streak INTEGER DEFAULT 0")
    except: pass
    conn.commit()
    c.execute("SELECT daily_challenge_date, daily_challenge_streak FROM users WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: return False, 0
    return row["daily_challenge_date"] == date_str, row["daily_challenge_streak"] or 0

def mark_daily_challenge_done(user_id, date_str):
    conn = get_conn(); c = conn.cursor()
    c.execute("SELECT daily_challenge_date, daily_challenge_streak FROM users WHERE id=?", (user_id,))
    row = c.fetchone()
    yesterday = (date.today() - __import__('datetime').timedelta(days=1)).isoformat()
    prev_date = row["daily_challenge_date"] if row else ""
    prev_streak = row["daily_challenge_streak"] if row else 0
    new_streak = (prev_streak + 1) if prev_date == yesterday else 1
    c.execute("UPDATE users SET daily_challenge_date=?, daily_challenge_streak=? WHERE id=?",
              (date_str, new_streak, user_id))
    conn.commit()
    conn.close()
    return new_streak

def set_exam_date(user_id, subject, exam_date):
    conn = get_conn(); c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS exam_dates
                 (user_id TEXT, subject TEXT, exam_date TEXT,
                  PRIMARY KEY(user_id, subject))""")
    conn.commit()
    c.execute("INSERT OR REPLACE INTO exam_dates(user_id,subject,exam_date) VALUES(?,?,?)",
              (user_id, subject, exam_date))
    conn.commit()
    conn.close()

def get_exam_dates(user_id):
    conn = get_conn(); c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS exam_dates
                 (user_id TEXT, subject TEXT, exam_date TEXT,
                  PRIMARY KEY(user_id, subject))""")
    conn.commit()
    c.execute("SELECT subject, exam_date FROM exam_dates WHERE user_id=?", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{"subject": r["subject"], "exam_date": r["exam_date"]} for r in rows]
