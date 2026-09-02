# PatientTriage-ai-AIC-2026
AI-assisted emergency department triage and dynamic patient prioritization

## Introduction

PatientTriage.ai is an AI-assisted emergency department triage and
patient prioritization prototype designed to support clinical staff
during periods of high patient volume. The system converts patient
information into a structured priority assessment and maintains a
live queue that can adapt as patient conditions and waiting times
change.

The system is designed as a clinical decision-support tool rather
than a diagnostic system. It keeps healthcare professionals in the
decision-making loop by providing explainable recommendations,
reassessment capabilities, human overrides, and fallback manual
triage when the AI service is unavailable.

## Features

- Dynamic priority queue with automatic re-ranking
- Rule-based triage assessment with explainable reasons
- Waiting-time monitoring and reassessment alerts
- Patient update and reassessment workflow
- Nurse priority override with recorded reason
- Audit log and assessment history
- Manual triage mode for simulated AI unavailability
- Surge simulation for high patient volume
- Browser-based state persistence

## Architecture

PatientTriage.ai follows a lightweight client-server architecture.
The frontend handles patient input, queue management and user
interaction, while the Flask backend provides the assessment API and
connects the application to the triage engine.

```text
                    Clinical Staff
                         |
                         v
              +------------------------+
              |      Web Frontend      |
              | HTML / CSS / JavaScript|
              +----------+-------------+
                         |
                    HTTP / JSON
                         |
                         v
              +----------------------+
              |     Flask Backend    |
              | /assess /reassess    |
              |       /health        |
              +----------+-----------+
                         |
                         v
              +----------------------+
              |    Triage Engine     |
              |   Python rule-based  |
              |      assessment      |
              +----------+-----------+
                         |
                         v
          Priority + Confidence + Reasons
                         |
                         v
              +----------------------+
              |    Patient Queue     |
              | Monitoring / History |
              |     / Audit Log      |
              +----------------------+
```

The Flask routes and their connection to `assess_patient()` are present in the current backend.

---

# 2. How It Works


PatientTriage.ai follows a continuous workflow rather than treating
triage as a single classification step.

```text
Patient Information
        |
        v
Initial Assessment
        |
        v
Priority + Confidence + Deterioration Risk
        |
        v
Live Priority Queue
        |
        v
Waiting-Time Monitoring
        |
        +------> Reassessment Required
                       |
                       v
                Updated Information
                       |
                       v
                 New Assessment
                       |
                       v
                 Updated Queue
```


The frontend creates an assessment history entry at initial assessment and stores the current patient information alongside the result.

---

# 3. Triage Engine

The PatientTriage.ai prototype uses a structured, rule-based triage
engine implemented in Python. It is designed to demonstrate how
multiple patient factors can be combined into a priority recommendation
while keeping the assessment logic transparent and inspectable.

The engine does not diagnose patients. Instead, it evaluates the
available information and returns:

- **Priority** — the current urgency category.
- **Confidence** — an indication of confidence in the prototype
  recommendation.
- **Deterioration Risk** — the estimated risk level used by the
  prototype.
- **Reasons** — the factors that contributed to the recommendation.

### Priority Evaluation

The engine evaluates higher-acuity conditions before lower-acuity
conditions. The main priority levels are:

```text
CRITICAL
   |
   v
 HIGH
   |
   v
 URGENT
   |
   v
URGENT REVIEW
   |
   v
MODERATE
   |
   v
  LOW
```

## Requirements

### Software

- Python 3.9 or later
- `pip`
- Git

### Python Dependency

The backend requires Flask.

```text
Flask
```

No external database or machine-learning framework is required for the
current prototype. The triage engine is implemented as a local Python
module.

### Browser

A modern web browser such as Google Chrome, Microsoft Edge or Mozilla
Firefox is recommended.

---

## Installation

Clone the repository and move into the project directory:

```bash
git clone <repository-url>
cd PatientTriage-ai-AIC-2026
```

Create and activate a Python virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the required dependency:

```bash
pip install Flask
```

The project should have the following basic structure:

```text
PatientTriage-ai-AIC-2026/
|
+-- app.py
+-- triage_engine.py
|
+-- templates/
|   +-- index.html
|
+-- static/
    +-- app.js
    +-- style.css
```

---

## Running

After installation, activate the virtual environment and start the
Flask application:

```bash
python app.py
```

The application will start on the local Flask development server.

Open the address shown in the terminal, typically:

```text
http://127.0.0.1:5000
```

The PatientTriage.ai interface should then open in the browser.

### Using the Prototype

1. Open **Add Patient** to enter a new patient record.
2. Enter the available triage information.
3. Select **Assess Patient** to generate the initial recommendation.
4. Review the patient's priority in the live queue.
5. Open **View Details** to inspect the recommendation and supporting
   information.
6. Use **Update / Reassess** when patient information changes.
7. Use **Nurse Override** when clinical judgment requires a different
   priority.
8. Use **Simulate Surge** to demonstrate operation with increased
   patient volume.
9. Use **Clear Queue** to reset the current demonstration state.

The prototype runs locally and does not require an external database or
cloud service for the demonstrated workflow.

## Usage

PatientTriage.ai can be used to simulate an emergency-department triage
workflow from initial assessment through reassessment.

### Initial Triage

1. Open the application in the browser.
2. Select **Add Patient**.
3. Enter the available patient information, including symptoms,
   vital signs, medical history, medications, mobility, and
   consciousness where applicable.
4. Submit the patient for assessment.
5. Review the generated priority, confidence, deterioration risk, and
   supporting reasons.
