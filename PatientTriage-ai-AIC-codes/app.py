from flask import Flask, render_template, request, jsonify

from triage_engine import assess_patient


app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/assess", methods=["POST"])
def assess():
    patient = request.get_json()

    result = assess_patient(patient)

    return jsonify(result)

@app.route("/reassess", methods=["POST"])
def reassess():
    """
    Reassess an existing patient using updated information.
    """

    patient = request.get_json()

    result = assess_patient(patient)

    return jsonify(result)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "ai_available": True
    })


if __name__ == "__main__":
    app.run(debug=True)