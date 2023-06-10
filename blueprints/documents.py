from flask import Blueprint, jsonify, request
from flask_login import login_required
import os
import json
import glob


documents = Blueprint("documents", __name__)


@documents.route("/documents", methods=["POST"])
@login_required
def documents_function():
    path = "storage/proposals/*.json"

    file_list = glob.glob(path)

    result = []

    for file in file_list:
        filename = os.path.basename(file)
        name, ext = os.path.splitext(filename)
        stripped_name = name.split("-")[0]
        result.append({"id": filename, "name": stripped_name})

    return jsonify(result)
