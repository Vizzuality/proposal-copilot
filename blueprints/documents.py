from flask import Blueprint, jsonify, request
from flask_login import login_required
import os
import json
import glob


documents = Blueprint("documents", __name__)


@documents.route("/documents", methods=["GET"])
@login_required
def list_documents():
    path = "storage/proposals/*.json"
    file_list = glob.glob(path)

    result = []

    for file in file_list:
        filename = os.path.basename(file)
        name, ext = os.path.splitext(filename)
        stripped_name = name.split("-")[0]
        result.append({"id": filename, "name": stripped_name})

    return jsonify(result)


@documents.route("/documents/<id>", methods=["GET"])
@login_required
def get_document(id):
    path = "storage/proposals/" + id
    print(path)
    if os.path.isfile(path):
        with open(path, "r") as f:
            file_content = json.load(f)
        return jsonify(file_content)
    else:
        return jsonify({"error": "File not found"}), 404
