import os
import uuid
import json

from flask import Blueprint, jsonify, request
from flask_login import login_required

save_proposal = Blueprint("save_proposal", __name__)


@save_proposal.route("/save-proposal", methods=["POST"])
@login_required
def save_json():
    try:
        # Parse JSON
        proposal_json = request.get_json(force=True)

        # Extract values
        project_name = proposal_json.get("project-name")
        proposal_uid = proposal_json.get("proposal-uid")

        if not project_name:
            raise ValueError("Missing 'project name' Analyze or write a project name.")

        if not proposal_uid:
            proposal_uid = uuid.uuid4()
            filename = f"{project_name}-uid{proposal_uid}.json"
        else:
            filename = proposal_uid

        # Create directory if it doesn't exist
        directory = "storage/proposals"
        os.makedirs(directory, exist_ok=True)

        # Define filename and path
        file_path = os.path.join(directory, filename)

        # Write JSON file
        with open(file_path, "w") as file:
            json.dump(proposal_json, file)

        return (
            jsonify({"message": "File saved successfully.", "proposal_uid": filename}),
            200,
        )

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to decode JSON."}), 400

    except OSError as e:
        return jsonify({"error": f"Failed to write file: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
