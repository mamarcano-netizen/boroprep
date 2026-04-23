import os, base64, json
import anthropic

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client

def explain_answer(question: str, correct_answer: str, student_answer: str, subject: str, simple_mode: bool = False, spanish_mode: bool = False) -> str:
    level = "Use very simple words, short sentences, and a friendly tone like explaining to a middle schooler." if simple_mode else "Be clear and educational."
    spanish = "\nIMPORTANT: Respond entirely in Spanish. The student prefers Spanish." if spanish_mode else ""
    correct = student_answer == correct_answer
    prompt = f"""A student is studying for the NYS Regents {subject} exam.

Question: {question}
Correct answer: {correct_answer}
Student answered: {student_answer}
{"✅ They got it right!" if correct else "❌ They got it wrong."}

{level}{spanish}

{"Confirm they're right and explain WHY this is the correct answer in a way that helps them remember it." if correct else "Kindly explain why their answer is wrong and clearly explain the correct answer. Be encouraging — learning from mistakes is great!"}

Keep it to 3-4 sentences max."""

    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text

def tutor_chat(subject: str, history: list, message: str, simple_mode: bool = False, spanish_mode: bool = False) -> str:
    level = "Use very simple words and short sentences. Explain like talking to a middle schooler." if simple_mode else "Be clear and educational."
    spanish = "\nIMPORTANT: Respond entirely in Spanish. The student prefers Spanish." if spanish_mode else ""
    system = f"""You are BoroPrep, a friendly AI tutor helping NYC students pass their NYS Regents {subject} exam.

{level}{spanish}

- Answer questions clearly with examples
- Quiz the student when they ask
- Be encouraging — always celebrate effort
- Keep responses short and easy to read on a phone
- Use emojis occasionally to keep it fun 🎓"""

    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=system,
        messages=history[-20:] + [{"role": "user", "content": message}]
    )
    return msg.content[0].text

def generate_flashcard_hint(term: str, subject: str) -> str:
    prompt = f"Give a super simple one-sentence memory trick or hint to remember this {subject} concept: {term}. Make it fun and easy for a high schooler."
    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text

def tonight_mode(subject: str, weak_topics: list) -> str:
    topics = ", ".join(weak_topics) if weak_topics else "all key topics"
    prompt = f"""A student has a {subject} Regents exam soon and needs to pass TONIGHT.
Their weak areas are: {topics}

Create a quick 10-minute study plan with:
1. The 3 most important things to remember
2. One trick/tip for each
3. An encouraging closing message

Keep it short, simple, and on a phone screen. Use emojis. Be their hype person! 🔥"""

    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text


def photo_help(image_bytes: bytes, media_type: str, simple_mode: bool = False) -> str:
    level = "Use very simple words like explaining to a middle schooler." if simple_mode else "Be clear and educational."
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
            {"type": "text", "text": f"This is a school question or assignment. {level} Read it carefully and give a complete, step-by-step answer with explanation. If it's a multiple choice question, tell me which answer is correct and why."}
        ]}]
    )
    return msg.content[0].text


