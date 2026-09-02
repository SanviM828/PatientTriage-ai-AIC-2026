"""
PatientTriage.ai
ED Triage Decision Engine

Prototype only.
This engine does NOT diagnose patients.

It combines:
1. Red / high-acuity clinical presentation
2. Yellow / urgent clinical features
3. High-risk vital signs
4. Deterioration risk
5. Data completeness / uncertainty

The final output is intentionally simplified into:

CRITICAL
HIGH
URGENT
MODERATE
LOW
REVIEW
"""

import re


# =========================================================
# BASIC HELPERS
# =========================================================

def clean_text(value):
    """Convert a value into clean lowercase text."""
    if value is None:
        return ""

    return str(value).strip().lower()


def to_number(value):
    """Safely convert an input into a float."""
    try:
        if value is None or value == "":
            return None

        return float(value)

    except (ValueError, TypeError):
        return None


def contains_any(text, keywords):
    """
    Return True if any keyword is present and NOT explicitly negated.

    Handles simple clinical negation such as:
        "no bleeding"
        "no active bleeding"
        "denies chest pain"
        "without vomiting"
        "no difficulty breathing"
    """

    text = clean_text(text)

    negation_pattern = re.compile(
        r"\b(?:no|not|without|denies|denied|negative for|none|"
        r"absent|absence of)\b"
        r"(?:\s+\w+){0,5}\s*$"
    )

    for keyword in keywords:
        keyword = clean_text(keyword)

        if not keyword:
            continue

        pattern = re.compile(
            r"\b" + re.escape(keyword) + r"\b"
        )

        for match in pattern.finditer(text):

            # Look immediately before the keyword.
            preceding_text = text[:match.start()]

            # Only inspect a short local context.
            preceding_text = preceding_text[-60:]

            # If the keyword is explicitly negated,
            # do NOT count it as present.
            if negation_pattern.search(preceding_text):
                continue

            return True

    return False


# =========================================================
# VITAL SIGN PARSING
# =========================================================

def parse_blood_pressure(value):
    """
    Parse BP such as:
        120/80
        90/60

    Returns:
        systolic, diastolic
    """

    if not value:
        return None, None

    match = re.match(
        r"^\s*(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)\s*$",
        str(value)
    )

    if not match:
        return None, None

    return float(match.group(1)), float(match.group(2))


# =========================================================
# CRITICAL CRITERIA
# =========================================================

