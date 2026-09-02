# PatientTriage.ai

## Accenture Innovation Challenge 2026

**Prepared by:** Sanvi Majare  
**Team:** Waypoint  
**Department:** Electrical Engineering  
**Institute:** IIT Bombay

---

# 1. Introduction

## What is PatientTriage.ai?

**PatientTriage.ai** is an AI-assisted emergency department triage system designed to turn a static triage queue into a **dynamic, risk-aware priority queue**.

The prototype supports clinical staff by processing information available at triage, including:

- Symptoms and chief complaint
- Vital signs
- Pain severity
- Patient age
- Relevant contextual information

Based on these inputs, the system produces an **urgency recommendation ranging from LOW to CRITICAL**, along with supporting reasons and additional indicators such as confidence and deterioration risk.

The system is designed as a **decision-support tool, not a replacement for clinical judgment**. Nurses and other clinical staff remain responsible for the final decision, with the ability to reassess patients, override recommendations, and use manual triage when AI assistance is unavailable.

## The Problem

Traditional emergency department triage often results in a queue that is largely determined at the time of the patient's initial assessment. However, a patient's condition and the operational context of the emergency department can change while they wait.

A patient initially assessed as lower priority may deteriorate, while prolonged waiting can itself become an important factor in deciding which patients require renewed attention.

This creates a key limitation:

> **A static priority assigned at arrival does not necessarily reflect the patient's current risk.**

PatientTriage.ai addresses this by treating triage as an **ongoing process rather than a one-time classification**.

## From Static to Dynamic Triage

Instead of maintaining only a fixed ordering based on the initial assessment, PatientTriage.ai combines the initial urgency assessment with **waiting-time monitoring and reassessment**.

The resulting workflow can be viewed as:

**Initial Information → Risk Assessment → Priority Queue → Waiting-Time Monitoring → Reassessment → Updated Priority**

This allows the system to support a queue that can respond to changes in patient status while keeping the **human clinician in control of the final decision**.

The prototype also provides explainability through the reasons associated with each recommendation, helping clinical staff understand the factors contributing to the assigned priority.

# 2. Solution Overview

PatientTriage.ai provides a structured workflow for assessing patients at the point of triage and maintaining a dynamic priority queue.

The prototype follows the pipeline:

**Patient Information → Triage Engine → Urgency Recommendation → Priority Queue**

### What the Prototype Does

For each patient, the system collects available triage information such as:

- Age and demographic information
- Chief complaint and symptoms
- Pain severity
- Vital signs
- Visible signs and injury information
- Relevant medical and contextual information

This information is passed to the **Python-based triage engine**, which evaluates the available data using a structured set of rules and contextual checks.

The engine produces:

- **Urgency recommendation:** LOW, MODERATE, URGENT, HIGH, or CRITICAL
- **Confidence indication**
- **Deterioration-risk indication**
- **Reasons supporting the recommendation**
- **Ambiguity or conflict indicators**, where applicable

The resulting assessment is then displayed in the live queue, where patients are ordered according to their current priority.

### Dynamic Priority Queue

The queue is not intended to remain a fixed list created at the time of arrival.

PatientTriage.ai also monitors **waiting time** and supports **patient reassessment**, allowing the workflow to account for changes that occur after the initial assessment.

A patient can therefore move through the following cycle:

**Assess → Queue → Monitor → Reassess → Update Priority**

This is the central idea behind the transition from a **static triage queue to a dynamic, risk-aware priority queue**.

### Human-in-the-Loop

PatientTriage.ai is designed as a **clinical decision-support prototype** rather than an autonomous decision-making system.

The AI-assisted recommendation is presented to clinical staff along with the factors contributing to it. The clinician remains responsible for the final triage decision.

The prototype supports this through:

- Explainable recommendations
- Patient reassessment
- Nurse priority override
- Manual triage when AI assistance is unavailable
- Audit logging of important actions
- A fail-safe review state when the available information is insufficient or ambiguous

The purpose of these mechanisms is to ensure that automation assists the clinical workflow while **human judgment remains the final authority**.

---

# 3. System Architecture

PatientTriage.ai is implemented as a lightweight web application consisting of a frontend, a Flask backend, and a Python-based rule engine.

The main components are:

