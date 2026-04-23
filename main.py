import os, secrets, json, asyncio
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Cookie, Response, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import date
import db, auth, regents, ai

db.init_db()
app = FastAPI(title="BoroPrep")

# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/auth/signup")
def signup(req: SignupRequest, response: Response):
    user, error = auth.signup_email(req.name, req.email, req.password, req.role)
    if error:
        raise HTTPException(400, error)
    token = db.create_session(user["id"])
    response.set_cookie("session", token, max_age=30*24*3600, httponly=True, samesite="lax")
    return {"user": _safe_user(user)}

@app.post("/auth/login")
def login(req: LoginRequest, response: Response):
    user, error = auth.login_email(req.email, req.password)
    if error:
        raise HTTPException(401, error)
    token = db.create_session(user["id"])
    response.set_cookie("session", token, max_age=30*24*3600, httponly=True, samesite="lax")
    return {"user": _safe_user(user)}


@app.post("/auth/logout")
def logout(response: Response, session: Optional[str] = Cookie(None)):
    response.delete_cookie("session")
    return {"ok": True}

@app.get("/auth/me")
def me(session: Optional[str] = Cookie(None)):
    user = auth.get_current_user(session)
    if not user:
        raise HTTPException(401, "Not logged in")
    return _safe_user(user)

# ── Subjects & Questions ──────────────────────────────────────────────────────

@app.get("/api/subjects")
def subjects():
    return regents.get_subjects()

@app.get("/api/questions/{subject}")
def questions(subject: str, limit: int = 10, topic: str = None, session: Optional[str] = Cookie(None)):
    qs = regents.get_questions(subject, limit * 3, topic)  # fetch extra pool
    user = auth.get_current_user(session)
    if user and not topic:
        progress = db.get_progress(user["id"])
        weak = {p["topic"] for p in progress if p["attempts"] >= 2 and p["correct"] / p["attempts"] < 0.6}
        if weak:
            weak_qs = [q for q in qs if q.get("topic") in weak]
            other_qs = [q for q in qs if q.get("topic") not in weak]
            import random
            random.shuffle(weak_qs); random.shuffle(other_qs)
            # Fill up to limit with 60% weak, 40% other
            n_weak = min(len(weak_qs), round(limit * 0.6))
            n_other = min(len(other_qs), limit - n_weak)
            qs = (weak_qs[:n_weak] + other_qs[:n_other])[:limit]
            random.shuffle(qs)
            return qs
    import random; random.shuffle(qs)
    return qs[:limit]

@app.get("/api/topics/{subject}")
def topics(subject: str):
    return regents.get_topics(subject)

# ── Quiz ──────────────────────────────────────────────────────────────────────

class CheckAnswer(BaseModel):
    subject: str
    question_id: str
    student_answer: str
    question_text: str
    correct_answer: str
    simple_mode: bool = False
    spanish_mode: bool = False

@app.post("/api/quiz/check")
def check_answer(req: CheckAnswer, session: Optional[str] = Cookie(None)):
    user = auth.get_current_user(session)
    correct = req.student_answer == req.correct_answer
    explanation = ai.explain_answer(
        req.question_text, req.correct_answer, req.student_answer,
        req.subject, req.simple_mode, req.spanish_mode
    )
    xp_earned = 0
    total_xp = 0
    new_badges = []
    if user:
        db.save_progress(user["id"], req.subject, req.question_id.split("_")[0] or "", 1 if correct else 0, 1)
        if correct:
            xp_earned = 15
            total_xp = db.add_xp(user["id"], xp_earned)
            progress = db.get_progress(user["id"])
            total_correct = sum(p["correct"] for p in progress)
            for threshold, badge in [(1,"first_correct"),(10,"ten_correct"),(50,"fifty_correct"),(100,"hundred_correct"),(250,"regents_ready")]:
                if total_correct >= threshold:
                    db.award_badge(user["id"], badge)
    return {"correct": correct, "explanation": explanation, "xp_earned": xp_earned, "total_xp": total_xp}

