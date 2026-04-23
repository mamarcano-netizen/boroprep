import json, os, random

SUBJECTS = {
    "chemistry": {"name": "Chemistry", "emoji": "🧪", "color": "#e74c3c"},
    "biology": {"name": "Living Environment", "emoji": "🌱", "color": "#27ae60"},
    "algebra1": {"name": "Algebra I", "emoji": "📐", "color": "#2980b9"},
    "geometry": {"name": "Geometry", "emoji": "📏", "color": "#8e44ad"},
    "history": {"name": "US History", "emoji": "🗽", "color": "#d35400"},
    "algebra2": {"name": "Algebra II", "emoji": "📊", "color": "#16a085"},
    "physics": {"name": "Physics", "emoji": "⚡", "color": "#2c3e50"},
    "global": {"name": "Global History", "emoji": "🌍", "color": "#7f8c8d"},
    "english": {"name": "English (ELA)", "emoji": "📖", "color": "#8e44ad"},
    "earthscience": {"name": "Earth Science", "emoji": "🌎", "color": "#27ae60"},
    "earth_space_sciences": {"name": "Earth & Space Sciences", "emoji": "🚀", "color": "#1abc9c"},
    "life_science_biology": {"name": "Life Science: Biology", "emoji": "🔬", "color": "#2ecc71"},
}

QUESTIONS_DIR = os.path.join(os.path.dirname(__file__), "questions")

def get_subjects():
    return [{"id": k, **v} for k, v in SUBJECTS.items()]

def get_questions(subject: str, limit: int = 10, topic: str = None) -> list:
    path = os.path.join(QUESTIONS_DIR, f"{subject}.json")
    if not os.path.exists(path):
        return []
    with open(path) as f:
        questions = json.load(f)
    if topic:
        questions = [q for q in questions if q.get("topic") == topic]
    random.shuffle(questions)
    return questions[:limit]

def get_question_by_id(subject: str, qid: str) -> dict | None:
    path = os.path.join(QUESTIONS_DIR, f"{subject}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        questions = json.load(f)
    return next((q for q in questions if q["id"] == qid), None)

def get_topics(subject: str) -> list[str]:
    path = os.path.join(QUESTIONS_DIR, f"{subject}.json")
    if not os.path.exists(path):
        return []
    with open(path) as f:
        questions = json.load(f)
    return sorted(set(q.get("topic", "") for q in questions if q.get("topic")))