```text
┌─────────────────────────────────────┐
│          HTML / CSS / JavaScript    │
│              Frontend               │
│                                     │
│  Patient Form → Queue → Dashboard   │
└─────────────────┬───────────────────┘
                  │
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────┐
│          Flask Backend              │
│                                     │
│        API Routes / Request         │
│             Handling                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Python Rule-Based Engine       │
│                                     │
│     Critical → High → Urgent →      │
│          Moderate → Low             │
│                                     │
│  Context • Ambiguity • Fail-safe    │
└─────────────────────────────────────┘

                  ▲
                  │
                  │
┌─────────────────┴───────────────────┐
│          Browser localStorage       │
│                                     │
│  Patient queue • State • Audit data │
└─────────────────────────────────────┘
```

# 4. Core Features

PatientTriage.ai combines initial triage assessment with monitoring and clinician-controlled updates to support a dynamic emergency department workflow.

## 4.1 Dynamic Priority Queue

Patients are organized into a live priority queue based on their current triage recommendation.

The queue distinguishes between five primary urgency levels:

**CRITICAL → HIGH → URGENT → MODERATE → LOW**

Patients can be reassessed and their queue position can change when their assessment or workflow state is updated.

## 4.2 Explainable Recommendations

Each AI-assisted assessment is accompanied by the factors that contributed to the recommendation.

Instead of presenting only a priority label, the system provides supporting reasons so that clinical staff can inspect why a particular recommendation was produced.

## 4.3 Ambiguity Detection

The prototype checks for potentially conflicting or ambiguous information in the submitted patient data.

When ambiguity is detected, it is surfaced to the user rather than being silently ignored. Importantly, ambiguity does not override clearly identified high-acuity findings.

Cases where the available information requires additional review can be assigned an **URGENT REVIEW** state.

## 4.4 Waiting-Time Monitoring

The system continuously tracks how long patients have been waiting in the queue.

Waiting-time monitoring provides an additional safety mechanism by drawing attention to patients who have remained in the queue for longer periods.

The prototype uses configurable waiting-time values for demonstration purposes; these values are **not intended to represent universal clinical waiting-time standards**.

## 4.5 Update & Reassess

Patient information can be updated after the initial assessment and submitted for reassessment.

The updated information is processed through the triage engine, allowing the system to generate a new recommendation based on the latest available inputs.

This supports the principle that triage should be treated as an ongoing process rather than a one-time classification.

## 4.6 Nurse Override

Clinical staff can override an AI-assisted recommendation when their clinical judgment requires a different priority.

The override is preserved in the patient record and reflected in the queue. The system also retains the AI recommendation separately where applicable, providing visibility into the difference between the automated recommendation and the clinician's decision.

## 4.7 Manual Fallback

The prototype supports manual triage when AI assistance is unavailable.

This ensures that patient assessment does not depend entirely on the availability of the AI-assisted component.

Manual decisions can subsequently remain part of the workflow when AI assistance becomes available again.

## 4.8 AI Offline and Recovery

The prototype includes a simulated AI availability state to demonstrate how the workflow behaves during an AI outage.

When AI assistance is unavailable, the interface indicates that **manual clinical triage is active**.

When AI assistance becomes available again, the workflow can return to AI-assisted assessment. Pending patients can then be reassessed through the normal assessment workflow.

The prototype does not claim autonomous reassessment or autonomous recovery of pending patients.

## 4.9 Audit Log

Important workflow events are recorded in an audit log, including events such as:

- AI assessment
- Reassessment
- Waiting-time alerts
- Nurse overrides
- Manual triage
- AI availability/status changes

The audit log provides a chronological record of important actions during the prototype workflow.

## 4.10 Surge Simulation

The **Simulate Surge** feature allows the prototype to populate the queue with a larger number of simulated patients.

This is a testing utility designed to demonstrate how the priority queue behaves when patient volume increases.

It complements the manually entered test cases used for the main demonstration.

---

# 5. Triage Engine

The triage engine is implemented in `triage_engine.py` as a **structured, rule-based assessment system**.

It evaluates the information submitted during triage and checks for acuity indicators, contextual factors, ambiguity, and data-quality concerns before producing an urgency recommendation.

## 5.1 Priority Levels

The prototype uses five primary priority levels:

| Priority | Description |
|---|---|
| **CRITICAL** | Immediate high-acuity presentation requiring the highest priority |
| **HIGH** | Serious presentation requiring high priority |
| **URGENT** | Presentation requiring prompt attention |
| **MODERATE** | Lower-acuity presentation requiring assessment but not the highest urgency |
| **LOW** | Lower-risk presentation suitable for the lowest queue priority |

