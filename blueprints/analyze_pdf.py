from flask import Blueprint, request, jsonify
import os

from blueprints.vectorstore_manager import VectorStoreManager

import asyncio
from flask_login import login_required


analyze_pdf = Blueprint("analyze_pdf", __name__)

vectorstore_manager = VectorStoreManager()


@analyze_pdf.route("/analyze-pdf", methods=["POST"])
@login_required
def analyze_pdf_function():
    index_name = request.form.get("index-name")
    print(index_name)
    _, qa = vectorstore_manager.get_vectorstore(index_name)

    output_dict = {}
    if (
        request.form.get("analysis-type") == "general-data"
        and "iteration" in request.form
    ):
        "month"
        # 'proposal-title'
        # 'client-name'
        # 'project-name'
        # 'client-main-goal'
        # 'project-main-outcome'
        # 'goal-of-the-project'
        # 'ype-of-information'
        # 'expected-time-in-weeks'
        prompts = [
            {
                "title": "proposal-title",
                "prompt": "respond in a short and concise way using as few words as possible, just give the answer to this: what is a good name for this proposal",
            },
            {
                "title": "client-name",
                "prompt": "respond in a short and concise way using as few words as possible, just give the answer to this: what is the client name",
            },
            {
                "title": "client-main-goal",
                "prompt": "respond in a short and concise way using as few words as possible, just give the answer to this: what need is this project filling",
            },
            {
                "title": "project-main-outcome",
                "prompt": "respond in a short and concise way using as few words as possible, just give the answer to this: what is the main outcome of this project",
            },
            {
                "title": "goal-of-the-project",
                "prompt": "respond in a short and concise way using as few words as possible, just give the answer to this: what will be a user thinking or planning to use this project",
            },
            {
                "title": "type-of-information",
                "prompt": "respond in a short and concise way using as few words as possible, just give the answer to this: what topic is this about, choose from: sustainability, environmental, investment, climate, biodiversity, none",
            },
            {
                "title": "expected-time-in-weeks",
                "prompt": "respond in a short and concise way using as few words as possible, just give the answer to this: what is the expected time for development in weeks, say none if you don't know",
            },
        ]
        iteration_index = int(request.form.get("iteration"))
        prompts = [prompts[iteration_index]]
    elif (
        request.form.get("analysis-type") == "initial-analysis"
        and "iteration" in request.form
    ):
        prompts = [
            {
                "title": "Engagement Objective",
                "prompt": "what are the project goals of this project",
            },
            {
                "title": "Promotion & Stakeholders",
                "prompt": "Who is promoting this engagement and who are the stakeholders",
            },
            {
                "title": "Reason",
                "prompt": "why this is needed, what problems will it solve.",
            },
            {
                "title": "Business Requirements",
                "prompt": "Write an exhaustive list of business requirements. Each one should include who will use, what must be done, and why it is needed",
            },
            {
                "title": "Timeline",
                "prompt": "when this is needed, what are possible project phases or milestones",
            },
            {
                "title": "Features",
                "prompt": "Give me a complete list of demanded features",
            },
            {
                "title": "Technical Requirements",
                "prompt": "What technologies are demanded, is there any technical requirement explicit? Add a list if so.",
            },
            {
                "title": "Risks & Caveats",
                "prompt": "List any possible risks or caveats",
            },
            {
                "title": "Initial Platform Status",
                "prompt": "Describe what has been developed before, if there is any user research, design, or if this is a new phase over an existing product.",
            },
            {
                "title": "Special Conditions",
                "prompt": "Describe if there is any risk or special conditions",
            },
        ]
        iteration_index = int(request.form.get("iteration"))
        prompts = [prompts[iteration_index]]
    elif request.form.get("analysis-type") == "new-section":
        prompts = [
            {
                "title": request.form.get("section-title"),
                "prompt": request.form.get("section-prompt"),
            }
        ]
    elif request.form.get("analysis-type") == "elaborate":
        original_prompt = request.form.get("section-prompt")
        prompt = f"""Find all related information to this text, in the most elaborated way possible; avoid repetition: {original_prompt} """
        prompts = [
            {"title": "elaboratedSection", "prompt": prompt},
        ]

    for prompt in prompts:
        # asyncio.run creates a new event loop and runs the coroutine until it's done
        prompt, result = asyncio.run(ask_pdf(prompt, qa))  # pass qa to ask_pdf function
        output_dict[prompt] = result
    print(output_dict)
    return jsonify(output_dict), 200


async def ask_pdf(prompt_obj, qa):  # receive qa as an argument
    try:
        # Let's run the blocking function in a separate thread using asyncio.to_thread
        response = await asyncio.to_thread(qa.run, prompt_obj["prompt"])

    except Exception as e:
        response = None
    finally:
        return prompt_obj["title"], {
            "question": prompt_obj["prompt"],
            "response": response,
        }
