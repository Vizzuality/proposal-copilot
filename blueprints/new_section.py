from flask import Blueprint, request, jsonify
import os

from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.llms import OpenAI
import asyncio

new_section = Blueprint("new_section", __name__)
output_dict = {}
embeddings = OpenAIEmbeddings()
new_vectorstore = FAISS.load_local("faiss_index_react", embeddings)
qa = RetrievalQA.from_chain_type(
    llm=OpenAI(), chain_type="stuff", retriever=new_vectorstore.as_retriever()
)


@new_section.route("/new-section", methods=["POST"])
def new_section_function():
    prompts = [
        {
            "title": "User Prompt",
            "prompt": request.form.get("section-prompt"),
        },
        {
            "title": "Engagement Objective",
            "prompt": "what is The primary objective of this engagement",
        },
        {
            "title": "Promotion & Stakeholders",
            "prompt": "Who is promoting this engagement and stakeholders",
        },
        {
            "title": "Reason",
            "prompt": "why this is needed",
        },
        {
            "title": "Timeline",
            "prompt": "when this is needed",
        },
        {
            "title": "Todo List",
            "prompt": "Give me the whole list of things to do",
        },
        {
            "title": "Technical Requirements",
            "prompt": "List any possible technical requirement",
        },
        {
            "title": "Risks & Caveats",
            "prompt": "List any possible risk or caveat",
        },
        {
            "title": "Initial Platform Status",
            "prompt": "Describe if there is current status of the platform, if there was something developed before, also posssible technologies used",
        },
        {
            "title": "Special Conditions",
            "prompt": "Describe if there is any risk or special condition",
        },
    ]

    for prompt in prompts:
        # asyncio.run creates a new event loop and runs the coroutine until it's done
        prompt, result = asyncio.run(ask_pdf(prompt))
        output_dict[prompt] = result
    print(jsonify(output_dict))
    return jsonify(output_dict), 200


async def ask_pdf(prompt_obj):
    try:
        # Let's run the blocking function in a separate thread using asyncio.to_thread
        response = await asyncio.to_thread(qa.run, prompt_obj["prompt"])
        print(response)
    except Exception as e:
        response = None
    finally:
        return prompt_obj["title"], {
            "question": prompt_obj["prompt"],
            "response": response,
        }