In addition, the engine can produce separate review states such as **URGENT REVIEW** or **REVIEW** when ambiguity or insufficient information requires additional attention.

## 5.2 Rule Evaluation

The engine evaluates criteria in order of clinical urgency, with higher-acuity findings taking precedence over lower-priority classifications.

The general evaluation flow is:

```text
Patient Information
        ↓
Data Quality Checks
        ↓
Critical Criteria
        ↓
High-Priority Criteria
        ↓
Urgent Criteria
        ↓
Moderate Criteria
        ↓
Low-Priority Classification
        ↓
Contextual & Ambiguity Checks
        ↓
Final Recommendation
```
# 6. End-to-End Workflow

PatientTriage.ai follows a continuous workflow in which patients can be assessed, monitored, and reassessed while clinical staff retain control over the final decision.

## 6.1 Add Patient

The workflow begins when a patient is added through the triage form.

The user enters the information available at the time of assessment, including symptoms, vital signs, pain severity, age, and relevant contextual information.

Only the information available to the prototype is used for the assessment.

## 6.2 Assess

The submitted information is sent to the Flask backend and passed to the Python triage engine.

The engine evaluates the available information using the prototype's rule-based assessment logic and returns an urgency recommendation together with supporting reasons and assessment indicators.

## 6.3 Add to Priority Queue

After assessment, the patient is added to the live queue.

Patients are displayed according to their current priority, with higher-acuity patients receiving greater queue priority.

The interface also displays relevant information such as the patient's priority, assessment details, and waiting time.

## 6.4 Monitor

Once a patient is in the queue, the system tracks their waiting time.

Waiting-time monitoring provides an additional mechanism for identifying patients who have remained in the queue for longer periods and may require renewed attention.

The waiting-time mechanism is intended as a monitoring aid and does not independently make a clinical decision.

## 6.5 Reassess

Patient information can change after the initial assessment.

The user can open a patient's record, update the available information, and submit the patient for reassessment.

The updated information is processed through the triage engine and a new recommendation is generated based on the latest available data.

This allows the workflow to respond to changes rather than treating the initial assessment as permanently fixed.

## 6.6 Override if Necessary

Clinical staff can override an AI-assisted recommendation when their judgment indicates that a different priority is appropriate.

The nurse-assigned priority is retained as the active clinical decision, while the AI recommendation can remain visible for comparison.

This ensures that the system assists the workflow without taking control away from the clinician.

## 6.7 Audit

Important actions throughout the workflow are recorded in the audit log.

Examples include:

- AI assessments
- Reassessments
- Waiting-time alerts
- Nurse overrides
- Manual triage
- AI availability/status changes

The audit trail provides a chronological record of important events within the prototype and improves visibility into how the queue and patient assessments changed over time.

### Complete Workflow

```text
  Add Patient
       ↓
Initial Assessment
       ↓
Priority Recommendation
       ↓
Live Priority Queue
       ↓
Waiting-Time Monitoring
       ↓
┌───────────────┐
│ Patient Change│
└───────┬───────┘
        ↓
   Reassessment
        ↓
 Updated Priority
        │
        ↓
 Nurse Override
 (if necessary)
        │
        ↓
    Audit Log
```
# 8. Safety, Human-in-the-Loop & Limitations

PatientTriage.ai is designed with the principle that AI should **support clinical decision-making rather than replace it**.

## 8.1 Human Decision-Making

The AI-assisted recommendation is not treated as a final clinical decision.

Clinical staff remain responsible for determining the appropriate patient priority. The prototype provides supporting information, explanations, reassessment capabilities, and the ability to override the recommendation when required.

## 8.2 Manual Fallback

The workflow does not depend entirely on AI availability.

When AI assistance is unavailable, the prototype provides a **manual clinical triage mode**, allowing patient assessment to continue without the AI-assisted recommendation.

When AI assistance becomes available again, the workflow can return to AI-assisted assessment through the normal assessment or reassessment process.

## 8.3 No Autonomous Clinical Decisions

The prototype does not autonomously diagnose patients, prescribe treatment, or make final clinical decisions.

Its purpose is to provide an urgency recommendation and supporting information for consideration by clinical staff.

## 8.4 No Clinical Validation

The current prototype has **not undergone clinical validation** and should not be used for real patient care.

The rules and thresholds implemented in the prototype are intended to demonstrate the proposed workflow and system architecture. They are not a validated clinical triage protocol.

## 8.5 Synthetic Demonstration Data