def get_hint(question_text: str, subject: str, simple_mode: bool = False, spanish_mode: bool = False) -> str:
    level = "Use very simple words." if simple_mode else "Be clear."
    spanish = " IMPORTANT: Respond entirely in Spanish. The student prefers Spanish." if spanish_mode else ""
    prompt = f"""A student is stuck on this {subject} Regents question:

{question_text}

Give them ONE helpful hint that nudges them toward the answer WITHOUT giving the answer away. {level}{spanish} Maximum 2 sentences. Start with "Think about..." or "Remember that..." or "Consider..."."""
    msg = _get_client().messages.create(
        model="claude-sonnet-4-6", max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text

def daily_plan(name: str, exam_name: str, days_left: int, progress: list) -> str:
    weak = [p for p in progress if p["attempts"] >= 2 and p["correct"] / p["attempts"] < 0.65]
    weak_text = ", ".join(f"{p['subject']} {p['topic'] or ''}" for p in weak[:3]) or "all topics"
    urgency = "🚨 URGENT" if days_left <= 7 else ("⏰ Coming up" if days_left <= 30 else "📅 Plenty of time")
    prompt = f"""Create a personalized TODAY'S STUDY PLAN for {name}.

{urgency}: {exam_name} is in {days_left} days.
Weak areas: {weak_text}

Give exactly 3 specific tasks for today, formatted as a short numbered list. Each task should take 10-15 minutes. Be specific (e.g. "Practice 10 Stoichiometry problems focusing on molar mass"). Use emojis. End with one motivating sentence. Keep it under 80 words total."""

    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text

def grade_essay(essay_text: str, prompt_type: str, simple_mode: bool = False,
                passage_text: str = "", prompt_text: str = "") -> dict:
    type_labels = {
        "text_analysis": "Text Analysis",
        "argument": "Argument Essay",
        "document_analysis": "Document Analysis (DBQ)",
    }
    essay_label = type_labels.get(prompt_type, "Essay")
    level = "Use simple, clear language a high schooler can understand." if simple_mode else "Be thorough and specific."

    passage_section = f"""
SOURCE TEXTS THE STUDENT WAS GIVEN:
\"\"\"
{passage_text}
\"\"\"

WRITING PROMPT THEY WERE RESPONDING TO:
{prompt_text}
""" if passage_text else ""

    prompt = f"""You are an expert NYS Regents ELA grader. Grade the following {essay_label} using the official NYS Regents rubric (4 criteria, each scored 0-6).

Rubric criteria:
1. Content & Analysis — depth of ideas, insight, quality of analysis
2. Command of Evidence — how well the student uses specific evidence from the source texts, accuracy, relevance
3. Coherence, Organization & Style — logical flow, structure, transitions, introduction/conclusion
4. Language Use — grammar, vocabulary, sentence variety, mechanics
{passage_section}
STUDENT ESSAY:
\"\"\"
{essay_text}
\"\"\"

{level}

When evaluating Command of Evidence, check whether the student quoted or paraphrased specific parts of the source texts. If the essay has no textual evidence, the evidence score should be 0-2.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{{
  "scores": {{
    "content": <0-6>,
    "evidence": <0-6>,
    "coherence": <0-6>,
    "language": <0-6>
  }},
  "total": <sum of 4 scores, max 24>,
  "passed": <true if total >= 12 AND no individual score < 2>,
  "strengths": ["<specific strength referencing actual text/ideas>", "<strength 2>", "<strength 3>"],
  "improvements": ["<specific improvement with example of how to fix it>", "<improvement 2>", "<improvement 3>"],
  "line_feedback": "<2-3 sentences of specific suggestions — quote from student essay where possible>",
  "overall_comment": "<encouraging 1-sentence summary>"
}}"""

    _fallback = {
        "scores": {"content": 0, "evidence": 0, "coherence": 0, "language": 0},
        "total": 0,
        "passed": False,
        "strengths": ["Unable to parse feedback."],
        "improvements": ["Please try again."],
        "line_feedback": "An error occurred while grading. Please try again.",
        "overall_comment": "Something went wrong — please resubmit your essay.",
    }

    try:
        msg = _get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        scores = data.get("scores", {})
        total = scores.get("content", 0) + scores.get("evidence", 0) + scores.get("coherence", 0) + scores.get("language", 0)
        data["total"] = total
        data["passed"] = total >= 12 and all(v >= 2 for v in scores.values())
        return data
    except Exception:
        return _fallback


def generate_questions(subject: str, topic: str, count: int = 5) -> list:
    prompt = f"""Generate {count} multiple-choice practice questions for the NYS Regents {subject} exam.
{"Focus on the topic: " + topic if topic else ""}

Each question must be in this EXACT JSON format (array of objects):
[
  {{
    "id": "gen_{subject}_001",
    "question": "Question text here?",
    "choices": ["A) option one", "B) option two", "C) option three", "D) option four"],
    "answer": "A) option one",
    "explanation": "Brief explanation of why this is correct.",
    "topic": "{topic or subject}",
    "difficulty": "medium"
  }}
]

Rules:
- choices MUST be exactly 4 items, each starting with "A) ", "B) ", "C) ", or "D) "
- answer MUST exactly match one of the choices
- Make questions Regents-level difficulty
- Give unique IDs like gen_{subject}_001, gen_{subject}_002, etc.
- Return ONLY the JSON array, no other text

Generate {count} questions now."""

    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    import json as _json
    questions = _json.loads(raw.strip())
    # Validate each question has required fields
    valid = []
    for q in questions:
        if all(k in q for k in ["question","choices","answer","topic"]) and len(q["choices"]) == 4:
            valid.append(q)
    return valid


def smart_suggestions(progress: list) -> str:
    if not progress:
        return "Start a quiz to get personalized study suggestions! 📚"

    weak = [p for p in progress if p["attempts"] > 0 and p["correct"] / p["attempts"] < 0.7]
    strong = [p for p in progress if p["attempts"] > 0 and p["correct"] / p["attempts"] >= 0.8]

    weak_text = ", ".join(f"{p['subject']} ({p['correct']}/{p['attempts']})" for p in weak[:3]) or "none yet"
    strong_text = ", ".join(f"{p['subject']}" for p in strong[:3]) or "none yet"

    prompt = f"""A student is studying for NYC Regents exams. Based on their progress:

Struggling with: {weak_text}
Doing well in: {strong_text}

Give them a short, encouraging 2-3 sentence study recommendation. Tell them exactly what to focus on next. Use emojis. Be their hype person! Keep it under 50 words."""

    msg = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text
