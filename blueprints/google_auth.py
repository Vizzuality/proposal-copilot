from flask import Blueprint, redirect, url_for, session, flash
from flask_dance.contrib.google import make_google_blueprint, google
from flask_dance.consumer import oauth_authorized, oauth_error
from flask_dance.consumer.storage.sqla import SQLAlchemyStorage
from flask_login import login_user, UserMixin, LoginManager, logout_user, current_user
from config import google_id as google_id
from config import google_secret as google_secret
from oauthlib.oauth2.rfc6749.errors import TokenExpiredError
from models import db, User, OAuth

google_auth = Blueprint("google_auth", __name__)

login_manager = LoginManager()


google_bp = make_google_blueprint(
    client_id=google_id,
    client_secret=google_secret,
    offline=True,
    scope=[
        "https://www.googleapis.com/auth/userinfo.email",
        "openid",
        "https://www.googleapis.com/auth/drive",
    ],
    storage=SQLAlchemyStorage(OAuth, db.session, user=current_user),
)


@google_auth.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("routes.login"))


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)


@oauth_authorized.connect_via(google_bp)
def google_logged_in(blueprint, token):
    if not token:
        flash("Failed to log in with Google.", category="error")
        return False

    resp = blueprint.session.get("/oauth2/v1/userinfo")
    if not resp.ok:
        flash("Could not authenticate with Google", category="error")
        return False

    user_data = resp.json()
    user = User.query.filter_by(id=user_data["id"]).first()

    if not user:
        user = User(id=user_data["id"], email=user_data["email"])
        db.session.add(user)

    oauth = OAuth.query.filter_by(provider=blueprint.name, user_id=user.id).first()

    if not oauth:
        oauth = OAuth(
            provider=blueprint.name,
            provider_user_id=user_data["id"],
            token=token,
            user=user,
        )
    else:
        oauth.token = token

    db.session.add(oauth)
    db.session.commit()
    login_user(user)


@oauth_error.connect_via(google_bp)
def google_error(blueprint, error, error_description=None, error_uri=None):
    msg = (
        f"OAuth error from {blueprint.name}! "
        f"error={error} description={error_description} uri={error_uri}"
    )
    flash(msg, category="error")