The demonstration uses **synthetic patient information** created specifically for testing the prototype.

No real patient records are required for the demonstrated workflow.

## 8.6 Simulated AI Availability

The AI offline and recovery functionality is simulated within the prototype to demonstrate how the workflow behaves when AI assistance is unavailable.

It does not represent an actual failure of a deployed AI service.

## 8.7 Prototype Thresholds

Waiting-time thresholds and triage rules used by the prototype are **demonstration parameters**.

They should not be interpreted as universal clinical standards or recommendations for emergency department operations.

Any production implementation would require appropriate clinical review and validation before such thresholds or rules could be used operationally.

## 8.8 Current Integration Limitations

The prototype does not currently integrate with:

- Hospital Electronic Health Record (EHR) systems
- Laboratory information systems
- Medical imaging systems
- Real-time hospital patient databases

The current implementation uses a lightweight Flask application and browser-based storage for demonstration purposes.

## 8.9 Prototype vs. Production

The current system is a functional prototype intended to demonstrate the proposed workflow.

A production healthcare system would require substantially stronger controls around clinical validation, security, privacy, reliability, interoperability, monitoring, and governance before deployment.

---

# 9. Running the Prototype

## 9.1 Requirements

The prototype requires:

- **Python 3.9 or later**
- **Flask**
- **pip**
- A modern web browser
- **Git** (for cloning the repository)

The current prototype uses Flask as its backend dependency. No external database or machine-learning framework is required.

## 9.2 Installation

Clone the repository:

```bash
git clone https://github.com/SanviM828/PatientTriage-ai-AIC-2026
cd PatientTriage-ai-AIC-2026-
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

Install Flask:

```bash
pip install Flask
```

Move into the application directory:

```bash
cd code
```
## 9.3 Running Flask

Start the Flask application from the `code` directory:

```bash
python app.py
```

The Flask development server will start and display the local address in the terminal.

## 9.4 Browser Access

Open the local address shown by Flask in a web browser.

Typically, the application is available at:

```text
http://127.0.0.1:5000
```

Once the dashboard loads, users can:

1. Add a new patient
2. Submit the patient for assessment
3. View the resulting priority queue
4. Inspect patient details and explanations
5. Monitor waiting times
6. Update and reassess patients
7. Perform nurse overrides
8. Use manual triage when AI assistance is unavailable
9. Inspect the audit log
10. Use surge simulation for testing

## 9.5 Project Structure

```text
PatientTriage-ai-AIC-2026/
├── README.md
├── .gitignore
├─code
  ├── app.py
  ├── triage_engine.py
  │
  ├── templates/
  │   └── index.html
  │
  ├── static/
  │   ├── app.js
  │   └── style.css
  │
  └── docs/
      └── screenshots/
```

### Main Components

| File / Directory | Purpose |
|---|---|
| `app.py` | Flask application and API routes |
| `triage_engine.py` | Rule-based triage assessment logic |
| `templates/index.html` | Main application interface |
| `static/app.js` | Frontend logic and user interactions |
| `static/style.css` | Application styling and layout |
| `docs/screenshots/` | Documentation and demonstration screenshots |

The separation between the frontend, Flask API layer, and triage engine keeps the main components modular and makes the assessment logic easier to inspect and test.

---

# 10. Conclusion

PatientTriage.ai demonstrates how an emergency department triage workflow can move beyond a **static, one-time priority assignment** toward a more dynamic process that incorporates monitoring, reassessment, explainability, and clinician oversight.

The prototype combines a structured rule-based triage engine with a live priority queue and supporting safety mechanisms such as:

- Explainable recommendations
- Ambiguity detection
- Waiting-time monitoring
- Patient reassessment
- Nurse override
- Manual fallback
- AI offline/recovery handling
- Audit logging

The system is intentionally designed as **decision support rather than autonomous clinical decision-making**. The clinician remains responsible for the final patient-priority decision.

The current implementation is a prototype and has not been clinically validated. Its rules, thresholds, and synthetic test cases are intended to demonstrate the proposed workflow rather than serve as clinical guidance.

Future development would focus on clinical validation, secure hospital deployment, EHR interoperability, stronger authentication and audit infrastructure, and carefully governed AI/ML capabilities.

Ultimately, PatientTriage.ai aims to demonstrate a practical principle:

> **Triage should not be treated as a one-time decision. It should remain responsive to patient changes, waiting time, new information, and clinical judgment.**