def check_critical_criteria(patient):
    """
    Identify presentations that should immediately receive
    Level 1 — CRITICAL priority in our prototype.

    These are safety-oriented rules for immediately
    life-threatening presentations.
    """

    complaint = clean_text(patient.get("chief_complaint"))
    symptoms = clean_text(patient.get("symptoms"))
    visible_signs = clean_text(patient.get("visible_signs"))
    injury = clean_text(patient.get("injury_mechanism"))
    consciousness = clean_text(patient.get("consciousness"))

    age = to_number(patient.get("age"))

    combined_text = " ".join([
        complaint,
        symptoms,
        visible_signs
    ])

    reasons = []


    # -----------------------------------------------------
    # 1. SEVERE RESPIRATORY DISTRESS
    # -----------------------------------------------------

    severe_breathing = contains_any(
        combined_text,
        [
            "severe respiratory distress",
            "respiratory distress",
            "cannot breathe",
            "unable to breathe",
            "gasping",
            "airway obstruction"
        ]
    )

    if severe_breathing:

        reasons.append(
            "Severe respiratory distress / airway concern"
        )


    # -----------------------------------------------------
    # 2. VERY LOW OXYGEN SATURATION
    # -----------------------------------------------------

    spo2 = to_number(patient.get("spo2"))

    if spo2 is not None and spo2 < 85:

        reasons.append(
            f"Critically low SpO₂ ({spo2:g}%)"
        )


    # -----------------------------------------------------
    # 3. UNRESPONSIVE / ACUTE ALTERED CONSCIOUSNESS
    # -----------------------------------------------------

    if consciousness in [
        "unresponsive",
        "drowsy"
    ]:

        reasons.append(
            "Abnormal consciousness / reduced responsiveness"
        )


    if contains_any(
        combined_text,
        [
            "unresponsive",
            "unconscious",
            "not responding",
            "acute confusion",
            "sudden confusion"
        ]
    ):

        reasons.append(
            "Acute alteration in mental status"
        )


    # -----------------------------------------------------
    # 4. MAJOR / UNCONTROLLED BLEEDING
    # -----------------------------------------------------

    major_bleeding = contains_any(
        combined_text,
        [
            "major bleeding",
            "severe bleeding",
            "uncontrolled bleeding",
            "heavy bleeding",
            "massive bleeding"
        ]
    )

    if major_bleeding:

        reasons.append(
            "Major or uncontrolled bleeding"
        )


    # -----------------------------------------------------
    # 5. ACTIVE CONVULSION / SEIZURE
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "active seizure",
            "active convulsion",
            "ongoing seizure",
            "ongoing convulsion"
        ]
    ):

        reasons.append(
            "Active seizure / convulsion"
        )


    # -----------------------------------------------------
    # 6. STRIDOR / CENTRAL CYANOSIS
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "stridor",
            "central cyanosis",
            "blue lips",
            "blue tongue"
        ]
    ):

        reasons.append(
            "Possible airway compromise / central cyanosis"
        )


    # -----------------------------------------------------
    # 7. CRITICAL BLOOD PRESSURE
    # -----------------------------------------------------
    age = to_number(patient.get("age"))
    systolic, diastolic = parse_blood_pressure(
        patient.get("blood_pressure")
    )

    if systolic is not None and systolic < 90:

        reasons.append(
            f"Very low systolic blood pressure ({systolic:g} mmHg)"
        )


    # -----------------------------------------------------
    # 8. CRITICALLY ABNORMAL HEART RATE
    # -----------------------------------------------------

    heart_rate = to_number(patient.get("heart_rate"))

    if heart_rate is not None:

        # Age-specific critical HR thresholds.
        # These are intentionally stricter than the HIGH thresholds.

        if age is not None and age < 12:

            if age < 1:
                critical_hr_low = 50
                critical_hr_high = 200
            elif age < 5:
                critical_hr_low = 50
                critical_hr_high = 180
            else:
                critical_hr_low = 40
                critical_hr_high = 180

        else:
            # Adult / older-child critical threshold
            critical_hr_low = 40
            critical_hr_high = 150

        if heart_rate < critical_hr_low:

            reasons.append(
                f"Critically low heart rate for age ({heart_rate:g}/min)"
            )

        elif heart_rate > critical_hr_high:

            reasons.append(
                f"Critically high heart rate for age ({heart_rate:g}/min)"
            )


    # -----------------------------------------------------
    # FINAL CRITICAL DECISION
    # -----------------------------------------------------

    if reasons:

        return True, reasons

    return False, []


# =========================================================
# HIGH CRITERIA
# =========================================================

