import os
from flask import Flask, Blueprint
from blueprints.routes import routes
from blueprints.routes import routes
from config import secret_key as secret_key

app = Flask(__name__)
app.secret_key = secret_key
app.config["ENV"] = os.environ.get("FLASK_ENV", "production")
app.register_blueprint(routes)

if __name__ == "__main__":
    app.run()
