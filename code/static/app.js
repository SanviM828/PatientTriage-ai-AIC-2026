let patients = JSON.parse(
    localStorage.getItem("patients") || "[]"
);

let nextPatientNumber = Number(
    localStorage.getItem("nextPatientNumber") || "1"
);
let aiAvailable = true;

// -----------------------------------------
// AUDIT LOG
// -----------------------------------------

let auditLog = JSON.parse(
    localStorage.getItem("auditLog") || "[]"
);


let nextAuditNumber = Number(
    localStorage.getItem("nextAuditNumber") || "1"
);


// -----------------------------------------
// AUDIT EVENT TAXONOMY
// -----------------------------------------

const AUDIT_EVENT = {
    AI_ASSESSMENT: "AI_ASSESSMENT",
    AI_REASSESSMENT: "AI_REASSESSMENT",
    WAITING_TIME_ALERT: "WAITING_TIME_ALERT",
    MANUAL_TRIAGE: "MANUAL_TRIAGE",
    NURSE_OVERRIDE: "NURSE_OVERRIDE",
    AI_RECOVERY_REVIEW: "AI_RECOVERY_REVIEW",
    SAFETY_REVIEW: "SAFETY_REVIEW"
};

const addPatientButton = document.getElementById("addPatientButton");
const patientForm = document.getElementById("patientForm");
const assessPatientButton = document.getElementById("assessPatientButton");
const assessmentResult = document.getElementById("assessmentResult");
const addPatientModal = document.getElementById("addPatientModal");
const surgeButton = document.getElementById("surgeButton");
const demoQueueButton = document.getElementById("demoQueueButton");
const clearQueueButton = document.getElementById("clearQueueButton");

function saveQueue() {

    localStorage.setItem(
        "patients",
        JSON.stringify(patients)
    );

    localStorage.setItem(
        "nextPatientNumber",
        String(nextPatientNumber)
    );

    localStorage.setItem(
        "auditLog",
        JSON.stringify(auditLog)
    );

    localStorage.setItem(
        "nextAuditNumber",
        String(nextAuditNumber)
    );
}


function addAuditLog(event) {

    const logEntry = {

        id: nextAuditNumber++,

        timestamp:
            new Date().toLocaleTimeString(),

        actor: event.actor || "SYSTEM",

        category: event.category || "SYSTEM",

        ...event

    };


    auditLog.push(logEntry);


    // Keep audit log persistent
    localStorage.setItem(
        "auditLog",
        JSON.stringify(auditLog)
    );

    localStorage.setItem(
        "nextAuditNumber",
        String(nextAuditNumber)
    );


    renderAuditLog();
}


function renderAuditLog() {

    const auditContainer =
        document.getElementById("auditLogContent");

    const auditCount =
        document.getElementById("auditLogCount");


    if (!auditContainer) {
        return;
    }


    auditCount.textContent =
        `${auditLog.length} event${auditLog.length === 1 ? "" : "s"}`;


    if (auditLog.length === 0) {

        auditContainer.innerHTML = `
            <div class="audit-empty">
                No audit events recorded yet.
            </div>
        `;

        return;
    }


    // Newest event first
    const logs = [...auditLog].reverse();


    auditContainer.innerHTML =
        logs.map(log => {

            let content = `
                <div class="audit-event-title">
                    ${log.type || "Unknown Event"}
                </div>

                <div>
                    <strong>Patient:</strong>
                    ${log.patientId || "System"}
                </div>

                <div>
                    <strong>Actor:</strong>
                    ${log.actor || "SYSTEM"}
                </div>

                <div>
                    <strong>Category:</strong>
                    ${log.category || "SYSTEM"}
                </div>
            `;


            // ---------------------------------
            // AI assessment
            // ---------------------------------

            if (log.type === AUDIT_EVENT.AI_ASSESSMENT) {

                content = `

                    <div class="audit-event-title">
                        AI Assessment
                    </div>

                    <div>
                        <strong>Patient:</strong>
                        ${log.patientId}
                    </div>

                    <div>
                        <strong>Priority:</strong>
                        ${log.priority}
                    </div>

                    <div>
                        <strong>Confidence:</strong>
                        ${log.confidence}%
                    </div>

                `;

            }


            // ---------------------------------
            // Reassessment
            // ---------------------------------

            else if (log.type === AUDIT_EVENT.AI_REASSESSMENT) {

                content = `

                    <div class="audit-event-title">
                        Patient Reassessment
                    </div>

                    <div>
                        <strong>Patient:</strong>
                        ${log.patientId}
                    </div>

                    <div>
                        <strong>Priority:</strong>
                        ${log.previousPriority}
                        → ${log.priority}
                    </div>

                    <div>
                        <strong>Confidence:</strong>
                        ${log.confidence}%
                    </div>

                `;

            }


            // ---------------------------------
            // Waiting-time alert
            // ---------------------------------

            else if (log.type === AUDIT_EVENT.WAITING_TIME_ALERT) {

                content = `

                    <div class="audit-event-title">
                        Automatic Waiting-Time Alert
                    </div>

                    <div>
                        <strong>Patient:</strong>
                        ${log.patientId}
                    </div>

                    <div>
                        <strong>Priority:</strong>
                        ${log.priority}
                    </div>

                    <div>
                        <strong>Waiting:</strong>
                        ${formatWaitingTime(log.waitingTime)}
                    </div>

                    <div>
                        <strong>Prototype threshold:</strong>
                        ${log.threshold} min
                    </div>

                `;

            }


            // ---------------------------------
            // Nurse override
            // ---------------------------------

            else if (log.type === AUDIT_EVENT.NURSE_OVERRIDE) {

                content = `

                    <div class="audit-event-title">
                        Nurse Override
                    </div>

                    <div>
                        <strong>Patient:</strong>
                        ${log.patientId}
                    </div>

                    <div>
                        <strong>Priority:</strong>
                        ${log.previousPriority}
                        → ${log.priority}
                    </div>

                    <div>
                        <strong>Reason:</strong>
                        ${log.reason}
                    </div>

                    <div>
                        <strong>Final Priority:</strong>
                        ${log.priority}
                    </div>

                `;

            }


            // ---------------------------------
            // Manual triage
            // ---------------------------------

            else if (log.type === AUDIT_EVENT.MANUAL_TRIAGE) {

                content = `

                    <div class="audit-event-title">
                        Manual Triage
                    </div>

                    <div>
                        <strong>Patient:</strong>
                        ${log.patientId}
                    </div>

                    <div>
                        <strong>Priority:</strong>
                        ${log.priority}
                    </div>

                    <div>
                        <strong>Actor:</strong>
                        Nurse
                    </div>

                    <div>
                        <strong>Reason:</strong>
                        ${log.reason}
                    </div>

                `;
            }


            return `

                <div class="audit-entry">

                    <div class="audit-time">
                        ${log.timestamp}
                    </div>

                    <div class="audit-content">
                        ${content}
                    </div>

                </div>

            `;

        }).join("");
}


function restoreQueueState() {

    const now = Date.now();

    patients.forEach(patient => {

        // Older patients created before persistence
        // may not have addedAt.
        if (!patient.addedAt) {
            patient.addedAt = now;
        }

        // Recalculate waiting time
        patient.waiting_time = Math.floor(
            (now - patient.addedAt) / 60000
        );

        // Recalculate queue priority
        patient.queuePriority =
            getPriorityWeight(patient.priority);

        // Make sure older patient objects have
        // these properties.
        if (patient.deteriorationDetected === undefined) {
            patient.deteriorationDetected = false;
        }

        if (patient.lastReassessmentAt === undefined) {
            patient.lastReassessmentAt = patient.addedAt;
        }

        if (patient.waitingAlertTriggered === undefined) {
            patient.waitingAlertTriggered = false;
        }

        if (patient.waitingReviewActive === undefined) {
            patient.waitingReviewActive = false;
        }

        if (!patient.assessmentHistory) {
            patient.assessmentHistory = [];
        }
    });

    sortPatientQueue();

    saveQueue();
}

function updateWaitingTimes() {

    const now = Date.now();

    patients.forEach(patient => {

        if (!patient.addedAt) {
            patient.addedAt = now;
        }

        const elapsedMilliseconds =
            now - patient.addedAt;

        const elapsedMinutes =
            Math.floor(
                elapsedMilliseconds / 60000
            );

        patient.waiting_time = elapsedMinutes;
    });
}