def check_high_criteria(patient):
    """
    Identify patients who do not meet Level 1 criteria
    but have potentially high-acuity or time-sensitive findings.
    """

    complaint = clean_text(patient.get("chief_complaint"))
    symptoms = clean_text(patient.get("symptoms"))
    visible_signs = clean_text(patient.get("visible_signs"))
    consciousness = clean_text(patient.get("consciousness"))

    combined_text = " ".join([
        complaint,
        symptoms,
        visible_signs
    ])

    reasons = []


    # -----------------------------------------------------
    # 1. MODERATE RESPIRATORY SYMPTOMS
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "severe breathlessness",
            "severe shortness of breath",
            "severe difficulty breathing",
            "severe breathing difficulty"
        ]
    ):

        reasons.append(
            "Potentially time-sensitive airway or breathing problem"
        )


    # -----------------------------------------------------
    # 2. CHEST PAIN
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "chest pain",
            "chest pressure",
            "chest tightness",
            "chest discomfort"
        ]
    ):

        reasons.append(
            "Potentially time-sensitive chest discomfort"
        )


    # -----------------------------------------------------
    # 3. ACUTE NEUROLOGICAL SYMPTOMS
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "stroke",
            "facial droop",
            "slurred speech",
            "new weakness",
            "sudden weakness",
            "loss of sensation",
            "sudden numbness"
        ]
    ):

        reasons.append(
            "Possible acute neurological event"
        )


    # -----------------------------------------------------
    # 4. SIGNIFICANT BLEEDING
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "bleeding",
            "blood loss",
            "vomiting blood",
            "blood in stool"
        ]
    ):

        reasons.append(
            "Active bleeding requires prompt assessment"
        )


    # -----------------------------------------------------
    # 5. ABNORMAL CONSCIOUSNESS
    # -----------------------------------------------------

    if consciousness in [
        "confused",
        "drowsy"
    ]:

        reasons.append(
            "Altered mental status"
        )


    # -----------------------------------------------------
    # 6. HIGH-RISK VITAL SIGNS
    # -----------------------------------------------------

    spo2 = to_number(patient.get("spo2"))
    respiratory_rate = to_number(
        patient.get("respiratory_rate")
    )
    heart_rate = to_number(
        patient.get("heart_rate")
    )
    temperature = to_number(
        patient.get("temperature")
    )
    age = to_number(patient.get("age"))
    systolic, diastolic = parse_blood_pressure(
        patient.get("blood_pressure")
    )


    # SpO₂ 90–91:
    # below the ESI danger-zone threshold of 92,
    # but not in our <90 HIGH bucket.

    if spo2 is not None:

        if 85 <= spo2 < 92:

            reasons.append(
                f"Low oxygen saturation (SpO₂ {spo2:g}%)"
            )

# Age-specific respiratory-rate thresholds
    if respiratory_rate is not None:

        if age < 12:
            if age < 1:
                rr_low = 25
                rr_high = 50
            elif age < 5:
                rr_low = 20
                rr_high = 40
            else:
                rr_low = 10
                rr_high = 30
        else:
            # Adult threshold (age >= 12)
            rr_low = 10
            rr_high = 30

        if respiratory_rate < rr_low:
            reasons.append(
                f"Respiratory rate too low for age ({respiratory_rate}/min)"
            )
        elif respiratory_rate > rr_high:
            reasons.append(
                f"Respiratory rate too high for age ({respiratory_rate}/min)"
            )


    # Heart rate

# Age-specific heart-rate thresholds
    if heart_rate is not None:

        if age < 12:
            if age < 1:
                hr_low = 90
                hr_high = 180
            elif age < 5:
                hr_low = 80
                hr_high = 160
            else:
                hr_low = 70
                hr_high = 140
        else:
            # Adult threshold (age >= 12)
            hr_low = 60
            hr_high = 130

        if heart_rate < hr_low:
            reasons.append(
                f"Heart rate too low for age ({heart_rate} bpm)"
            )
        elif heart_rate > hr_high:
            reasons.append(
                f"Heart rate too high for age ({heart_rate} bpm)"
            )

    # Temperature

    if temperature is not None:

        if temperature < 36:

            reasons.append(
                f"Low temperature ({temperature:g}°C)"
            )

        elif temperature > 39:

            reasons.append(
                f"High temperature ({temperature:g}°C)"
            )


    # Blood pressure

    if systolic is not None:

        if systolic < 90:

            reasons.append(
                f"Low systolic blood pressure ({systolic:g} mmHg)"
            )

        elif systolic > 180:

            reasons.append(
                f"Severely elevated systolic blood pressure ({systolic:g} mmHg)"
            )


    # -----------------------------------------------------
    # FINAL URGENT DECISION
    # -----------------------------------------------------

    if reasons:

        return True, reasons

    return False, []


# =========================================================
# URGENT CRITERIA
# =========================================================