# ── Hint ──────────────────────────────────────────────────────────────────────

class HintRequest(BaseModel):
    question_text: str
    subject: str
    simple_mode: bool = False
    spanish_mode: bool = False

@app.post("/api/hint")
async def hint(req: HintRequest):
    h = await asyncio.to_thread(ai.get_hint, req.question_text, req.subject, req.simple_mode, req.spanish_mode)
    return {"hint": h}

# ── Tutor Chat ────────────────────────────────────────────────────────────────

class TutorRequest(BaseModel):
    subject: str
    history: list
    message: str
    simple_mode: bool = False
    spanish_mode: bool = False

@app.post("/api/tutor")
def tutor(req: TutorRequest):
    reply = ai.tutor_chat(req.subject, req.history, req.message, req.simple_mode, req.spanish_mode)
    return {"reply": reply}

# ── Tonight Mode ──────────────────────────────────────────────────────────────

class TonightRequest(BaseModel):
    subject: str

@app.post("/api/tonight")
def tonight(req: TonightRequest, session: Optional[str] = Cookie(None)):
    user = auth.get_current_user(session)
    weak_topics = []
    if user:
        progress = db.get_progress(user["id"])
        subject_progress = [p for p in progress if p["subject"] == req.subject]
        weak_topics = [p["topic"] for p in subject_progress if p["attempts"] > 0 and p["correct"] / p["attempts"] < 0.6]
    plan = ai.tonight_mode(req.subject, weak_topics)
    return {"plan": plan}

# ── Progress ──────────────────────────────────────────────────────────────────