function formatWaitingTime(minutes) {

    if (minutes === 0) {
        return "0 min";
    }

    if (minutes === 1) {
        return "1 min";
    }

    return `${minutes} min`;
}

// =========================================================
// AUTOMATIC WAITING-TIME MONITORING
// Prototype thresholds only — not universal clinical standards.
// Higher-acuity patients are given shorter monitoring intervals.
// =========================================================

const WAITING_THRESHOLDS = {
    LOW: 35,
    MODERATE: 25,
    HIGH: 20,
    CRITICAL: 15
};

function checkWaitingTimeMonitoring() {

    const now = Date.now();
    let queueChanged = false;

    patients.forEach(patient => {

        if (!patient.addedAt) {
            patient.addedAt = now;
        }

        if (patient.lastReassessmentAt === undefined) {
            patient.lastReassessmentAt = patient.addedAt;
        }

        if (patient.waitingAlertTriggered === undefined) {
            patient.waitingAlertTriggered = false;
        }

        const priority = patient.priority.toUpperCase();
        const threshold = WAITING_THRESHOLDS[priority];

        // CRITICAL patients already require immediate attention.
        if (!threshold) {
            return;
        }

        const monitoringMinutes = Math.floor(
            (now - patient.lastReassessmentAt) / 60000
        );

        if (monitoringMinutes < threshold || patient.waitingAlertTriggered) {
            return;
        }

        patient.waitingAlertTriggered = true;
        patient.waitingReviewActive = true;
        patient.waitingReviewThreshold = threshold;

        if (priority === "LOW" || priority === "MODERATE") {
            patient.waitingReviewPreviousPriority = priority;
            patient.priority = "URGENT REVIEW";
            patient.queuePriority = getPriorityWeight("URGENT REVIEW");
            patient.reasons = [
                `Waiting time exceeded the prototype ${priority} threshold (${threshold} min).`,
                "Reassessment required before continuing routine waiting."
            ];
            queueChanged = true;
        } else if (priority === "HIGH") {
            patient.queuePriority = getPriorityWeight("HIGH");
        }


        addAuditLog({

            type: AUDIT_EVENT.WAITING_TIME_ALERT,

            actor: "SYSTEM",

            category: "MONITORING",

            patientId:
                patient.id,
            priority:
                patient.priority,

            waitingTime:
                patient.waiting_time,

            threshold:
                threshold
        });


    });

    if (queueChanged) {
        sortPatientQueue();
    }

    saveQueue();
}
// Show / hide the patient form
// Show a fresh patient form
addPatientButton.addEventListener("click", function () {

    // Start with a completely fresh patient
    patientForm.reset();

    // Clear previous assessment
    assessmentResult.innerHTML = "";
    assessmentResult.classList.add("hidden");

    // Open Add Patient popup
    addPatientModal.classList.remove("hidden");
});

// Send patient information to the Python triage engine
assessPatientButton.addEventListener("click", async function () {

    // Collect patient information
    const patient = {
        age: document.getElementById("patientAge").value,
        sex: document.getElementById("patientSex").value,
        pregnancy_status: document.getElementById("pregnancyStatus").value,

        chief_complaint: document.getElementById("chiefComplaint").value,
        symptoms: document.getElementById("symptoms").value,
        symptom_duration: document.getElementById("symptomDuration").value,
        pain_severity: document.getElementById("painSeverity").value,
        visible_signs: document.getElementById("visibleSigns").value,
        injury_mechanism: document.getElementById("injuryMechanism").value,

        heart_rate: document.getElementById("heartRate").value,
        blood_pressure: document.getElementById("bloodPressure").value,
        spo2: document.getElementById("spo2").value,
        respiratory_rate: document.getElementById("respiratoryRate").value,
        temperature: document.getElementById("temperature").value,

        medical_history: document.getElementById("medicalHistory").value,
        medications: document.getElementById("medications").value,
        allergies: document.getElementById("allergies").value,
        previous_episodes: document.getElementById("previousEpisodes").value,
        no_history: document.getElementById("noHistory").checked,

        communication_difficulty:
            document.getElementById("communicationDifficulty").value,

        mobility: document.getElementById("mobility").value,
        consciousness: document.getElementById("consciousness").value
    };


    // Basic check
    // -------------------------------------------------
    // FAIL-SAFE: Missing information
    // -------------------------------------------------

    if (
        patient.age === "" ||
        patient.chief_complaint.trim() === ""
    ) {
        assessmentResult.innerHTML = `
            <h4>⚠ Insufficient Information</h4>
            <p><strong>Human review required.</strong></p>
            <p>Do not downgrade automatically.</p>
        `;

        assessmentResult.classList.remove("hidden");
        return;
    }


    // Show processing message
    assessmentResult.innerHTML = `
        <h4>Assessing patient...</h4>
        <p>PatientTriage.ai is evaluating the available information.</p>
    `;

    assessmentResult.classList.remove("hidden");


    try {

        // Send the complete patient record to Flask
        const response = await fetch("/assess", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(patient)
        });


        // Get the assessment returned by Flask
        if (!response.ok) {
            throw new Error(
                `Assessment request failed: ${response.status}`
            );
        }

        const result = await response.json();

        const newPatient = {
            id: `P${String(nextPatientNumber).padStart(3, "0")}`,

            // Basic information
            age: patient.age,
            complaint: patient.chief_complaint,

            // Current triage assessment
            priority: result.priority,
            confidence: result.confidence,
            deterioration_risk: result.deterioration_risk,
            reasons: result.reasons,

            // Current patient information
            patientData: patient,

            // Assessment history
            assessmentHistory: [
                {
                    type: "Initial assessment",
                    timestamp: new Date().toLocaleTimeString(),
                    priority: result.priority,
                    confidence: result.confidence,
                    deterioration_risk: result.deterioration_risk,
                    reasons: result.reasons,
                    patientData: { ...patient }
                }
            ],

            // Queue information
            waiting_time: 0,

            // Deterioration state
            deteriorationDetected: false,

            // Waiting-time monitoring state
            waitingAlertTriggered: false,
            waitingReviewActive: false,
            lastReassessmentAt: Date.now(),

            // Used for queue ranking
            queuePriority: getPriorityWeight(result.priority),

            // Used to track when the patient entered the queue
            addedAt: Date.now()
        };


        patients.push(newPatient);
        nextPatientNumber++;


        // -----------------------------------------
        // Audit log: Initial AI assessment
        // -----------------------------------------

        addAuditLog({

            type: AUDIT_EVENT.AI_ASSESSMENT,

            actor: "AI",

            category: "TRIAGE",

            patientId:
                newPatient.id,

            priority:
                result.priority,

            confidence:
                result.confidence
        });


        sortPatientQueue();

        saveQueue();

        renderQueue();

        // Display the result
        assessmentResult.innerHTML = `
            <h4>AI Triage Recommendation</h4>

            <p>
                <strong>Priority:</strong>
                ${result.priority}
            </p>

            <p>
                <strong>Confidence:</strong>
                ${result.confidence}%
            </p>

            <p>
                <strong>Deterioration Risk:</strong>
                ${result.deterioration_risk}
            </p>

            <p><strong>Why?</strong></p>

            <ul>
                ${result.reasons.map(reason => `<li>${reason}</li>`).join("")}
            </ul>
        `;

    } catch (error) {

        console.error(
            "Assessment failed:",
            error
        );

        // AI is unavailable.
        setAIMode(false);

        // Alert the nurse.
        showAIUnavailableModal();
    }

});

