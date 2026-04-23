import sqlite3, json, os, secrets
from datetime import datetime, timezone, date, timedelta

DB_PATH = os.environ.get("DB_PATH", "/tmp/boroprep.db")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
USE_PG = bool(DATABASE_URL)

# ── Connection factory ────────────────────────────────────────────────────────

def get_conn():
    if USE_PG:
        import psycopg2, psycopg2.extras
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)
        return conn
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _q(sql):
    """SQLite uses ?, PostgreSQL uses %s."""
    if USE_PG:
        return sql.replace("?", "%s")
    return sql

def _row(row):
    return dict(row) if row else None

def _exec(conn, sql, params=()):
    c = conn.cursor()
    c.execute(_q(sql), params)
    return c

def _insert_ignore(conn, table, columns, values):
    """INSERT OR IGNORE (SQLite) / INSERT ... ON CONFLICT DO NOTHING (PG)."""
    cols = ", ".join(columns)
    placeholders = ", ".join(["?" if not USE_PG else "%s"] * len(values))
    if USE_PG:
        sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
    else:
        sql = f"INSERT OR IGNORE INTO {table} ({cols}) VALUES ({placeholders})"
    _exec(conn, sql, values)

def _now_plus_days(n):
    if USE_PG:
        return f"NOW() + INTERVAL '{n} days'"
    return f"datetime('now','+{n} days')"

def _script(conn, sql):
    if USE_PG:
        stmts = [s.strip() for s in sql.split(";") if s.strip()]
        c = conn.cursor()
        for stmt in stmts:
            c.execute(stmt)
    else:
        conn.executescript(sql)

# ── Schema ────────────────────────────────────────────────────────────────────

def init_db():
    conn = get_conn()
    serial = "SERIAL" if USE_PG else "INTEGER"
    pk_auto = "SERIAL PRIMARY KEY" if USE_PG else "INTEGER PRIMARY KEY AUTOINCREMENT"
    _script(conn, f"""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            google_id TEXT,
            role TEXT DEFAULT 'student',
            accessibility TEXT DEFAULT '{{}}',
            language TEXT DEFAULT 'en',
            streak INTEGER DEFAULT 0,
            last_studied DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            xp INTEGER DEFAULT 0,
            streak_freeze_week TEXT,
            last_active TEXT DEFAULT '',
            push_sub TEXT DEFAULT '',
            daily_challenge_date TEXT DEFAULT '',
            daily_challenge_streak INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS progress (
            id {pk_auto},
            user_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            topic TEXT,
            correct INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            last_studied TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS feedback (
            id {pk_auto},
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
            id {pk_auto},
            teacher_id TEXT NOT NULL,
            student_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            topic TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS teacher_students (
            teacher_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            PRIMARY KEY (teacher_id, student_id)
        );
        CREATE TABLE IF NOT EXISTS exam_dates (
            user_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            exam_date TEXT NOT NULL,
            PRIMARY KEY (user_id, subject)
        )
    """)
    conn.commit()
    conn.close()

# ── Users ─────────────────────────────────────────────────────────────────────

def create_user(name, email, password_hash=None, google_id=None, role="student"):
    conn = get_conn()
    uid = secrets.token_hex(16)
    _exec(conn, "INSERT INTO users (id, name, email, password_hash, google_id, role) VALUES (?,?,?,?,?,?)",
          (uid, name, email, password_hash, google_id, role))
    conn.commit()
    conn.close()
    return uid