def check_urgent_criteria(patient):

    """
    Identify patients who are clinically stable but
    need more timely assessment than routine moderate cases.
    """

    complaint = clean_text(
        patient.get("chief_complaint")
    )

    symptoms = clean_text(
        patient.get("symptoms")
    )

    combined_text = " ".join([
        complaint,
        symptoms
    ])

    reasons = []


    # -----------------------------------------------------
    # 1. MODERATE-SEVERE PAIN
    # -----------------------------------------------------

    pain_severity = to_number(
        patient.get("pain_severity")
    )

    if pain_severity is not None and pain_severity >= 7:

        reasons.append(
            f"Significant pain severity ({pain_severity:g}/10)"
        )


    # -----------------------------------------------------
    # 2. PERSISTENT / SIGNIFICANT SYMPTOMS
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "persistent vomiting",
            "repeated vomiting",
            "severe vomiting",
            "persistent abdominal pain",
            "severe abdominal pain",
            "severe dizziness",
            "severe weakness"
        ]
    ):

        reasons.append(
            "Significant symptoms requiring timely assessment"
        )


    # -----------------------------------------------------
    # 3. MODERATE INJURY
    # -----------------------------------------------------

    moderate_injury = (
        "moderate" in combined_text
        and "injury" in combined_text
    )

    other_significant_injury = contains_any(
        combined_text,
        [
            "deep cut",
            "large laceration",
            "significant injury",
            "head injury"
        ]
    )

    if moderate_injury or other_significant_injury:
        reasons.append(
            "Injury requires timely clinical assessment"
        )


    # -----------------------------------------------------
    # 4. HIGH FEVER
    # -----------------------------------------------------

    temperature = to_number(
        patient.get("temperature")
    )

    if temperature is not None and temperature >= 39:

        reasons.append(
            f"High temperature ({temperature:g}°C)"
        )


    # -----------------------------------------------------
    # FINAL URGENT DECISION
    # -----------------------------------------------------

    if reasons:

        return True, reasons

    return False, []


# =========================================================
# MODERATE CRITERIA
# =========================================================

def check_moderate_criteria(patient):
    """
    Identify patients who need clinical assessment but
    do not meet CRITICAL, HIGH, or URGENT criteria.
    """

    complaint = clean_text(patient.get("chief_complaint"))
    symptoms = clean_text(patient.get("symptoms"))

    combined_text = " ".join([
        complaint,
        symptoms
    ])

    reasons = []

    # -----------------------------------------------------
    # RESPIRATORY SYMPTOMS THAT ARE NOT CURRENTLY HIGH RISK
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "wheezing",
            "shortness of breath",
            "breathlessness",
            "difficulty breathing",
            "breathing difficulty"
        ]
    ):
        reasons.append(
            "Respiratory symptoms require clinical assessment"
        )

    # -----------------------------------------------------
    # ELEVATED RESPIRATORY RATE
    # -----------------------------------------------------

    respiratory_rate = to_number(
        patient.get("respiratory_rate")
    )

    age = to_number(patient.get("age"))

    if respiratory_rate is not None:

        # For adults / older children, mildly elevated RR
        # can contribute to MODERATE classification.
        #
        # Pediatric RR is handled by the age-specific HIGH
        # thresholds above, so do not apply the generic 21–30
        # rule to young children.

        if age is not None and age >= 12:

            if 21 <= respiratory_rate <= 30:

                reasons.append(
                    f"Elevated respiratory rate ({respiratory_rate:g}/min)"
                )


    # -----------------------------------------------------
    # MODERATE PAIN
    # -----------------------------------------------------

    pain_severity = to_number(
        patient.get("pain_severity")
    )

    if pain_severity is not None and 4 <= pain_severity <= 6:

        reasons.append(
            f"Moderate pain severity ({pain_severity:g}/10)"
        )


    # -----------------------------------------------------
    # OTHER MODERATE PRESENTATIONS
    # -----------------------------------------------------

    if contains_any(
        combined_text,
        [
            "pain",
            "headache",
            "fever",
            "vomiting",
            "diarrhea",
            "abdominal pain",
            "moderate injury",
            "moderate weakness",
            "persistent cough",
            "dizziness"
        ]
    ):
        reasons.append(
            "Clinical symptoms require assessment but no immediate high-acuity criteria were detected"
        )


    # -----------------------------------------------------
    # FINAL MODERATE DECISION
    # -----------------------------------------------------

    if reasons:
        return True, reasons

    return False, []

# =========================================================
# DATA QUALITY
# =========================================================