function renderQueue() {

    const queue = document.getElementById("patientQueue");
    const queueCount = document.getElementById("queueCount");

    queueCount.textContent =
        `${patients.length} patient${patients.length === 1 ? "" : "s"}`;


    if (patients.length === 0) {

        queue.innerHTML = `
            <div class="empty-queue">

                <p>No patients in queue.</p>

                <p>
                    Add a patient to begin triage.
                </p>

            </div>
        `;

        return;
    }


    queue.innerHTML = patients.map(patient => {

        /* -----------------------------------------
           Determine colour class
           ----------------------------------------- */

        const priority = patient.priority.toUpperCase();

        let priorityClass = "priority-review";

        if (priority === "CRITICAL") {

            priorityClass = "priority-critical";

        }
        else if (priority === "HIGH") {

            priorityClass = "priority-high";

        }
        else if (
            priority === "URGENT" ||
            priority === "URGENT REVIEW"
        ) {

            priorityClass = "priority-urgent";

        }
        else if (priority === "MODERATE") {

            priorityClass = "priority-moderate";

        }
        else if (priority === "LOW") {

            priorityClass = "priority-low";

        }


        return `

            <div
                class="patient-card ${priorityClass}"
                data-patient-id="${patient.id}"
            >

                <!-- COLOURED TOP BAND -->

                <div class="patient-card-top">

                    <div>

                        <strong>
                            ${patient.id}
                        </strong>

                        <span class="patient-age">
                            Age ${patient.age}
                        </span>

                    </div>


                    <!-- PRIORITY BADGE -->

                    <span class="priority-badge">

                        ${patient.priority}

                    </span>

                </div>


                <!-- CARD CONTENT -->

                <div class="patient-card-content">

                    <p class="patient-complaint">
                        ${patient.complaint}
                    </p>


                    <div class="patient-details">

                        <span>
                            ${
                                patient.triageSource === "Nurse / Manual Triage"
                                    ? (
                                        patient.aiReviewed === true
                                            ? `Nurse: ${patient.manualPriority} • AI: ${patient.aiRecommendation} (${patient.aiConfidence}%)`
                                            : "AI Review Pending"
                                    )
                                    : `Confidence: ${patient.confidence}%`
                            }
                        </span>

                        <span>
                            Deterioration:
                            ${patient.deterioration_risk}
                        </span>

                        <span>
                            Waiting:
                            ${formatWaitingTime(patient.waiting_time)}
                        </span>

                    </div>

                    ${patient.waitingReviewActive ? `
                        <div class="waiting-time-alert">
                            <strong>WAITING-TIME ALERT</strong>
                            <span>Reassessment required — prototype threshold exceeded (${patient.waitingReviewThreshold} min).</span>
                        </div>
                    ` : ""}

                    <button
                        class="view-details-button"
                        onclick="showPatientDetails('${patient.id}')"
                    >
                        View Details
                    </button>

                </div>

            </div>

        `;

    }).join("");
}

function getPriorityWeight(priority) {

    const weights = {
        "CRITICAL": 5,
        "HIGH": 4,
        "URGENT": 3,
        "URGENT REVIEW": 3,
        "MODERATE": 2,
        "LOW": 1,
        "REVIEW": 0
    };

    return weights[priority] ?? 0;
}

function getPriorityClass(priority) {

    if (priority === "CRITICAL") {
        return "priority-critical";
    }

    if (priority === "HIGH") {
        return "priority-high";
    }

    if (
        priority === "URGENT" ||
        priority === "URGENT REVIEW"
    ) {
        return "priority-urgent";
    }
    if (priority === "MODERATE") {
        return "priority-moderate";
    }

    if (priority === "LOW") {
        return "priority-low";
    }

    return "priority-review";
}

function showPatientDetails(patientId) {

    const patient = patients.find(p => p.id === patientId);

    if (!patient) {
        return;
    }

    // Highlight the patient whose details are currently open
    document.querySelectorAll(".patient-card").forEach(card => {
        card.classList.remove("patient-card-selected");
    });

    const selectedCard = document.querySelector(
        `.patient-card[data-patient-id="${patientId}"]`
    );

    if (selectedCard) {
        selectedCard.classList.add("patient-card-selected");
    }

    // -------------------------------------------------
    // PHASE B: CHECK FOR MISSING VITAL SIGNS
    // -------------------------------------------------

    const data = patient.patientData || {};

    const vitalFields = [
        {
            key: "heart_rate",
            label: "Heart Rate"
        },
        {
            key: "blood_pressure",
            label: "Blood Pressure"
        },
        {
            key: "spo2",
            label: "SpO₂"
        },
        {
            key: "respiratory_rate",
            label: "Respiratory Rate"
        },
        {
            key: "temperature",
            label: "Temperature"
        }
    ];

    const missingVitals = vitalFields
        .filter(vital => {
            const value = data[vital.key];

            return (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            );
        })
        .map(vital => vital.label);



    //const data = patient.patientData;

    const modal = document.getElementById("patientModal");
    const modalContent = document.getElementById("modalContent");

    // -------------------------------------------------
    // Helper for displaying missing information
    // -------------------------------------------------

    function displayValue(value, fallback = "Not recorded") {
        return value !== undefined &&
               value !== null &&
               String(value).trim() !== ""
            ? value
            : fallback;
    }

    // -------------------------------------------------
    // Patient details
    // -------------------------------------------------

    const age = displayValue(data.age, "Age not recorded");
    const sex = displayValue(data.sex, "Sex not recorded");
    const complaint = displayValue(
        data.chief_complaint,
        "Chief complaint not recorded"
    );

    const priorityClass =
        getPriorityClass(patient.priority);

    // -------------------------------------------------
    // Build compact patient details view
    // -------------------------------------------------

    modalContent.innerHTML = `

        <!-- =================================================
             HEADER / PATIENT IDENTITY
             ================================================= -->

        <div class="modal-header compact-details-header">

            <div>

                <h2>
                    ${patient.id} — Patient Details
                </h2>

                <p class="patient-identity-line">
                    Age ${age}
                    <span>•</span>
                    ${sex}
                </p>

                <p class="patient-chief-complaint">
                    ${complaint}
                </p>

            </div>

            <button
                class="modal-close"
                onclick="closePatientDetails()"
            >
                ×
            </button>

        </div>


        <!-- =================================================
             AI TRIAGE SNAPSHOT
             ================================================= -->

        <div class="triage-snapshot">

            <div class="triage-snapshot-header">

                <div>
                    <span class="snapshot-label">

                        ${
                            patient.triageSource === "Nurse / Manual Triage"
                            ? "AI REVIEW PENDING"
                            : "AI TRIAGE RECOMMENDATION"
                        }

                    </span>

                    <div class="modal-priority ${priorityClass}">
                        ${patient.priority}
                    </div>
                </div>

                <div class="snapshot-metrics">

                    <div class="snapshot-metric">
                        <span>Confidence</span>
                        <strong>
                            ${
                                patient.confidence === null ||
                                patient.confidence === undefined
                                ? "Not reviewed"
                                : patient.confidence + "%"
                            }
                        </strong>
                    </div>

                    <div class="snapshot-metric">
                        <span>Deterioration</span>
                        <strong>
                            ${patient.deterioration_risk}
                        </strong>
                    </div>

                </div>

            </div>

            ${
                patient.triageSource === "Nurse / Manual Triage"
                ? `
                    <div class="manual-triage-status">
                        <strong>AI REVIEW PENDING</strong>

                        <span>
                            AI has not reviewed this patient yet.
                            Priority assigned by nurse during AI outage.
                        </span>
                    </div>
                `
                : ""
            }

        </div>

        ${
            patient.ambiguity_detected === true
            ? `
                <div class="ambiguity-warning">
                    <strong>⚠ URGENT REVIEW REQUIRED</strong>

                    <p>
                        Ambiguous or conflicting information was detected.
                        Human clinical attention is required.
                    </p>
                </div>
            `
            : ""
        }


        ${
            patient.waitingReviewActive
            ? `
                <div class="waiting-time-alert waiting-time-alert-modal">
                    <strong>WAITING-TIME ALERT</strong>
                    <p>
                        This patient has exceeded the prototype waiting-time threshold
                        (${patient.waitingReviewThreshold} min). Reassessment is required.
                    </p>
                </div>
            `
            : ""
        }


        <!-- =================================================
             VITAL SIGNS — HIGH PRIORITY INFORMATION
             ================================================= -->

        <div class="modal-section compact-section">

            <div class="section-heading-row">

                <h3>Vital Signs</h3>

            </div>

            ${
                missingVitals.length > 0
                ? `
                    <div class="missing-vitals-warning">
                        <strong>⚠ Incomplete vital signs</strong>

                        <p>
                            ${missingVitals.join(", ")}
                            ${missingVitals.length === 1 ? "was" : "were"}
                            not recorded.
                        </p>

                        <p>
                            Assessment may be less reliable.
                            Please obtain or recheck the missing vital signs.
                        </p>
                    </div>
                `
                : ""
            }


            <div class="compact-vitals-grid">

                <div class="vital-item">
                    <span>Heart Rate</span>
                    <strong>
                        ${displayValue(data.heart_rate)} bpm
                    </strong>
                </div>

                <div class="vital-item">
                    <span>Blood Pressure</span>
                    <strong>
                        ${displayValue(data.blood_pressure)}
                    </strong>
                </div>

                <div class="vital-item">
                    <span>SpO₂</span>
                    <strong>
                        ${displayValue(data.spo2)}%
                    </strong>
                </div>

                <div class="vital-item">
                    <span>Respiratory Rate</span>
                    <strong>
                        ${displayValue(data.respiratory_rate)} /min
                    </strong>
                </div>

                <div class="vital-item">
                    <span>Temperature</span>
                    <strong>
                        ${displayValue(data.temperature)} °C
                    </strong>
                </div>

            </div>

        </div>


        <!-- =================================================
             WHY — EXPLAINABILITY
             ================================================= -->

        <div class="modal-section compact-section">

            <h3>Why?</h3>

            <ul class="triage-reasons">

                ${
                    patient.reasons &&
                    patient.reasons.length > 0

                    ? patient.reasons
                        .map(reason => `<li>${reason}</li>`)
                        .join("")

                    : "<li>No specific reason recorded.</li>"
                }

            </ul>

        </div>


        <!-- =================================================
             CURRENT PRESENTATION
             ================================================= -->

        <div class="modal-section compact-section">

            <h3>Current Presentation</h3>

            <div class="compact-info-grid">

                <div class="info-item wide">
                    <span>Symptoms</span>
                    <strong>
                        ${displayValue(
                            data.symptoms,
                            "Not recorded"
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Duration / Onset</span>
                    <strong>
                        ${displayValue(
                            data.symptom_duration
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Pain Severity</span>
                    <strong>
                        ${displayValue(
                            data.pain_severity
                        )}/10
                    </strong>
                </div>

                <div class="info-item wide">
                    <span>Visible / Observable Signs</span>
                    <strong>
                        ${displayValue(
                            data.visible_signs
                        )}
                    </strong>
                </div>

                <div class="info-item wide">
                    <span>Injury / Accident</span>
                    <strong>
                        ${displayValue(
                            data.injury_mechanism,
                            "Not applicable"
                        )}
                    </strong>
                </div>

            </div>

        </div>


        <!-- =================================================
             RELEVANT HISTORY
             ================================================= -->

        <div class="modal-section compact-section">

            <h3>Relevant History</h3>

            <div class="compact-info-grid">

                <div class="info-item">
                    <span>Known Conditions</span>
                    <strong>
                        ${displayValue(
                            data.medical_history
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Medications</span>
                    <strong>
                        ${displayValue(
                            data.medications
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Allergies</span>
                    <strong>
                        ${displayValue(
                            data.allergies
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Previous Episodes</span>
                    <strong>
                        ${displayValue(
                            data.previous_episodes
                        )}
                    </strong>
                </div>

            </div>

        </div>


        <!-- =================================================
             FUNCTIONAL / CONTEXTUAL
             ================================================= -->

        <div class="modal-section compact-section">

            <h3>Functional / Context</h3>

            <div class="compact-info-grid">

                <div class="info-item">
                    <span>Communication Difficulty</span>
                    <strong>
                        ${displayValue(
                            data.communication_difficulty,
                            "None recorded"
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Mobility</span>
                    <strong>
                        ${displayValue(
                            data.mobility
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Consciousness</span>
                    <strong>
                        ${displayValue(
                            data.consciousness
                        )}
                    </strong>
                </div>

                <div class="info-item">
                    <span>Pregnancy Status</span>
                    <strong>
                        ${displayValue(
                            data.pregnancy_status
                        )}
                    </strong>
                </div>

            </div>

        </div>


        <!-- =================================================
             ACTIONS
             ================================================= -->

        <div class="reassessment-action details-actions">

            <button
                class="update-patient-button"
                onclick="enablePatientUpdate('${patient.id}')"
            >
                Update / Reassess Patient
            </button>

            <button
                class="override-patient-button"
                onclick="showOverridePanel('${patient.id}')"
            >
                Nurse Override
            </button>

        </div>

    `;

    modal.classList.remove("hidden");
}

