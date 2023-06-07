import os

from flask import Flask

from blueprints.routes import routes
from blueprints.pdf_uploader import pdf_uploader
from blueprints.analyze_pdf import analyze_pdf
from blueprints.similarity import similarity
from blueprints.askgpt import ask_gpt
from blueprints.solve import solve
from blueprints.save_proposal import save_proposal
from config import openai_api_key as openai_api_key
from config import secret_key as secret_key

app = Flask(__name__)
app.secret_key = secret_key
app.config["ENV"] = os.environ.get("FLASK_ENV", "production")
app.register_blueprint(routes)
app.register_blueprint(pdf_uploader)
app.register_blueprint(analyze_pdf)
app.register_blueprint(similarity)
app.register_blueprint(ask_gpt)
app.register_blueprint(solve)
app.register_blueprint(save_proposal)

if __name__ == "__main__":
    app.run()
