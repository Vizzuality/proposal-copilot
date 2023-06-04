from flask import Blueprint, jsonify, request
from tree_of_thoughts import OptimizedOpenAILanguageModel
from tree_of_thoughts import TreeofThoughts
from config import openai_api_key as openai_api_key
from config import chat_model as chat_model

solve = Blueprint("solve", __name__)


@solve.route("/solve", methods=["POST"])
def solve_function():
    title = request.form.get("section-title")
    prompt_str = request.form.get("section-prompt")
    output_dict = {}

    model = OptimizedOpenAILanguageModel(api_model=chat_model, api_key=openai_api_key)

    # choose search algorithm('BFS' or 'DFS')
    search_algorithm = "BFS"

    # cot or propose
    strategy = "cot"

    # value or vote
    evaluation_strategy = "value"

    # initialize the class
    tree_of_thoughts = TreeofThoughts(model, search_algorithm)

    # enter an problem if you want!
    # input_problem = "use 4 numbers and basic arithmetic operations (+-*/) to obtain 24"  #
    input_problem = prompt_str
    # note for superior intelligent responses you'll have to be more explicit in your prompt and select a better model

    num_thoughts = 5
    max_steps = 3
    max_states = 5
    value_threshold = 0.5
    solution = tree_of_thoughts.solve(
        input_problem,
        num_thoughts=num_thoughts,
        max_steps=max_steps,
        max_states=max_states,
        value_threshold=value_threshold,
    )
    solution_str = " ".join(solution)
    print(solution_str)
    title, result = title, {
        "question": prompt_str,
        "response": solution_str,
    }
    output_dict[title] = result
    print(output_dict)
    return jsonify(output_dict), 200