def check_data_quality(patient):
    """
    Estimate whether enough information is available
    for a meaningful prototype assessment.
    """

    missing = []

    age = patient.get("age")
    complaint = clean_text(
        patient.get("chief_complaint")
    )

    if age in [None, ""]:
        missing.append("age")

    if complaint == "":
        missing.append("chief complaint")


    return missing

# =========================================================
# AMBIGUITY / CONFLICT DETECTION
# =========================================================

def check_ambiguity(patient):
    """
    Detect ambiguous or conflicting information.

    Uncertainty must never result in a lower priority.
    It either:
        1. escalates to URGENT REVIEW, or
        2. remains attached to a CRITICAL/HIGH result.
    """

    complaint = clean_text(
        patient.get("chief_complaint")
    )

    symptoms = clean_text(
        patient.get("symptoms")
    )

    visible_signs = clean_text(
        patient.get("visible_signs")
    )

    duration = clean_text(
        patient.get("symptom_duration")
    )

    combined_text = " ".join([
        complaint,
        symptoms,
        visible_signs,
        duration
    ])

    reasons = []

    # -----------------------------------------------------
    # 1. CONFLICTING SEVERITY
    # -----------------------------------------------------

    mild_terms = [
        "mild",
        "minor",
        "small",
        "slight",
        "minimal"
    ]

    severe_terms = [
        "severe",
        "major",
        "massive",
        "heavy",
        "uncontrolled",
        "critical"
    ]

    has_mild_description = contains_any(
        combined_text,
        mild_terms
    )

    has_severe_description = contains_any(
        combined_text,
        severe_terms
    )

    if has_mild_description and has_severe_description:

        reasons.append(
            "Conflicting severity descriptions in the recorded presentation"
        )

    # -----------------------------------------------------
    # 2. PAIN SCORE CONFLICTS WITH DESCRIPTION
    # -----------------------------------------------------

    pain_severity = to_number(
        patient.get("pain_severity")
    )

    if pain_severity is not None:

        if pain_severity >= 7 and has_mild_description:
            reasons.append(
                "Pain severity is inconsistent with the recorded mild presentation"
            )

        elif pain_severity <= 3 and has_severe_description:
            reasons.append(
                "Pain severity is inconsistent with the recorded severe presentation"
            )


    # -----------------------------------------------------
    # 3. VAGUE / UNCERTAIN INFORMATION
    # -----------------------------------------------------

    uncertainty_terms = [
        "not sure",
        "unsure",
        "unclear",
        "unknown",
        "possibly",
        "maybe",
        "might be",
        "cannot say",
        "can't say",
        "uncertain",
        "inconsistent",
        "vague"
    ]

    if contains_any(
        combined_text,
        uncertainty_terms
    ):

        reasons.append(
            "Patient information is vague or uncertain"
        )


    # -----------------------------------------------------
    # 4. SEVERE PRESENTATION WITH REASSURING VITALS
    # -----------------------------------------------------

    severe_presentation = contains_any(
        combined_text,
        [
            "severe pain",
            "severe abdominal pain",
            "severe chest pain",
            "severe weakness",
            "severe dizziness",
            "severe headache",
            "severe injury",
            "severe bleeding"
        ]
    )

    heart_rate = to_number(
        patient.get("heart_rate")
    )

    spo2 = to_number(
        patient.get("spo2")
    )

    respiratory_rate = to_number(
        patient.get("respiratory_rate")
    )

    temperature = to_number(
        patient.get("temperature")
    )

    systolic, diastolic = parse_blood_pressure(
        patient.get("blood_pressure")
    )

    reassuring_vitals = True

    if heart_rate is not None:
        if heart_rate < 60 or heart_rate > 100:
            reassuring_vitals = False

    if spo2 is not None:
        if spo2 < 95:
            reassuring_vitals = False

    if respiratory_rate is not None:
        if respiratory_rate < 12 or respiratory_rate > 20:
            reassuring_vitals = False

    if temperature is not None:
        if temperature >= 38:
            reassuring_vitals = False

    if systolic is not None:
        if systolic < 100 or systolic > 140:
            reassuring_vitals = False

    if severe_presentation and reassuring_vitals:

        reasons.append(
            "Severe presentation is discordant with currently recorded reassuring vital signs"
        )


    # -----------------------------------------------------
    # FINAL DECISION
    # -----------------------------------------------------

    if reasons:
        return True, reasons

    return False, []

