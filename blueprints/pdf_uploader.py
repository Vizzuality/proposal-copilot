from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from config import upload_folder as upload_folder

from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

pdf_uploader = Blueprint("pdf_uploader", __name__)

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@pdf_uploader.route("/pdf-upload", methods=["POST"])
async def pdf_upload():
    if "file" not in request.files:
        return jsonify(error="No file part"), 400
    file = request.files["file"]

    if file.filename == "":
        return jsonify(error="No selected file"), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        pdf_route = os.path.join(upload_folder, filename)
        file.save(pdf_route)

        loader = PyPDFLoader(file_path=pdf_route)
        documents = loader.load()

        text_splitter = CharacterTextSplitter(
            chunk_size=1000, chunk_overlap=30, separator="\n"
        )
        docs = text_splitter.split_documents(documents=documents)
        embeddings = OpenAIEmbeddings()

        vectorstore = FAISS.from_documents(docs, embeddings)
        vectorstore.save_local("faiss_index_react")

        new_vectorstore = FAISS.load_local("faiss_index_react", embeddings)
        qa = RetrievalQA.from_chain_type(
            llm=OpenAI(), chain_type="stuff", retriever=new_vectorstore.as_retriever()
        )
        response = qa.run("Search a short title for the project")
        print(response)
        return jsonify(status="File successfully uploaded", response=response), 200

    return jsonify(error="File not allowed"), 400