function enablePatientUpdate(patientId) {

    const patient = patients.find(p => p.id === patientId);

    if (!patient) {
        return;
    }

    const modalContent = document.getElementById("modalContent");
    const data = patient.patientData || {};

    modalContent.innerHTML = `

        <div class="modal-header">

            <div>
                <h2>${patient.id} — Update Patient</h2>
                <p>Enter the latest information for reassessment</p>
            </div>

            <button
                class="modal-close"
                onclick="showPatientDetails('${patient.id}')"
            >
                ×
            </button>

        </div>


        <!-- CURRENT PRESENTATION -->

        <div class="update-section">

            <h3>Current Presentation</h3>

            <label>
                Chief Complaint
            </label>

            <input
                type="text"
                id="updateChiefComplaint"
                value="${data.chief_complaint || ""}"
            >


            <label>
                Symptoms
            </label>

            <textarea
                id="updateSymptoms"
                rows="2"
            >${data.symptoms || ""}</textarea>


            <label>
                Visible / Observable Signs
            </label>

            <textarea
                id="updateVisibleSigns"
                rows="2"
            >${data.visible_signs || ""}</textarea>


            <label>
                Pain Severity (0–10)
            </label>

            <input
                type="number"
                id="updatePainSeverity"
                min="0"
                max="10"
                value="${data.pain_severity || ""}"
            >

        </div>


        <!-- VITAL SIGNS -->

        <div class="update-section">

            <h3>Vital Signs</h3>

            <div class="update-grid">

                <div>

                    <label>
                        Heart Rate (bpm)
                    </label>

                    <input
                        type="number"
                        id="updateHeartRate"
                        value="${data.heart_rate || ""}"
                    >

                </div>


                <div>

                    <label>
                        Blood Pressure (mmHg)
                    </label>

                    <input
                        type="text"
                        id="updateBloodPressure"
                        value="${data.blood_pressure || ""}"
                    >

                </div>


                <div>

                    <label>
                        SpO₂ (%)
                    </label>

                    <input
                        type="number"
                        id="updateSpo2"
                        min="0"
                        max="100"
                        value="${data.spo2 || ""}"
                    >

                </div>


                <div>

                    <label>
                        Respiratory Rate (/min)
                    </label>

                    <input
                        type="number"
                        id="updateRespiratoryRate"
                        value="${data.respiratory_rate || ""}"
                    >

                </div>


                <div>

                    <label>
                        Temperature (°C)
                    </label>

                    <input
                        type="number"
                        step="0.1"
                        id="updateTemperature"
                        value="${data.temperature || ""}"
                    >

                </div>

            </div>

        </div>


        <!-- FUNCTIONAL STATUS -->

        <div class="update-section">

            <h3>Functional / Contextual Information</h3>


            <label>
                Communication Difficulty
            </label>

            <textarea
                id="updateCommunicationDifficulty"
                rows="2"
            >${data.communication_difficulty || ""}</textarea>


            <label>
                Mobility
            </label>

            <select id="updateMobility">

                <option value="">Select</option>

                <option value="normal"
                    ${data.mobility === "normal" ? "selected" : ""}>
                    Normal
                </option>

                <option value="limited"
                    ${data.mobility === "limited" ? "selected" : ""}>
                    Limited
                </option>

                <option value="unable"
                    ${data.mobility === "unable" ? "selected" : ""}>
                    Unable
                </option>

                <option value="unknown"
                    ${data.mobility === "unknown" ? "selected" : ""}>
                    Unknown
                </option>

            </select>


            <label>
                Consciousness / Mental Status
            </label>

            <select id="updateConsciousness">

                <option value="">Select</option>

                <option value="alert"
                    ${data.consciousness === "alert" ? "selected" : ""}>
                    Alert
                </option>

                <option value="confused"
                    ${data.consciousness === "confused" ? "selected" : ""}>
                    Confused
                </option>

                <option value="drowsy"
                    ${data.consciousness === "drowsy" ? "selected" : ""}>
                    Drowsy
                </option>

                <option value="unresponsive"
                    ${data.consciousness === "unresponsive" ? "selected" : ""}>
                    Unresponsive
                </option>

                <option value="unknown"
                    ${data.consciousness === "unknown" ? "selected" : ""}>
                    Unknown
                </option>

            </select>

        </div>




        <!-- MANUAL TRIAGE PRIORITY -->

        <div
            id="manualTriageSection"
            class="manual-triage-section hidden"
        >

            <h3>Manual Triage</h3>

            <p class="manual-triage-note">
                AI is currently unavailable.
                Please assign the patient's priority using
                your clinical judgement.
            </p>

            <label>
                Nurse-assigned Priority
            </label>

            <select id="manualPriority">

                <option value="CRITICAL">
                    CRITICAL
                </option>

                <option value="HIGH">
                    HIGH
                </option>

                <option value="URGENT">
                    URGENT
                </option>

                <option value="MODERATE" selected>
                    MODERATE
                </option>

                <option value="LOW">
                    LOW
                </option>

            </select>

        </div>

        <!-- ACTIONS -->

        <div class="reassessment-buttons">

            <button
                class="cancel-update-button"
                onclick="showPatientDetails('${patient.id}')"
            >
                Cancel
            </button>

            <button
                class="reassess-button"
                onclick="savePatientUpdate('${patient.id}')"
            >
                Save & Reassess
            </button>

        </div>

    `;

    // Show manual triage controls when AI is offline
    if (!aiAvailable) {

        const manualSection =
            document.getElementById(
                "manualTriageSection"
            );

        const saveButton =
            document.querySelector(
                ".reassessment-buttons .reassess-button"
            );

        if (manualSection) {
            manualSection.classList.remove("hidden");
        }

        if (saveButton) {
            saveButton.textContent =
                "Save Manual Triage";
        }
    }
}


