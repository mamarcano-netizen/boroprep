import os, bcrypt
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import db

SCOPES = ["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
REDIRECT_URI = os.environ.get("REDIRECT_URI", "http://localhost:8000/auth/google/callback")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def get_google_flow():
    return Flow.from_client_config(
        {"web": {
            "client_id": os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "redirect_uris": [REDIRECT_URI],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }},
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

def get_google_auth_url():
    flow = get_google_flow()
    url, _ = flow.authorization_url(access_type="offline", prompt="consent")
    return url

def handle_google_callback(code: str):
    flow = get_google_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    info = id_token.verify_oauth2_token(creds.id_token, grequests.Request(), os.environ["GOOGLE_CLIENT_ID"])
    google_id = info["sub"]
    email = info["email"]
    name = info.get("name", email.split("@")[0])
    user = db.get_user_by_google_id(google_id)
    if not user:
        user = db.get_user_by_email(email)
        if not user:
            uid = db.create_user(name, email, google_id=google_id)
            user = db.get_user_by_id(uid)
    return user

def signup_email(name: str, email: str, password: str, role: str = "student"):
    existing = db.get_user_by_email(email)
    if existing:
        return None, "Email already registered"
    hashed = hash_password(password)
    uid = db.create_user(name, email, password_hash=hashed, role=role)
    return db.get_user_by_id(uid), None

def login_email(email: str, password: str):
    user = db.get_user_by_email(email)
    if not user or not user.get("password_hash"):
        return None, "Invalid email or password"
    if not check_password(password, user["password_hash"]):
        return None, "Invalid email or password"
    return user, None

def get_current_user(token: str):
    if not token:
        return None
    session = db.get_session(token)
    if not session:
        return None
    return db.get_user_by_id(session["user_id"])