# =========================================================
# CONTEXTUAL / PATIENT-INFORMATION FACTORS
# =========================================================

def get_patient_field(patient, *names):
    """Return the first non-empty value from possible field names."""

    for name in names:
        value = patient.get(name)

        if value not in [None, ""]:
            return value

    return ""


def check_contextual_factors(patient):
    """
    Use non-vital patient information as contextual risk modifiers.

    These factors do NOT diagnose a patient.

    They add context to the existing triage rules and can move an
    otherwise LOW patient to MODERATE when several relevant factors
    are present.
    """

    reasons = []
    score = 0

    # -----------------------------------------------------
    # READ PATIENT INFORMATION
    # -----------------------------------------------------

    age = to_number(
        get_patient_field(patient, "age")
    )

    complaint = clean_text(
        get_patient_field(
            patient,
            "chief_complaint",
            "complaint"
        )
    )

    symptoms = clean_text(
        get_patient_field(
            patient,
            "symptoms"
        )
    )

    duration = clean_text(
        get_patient_field(
            patient,
            "duration",
            "duration_onset",
            "onset",
            "symptom_duration"
        )
    )

    history = clean_text(
        get_patient_field(
            patient,
            "medical_history",
            "history",
            "known_conditions"
        )
    )

    medications = clean_text(
        get_patient_field(
            patient,
            "medications",
            "current_medications"
        )
    )

    previous = clean_text(
        get_patient_field(
            patient,
            "previous_episodes",
            "previous_episode",
            "prior_episodes"
        )
    )

    mobility = clean_text(
        get_patient_field(
            patient,
            "mobility",
            "mobility_status"
        )
    )

    pregnancy = clean_text(
        get_patient_field(
            patient,
            "pregnancy_status",
            "pregnancy"
        )
    )

    combined = " ".join([
        complaint,
        symptoms
    ])


    # -----------------------------------------------------
    # 1. AGE + PRESENTATION
    # -----------------------------------------------------

    if age is not None:

        # Pediatric patient with potentially concerning symptoms
        if age < 5 and contains_any(
            combined,
            [
                "fever",
                "vomiting",
                "breathing",
                "difficulty breathing",
                "diarrhea",
                "lethargy",
                "weakness"
            ]
        ):

            score += 1

            reasons.append(
                "Pediatric age group increases concern for this presentation"
            )


        # Geriatric patient with potentially concerning symptoms
        elif age >= 65 and contains_any(
            combined,
            [
                "chest pain",
                "breathlessness",
                "shortness of breath",
                "weakness",
                "dizziness",
                "fall",
                "confusion"
            ]
        ):

            score += 1

            reasons.append(
                "Older age increases concern for this presentation"
            )


    # -----------------------------------------------------
    # 2. ACUTE / SUDDEN ONSET
    # -----------------------------------------------------

    if contains_any(
        duration,
        [
            "sudden",
            "suddenly",
            "acute",
            "new onset",
            "just started",
            "started today",
            "within minutes",
            "within an hour"
        ]
    ):

        score += 1

        reasons.append(
            "Acute or sudden symptom onset"
        )


    # -----------------------------------------------------
    # 3. RELEVANT MEDICAL HISTORY
    # -----------------------------------------------------

    if contains_any(
        history,
        [
            "heart disease",
            "cardiac",
            "coronary",
            "heart failure",
            "asthma",
            "copd",
            "stroke",
            "seizure",
            "epilepsy",
            "diabetes",
            "kidney disease",
            "renal disease",
            "liver disease",
            "immunocompromised",
            "cancer"
        ]
    ):

        score += 1

        reasons.append(
            "Relevant high-risk medical history"
        )


    # -----------------------------------------------------
    # 4. HIGH-RISK MEDICATION
    # -----------------------------------------------------

    if contains_any(
        medications,
        [
            "anticoagulant",
            "blood thinner",
            "warfarin",
            "apixaban",
            "rivaroxaban",
            "dabigatran",
            "heparin"
        ]
    ):

        score += 1

        reasons.append(
            "Anticoagulant / blood-thinning medication increases bleeding risk"
        )


    # -----------------------------------------------------
    # 5. PREVIOUS / RECURRENT EPISODES
    # -----------------------------------------------------

    if previous not in [
        "",
        "none",
        "no",
        "not available",
        "not applicable"
    ]:

        if contains_any(
            previous,
            [
                "recurrent",
                "repeated",
                "similar episode",
                "previous episode",
                "prior episode",
                "previous seizure",
                "previous stroke"
            ]
        ):

            score += 1

            reasons.append(
                "Relevant previous or recurrent episode"
            )


    # -----------------------------------------------------
    # 6. MOBILITY / FUNCTIONAL STATUS
    # -----------------------------------------------------

    if contains_any(
        mobility,
        [
            "unable to walk",
            "cannot walk",
            "unable to stand",
            "cannot stand",
            "new mobility problem",
            "severely limited",
            "non-ambulatory"
        ]
    ):

        score += 1

        reasons.append(
            "Significant mobility limitation"
        )


    # -----------------------------------------------------
    # 7. PREGNANCY + CONCERNING SYMPTOMS
    # -----------------------------------------------------

    is_pregnant = contains_any(
        pregnancy,
        [
            "pregnant",
            "yes",
            "positive"
        ]
    )

    if is_pregnant and contains_any(
        combined,
        [
            "bleeding",
            "vaginal bleeding",
            "abdominal pain",
            "pelvic pain",
            "severe pain",
            "chest pain"
        ]
    ):

        score += 2

        reasons.append(
            "Pregnancy with a potentially concerning symptom requires prompt review"
        )


    return score, reasons

