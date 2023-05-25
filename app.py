import os

from flask import Flask

from blueprints.routes import routes
from blueprints.pdf_uploader import pdf_uploader
from config import openai_api_key as openai_api_key
from config import secret_key as secret_key

app = Flask(__name__)
app.secret_key = secret_key
app.config["ENV"] = os.environ.get("FLASK_ENV", "production")
app.register_blueprint(routes)
app.register_blueprint(pdf_uploader)

if __name__ == "__main__":
    app.run()