def get_user_by_email(email):
    conn = get_conn()
    row = _exec(conn, "SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    return _row(row)

def get_user_by_id(uid):
    conn = get_conn()
    row = _exec(conn, "SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    conn.close()
    return _row(row)

def get_user_by_google_id(gid):
    conn = get_conn()
    row = _exec(conn, "SELECT * FROM users WHERE google_id=?", (gid,)).fetchone()
    conn.close()
    return _row(row)

# ── Sessions ──────────────────────────────────────────────────────────────────

def create_session(user_id):
    token = secrets.token_hex(32)
    conn = get_conn()
    expires_sql = _now_plus_days(30)
    if USE_PG:
        _exec(conn, f"INSERT INTO sessions (token, user_id, expires_at) VALUES (%s, %s, {expires_sql})",
              (token, user_id))
    else:
        _exec(conn, f"INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,{expires_sql})",
              (token, user_id))
    conn.commit()
    conn.close()
    return token

def get_session(token):
    conn = get_conn()
    if USE_PG:
        row = _exec(conn, "SELECT * FROM sessions WHERE token=%s AND expires_at > NOW()", (token,)).fetchone()
    else:
        row = _exec(conn, "SELECT * FROM sessions WHERE token=? AND expires_at > datetime('now')", (token,)).fetchone()
    conn.close()
    return _row(row)

# ── Streak ────────────────────────────────────────────────────────────────────

def update_streak(user_id):
    conn = get_conn()
    row = _exec(conn, "SELECT streak, last_studied, streak_freeze_week FROM users WHERE id=?", (user_id,)).fetchone()
    if not row:
        conn.close()
        return
    row = _row(row)
    today = date.today()
    last_val = row["last_studied"]
    if last_val:
        last = last_val if isinstance(last_val, date) else date.fromisoformat(str(last_val)[:10])
    else:
        last = None
    streak = row["streak"] or 0
    current_week = today.strftime("%G-%V")

    if last is None or last < today:
        gap = (today - last).days if last else 999
        if gap == 1:
            streak += 1
        elif gap == 2 and row["streak_freeze_week"] != current_week:
            _exec(conn, "UPDATE users SET streak_freeze_week=? WHERE id=?", (current_week, user_id))
        elif gap > 1:
            streak = 1
        else:
            streak = max(streak, 1)
        _exec(conn, "UPDATE users SET streak=?, last_studied=? WHERE id=?",
              (streak, today.isoformat(), user_id))
        conn.commit()
    conn.close()

# ── Progress ──────────────────────────────────────────────────────────────────

def save_progress(user_id, subject, topic, correct, attempts):
    conn = get_conn()
    existing = _exec(conn, "SELECT id FROM progress WHERE user_id=? AND subject=? AND topic=?",
                     (user_id, subject, topic)).fetchone()
    if existing:
        existing = _row(existing)
        _exec(conn, "UPDATE progress SET correct=correct+?, attempts=attempts+?, last_studied=CURRENT_TIMESTAMP WHERE id=?",
              (correct, attempts, existing["id"]))
    else:
        _exec(conn, "INSERT INTO progress (user_id, subject, topic, correct, attempts) VALUES (?,?,?,?,?)",
              (user_id, subject, topic, correct, attempts))
    conn.commit()
    conn.close()
    update_streak(user_id)

def get_progress(user_id):
    conn = get_conn()
    rows = _exec(conn, "SELECT * FROM progress WHERE user_id=? ORDER BY last_studied DESC", (user_id,)).fetchall()
    conn.close()
    return [_row(r) for r in rows]

# ── Feedback ──────────────────────────────────────────────────────────────────

def save_feedback(user_id, question_id, rating, comment):
    conn = get_conn()
    _exec(conn, "INSERT INTO feedback (user_id, question_id, rating, comment) VALUES (?,?,?,?)",
          (user_id, question_id, rating, comment))
    conn.commit()
    conn.close()

# ── Parent / Student links ────────────────────────────────────────────────────

def link_parent_student(parent_id, student_id):
    conn = get_conn()
    _insert_ignore(conn, "parent_links", ["parent_id", "student_id"], (parent_id, student_id))
    conn.commit()
    conn.close()

def get_children(parent_id):
    conn = get_conn()
    rows = _exec(conn, "SELECT u.* FROM users u JOIN parent_links p ON u.id=p.student_id WHERE p.parent_id=?",
                 (parent_id,)).fetchall()
    conn.close()
    return [_row(r) for r in rows]

# ── Badges ────────────────────────────────────────────────────────────────────

def award_badge(user_id, badge):
    conn = get_conn()
    _insert_ignore(conn, "badges", ["user_id", "badge"], (user_id, badge))
    conn.commit()
    conn.close()

def get_badges(user_id):
    conn = get_conn()
    rows = _exec(conn, "SELECT badge, earned_at FROM badges WHERE user_id=?", (user_id,)).fetchall()
    conn.close()
    return [_row(r) for r in rows]

# ── Assignments ───────────────────────────────────────────────────────────────

def create_assignment(teacher_id, student_email, subject, topic):
    conn = get_conn()
    _exec(conn, "INSERT INTO assignments (teacher_id, student_email, subject, topic) VALUES (?,?,?,?)",
          (teacher_id, student_email, subject, topic))
    conn.commit()
    conn.close()

def get_assignments(teacher_id):
    conn = get_conn()
    rows = _exec(conn, "SELECT * FROM assignments WHERE teacher_id=? ORDER BY created_at DESC", (teacher_id,)).fetchall()
    conn.close()
    return [_row(r) for r in rows]

def get_all_students():
    conn = get_conn()
    rows = _exec(conn, "SELECT * FROM users WHERE role='student'").fetchall()
    conn.close()
    return [_row(r) for r in rows]

# ── XP / Leaderboard ──────────────────────────────────────────────────────────

def add_xp(user_id, amount):
    conn = get_conn()
    _exec(conn, "UPDATE users SET xp = COALESCE(xp,0) + ? WHERE id=?", (amount, user_id))
    conn.commit()
    row = _exec(conn, "SELECT xp FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return _row(row)["xp"] if row else 0

def get_leaderboard(limit=10):
    conn = get_conn()
    rows = _exec(conn, "SELECT name, COALESCE(xp,0) as xp, streak FROM users ORDER BY xp DESC LIMIT ?",
                 (limit,)).fetchall()
    conn.close()
    return [_row(r) for r in rows]

# ── Teacher / Students ────────────────────────────────────────────────────────

def link_student(teacher_id, student_email):
    conn = get_conn()
    row = _exec(conn, "SELECT id, name FROM users WHERE email=? AND role='student'", (student_email,)).fetchone()
    student = _row(row)
    if not student:
        conn.close()
        return None, "No student found with that email"
    _insert_ignore(conn, "teacher_students", ["teacher_id", "student_id"], (teacher_id, student["id"]))
    conn.commit()
    conn.close()
    return {"id": student["id"], "name": student["name"]}, None

def get_teacher_students(teacher_id):
    conn = get_conn()
    rows = _exec(conn, """
        SELECT u.id, u.name, u.email,
               COALESCE(u.streak, 0) as streak,
               COALESCE(u.xp, 0) as xp,
               COALESCE(u.last_active, '') as last_active
        FROM teacher_students ts
        JOIN users u ON u.id = ts.student_id
        WHERE ts.teacher_id = ?
        ORDER BY u.name
    """, (teacher_id,)).fetchall()
    conn.close()
    result = []
    for r in rows:
        r = _row(r)
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
    _exec(conn, "DELETE FROM teacher_students WHERE teacher_id=? AND student_id=?", (teacher_id, student_id))
    conn.commit()
    conn.close()

# ── Push Subscriptions ────────────────────────────────────────────────────────

def save_push_subscription(user_id, subscription_json):
    conn = get_conn()
    _exec(conn, "UPDATE users SET push_sub=? WHERE id=?", (subscription_json, user_id))
    conn.commit()
    conn.close()

def get_push_subscriptions():
    conn = get_conn()
    rows = _exec(conn, "SELECT id, push_sub FROM users WHERE push_sub != '' AND push_sub IS NOT NULL").fetchall()
    conn.close()
    return [_row(r) for r in rows]

# ── Daily Challenge ───────────────────────────────────────────────────────────

def get_daily_challenge_done(user_id, date_str):
    conn = get_conn()
    row = _exec(conn, "SELECT daily_challenge_date, daily_challenge_streak FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return False, 0
    row = _row(row)
    return row["daily_challenge_date"] == date_str, row["daily_challenge_streak"] or 0

def mark_daily_challenge_done(user_id, date_str):
    conn = get_conn()
    row = _exec(conn, "SELECT daily_challenge_date, daily_challenge_streak FROM users WHERE id=?", (user_id,)).fetchone()
    row = _row(row)
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    prev_date = row["daily_challenge_date"] if row else ""
    prev_streak = row["daily_challenge_streak"] if row else 0
    new_streak = (prev_streak + 1) if prev_date == yesterday else 1
    _exec(conn, "UPDATE users SET daily_challenge_date=?, daily_challenge_streak=? WHERE id=?",
          (date_str, new_streak, user_id))
    conn.commit()
    conn.close()
    return new_streak

# ── Exam Dates ────────────────────────────────────────────────────────────────

def set_exam_date(user_id, subject, exam_date):
    conn = get_conn()
    if USE_PG:
        _exec(conn, """INSERT INTO exam_dates(user_id, subject, exam_date) VALUES (%s,%s,%s)
                       ON CONFLICT (user_id, subject) DO UPDATE SET exam_date=EXCLUDED.exam_date""",
              (user_id, subject, exam_date))
    else:
        _exec(conn, "INSERT OR REPLACE INTO exam_dates(user_id,subject,exam_date) VALUES(?,?,?)",
              (user_id, subject, exam_date))
    conn.commit()
    conn.close()

def get_exam_dates(user_id):
    conn = get_conn()
    rows = _exec(conn, "SELECT subject, exam_date FROM exam_dates WHERE user_id=?", (user_id,)).fetchall()
    conn.close()
    return [{"subject": _row(r)["subject"], "exam_date": _row(r)["exam_date"]} for r in rows]
