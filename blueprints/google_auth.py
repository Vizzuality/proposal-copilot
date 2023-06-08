from flask import Blueprint, redirect, url_for, session, flash
from flask_dance.contrib.google import make_google_blueprint, google
from flask_dance.consumer import oauth_authorized, oauth_error
from flask_login import login_user, UserMixin, LoginManager, logout_user
from config import google_id as google_id
from config import google_secret as google_secret
from oauthlib.oauth2.rfc6749.errors import TokenExpiredError


login_manager = LoginManager()


# User class without database
class User(UserMixin):
    def __init__(self, id, email):
        self.id = id
        self.email = email


google_auth = Blueprint("google_auth", __name__)

google_bp = make_google_blueprint(
    client_id=google_id,
    client_secret=google_secret,
    offline=True,
    scope=[
        "https://www.googleapis.com/auth/userinfo.email",
        "openid",
        "https://www.googleapis.com/auth/drive",
    ],
)


@google_auth.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("routes.login"))


@login_manager.user_loader
def load_user(user_id):
    user = session.get("user")
    if user is not None and user.get("id") == user_id:
        return User(
            id=user["id"],
            email=user["email"],
        )
    return None


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
    user = User(id=user_data["id"], email=user_data["email"])
    login_user(user)

    # here we are saving the user data and token information in session
    session["user"] = user_data
    session["google_token"] = {
        "token": token["access_token"],
        "refresh_token": token.get("refresh_token"),
        "client_id": blueprint.client_id,
        "client_secret": blueprint.client_secret,
    }
    return redirect(url_for("routes.index"))


@oauth_error.connect_via(google_bp)
def google_error(blueprint, error, error_description=None, error_uri=None):
    msg = (
        f"OAuth error from {blueprint.name}! "
        f"error={error} description={error_description} uri={error_uri}"
    )
    flash(msg, category="error")
