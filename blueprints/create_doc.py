from googleapiclient.discovery import build
from flask import Blueprint, jsonify, request
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from config import template_doc_id as template_doc_id
from config import google_id as google_id
from config import google_secret as google_secret
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError
from flask_login import current_user, login_required
from models import db, User, OAuth as OAuthModel
import re

create_doc = Blueprint("create_doc", __name__)


@create_doc.route("/create-doc", methods=["POST"])
@login_required
def create_doc_function():
    oauth_model = OAuthModel.query.filter_by(
        provider="google", user_id=current_user.id
    ).first()

    if not oauth_model:
        return jsonify({"error": "User must be logged in to Google"}), 403

    token = oauth_model.token

    if not token:
        return jsonify({"error": "You must log in"}), 401

    # If refresh_token is present in token, use it, and save it in database
    if "refresh_token" in token:
        oauth_model.refresh_token = token["refresh_token"]
        db.session.commit()
        refresh_token = token["refresh_token"]
    else:
        # If refresh_token is not present in token, use the one stored in database (if it exists)
        refresh_token = oauth_model.refresh_token

    creds = Credentials(
        token=token["access_token"],
        id_token=token.get("id_token", None),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=google_id,
        client_secret=google_secret,
        enable_reauth_refresh=True,
        refresh_token=refresh_token,
        scopes=[
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/drive",
        ],
    )

    print(f"Token: {creds.token}")
    print(f"Refresh Token: {creds.refresh_token}")
    print(f"ID Token: {creds.id_token}")
    print(f"Token URI: {creds.token_uri}")
    print(f"Client ID: {creds.client_id}")
    print(f"Client Secret: {creds.client_secret}")
    print(f"Expiry: {creds.expired}")
    print(f"Scopes: {creds.scopes}")

    # Extract data from JSON request
    proposal_json = request.get_json(force=True)

    # Keys to extract from the JSON
    keys = [
        "month",
        "project-name",
        "project-title",
        "client-main-goal",
        "client-name",
        "project-main-outcome",
        "goal-of-the-project",
        "type-of-information",
        "expected-time-in-weeks",
    ]

    # Populate variables dictionary and create document body
    variables = {}
    proposal_dict = proposal_json.get("proposalJson")
    if proposal_dict:
        document_body = "\n\n".join(
            remove_markdown(item["response"])
            for item in proposal_dict.values()
            if "response" in item
        )
        document_body_paragraphs = document_body.split("\n\n")
    else:
        document_body_paragraphs = []

    # Fill up the remaining with empty strings if less than 50
    document_body_paragraphs += [""] * (50 - len(document_body_paragraphs))

    for i, paragraph in enumerate(document_body_paragraphs):
        variables[f"document-body-{i+1}"] = paragraph

    for key in keys:
        variables[key] = proposal_json.get(key)

    # Create requests array
    requests = [
        {
            "replaceAllText": {
                "containsText": {
                    "text": "{{" + var + "}}",
                    "matchCase": "true",
                },
                "replaceText": value,
            }
        }
        for var, value in variables.items()
    ]

    docs_service = build("docs", "v1", credentials=creds)

    # ID of the Google Docs document to be copied
    DOCUMENT_ID = template_doc_id

    # Make a copy of the template document
    try:
        copy_title = proposal_json.get("project-name")
        body = {"name": copy_title}
        drive_service = build("drive", "v3", credentials=creds)
        copied_doc = drive_service.files().copy(fileId=DOCUMENT_ID, body=body).execute()
        document_id = copied_doc["id"]
        print(f"Copied doc ID: {document_id}")
    except HttpError as error:
        print(f"An error has occurred: {error}")
        return (
            jsonify(
                {
                    "error": f"Please, save your document, log out and log in again{error}"
                }
            ),
            200,
        )

    result = (
        docs_service.documents()
        .batchUpdate(documentId=document_id, body={"requests": requests})
        .execute()
    )
    return (
        jsonify({"document_id": f"https://docs.google.com/document/d/{document_id}"}),
        200,
    )


def remove_markdown(md):
    md = re.sub(r"#.*\n", "", md)
    md = re.sub(r"\[.*\]\(.*\)", "", md)
    md = re.sub(r"\*.*\*", "", md)
    md = re.sub(r"`.*`", "", md)
    md = md.replace("\n", " ")
    return md