function showOverridePanel(patientId) {

    const patient = patients.find(
        p => p.id === patientId
    );

    if (!patient) {
        return;
    }

    const modalContent =
        document.getElementById("modalContent");

    modalContent.innerHTML = `

        <div class="modal-header">

            <div>

                <h2>${patient.id} — Nurse Override</h2>

                <p>
                    Human clinical override of AI recommendation
                </p>

            </div>

            <button
                class="modal-close"
                onclick="showPatientDetails('${patient.id}')"
            >
                ×
            </button>

        </div>


        <div class="override-section">

            <h3>Current AI Recommendation</h3>

            <div class="modal-priority ${getPriorityClass(patient.priority)}">

                ${patient.priority}

            </div>

            <p>
                <strong>AI Confidence:</strong>
                ${patient.confidence}%
            </p>

            <p>
                <strong>Deterioration Risk:</strong>
                ${patient.deterioration_risk}
            </p>

        </div>


        <div class="override-section">

            <h3>Nurse Override</h3>

            <label>
                Override Priority
            </label>

            <select id="overridePriority">

                <option value="CRITICAL">
                    CRITICAL
                </option>

                <option value="HIGH">
                    HIGH
                </option>

                <option value="URGENT">
                    URGENT
                </option>

                <option value="MODERATE">
                    MODERATE
                </option>

                <option value="LOW">
                    LOW
                </option>

            </select>


            <label>
                Reason for Override
            </label>

            <textarea
                id="overrideReason"
                rows="4"
                placeholder="Enter clinical reason for overriding the AI recommendation..."
            ></textarea>

        </div>


        <div class="reassessment-buttons">

            <button
                class="cancel-update-button"
                onclick="showPatientDetails('${patient.id}')"
            >
                Cancel
            </button>

            <button
                class="reassess-button"
                onclick="applyNurseOverride('${patient.id}')"
            >
                Apply Override
            </button>

        </div>

    `;

}

function applyNurseOverride(patientId) {

    const patient = patients.find(
        p => p.id === patientId
    );

    if (!patient) {
        return;
    }


    const overridePriority =
        document.getElementById("overridePriority").value;

    const overrideReason =
        document.getElementById("overrideReason").value.trim();


    // Reason is mandatory
    if (!overrideReason) {

        alert(
            "Please enter a reason for the nurse override."
        );

        return;
    }


    // Save previous AI recommendation
    const previousPriority =
        patient.priority;


    // Store the nurse override
    patient.nurseOverride = {

        overridden: true,

        previousPriority:
            previousPriority,

        finalPriority:
            overridePriority,

        reason:
            overrideReason,

        timestamp:
            new Date().toLocaleTimeString()

    };


    // Final priority becomes the nurse-selected priority
    patient.priority =
        overridePriority;


    // CRITICAL should have highest queue priority
    patient.queuePriority =
        getPriorityWeight(overridePriority);

    // A human override is a reassessment point for waiting-time monitoring.
    patient.lastReassessmentAt = Date.now();
    patient.waitingAlertTriggered = false;
    patient.waitingReviewActive = false;
    patient.waitingReviewPreviousPriority = null;
    patient.waitingReviewThreshold = null;


    // Mark as human-overridden
    patient.humanOverride = true;


    // Add to assessment history
    if (!patient.assessmentHistory) {
        patient.assessmentHistory = [];
    }


    patient.assessmentHistory.push({

        type: "Nurse Override",

        timestamp:
            new Date().toLocaleTimeString(),

        previousPriority:
            previousPriority,

        priority:
            overridePriority,

        reason:
            overrideReason,

        patientData:
            { ...patient.patientData }

    });


    // -----------------------------------------
    // Audit log: Nurse override
    // -----------------------------------------

    addAuditLog({

        type: AUDIT_EVENT.NURSE_OVERRIDE,

        actor: "NURSE",

        category: "HUMAN_ACTION",

        patientId:
            patient.id,

        previousPriority:
            previousPriority,

        priority:
            overridePriority,

        reason:
            overrideReason
    });


    // Re-rank the queue
    sortPatientQueue();


    // Save to localStorage
    saveQueue();


    // Re-render queue
    renderQueue();


    // Show updated patient details
    showPatientDetails(patient.id);

}

function savePatientUpdate(patientId) {

    const patient = patients.find(
        p => p.id === patientId
    );

    if (!patient) {
        return;
    }

    const oldData = patient.patientData;

    // Collect the updated information from the form
    const updatedData = {

        // Keep information that is not currently editable
        age: oldData.age,
        sex: oldData.sex,
        pregnancy_status: oldData.pregnancy_status,

        symptom_duration:
            oldData.symptom_duration,

        injury_mechanism:
            oldData.injury_mechanism,

        medical_history:
            oldData.medical_history,

        medications:
            oldData.medications,

        allergies:
            oldData.allergies,

        previous_episodes:
            oldData.previous_episodes,

        no_history:
            oldData.no_history,


        // -----------------------------------------
        // Updated current presentation
        // -----------------------------------------

        chief_complaint:
            document.getElementById(
                "updateChiefComplaint"
            ).value,

        symptoms:
            document.getElementById(
                "updateSymptoms"
            ).value,

        visible_signs:
            document.getElementById(
                "updateVisibleSigns"
            ).value,

        pain_severity:
            document.getElementById(
                "updatePainSeverity"
            ).value,


        // -----------------------------------------
        // Updated vital signs
        // -----------------------------------------

        heart_rate:
            document.getElementById(
                "updateHeartRate"
            ).value,

        blood_pressure:
            document.getElementById(
                "updateBloodPressure"
            ).value,

        spo2:
            document.getElementById(
                "updateSpo2"
            ).value,

        respiratory_rate:
            document.getElementById(
                "updateRespiratoryRate"
            ).value,

        temperature:
            document.getElementById(
                "updateTemperature"
            ).value,


        // -----------------------------------------
        // Updated functional / contextual data
        // -----------------------------------------

        communication_difficulty:
            document.getElementById(
                "updateCommunicationDifficulty"
            ).value,

        mobility:
            document.getElementById(
                "updateMobility"
            ).value,

        consciousness:
            document.getElementById(
                "updateConsciousness"
            ).value
    };


    // Basic validation
    if (
        updatedData.chief_complaint.trim() === ""
    ) {

        alert(
            "Please enter the patient's chief complaint."
        );

        return;
    }


    // -------------------------------------------------
    // OFFLINE MODE
    // Save manually when AI is unavailable.
    // -------------------------------------------------

    if (!aiAvailable) {

        const manualPriority =
            document.getElementById(
                "manualPriority"
            ).value;


        // ---------------------------------------------
        // Save updated patient information
        // ---------------------------------------------

        patient.patientData =
            updatedData;

        patient.age =
            updatedData.age;

        patient.complaint =
            updatedData.chief_complaint;


        // ---------------------------------------------
        // Nurse becomes the source of the priority
        // ---------------------------------------------

        patient.priority =
            manualPriority;

        patient.confidence = null;

        patient.deterioration_risk =
            "MANUAL";

        patient.reasons = [
            "Priority assigned by nurse during AI outage.",
            "AI assessment not available."
        ];


        // ---------------------------------------------
        // Mark the assessment source
        // ---------------------------------------------

        patient.triageSource =
            "Nurse / Manual Triage";

        patient.aiReviewed =
            false;


        // ---------------------------------------------
        // Update queue ranking
        // ---------------------------------------------

        patient.queuePriority =
            getPriorityWeight(
                manualPriority
            );


        // ---------------------------------------------
        // Store in assessment history
        // ---------------------------------------------

        if (!patient.assessmentHistory) {

            patient.assessmentHistory = [];

        }

        patient.assessmentHistory.push({

            type: "Manual Triage",

            timestamp:
                new Date().toLocaleTimeString(),

            priority:
                manualPriority,

            confidence:
                null,

            reason:
                "AI unavailable. Priority assigned by nurse.",

            patientData:
                { ...updatedData }

        });


        // ---------------------------------------------
        // Audit log
        // ---------------------------------------------

        addAuditLog({

            type: AUDIT_EVENT.MANUAL_TRIAGE,

            actor: "NURSE",

            category: "HUMAN_ACTION",

            patientId:
                patient.id,

            priority:
                manualPriority,

            reason:
                "AI unavailable. Nurse assigned priority."
        });


        // ---------------------------------------------
        // Save everything
        // ---------------------------------------------

        sortPatientQueue();

        saveQueue();

        renderQueue();


        // Close/update details
        showPatientDetails(
            patient.id
        );

        return;
    }


    // -------------------------------------------------
    // ONLINE MODE
    // Continue using AI reassessment.
    // -------------------------------------------------

    reassessPatient(
        patientId,
        updatedData
    );
}



