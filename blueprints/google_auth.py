from authlib.integrations.flask_client import OAuth
from flask_login import login_required, login_user, logout_user, current_user
from flask import Blueprint, redirect, url_for, session, request, jsonify
from config import google_id as google_id
from config import google_secret as google_secret
from models import db, User, OAuth as OAuthModel
import uuid

google_auth = Blueprint("google_auth", __name__)

oauth = OAuth()

# Configure Google OAuth2
oauth.register(
    "google",
    client_id=google_id,
    client_secret=google_secret,
    access_token_url="https://accounts.google.com/o/oauth2/token",
    access_token_params=None,
    authorize_params={
        "access_type": "offline",
        "prompt": "consent",
    },  # Add this line to request refresh token
    refresh_token_url=None,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    api_base_url="https://www.googleapis.com/oauth2/v1/",
    client_kwargs={
        "scope": "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive"
    },
)


@google_auth.route("/login")
def login():
    redirect_uri = url_for("google_auth.authorize", _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@google_auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("routes.login"))


@google_auth.route("/login/google/authorized")
def authorize():
    token = oauth.google.authorize_access_token()
    resp = oauth.google.get("userinfo")
    user_info = resp.json()

    user = User.query.filter_by(id=user_info["id"]).first()

    if not user:
        user = User(id=user_info["id"], email=user_info["email"])
        db.session.add(user)

    oauth_model = OAuthModel.query.filter_by(provider="google", user_id=user.id).first()

    if not oauth_model:
        oauth_model = OAuthModel(
            id=str(uuid.uuid4()),
            provider="google",
            provider_user_id=user_info["id"],
            token=token,
            user=user,
            refresh_token=token.get("refresh_token", None),
        )
    else:
        oauth_model.token = token
        # Update refresh_token only if a new one has been issued
        if "refresh_token" in token:
            oauth_model.refresh_token = token["refresh_token"]

    db.session.add(oauth_model)
    db.session.commit()
    login_user(user)

    return redirect(url_for("routes.index"))