# =========================================================
# MAIN TRIAGE FUNCTION
# =========================================================

def assess_patient(patient):
    """
    Main PatientTriage.ai triage function.

    Priority hierarchy:

        LEVEL 1 — CRITICAL
              ↓
        LEVEL 2 — HIGH
              ↓
        LEVEL 3 — URGENT
              ↓
        LEVEL 4 — MODERATE
              ↓
        LEVEL 5 — LOW
              ↓
            REVIEW

    CRITICAL takes precedence over all lower categories.
    HIGH takes precedence over all lower categories except CRITICAL.

    This is important because a dangerous vital sign
    combined with a severe presenting complaint should
    not be downgraded merely because another rule says
    "urgent review".
    """

    # -----------------------------------------------------
    # INITIAL RESULT
    # -----------------------------------------------------

    priority = "REVIEW"
    confidence = 0
    deterioration_risk = "UNKNOWN"
    reasons = []


    # -----------------------------------------------------
    # DATA CHECK
    # -----------------------------------------------------

    missing = check_data_quality(patient)

    if missing:

        reasons.append(
            "Insufficient information for a reliable triage assessment."
        )

        reasons.append(
            "Human review required."
        )

        reasons.append(
            "Do not downgrade automatically."
        )

        return {
            "priority": "REVIEW",
            "confidence": 30,
            "deterioration_risk": "UNKNOWN",
            "reasons": reasons,
            "fail_safe": True,
            "fail_safe_type": "missing_information",
            "missing_information": missing
        }


    # -----------------------------------------------------
    # AMBIGUITY / CONFLICT CHECK
    # -----------------------------------------------------

    ambiguity_detected, ambiguity_reasons = check_ambiguity(
        patient
    )

    # -----------------------------------------------------
    # CONTEXTUAL PATIENT INFORMATION
    # -----------------------------------------------------

    context_score, context_reasons = check_contextual_factors(
        patient
    )

    # Add contextual information to the explanation.
    # These factors do not override CRITICAL/HIGH/URGENT rules.
    reasons.extend(context_reasons)


    # -----------------------------------------------------
    # LEVEL 1 — CRITICAL CHECK
    # -----------------------------------------------------

    critical, critical_reasons = check_critical_criteria(patient)

    if critical:

        priority = "CRITICAL"

        reasons.extend(critical_reasons)

        deterioration_risk = "HIGH"

        if len(critical_reasons) >= 2:
            confidence = 90
        else:
            confidence = 85

        return {
            "priority": priority,
            "confidence": confidence,
            "deterioration_risk": deterioration_risk,
            "reasons": reasons,
            "ambiguity_detected": ambiguity_detected,
            "ambiguity_reasons": ambiguity_reasons
        }

    # -----------------------------------------------------
    # LEVEL 2 — HIGH CHECK
    # -----------------------------------------------------

    high, high_reasons = check_high_criteria(patient)

    if high:

        priority = "HIGH"

        reasons.extend(high_reasons)

        deterioration_risk = "HIGH"

        if len(high_reasons) >= 2:
            confidence = 90
        else:
            confidence = 85

        return {
            "priority": priority,
            "confidence": confidence,
            "deterioration_risk": deterioration_risk,
            "reasons": reasons,
            "ambiguity_detected": ambiguity_detected,
            "ambiguity_reasons": ambiguity_reasons
        }


    # -----------------------------------------------------
    # LEVEL 3 — URGENT CHECK
    # -----------------------------------------------------

    urgent, urgent_reasons = check_urgent_criteria(patient)

    if urgent or ambiguity_detected:

        if ambiguity_detected:
            priority = "URGENT REVIEW"

            reasons.extend(ambiguity_reasons)

            reasons.append(
                "Human clinical attention required due to ambiguous or conflicting information."
            )

            if urgent:
                reasons.extend(urgent_reasons)

            confidence = 60
            deterioration_risk = "MODERATE"

        else:
            priority = "URGENT"

            reasons.extend(urgent_reasons)

            deterioration_risk = "MODERATE"

            if len(urgent_reasons) >= 2:
                confidence = 80
            else:
                confidence = 75

        return {
            "priority": priority,
            "confidence": confidence,
            "deterioration_risk": deterioration_risk,
            "reasons": reasons,
            "ambiguity_detected": ambiguity_detected,
            "ambiguity_reasons": ambiguity_reasons
        }

    # -----------------------------------------------------
    # AMBIGUITY / CONFLICT CHECK
    # -----------------------------------------------------
    """
    ambiguous, ambiguity_reasons = check_ambiguity(patient)

    if ambiguous:

        return {
            "priority": "URGENT REVIEW",
            "confidence": 60,
            "deterioration_risk": "MODERATE",
            "reasons": ambiguity_reasons,
            "fail_safe": True,
            "fail_safe_type": "ambiguous_information"
        }
    """
    # -----------------------------------------------------
    # LEVEL 4 — MODERATE CHECK
    # -----------------------------------------------------

    moderate, moderate_reasons = check_moderate_criteria(
        patient
    )

    if moderate:

        priority = "MODERATE"

        reasons.extend(moderate_reasons)

        deterioration_risk = "MODERATE"

        confidence = 70

        return {
            "priority": priority,
            "confidence": confidence,
            "deterioration_risk": deterioration_risk,
            "reasons": reasons
        }


    # -----------------------------------------------------
    # LEVEL 5 — LOW
    # -----------------------------------------------------

    # Several relevant contextual factors should not be ignored.
    #
    # If an otherwise LOW patient has enough contextual risk,
    # classify them as MODERATE rather than silently treating
    # them as routine.

    if context_score >= 2:

        priority = "MODERATE"

        deterioration_risk = "MODERATE"

        confidence = 70

        reasons.extend([
            "Contextual risk factors require clinical assessment.",
            "No immediate critical or high-acuity criteria detected."
        ])

        return {
            "priority": priority,
            "confidence": confidence,
            "deterioration_risk": deterioration_risk,
            "reasons": reasons
        }


    priority = "LOW"

    deterioration_risk = "LOW"

    confidence = 70

    reasons.extend([
        "No immediate critical criteria detected.",
        "No high-acuity criteria detected.",
        "No urgent criteria detected.",
        "No moderate criteria detected."
    ])

    return {
        "priority": priority,
        "confidence": confidence,
        "deterioration_risk": deterioration_risk,
        "reasons": reasons
    }