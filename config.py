import os
from dotenv import load_dotenv

load_dotenv()

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
