from googleapiclient.discovery import build
from flask import Blueprint, redirect, url_for, session, jsonify
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from flask_dance.contrib.google import google
from config import template_doc_id as template_doc_id
from google.oauth2.credentials import Credentials
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError

create_doc = Blueprint("create_doc", __name__)


@create_doc.route("/create-doc", methods=["POST"])
def create_doc_function():
    # Get the token info from the session
    token = session.get("google_token")

    if not token:
        return jsonify({"error": "You must log in"}), 401

    # Create a credentials object
    creds = Credentials.from_authorized_user_info(token)

    # If the credentials are expired and a refresh token is available, refresh the credentials
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except RefreshError as e:
            return jsonify({"error": "Access token could not be refreshed"}), 401

    docs_service = build("docs", "v1", credentials=creds)

    # ID of the Google Docs document to be copied
    DOCUMENT_ID = template_doc_id

    # Make a copy of the template document
    try:
        copy_title = "My New Document"
        body = {"name": copy_title}
        drive_service = build("drive", "v3", credentials=creds)
        copied_doc = drive_service.files().copy(fileId=DOCUMENT_ID, body=body).execute()
        document_id = copied_doc["id"]
        print(f"Copied doc ID: {document_id}")
    except HttpError as error:
        print(f"An error has occurred: {error}")

    # Now, let's say you want to replace some placeholders in the copied doc.
    # You can use the BatchUpdate method for this.

    requests = [
        {
            "replaceAllText": {
                "containsText": {
                    "text": "{{var1}}",
                    "matchCase": "true",
                },
                "replaceText": "Replacement for var1",
            }
        },
        {
            "replaceAllText": {
                "containsText": {
                    "text": "{{var2}}",
                    "matchCase": "true",
                },
                "replaceText": "Replacement for var2",
            }
        },
    ]

    result = (
        docs_service.documents()
        .batchUpdate(documentId=document_id, body={"requests": requests})
        .execute()
    )