function openAuditLog() {

    const modal =
        document.getElementById("auditLogModal");

    modal.classList.remove("hidden");

    renderAuditLog();
}


function closeAuditLog() {

    const modal =
        document.getElementById("auditLogModal");

    modal.classList.add("hidden");
}

function closePatientDetails() {

    const modal = document.getElementById("patientModal");

    modal.classList.add("hidden");
}

function closeAddPatient() {

    const modal = document.getElementById("addPatientModal");

    modal.classList.add("hidden");
}

function showAIUnavailableModal() {

    const modal =
        document.getElementById("aiUnavailableModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");
}


function closeAIUnavailableModal() {

    const modal =
        document.getElementById("aiUnavailableModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}





// =========================================================
// AUTOMATIC AI REVIEW OF MANUALLY TRIAGED PATIENTS
// =========================================================

async function reviewPendingManualPatients() {

    if (!aiAvailable) {
        return;
    }

    const pendingPatients = patients.filter(
        patient =>
            patient.triageSource === "Nurse / Manual Triage" &&
            patient.aiReviewed === false &&
            patient.patientData &&
            patient._aiReviewInProgress !== true
    );

    if (pendingPatients.length === 0) {
        return;
    }

    console.log(
        `AI recovery: reviewing ${pendingPatients.length} pending patient(s).`
    );

    for (const patient of pendingPatients) {

        // Prevent duplicate reassessment requests
        patient._aiReviewInProgress = true;

        console.log(
            `Automatically reassessing ${patient.id}...`
        );

        try {

            await reassessPatient(
                patient.id,
                { ...patient.patientData },
                false,
                true
            );

        } finally {

            patient._aiReviewInProgress = false;
        }

        // If AI went offline during reassessment,
        // stop processing the remaining patients.
        if (!aiAvailable) {
            console.warn(
                "AI became unavailable during automatic review."
            );
            break;
        }
    }

    sortPatientQueue();
    saveQueue();
    renderQueue();
}

function setAIMode(available) {

    const indicator =
        document.getElementById("aiModeIndicator");

    if (!indicator) {
        return;
    }


    // -------------------------------------------------
    // AI is available
    // -------------------------------------------------

    if (available) {

        const wasOffline =
            aiAvailable === false;

        aiAvailable = true;

        indicator.className =
            "ai-mode-indicator ai-online";

        indicator.textContent =
            "● AI ONLINE";


        // AI has just recovered
        if (wasOffline) {
            console.log(
                "AI triage service is back online."
            );
        }
            // Automatically review patients
            // who were triaged manually during the outage.
            reviewPendingManualPatients();
        

    }

    // -------------------------------------------------
    // AI is unavailable
    // -------------------------------------------------

    else {

        aiAvailable = false;

        indicator.className =
            "ai-mode-indicator ai-manual";

        indicator.textContent =
            "● MANUAL MODE — AI OFFLINE";
    }
}

async function checkAIStatus() {

    try {

        const response =
            await fetch("/health", {
                method: "GET",
                cache: "no-store"
            });


        if (!response.ok) {
            throw new Error(
                "AI health check failed"
            );
        }


        const result =
            await response.json();


        if (result.ai_available === true) {

            setAIMode(true);

        } else {

            setAIMode(false);

        }


    } catch (error) {

        console.warn(
            "AI service unavailable."
        );

        setAIMode(false);
    }
}

// Check AI availability when the page loads
checkAIStatus();


// ---------------------------------------------------------
// TEMPORARY DEMO / TEST MODE
// ---------------------------------------------------------
// Allows us to simulate an AI outage without waiting
// for the real backend to fail.
//
// Open browser console and use:
//
//     enableOfflineDemo();
//
// or:
//
//     enableOnlineDemo();
// ---------------------------------------------------------

function enableOfflineDemo() {

    setAIMode(false);

    console.log(
        "DEMO MODE: AI forced OFFLINE."
    );
}


function enableOnlineDemo() {

    setAIMode(true);

    console.log(
        "DEMO MODE: AI forced ONLINE."
    );
}

async function reassessPatient(patientId, updatedData, showDetails = true, preserveManualPriority = false) {

    const patient = patients.find(
        p => p.id === patientId
    );

    if (!patient) {
        return;
    }

    const modalContent = document.getElementById("modalContent");
    // Save the previous state
    const previousPriority = patient.priority;
    const previousData = {
        ...patient.patientData
    };


    try {

        // Send updated patient information
        // to the triage engine
        const response = await fetch("/reassess", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error(
                `Reassessment request failed: ${response.status}`
            );
        }

        const result = await response.json();


        // -------------------------------------------------
        // FAIL-SAFE: Insufficient information
        // Never downgrade an existing patient because
        // information is missing.
        // -------------------------------------------------

        if (result.fail_safe === true) {

            modalContent.innerHTML = `
                <div class="modal-header">
                    <div>
                        <h2>${patient.id} — Reassessment Safety Check</h2>
                        <p>Patient priority has been preserved.</p>
                    </div>

                    <button
                        class="modal-close"
                        onclick="showPatientDetails('${patient.id}')"
                    >
                        ×
                    </button>
                </div>

                <div class="assessment-result">
                    <h3>⚠ Insufficient Information</h3>

                    <p>
                        <strong>Human review required.</strong>
                    </p>

                    <p>
                        Do not downgrade automatically.
                    </p>

                    <p>
                        Current priority remains:
                        <strong>${previousPriority}</strong>
                    </p>
                </div>
            `;

            return;
        }


        // -------------------------------------------------
        // Detect deterioration
        // -------------------------------------------------

        const priorityImproved = (
            getPriorityWeight(result.priority)
            >
            getPriorityWeight(previousPriority)
        );


        const deteriorationDetected = (
            priorityImproved ||
            (
                patient.deterioration_risk !== "HIGH" &&
                result.deterioration_risk === "HIGH"
            )
        );

        // -------------------------------------------------
        // Preserve nurse priority during AI recovery
        // -------------------------------------------------

        const manualRecovery =
            preserveManualPriority &&
            patient.triageSource === "Nurse / Manual Triage" &&
            patient.aiReviewed === false;

        const finalPriority =
            manualRecovery &&
            getPriorityWeight(previousPriority) >=
            getPriorityWeight(result.priority)
                ? previousPriority
                : result.priority;


        // -----------------------------------------
        // Update final patient state
        // -----------------------------------------

        patient.priority =
            finalPriority;

        patient.confidence =
            result.confidence;

        patient.deterioration_risk =
            result.deterioration_risk;

        patient.reasons =
            result.reasons;


        // -----------------------------------------
        // AI has now reviewed the patient
        // -----------------------------------------

        patient.aiReviewed =
            true;

        if (manualRecovery) {

            patient.triageSource =
                "Nurse / Manual Triage";

            patient.manualPriority =
                previousPriority;

            patient.aiRecommendation =
                result.priority;

            patient.aiConfidence =
                result.confidence;

            patient.aiDeteriorationRisk =
                result.deterioration_risk;

        } else {

            patient.triageSource =
                "AI Reassessment";

        }

        patient.patientData =
            updatedData;

        // Update information displayed directly
        // on the queue card
        patient.age =
            updatedData.age;

        patient.complaint =
            updatedData.chief_complaint;

        patient.deteriorationDetected =
            deteriorationDetected;

        // A completed reassessment resets the waiting-time
        // monitoring interval for the updated patient state.
        patient.lastReassessmentAt = Date.now();
        patient.waitingAlertTriggered = false;
        patient.waitingReviewActive = false;
        patient.waitingReviewPreviousPriority = null;
        patient.waitingReviewThreshold = null;


        // -------------------------------------------------
        // Store reassessment in history
        // -------------------------------------------------

        patient.assessmentHistory.push({

            type: "Reassessment",

            timestamp:
                new Date().toLocaleTimeString(),

            priority:
                patient.priority,

            aiRecommendation:
                result.priority,

            confidence:
                result.confidence,

            deterioration_risk:
                result.deterioration_risk,

            reasons:
                result.reasons,

            patientData:
                { ...updatedData },

            previousPriority:
                previousPriority,

            previousData:
                previousData
        });


        // -----------------------------------------
        // Audit log: Reassessment
        // -----------------------------------------

        addAuditLog({

            type: AUDIT_EVENT.AI_REASSESSMENT,

            actor: "AI",

            category: "TRIAGE",

            patientId:
                patient.id,

            previousPriority:
                previousPriority,

            priority:
                patient.priority,

            aiRecommendation:
                result.priority,

            confidence:
                result.confidence
        });


        // Update queue priority
        patient.queuePriority =
            getPriorityWeight(patient.priority);


        // Re-rank the queue
        sortPatientQueue();

        // Save the updated patient state
        // so it survives a page reload
        saveQueue();

        // Re-render the queue
        renderQueue();


        // Show the updated patient details
        if (showDetails) {
            showPatientDetails(patient.id);
        }


        return result;


    } catch (error) {

        console.error(
            "Reassessment failed:",
            error
        );

        // AI is unavailable.
        // Switch the interface to manual mode.
        setAIMode(false);

        // Show the attention notification.
        showAIUnavailableModal();
    }
}

function sortPatientQueue() {

    patients.sort((a, b) => {

        // -----------------------------------------
        // 1. Clinical priority comes first
        // -----------------------------------------

        if (a.queuePriority !== b.queuePriority) {

            return b.queuePriority - a.queuePriority;
        }


        // -----------------------------------------
        // 2. If same priority,
        //    longer waiting time comes first
        // -----------------------------------------

        if (a.waiting_time !== b.waiting_time) {

            return b.waiting_time - a.waiting_time;
        }


        // -----------------------------------------
        // 3. If everything is equal,
        //    older patient comes first
        // -----------------------------------------

        return a.addedAt - b.addedAt;

    });
}


// =========================================================
// LOAD DEMO QUEUE
// Creates 15 realistic demo patients for demonstration.
// =========================================================

function loadDemoQueue() {

    // Prevent accidental mixing with an existing queue.
    if (patients.length > 0) {

        const proceed = confirm(
            "The queue already contains patients.\n\n" +
            "Loading the demo queue will replace the current queue.\n\n" +
            "Continue?"
        );

        if (!proceed) {
            return;
        }

    }


    // Clear the current queue.
    patients = [];


    // Reset patient numbering.
    nextPatientNumber = 1;


    const now = Date.now();


    // ---------------------------------------------------------
    // Demo patient data
    // ---------------------------------------------------------

    const demoPatients = [

        {
            age: 72,
            complaint: "Severe breathlessness",
            priority: "HIGH",
            confidence: 90,
            deterioration_risk: "HIGH",
            reasons: [
                "Severe respiratory distress / airway concern",
                "Critically low SpO₂ (87%)"
            ],
            vitals: {
                heart_rate: "112",
                blood_pressure: "145/88",
                spo2: "87",
                respiratory_rate: "31",
                temperature: "37.2"
            }
        },


        {
            age: 35,
            complaint: "Major bleeding",
            priority: "HIGH",
            confidence: 85,
            deterioration_risk: "HIGH",
            reasons: [
                "Major or uncontrolled bleeding"
            ],
            vitals: {
                heart_rate: "118",
                blood_pressure: "95/60",
                spo2: "96",
                respiratory_rate: "24",
                temperature: "36.7"
            }
        },


        {
            age: 68,
            complaint: "Chest pain",
            priority: "HIGH",
            confidence: 88,
            deterioration_risk: "HIGH",
            reasons: [
                "Potentially time-sensitive cardiac presentation"
            ],
            vitals: {
                heart_rate: "124",
                blood_pressure: "90/58",
                spo2: "94",
                respiratory_rate: "26",
                temperature: "37.1"
            }
        },


        {
            age: 54,
            complaint: "Severe abdominal pain",
            priority: "HIGH",
            confidence: 82,
            deterioration_risk: "HIGH",
            reasons: [
                "Severe pain with concerning clinical features"
            ],
            vitals: {
                heart_rate: "110",
                blood_pressure: "100/65",
                spo2: "95",
                respiratory_rate: "25",
                temperature: "38.4"
            }
        },


        {
            age: 43,
            complaint: "Wheezing",
            priority: "URGENT",
            confidence: 75,
            deterioration_risk: "MODERATE",
            reasons: [
                "Potentially time-sensitive airway or breathing problem"
            ],
            vitals: {
                heart_rate: "102",
                blood_pressure: "125/80",
                spo2: "93",
                respiratory_rate: "28",
                temperature: "37.0"
            }
        },


        {
            age: 40,
            complaint: "Weakness",
            priority: "URGENT",
            confidence: 75,
            deterioration_risk: "MODERATE",
            reasons: [
                "Potential acute change requiring timely assessment"
            ],
            vitals: {
                heart_rate: "105",
                blood_pressure: "110/70",
                spo2: "94",
                respiratory_rate: "23",
                temperature: "37.2"
            }
        },


        {
            age: 61,
            complaint: "Persistent vomiting",
            priority: "URGENT",
            confidence: 74,
            deterioration_risk: "MODERATE",
            reasons: [
                "Potential dehydration and clinical deterioration"
            ],
            vitals: {
                heart_rate: "108",
                blood_pressure: "105/68",
                spo2: "96",
                respiratory_rate: "22",
                temperature: "37.8"
            }
        },


        {
            age: 50,
            complaint: "Moderate chest discomfort",
            priority: "MODERATE",
            confidence: 76,
            deterioration_risk: "MODERATE",
            reasons: [
                "Symptoms require timely clinical assessment"
            ],
            vitals: {
                heart_rate: "92",
                blood_pressure: "130/82",
                spo2: "97",
                respiratory_rate: "20",
                temperature: "36.9"
            }
        },


        {
            age: 43,
            complaint: "Wheezing",
            priority: "MODERATE",
            confidence: 70,
            deterioration_risk: "MODERATE",
            reasons: [
                "Respiratory symptoms requiring assessment"
            ],
            vitals: {
                heart_rate: "88",
                blood_pressure: "128/80",
                spo2: "95",
                respiratory_rate: "22",
                temperature: "37.0"
            }
        },


        {
            age: 47,
            complaint: "Moderate headache",
            priority: "MODERATE",
            confidence: 70,
            deterioration_risk: "MODERATE",
            reasons: [
                "Persistent symptoms requiring clinical assessment"
            ],
            vitals: {
                heart_rate: "84",
                blood_pressure: "135/85",
                spo2: "98",
                respiratory_rate: "18",
                temperature: "37.1"
            }
        },


        {
            age: 29,
            complaint: "Mild cough",
            priority: "LOW",
            confidence: 70,
            deterioration_risk: "LOW",
            reasons: [
                "No immediate RED criteria detected.",
                "No YELLOW criteria detected.",
                "No high-risk vital signs detected."
            ],
            vitals: {
                heart_rate: "72",
                blood_pressure: "120/80",
                spo2: "98",
                respiratory_rate: "16",
                temperature: "36.8"
            }
        },


        {
            age: 25,
            complaint: "Mild cough",
            priority: "LOW",
            confidence: 70,
            deterioration_risk: "LOW",
            reasons: [
                "No immediate RED criteria detected.",
                "No YELLOW criteria detected.",
                "No high-risk vital signs detected."
            ],
            vitals: {
                heart_rate: "70",
                blood_pressure: "118/78",
                spo2: "98",
                respiratory_rate: "16",
                temperature: "36.7"
            }
        },


        {
            age: 40,
            complaint: "Minor knee injury",
            priority: "LOW",
            confidence: 70,
            deterioration_risk: "LOW",
            reasons: [
                "No immediate RED criteria detected.",
                "No YELLOW criteria detected.",
                "No high-risk vital signs detected."
            ],
            vitals: {
                heart_rate: "74",
                blood_pressure: "122/80",
                spo2: "99",
                respiratory_rate: "15",
                temperature: "36.8"
            }
        },


        {
            age: 16,
            complaint: "Minor elbow injury",
            priority: "LOW",
            confidence: 70,
            deterioration_risk: "LOW",
            reasons: [
                "No immediate RED criteria detected.",
                "No YELLOW criteria detected.",
                "No high-risk vital signs detected."
            ],
            vitals: {
                heart_rate: "76",
                blood_pressure: "118/76",
                spo2: "99",
                respiratory_rate: "16",
                temperature: "36.7"
            }
        },


        {
            age: 32,
            complaint: "Mild sore throat",
            priority: "LOW",
            confidence: 70,
            deterioration_risk: "LOW",
            reasons: [
                "No immediate RED criteria detected.",
                "No YELLOW criteria detected.",
                "No high-risk vital signs detected."
            ],
            vitals: {
                heart_rate: "73",
                blood_pressure: "120/78",
                spo2: "98",
                respiratory_rate: "16",
                temperature: "37.0"
            }
        }

    ];


    // ---------------------------------------------------------
    // Convert demo data into normal patient objects
    // ---------------------------------------------------------

    demoPatients.forEach((demo, index) => {

        const patientId =
            `P${String(index + 1).padStart(3, "0")}`;


        const patientData = {

            age: String(demo.age),

            sex: "",

            pregnancy_status: "not_applicable",

            chief_complaint: demo.complaint,

            symptoms: demo.complaint,

            symptom_duration: "",

            pain_severity: "",

            visible_signs: "",

            injury_mechanism: "",

            heart_rate: demo.vitals.heart_rate,

            blood_pressure: demo.vitals.blood_pressure,

            spo2: demo.vitals.spo2,

            respiratory_rate:
                demo.vitals.respiratory_rate,

            temperature:
                demo.vitals.temperature,

            medical_history: "",

            medications: "",

            allergies: "",

            previous_episodes: "",

            no_history: false,

            communication_difficulty: "",

            mobility: "normal",

            consciousness: "alert"

        };


        const patient = {

            id: patientId,

            age: String(demo.age),

            complaint: demo.complaint,

            priority: demo.priority,

            confidence: demo.confidence,

            deterioration_risk:
                demo.deterioration_risk,

            reasons:
                [...demo.reasons],

            patientData: patientData,


            assessmentHistory: [

                {

                    type: "Initial assessment",

                    timestamp:
                        new Date().toLocaleTimeString(),

                    priority: demo.priority,

                    confidence: demo.confidence,

                    deterioration_risk:
                        demo.deterioration_risk,

                    reasons:
                        [...demo.reasons],

                    patientData:
                        JSON.parse(
                            JSON.stringify(patientData)
                        )

                }

            ],


            waiting_time: 0,

            deteriorationDetected: false,

            queuePriority:
                getPriorityWeight(demo.priority),

            addedAt:
                now - (index * 60000)

        };


        patients.push(patient);

    });


    // Next real patient will start at P016.
    nextPatientNumber = 16;


    // Rank the queue.
    updateWaitingTimes();

    sortPatientQueue();


    // Save everything.
    saveQueue();


    // Display.
    renderQueue();


    alert(
        "Demo queue loaded.\n\n" +
        "15 patients are now in the queue.\n\n" +
        "Click 'Simulate Surge' to increase " +
        "the queue to 45 patients."
    );
}


function clearQueue() {

    patients = [];

    nextPatientNumber = 1;

    saveQueue();

    renderQueue();

    closePatientDetails();

}

demoQueueButton.addEventListener("click", function () {

    loadDemoQueue();

});


// =========================================================
// SURGE MODE
// Simulate a sudden 3x increase in ED patient volume.
// 15 patients -> 45 patients
// =========================================================

function simulateSurge() {

    // Surge simulation is designed for a 15-patient baseline.
    if (patients.length !== 15) {

        alert(
            `Surge simulation requires exactly 15 patients.\n\n` +
            `Current queue: ${patients.length} patients.`
        );

        return;
    }


    const originalPatients = patients.slice();

    const now = Date.now();

    const surgePatients = [];


    // Create 30 additional simulated patients.
    // The original 15 patients remain unchanged.
    for (let round = 1; round <= 2; round++) {

        originalPatients.forEach(sourcePatient => {

            const simulatedPatient = {

                // Give the simulated patient a new ID.
                id:
                    `P${String(nextPatientNumber).padStart(3, "0")}`,

                // Copy basic information.
                age:
                    sourcePatient.age,

                complaint:
                    sourcePatient.complaint,


                // Copy current triage assessment.
                priority:
                    sourcePatient.priority,

                confidence:
                    sourcePatient.confidence,

                deterioration_risk:
                    sourcePatient.deterioration_risk,

                reasons:
                    [...(sourcePatient.reasons || [])],


                // Deep-copy patient information.
                patientData:
                    JSON.parse(
                        JSON.stringify(
                            sourcePatient.patientData
                        )
                    ),


                // Start a fresh assessment history
                // for the simulated patient.
                assessmentHistory: [

                    {
                        type: "Initial assessment",

                        timestamp:
                            new Date().toLocaleTimeString(),

                        priority:
                            sourcePatient.priority,

                        confidence:
                            sourcePatient.confidence,

                        deterioration_risk:
                            sourcePatient.deterioration_risk,

                        reasons:
                            [...(sourcePatient.reasons || [])],

                        patientData:
                            JSON.parse(
                                JSON.stringify(
                                    sourcePatient.patientData
                                )
                            )
                    }

                ],


                // New patients enter the queue now.
                waiting_time: 0,

                addedAt:
                    now,


                // Queue ranking.
                queuePriority:
                    getPriorityWeight(
                        sourcePatient.priority
                    ),


                // Fresh deterioration state.
                deteriorationDetected:
                    false
            };


            patients.push(simulatedPatient);

            nextPatientNumber++;

        });

    }


    // Recalculate waiting times and queue ranking.
    updateWaitingTimes();

    sortPatientQueue();

    // Save the simulated surge.
    saveQueue();

    // Update the UI.
    renderQueue();


    alert(
        "Surge simulation complete.\n\n" +
        "Patient volume increased from 15 to 45."
    );
}

surgeButton.addEventListener("click", function () {

    simulateSurge();

});

clearQueueButton.addEventListener("click", function () {

    if (patients.length === 0) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to clear the entire queue?\n\n` +
        `This will remove all ${patients.length} patients from the queue.`
    );

    if (!confirmed) {
        return;
    }

    clearQueue();
});

restoreQueueState();
checkWaitingTimeMonitoring();

renderQueue();

renderAuditLog();

setInterval(function () {

    updateWaitingTimes();
    checkWaitingTimeMonitoring();

    sortPatientQueue();

    renderQueue();

}, 30000);