@app.get("/api/progress")
def progress(session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    return db.get_progress(user["id"])

@app.get("/api/predicted-score")
def predicted_score(session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    progress = db.get_progress(user["id"])
    by_subject = {}
    for p in progress:
        s = p["subject"]
        if s not in by_subject:
            by_subject[s] = {"correct": 0, "attempts": 0, "topics": []}
        by_subject[s]["correct"] += p["correct"]
        by_subject[s]["attempts"] += p["attempts"]
        by_subject[s]["topics"].append({
            "topic": p["topic"],
            "correct": p["correct"],
            "attempts": p["attempts"],
        })
    result = []
    for subject, d in by_subject.items():
        if d["attempts"] < 5:
            continue
        accuracy = d["correct"] / d["attempts"]
        # Find weak topics (< 60% accuracy with >= 2 attempts)
        weak = [t["topic"] for t in d["topics"]
                if t["attempts"] >= 2 and t["correct"] / t["attempts"] < 0.6 and t["topic"]]
        # Trend: if more than half of topics are strong, boost prediction slightly
        strong_topics = sum(1 for t in d["topics"] if t["attempts"] >= 2 and t["correct"] / t["attempts"] >= 0.75)
        trend_boost = min(5, strong_topics * 1)
        predicted = max(0, min(100, round(accuracy * 100 + trend_boost)))
        # Days until nearest exam for this subject
        exam_info = EXAM_DATES.get(subject, {})
        days_left = None
        if exam_info.get("date"):
            from datetime import date as _date
            days_left = (date.fromisoformat(exam_info["date"]) - date.today()).days
        result.append({
            "subject": subject,
            "accuracy": round(accuracy, 3),
            "predicted_score": predicted,
            "questions_done": d["attempts"],
            "on_track": predicted >= 65,
            "weak_topics": weak[:3],
            "days_left": days_left,
            "trend_boost": trend_boost,
        })
    return result

@app.get("/api/badges")
def badges(session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    return db.get_badges(user["id"])

# ── Exam Countdown ───────────────────────────────────────────────────────────

EXAM_DATES = {
    "english":    {"name": "English ELA",       "date": "2026-06-17"},
    "algebra1":   {"name": "Algebra I",          "date": "2026-06-18"},
    "biology":    {"name": "Living Environment", "date": "2026-06-18"},
    "earthscience":{"name": "Earth Science",     "date": "2026-06-19"},
    "history":    {"name": "US History",         "date": "2026-06-19"},
    "chemistry":  {"name": "Chemistry",          "date": "2026-06-23"},
    "geometry":   {"name": "Geometry",           "date": "2026-06-23"},
    "global":     {"name": "Global History",     "date": "2026-06-24"},
    "algebra2":   {"name": "Algebra II",         "date": "2026-06-24"},
    "physics":    {"name": "Physics",            "date": "2026-06-25"},
    "earth_space_sciences": {"name": "Earth & Space Sciences", "date": "2026-06-19"},
    "life_science_biology": {"name": "Life Science: Biology",  "date": "2026-06-18"},
}

@app.get("/api/exam-dates")
def exam_dates():
    today = date.today()
    result = []
    for subject_id, info in EXAM_DATES.items():
        exam_date = date.fromisoformat(info["date"])
        days_left = (exam_date - today).days
        result.append({
            "subject_id": subject_id,
            "name": info["name"],
            "date": info["date"],
            "days_left": days_left,
        })
    result.sort(key=lambda x: x["days_left"])
    return result

# ── Leaderboard ──────────────────────────────────────────────────────────────

@app.get("/api/leaderboard")
def leaderboard(subject: Optional[str] = None):
    if subject:
        return db.get_subject_leaderboard(subject, 10)
    return db.get_leaderboard(10)

# ── Daily Study Plan ──────────────────────────────────────────────────────────

@app.get("/api/daily-plan")
async def daily_plan(session: Optional[str] = Cookie(None)):
    user = auth.get_current_user(session)
    if not user:
        return {"plan": None}
    progress = db.get_progress(user["id"])
    today = date.today()
    # Find closest exam
    soonest = min(EXAM_DATES.items(), key=lambda x: abs((date.fromisoformat(x[1]["date"]) - today).days))
    days_left = (date.fromisoformat(soonest[1]["date"]) - today).days
    plan = await asyncio.to_thread(ai.daily_plan, user["name"], soonest[1]["name"], days_left, progress)
    return {"plan": plan, "exam": soonest[1]["name"], "days_left": days_left}

# ── Smart Study Suggestions ───────────────────────────────────────────────────

@app.get("/api/smart-study")
async def smart_study(session: Optional[str] = Cookie(None)):
    user = auth.get_current_user(session)
    if not user:
        return {"suggestion": "Sign in to get personalized study suggestions! 🎓"}
    progress = db.get_progress(user["id"])
    suggestion = await asyncio.to_thread(ai.smart_suggestions, progress)
    return {"suggestion": suggestion}

# ── Photo Help ────────────────────────────────────────────────────────────────

@app.post("/api/photo-help")
async def photo_help(file: UploadFile = File(...), simple_mode: str = "false"):
    image_bytes = await file.read()
    answer = await asyncio.to_thread(
        ai.photo_help, image_bytes, file.content_type, simple_mode == "true"
    )
    return {"answer": answer}

# ── Multiplayer ───────────────────────────────────────────────────────────────

ROOMS = {}  # in-memory rooms: {code: {players, questions, scores, current_q, started}}

class CreateRoomRequest(BaseModel):
    subject: Optional[str] = None

@app.post("/api/room/create")
async def create_room(req: CreateRoomRequest = CreateRoomRequest(), session: Optional[str] = Cookie(None)):
    user = auth.get_current_user(session)
    name = user["name"].split()[0] if user else "Player1"
    code = secrets.token_hex(3).upper()
    if req.subject:
        questions = regents.get_questions(req.subject, 10)
    else:
        questions = regents.get_questions("chemistry", 5) + regents.get_questions("algebra1", 5)
    ROOMS[code] = {
        "players": {name: 0},
        "questions": questions,
        "current_q": 0,
        "started": False,
        "host": name,
        "events": [],
    }
    return {"code": code, "player_name": name}

@app.post("/api/room/join/{code}")
async def join_room(code: str, session: Optional[str] = Cookie(None)):
    if code not in ROOMS:
        raise HTTPException(404, "Room not found")
    user = auth.get_current_user(session)
    name = (user["name"].split()[0] if user else "Player2") + str(len(ROOMS[code]["players"]) + 1)
    ROOMS[code]["players"][name] = 0
    ROOMS[code]["events"].append({"type": "join", "player": name})
    return {"code": code, "player_name": name}

@app.post("/api/room/start/{code}")
async def start_room(code: str):
    if code not in ROOMS:
        raise HTTPException(404, "Room not found")
    ROOMS[code]["started"] = True
    ROOMS[code]["events"].append({"type": "start"})
    return {"ok": True}

class RoomAnswer(BaseModel):
    code: str
    player_name: str
    answer: str

@app.post("/api/room/answer")
async def room_answer(req: RoomAnswer):
    room = ROOMS.get(req.code)
    if not room:
        raise HTTPException(404, "Room not found")
    q = room["questions"][room["current_q"]]
    correct = req.answer == q["answer"]
    if correct:
        room["players"][req.player_name] = room["players"].get(req.player_name, 0) + 1
        room["current_q"] += 1
        room["events"].append({"type": "correct", "player": req.player_name, "scores": dict(room["players"])})
    return {"correct": correct, "scores": room["players"], "explanation": q["explanation"]}

@app.get("/api/room/state/{code}")
async def room_state(code: str):
    room = ROOMS.get(code)
    if not room:
        raise HTTPException(404, "Room not found")
    q = room["questions"][room["current_q"]] if room["current_q"] < len(room["questions"]) else None
    return {
        "players": room["players"],
        "current_q": room["current_q"],
        "total_q": len(room["questions"]),
        "started": room["started"],
        "question": {"question": q["question"], "choices": q["choices"], "id": q["id"]} if q else None,
    }

# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    question_id: str
    rating: int
    comment: str = ""

@app.post("/api/feedback")
def feedback(req: FeedbackRequest, session: Optional[str] = Cookie(None)):
    user = auth.get_current_user(session)
    uid = user["id"] if user else None
    db.save_feedback(uid, req.question_id, req.rating, req.comment)
    return {"ok": True}

# ── Parent Dashboard ──────────────────────────────────────────────────────────

class LinkStudentRequest(BaseModel):
    student_email: str

@app.post("/api/parent/link")
def parent_link(req: LinkStudentRequest, session: Optional[str] = Cookie(None)):
    parent = _require_auth(session)
    student = db.get_user_by_email(req.student_email)
    if not student:
        raise HTTPException(404, "Student not found")
    db.link_parent_student(parent["id"], student["id"])
    return {"ok": True, "student": _safe_user(student)}

@app.get("/api/parent/digest/{student_id}", response_class=HTMLResponse)
def parent_digest(student_id: str, session: Optional[str] = Cookie(None)):
    _require_auth(session)
    student = db.get_user_by_id(student_id)
    if not student:
        raise HTTPException(404, "Student not found")
    progress = db.get_progress(student["id"])
    by_subject = {}
    for p in progress:
        s = p["subject"]
        if s not in by_subject:
            by_subject[s] = {"correct": 0, "attempts": 0}
        by_subject[s]["correct"] += p["correct"]
        by_subject[s]["attempts"] += p["attempts"]
    rows = ""
    for sub, d in by_subject.items():
        pct = round(d["correct"] / d["attempts"] * 100) if d["attempts"] else 0
        bar = f'<div style="background:#e0e7ff;border-radius:4px;height:8px;"><div style="background:#4f46e5;width:{pct}%;height:8px;border-radius:4px;"></div></div>'
        rows += f'<tr><td style="padding:10px 12px;text-transform:capitalize;font-weight:600">{sub}</td><td style="padding:10px 12px">{d["correct"]}/{d["attempts"]}</td><td style="padding:10px 12px;font-weight:700;color:{"#059669" if pct>=65 else "#dc2626"}">{pct}%</td><td style="padding:10px 12px;min-width:120px">{bar}</td></tr>'
    from datetime import date as _date
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>BoroPrep Weekly Report — {student["name"]}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#1e293b">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
    <div style="font-size:2rem">🗽</div>
    <h1 style="margin:8px 0;font-size:1.4rem">BoroPrep Weekly Report</h1>
    <p style="margin:0;opacity:0.85">{student["name"]} · {_date.today().strftime("%B %d, %Y")}</p>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:24px">
    <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:2rem;font-weight:800;color:#059669">{student.get("streak",0)}</div>
      <div style="font-size:0.85rem;color:#166534">Day Streak 🔥</div>
    </div>
    <div style="flex:1;background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:2rem;font-weight:800;color:#4f46e5">{student.get("xp",0)}</div>
      <div style="font-size:0.85rem;color:#3730a3">Total XP ⭐</div>
    </div>
    <div style="flex:1;background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:2rem;font-weight:800;color:#d97706">{sum(d["attempts"] for d in by_subject.values())}</div>
      <div style="font-size:0.85rem;color:#92400e">Questions Tried 📝</div>
    </div>
  </div>
  <h2 style="font-size:1rem;font-weight:700;margin-bottom:12px">Progress by Subject</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr style="background:#f8fafc"><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#64748b;text-transform:uppercase">Subject</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#64748b;text-transform:uppercase">Correct</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#64748b;text-transform:uppercase">Score</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#64748b;text-transform:uppercase">Progress</th></tr></thead>
    <tbody>{rows or "<tr><td colspan='4' style='padding:12px;color:#94a3b8'>No activity yet this week.</td></tr>"}</tbody>
  </table>
  <div style="text-align:center;color:#94a3b8;font-size:0.8rem">BoroPrep · Free for all NYC students · <a href="/dashboard" style="color:#4f46e5">Open App</a></div>
</body></html>"""

@app.get("/api/parent/children")
def parent_children(session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    children = db.get_children(user["id"])
    result = []
    for child in children:
        progress = db.get_progress(child["id"])
        result.append({"user": _safe_user(child), "progress": progress})
    return result

# ── Teacher Dashboard ─────────────────────────────────────────────────────────

class TeacherLinkRequest(BaseModel):
    student_email: str

@app.get("/api/teacher/students")
def teacher_students(session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    if user.get("role") != "teacher":
        raise HTTPException(403, "Teacher access only")
    return db.get_teacher_students(user["id"])

@app.post("/api/teacher/link")
def teacher_link(req: TeacherLinkRequest, session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    if user.get("role") != "teacher":
        raise HTTPException(403, "Teacher access only")
    student, err = db.link_student(user["id"], req.student_email)
    if err:
        raise HTTPException(404, err)
    return student

@app.delete("/api/teacher/unlink/{student_id}")
def teacher_unlink(student_id: str, session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    if user.get("role") != "teacher":
        raise HTTPException(403, "Teacher access only")
    db.unlink_student(user["id"], student_id)
    return {"ok": True}

class AssignRequest(BaseModel):
    student_email: str
    subject: str
    topic: str

@app.post("/api/teacher/assign")
def teacher_assign(req: AssignRequest, session: Optional[str] = Cookie(None)):
    teacher = _require_auth(session)
    db.create_assignment(teacher["id"], req.student_email, req.subject, req.topic)
    return {"ok": True}

@app.get("/api/teacher/assignments")
def teacher_assignments(session: Optional[str] = Cookie(None)):
    teacher = _require_auth(session)
    if teacher.get("role") != "teacher":
        raise HTTPException(403, "Teacher access only")
    return db.get_assignment_status(teacher["id"])

class CompleteAssignmentRequest(BaseModel):
    subject: str
    topic: str

@app.post("/api/assignments/complete")
def complete_assignment(req: CompleteAssignmentRequest, session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    # Find assignments for this student by email and mark them done across all teachers
    student_email = user.get("email", "")
    conn_assignments = db.get_conn()
    rows = db._exec(conn_assignments, "SELECT DISTINCT teacher_id FROM assignments WHERE student_email=? AND subject=? AND topic=?",
                    (student_email, req.subject, req.topic)).fetchall()
    conn_assignments.close()
    for row in rows:
        teacher_id = db._row(row)["teacher_id"]
        db.mark_assignment_done(teacher_id, student_email, req.subject, req.topic)
    return {"ok": True}

# ── Pages ─────────────────────────────────────────────────────────────────────

def _page(name):
    path = os.path.join(os.path.dirname(__file__), "static", name)
    with open(path) as f:
        return HTMLResponse(f.read())

@app.get("/", response_class=HTMLResponse)
def index(): return _page("index.html")

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(): return _page("dashboard.html")

@app.get("/study", response_class=HTMLResponse)
def study(): return _page("study.html")

@app.get("/parent", response_class=HTMLResponse)
def parent(): return _page("parent.html")

@app.get("/exam", response_class=HTMLResponse)
def exam(): return _page("exam.html")

@app.get("/multiplayer", response_class=HTMLResponse)
def multiplayer(): return _page("multiplayer.html")

@app.get("/teacher", response_class=HTMLResponse)
def teacher(): return _page("teacher.html")

@app.get("/share", response_class=HTMLResponse)
def share(score: int = 0, subject: str = "", name: str = "Student"):
    # If no score param, serve the plain share page
    if not score and not subject:
        return _page("share.html")
    subject_clean = subject[:30].replace("<","").replace(">","")
    name_clean = name[:20].replace("<","").replace(">","")
    color = "#10b981" if score >= 80 else "#f59e0b" if score >= 65 else "#ef4444"
    grade = "🏆 Crushing It!" if score >= 90 else "🔥 Passing!" if score >= 65 else "📚 Keep Studying!"
    # Serve share.html with injected OG meta — embed params for JS
    with open(os.path.join(os.path.dirname(__file__), "static", "share.html")) as f:
        html = f.read()
    og_tags = f"""  <meta property="og:title" content="{name_clean} scored {score}% on {subject_clean} — BoroPrep"/>
  <meta property="og:description" content="Study for your NYC Regents exam free at BoroPrep!"/>
  <meta property="og:image" content="/static/icon-192.png"/>"""
    html = html.replace("</head>", og_tags + "\n</head>", 1)
    return HTMLResponse(html)

@app.get("/essay", response_class=HTMLResponse)
def essay_page(): return _page("essay.html")

@app.get("/reference", response_class=HTMLResponse)
def reference_page(): return _page("reference.html")

@app.get("/classroom", response_class=HTMLResponse)
def classroom_page(): return _page("classroom.html")

@app.get("/profile", response_class=HTMLResponse)
def profile_page(): return _page("profile.html")

class EssayGradeRequest(BaseModel):
    essay_text: str
    prompt_type: str = "argument"
    simple_mode: bool = False
    passage_text: str = ""
    prompt_text: str = ""

@app.post("/api/essay/grade")
async def grade_essay(req: EssayGradeRequest, session: Optional[str] = Cookie(None)):
    result = await asyncio.to_thread(
        ai.grade_essay, req.essay_text, req.prompt_type,
        req.simple_mode, req.passage_text, req.prompt_text
    )
    return result

# ── ElevenLabs TTS proxy ──────────────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str

@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    import requests as _requests
    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key:
        raise HTTPException(503, "TTS not configured — add ELEVENLABS_API_KEY to .env")
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel
    clean = req.text.strip()[:2000]
    resp = _requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={"text": clean, "model_id": "eleven_turbo_v2_5",
              "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}},
        timeout=15,
    )
    if resp.status_code != 200:
        raise HTTPException(500, f"ElevenLabs error: {resp.status_code}")
    return Response(content=resp.content, media_type="audio/mpeg")

# ── Push Notifications ────────────────────────────────────────────────────────

class PushSubscription(BaseModel):
    subscription: dict

@app.post("/api/push/subscribe")
def push_subscribe(req: PushSubscription, session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    import json as _json
    db.save_push_subscription(user["id"], _json.dumps(req.subscription))
    return {"ok": True}

@app.post("/api/push/test")
def push_test(session: Optional[str] = Cookie(None)):
    _require_auth(session)
    return {"ok": True, "message": "Push configured — notifications will arrive daily at 6pm"}

# ── AI Question Generator ─────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    subject: str
    topic: str = ""
    count: int = 5

@app.post("/api/generate-questions")
async def generate_questions_endpoint(req: GenerateRequest, session: Optional[str] = Cookie(None)):
    if req.count > 10:
        req.count = 10
    qs = await asyncio.to_thread(ai.generate_questions, req.subject, req.topic, req.count)
    return qs

# ── Daily Challenge ───────────────────────────────────────────────────────────

@app.get("/api/daily-challenge")
def daily_challenge(session: Optional[str] = Cookie(None)):
    import hashlib, datetime as _dt
    today = _dt.date.today().isoformat()
    all_qs = []
    for subj in ["chemistry","biology","algebra1","geometry","history","global","physics","earthscience"]:
        qs = regents.get_questions(subj, 50)
        for q in qs:
            q["subject"] = subj
            all_qs.append(q)
    if not all_qs:
        raise HTTPException(404, "No questions available")
    idx = int(hashlib.md5(today.encode()).hexdigest(), 16) % len(all_qs)
    q = all_qs[idx]
    user = auth.get_current_user(session)
    done = False
    challenge_streak = 0
    if user:
        done, challenge_streak = db.get_daily_challenge_done(user["id"], today)
    return {**q, "date": today, "done": done, "challenge_streak": challenge_streak}

class DailyChallengeAnswer(BaseModel):
    question_id: str
    student_answer: str
    correct_answer: str
    question_text: str
    subject: str

@app.post("/api/daily-challenge/submit")
def submit_daily_challenge(req: DailyChallengeAnswer, session: Optional[str] = Cookie(None)):
    import datetime as _dt
    user = _require_auth(session)
    today = _dt.date.today().isoformat()
    done, _ = db.get_daily_challenge_done(user["id"], today)
    if done:
        return {"already_done": True, "correct": req.student_answer == req.correct_answer}
    correct = req.student_answer == req.correct_answer
    xp_earned = 25 if correct else 10
    db.add_xp(user["id"], xp_earned)
    new_streak = db.mark_daily_challenge_done(user["id"], today)
    explanation = ai.explain_answer(req.question_text, req.correct_answer, req.student_answer, req.subject)
    return {"correct": correct, "xp_earned": xp_earned, "challenge_streak": new_streak, "explanation": explanation}

# ── XP Add ────────────────────────────────────────────────────────────────────

class XpAddRequest(BaseModel):
    amount: int

@app.post("/api/xp/add")
def add_xp_endpoint(req: XpAddRequest, session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    if req.amount > 200: req.amount = 200
    total = db.add_xp(user["id"], req.amount)
    return {"total_xp": total, "xp_earned": req.amount}

# ── Exam Date Scheduler ───────────────────────────────────────────────────────

class ExamDateRequest(BaseModel):
    subject: str
    exam_date: str  # ISO format: YYYY-MM-DD

@app.post("/api/exam-dates")
def set_exam_date(req: ExamDateRequest, session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    db.set_exam_date(user["id"], req.subject, req.exam_date)
    return {"ok": True}

@app.get("/api/my-exam-dates")
def get_my_exam_dates(session: Optional[str] = Cookie(None)):
    user = _require_auth(session)
    return db.get_exam_dates(user["id"])

app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_user(u):
    return {k: v for k, v in u.items() if k not in ("password_hash",)}

def _require_auth(session):
    user = auth.get_current_user(session)
    if not user:
        raise HTTPException(401, "Not logged in")
    return user
