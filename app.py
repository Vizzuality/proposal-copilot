import os

from flask import Flask
from flask_migrate import Migrate
from config import openai_api_key as openai_api_key
from config import secret_key as secret_key
from models import db, User
from sqlalchemy import inspect
from flask_login import LoginManager
from blueprints.routes import routes
from blueprints.pdf_uploader import pdf_uploader
from blueprints.analyze_pdf import analyze_pdf
from blueprints.similarity import similarity
from blueprints.askgpt import ask_gpt
from blueprints.solve import solve
from blueprints.save_proposal import save_proposal
from blueprints.documents import documents
from blueprints.create_doc import create_doc
from blueprints.google_auth import google_auth, oauth


def create_app(config_filename=None):
    app = Flask(__name__)
    app.config.from_pyfile("config.py")
    app.config["SQLALCHEMY_ECHO"] = True

    oauth.init_app(app)

    db.init_app(app)

    with app.app_context():
        inspector = inspect(db.engine)
        if not inspector.has_table("user"):
            db.create_all()
        else:
            print("table already created")

    migrate = Migrate(app, db)

    app.secret_key = secret_key
    app.config["ENV"] = os.environ.get("FLASK_ENV", "production")

    app.register_blueprint(routes)
    app.register_blueprint(pdf_uploader)
    app.register_blueprint(analyze_pdf)
    app.register_blueprint(similarity)
    app.register_blueprint(ask_gpt)
    app.register_blueprint(solve)
    app.register_blueprint(save_proposal)
    app.register_blueprint(create_doc)
    app.register_blueprint(documents)
    app.register_blueprint(google_auth, url_prefix="/login")

    # Setup Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)

    return app


app = create_app()

if __name__ == "__main__":
    app.run()
