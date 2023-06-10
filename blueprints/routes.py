from flask import (
    Blueprint,
    request,
    render_template,
    send_from_directory,
    current_app,
    redirect,
    url_for,
)
from flask_login import login_required, current_user, logout_user


routes = Blueprint("routes", __name__)


@routes.route("/robots.txt")
def robots_txt():
    return send_from_directory(current_app.root_path, "robots.txt")


@routes.route("/login")
def login():
    return render_template("login.html")


@routes.route("/")
def index():
    if current_user.is_authenticated:
        return render_template("index.html")
    else:
        return render_template("login.html")


@routes.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("routes.login"))