6. The patient is added to the live priority queue.

### Reassessment

When new information becomes available:

1. Open the patient's details.
2. Update the relevant patient information.
3. Select **Reassess**.
4. Review the updated recommendation.
5. The queue is automatically updated if the patient's priority changes.

### Human Override

Clinical staff can override an AI-generated priority when required.
The override requires a reason and is recorded in the assessment history
and audit log.

### Demonstration Controls

The prototype also provides demonstration controls:

- **Load Demo Queue** — loads a predefined set of patients.
- **Simulate Surge** — increases the demonstration queue to simulate
  high patient volume.
- **Clear Queue** — removes the current queue and resets the
  demonstration state.

---

## Project Structure

```text
PatientTriage-ai-AIC-2026/
|
+-- app.py
+-- triage_engine.py
+-- requirements.txt
+-- README.md
|
+-- templates/
|   +-- index.html
|
+-- static/
|   +-- app.js
|   +-- style.css
|
+-- .gitignore
```

### Main Components

| File / Directory | Purpose |
|---|---|
| `app.py` | Flask application and API routes |
| `triage_engine.py` | Rule-based triage assessment logic |
| `templates/index.html` | Main application interface |
| `static/app.js` | Frontend logic, queue management, reassessment, and interactions |
| `static/style.css` | User interface styling |
| `requirements.txt` | Python dependencies |
| `README.md` | Project documentation |

The Flask backend exposes the main assessment, reassessment, and health
endpoints and passes patient information to the triage engine.

---

## Limitations

PatientTriage.ai is a prototype developed to demonstrate an
AI-assisted dynamic triage workflow. It has several important
limitations.

- **Rule-based prototype:** The current triage engine uses structured
  Python rules rather than a clinically trained machine-learning model.
- **No clinical validation:** The recommendations and thresholds have
  not been clinically validated and must not be used for real patient
  care.
- **Prototype thresholds:** Waiting-time and reassessment thresholds are
  demonstration parameters and do not represent hospital clinical
  protocols.
- **Limited data sources:** The prototype uses manually entered patient
  information and does not connect to real EHR, laboratory, imaging, or
  hospital information systems.
- **Simulated AI availability:** The current backend health endpoint
  reports the AI service as available; offline/manual triage behaviour
  is demonstrated at the application level rather than through a
  production AI infrastructure. 
- **Local prototype deployment:** The application is designed for local
  demonstration using the Flask development server rather than
  production hospital deployment.
- **Synthetic demonstration data:** Demo patients and surge scenarios
  are intended only to demonstrate system behaviour.
- **No autonomous clinical decision-making:** The system is designed as
  decision support and does not replace assessment or judgment by
  qualified healthcare professionals.

  ## Demo Features

The prototype includes several features intended to demonstrate the
dynamic triage workflow:

- **Live Priority Queue** — displays patients ordered by their current
  priority.
- **Explainable Assessment** — shows confidence, deterioration risk and
  reasons behind the recommendation.
- **Waiting-Time Monitoring** — identifies patients whose prototype
  waiting-time threshold has been exceeded.
- **Reassessment** — allows patient information to be updated and the
  triage recommendation to be recalculated.
- **Nurse Override** — allows clinical staff to manually change the
  recommended priority with a recorded reason.
- **Audit Log** — records important assessment, reassessment, override
  and system events.
- **Manual Triage Mode** — provides a fallback workflow when the AI
  component is unavailable.
- **Surge Simulation** — increases the demonstration patient volume to
  illustrate queue management under simulated ED crowding.
- **Demo Queue** — provides predefined data for quickly demonstrating
  the interface and surge workflow.

---

## Troubleshooting

### Flask server does not start

Make sure the virtual environment is activated and the dependencies
are installed:

```bash
pip install -r requirements.txt
```

Then run:

```bash
python app.py
```

### Port 5000 is already in use

Stop the existing Flask process or close the application using port
5000 before starting the server again.

### Page does not load

Confirm that the Flask server is running and open the local address
shown in the terminal, typically:

```text
http://127.0.0.1:5000
```

### Changes are not visible

Refresh the browser after making changes to the frontend or backend.
If the application state is persisted in the browser, use
**Clear Queue** before starting a fresh demonstration.

### Assessment does not behave as expected

Check that the required patient information has been entered correctly,
particularly the chief complaint, symptoms, vital signs, age and
consciousness status. The current prototype uses explicit
rule-based conditions, so wording and input values can affect which
rules are triggered.

---

## Future Improvements

The current prototype establishes the core workflow. Further
development could extend it in the following directions:

- Replace or complement the prototype rule engine with clinically
  validated AI/ML models.
- Validate triage rules and thresholds with qualified medical
  professionals and real-world clinical datasets.
- Integrate with hospital EHR and other clinical information systems
  using appropriate interoperability standards.
- Introduce secure authentication and role-based access for clinical
  staff.
- Move persistence from browser local storage to a secure backend
  database.
- Improve real-time monitoring and notification mechanisms for
  waiting-patient deterioration.
- Expand audit and governance capabilities for production deployment.
- Evaluate system performance using larger and more diverse patient
  datasets.
- Conduct clinical, usability, security and regulatory validation
  before any real-world deployment.

These improvements would move the system from a demonstration
prototype toward a more robust, clinically validated decision-support
platform.

---

## Team

**PatientTriage.ai — Waypoint**

**Team Member**

- **Sanvi Majare** — Electrical Engineering, IIT Bombay
