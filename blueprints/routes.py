from flask import Blueprint, request, render_template, send_from_directory, current_app

routes = Blueprint("routes", __name__)


@routes.route("/robots.txt")
def robots_txt():
    return send_from_directory(current_app.root_path, "robots.txt")


@routes.route("/")
def index():
    return render_template("index.html")
