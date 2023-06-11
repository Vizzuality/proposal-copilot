import os
from dotenv import load_dotenv

load_dotenv()
basedir = os.path.abspath(os.path.dirname(__file__))
import logging

logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)

SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(basedir, "storage/db/app.db")
SQLALCHEMY_TRACK_MODIFICATIONS = False
openai_api_key = os.getenv("OPENAI_API_KEY")
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = os.getenv(
    "OAUTHLIB_INSECURE_TRANSPORT", "1"
)
secret_key = os.getenv("SECRET_KEY")
upload_folder = os.getenv("UPLOAD_FOLDER")
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pinecone_env = os.getenv("PINECONE_ENV")
chat_model = os.getenv("CHAT_MODEL")
google_auth = os.getenv("GOOGLE_AUTH")
google_id = os.getenv("GOOGLE_ID")
google_secret = os.getenv("GOOGLE_SECRET")
template_doc_id = os.getenv("TEMPLATE_DOC_ID")
