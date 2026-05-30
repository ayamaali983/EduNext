import json
import re

from fastapi import APIRouter
from pydantic import BaseModel

from app.ai.hf_client import ask_llm


router = APIRouter()


class ChatRequest(BaseModel):
    message: str = ""
    subject: str = "math"
    image_data: str | None = None
    image_mime_type: str | None = None


class ExamQuestionResult(BaseModel):
    questionText: str = ""
    selectedAnswer: str | None = None
    correctAnswer: str | None = None
    isCorrect: bool = False


class ExamAnalysisRequest(BaseModel):
    userId: str = ""
    examId: str = ""
    examType: str = ""
    subjectName: str = ""
    score: int = 0
    questions: list[ExamQuestionResult] = []


class QuestionExplanationRequest(BaseModel):
    subjectName: str = ""
    questionText: str = ""
    selectedAnswer: str | None = None
    selectedAnswerText: str | None = None
    correctAnswer: str = ""
    correctAnswerText: str = ""
    isCorrect: bool = False


class SubjectProgressInput(BaseModel):
    subjectId: str | None = None
    subjectName: str = ""
    progressPercent: float = 0
    averageScore: float = 0
    completedLessons: int = 0
    totalLessons: int = 0
    remainingLessons: int = 0
    nextLessonTitle: str | None = None
    nextLessonId: str | None = None


class PersonalizedRecommendationRequest(BaseModel):
    contextType: str = ""
    studentName: str = ""
    stream: str = ""
    currentLevel: str = ""
    goal: str = ""
    studyHours: str = ""
    examExperience: str = ""
    learningMethods: list[str] = []
    difficultSubjects: list[str] = []
    averageScore: float = 0
    completedLessons: int = 0
    totalLessons: int = 0
    subjects: list[SubjectProgressInput] = []


@router.post("/chat")
def chat_route(req: ChatRequest):
    from app.services.chat_service import chat

    return {
        "reply": chat(
            req.message,
            req.subject,
            image_data=req.image_data,
            image_mime_type=req.image_mime_type,
        )
    }


@router.post("/exam-analysis")
def exam_analysis_route(req: ExamAnalysisRequest):
    fallback = _build_rule_based_analysis(req)
    prompt = _build_exam_analysis_prompt(req)
    raw = ask_llm(prompt)
    parsed = _parse_analysis_json(raw)

    if not parsed:
        return fallback

    return {
        "strengthAreas": _clean_list(parsed.get("strengthAreas")) or fallback["strengthAreas"],
        "weakAreas": _clean_list(parsed.get("weakAreas")) or fallback["weakAreas"],
        "levelMessage": str(parsed.get("levelMessage") or fallback["levelMessage"]).strip(),
        "recommendationText": str(parsed.get("recommendationText") or fallback["recommendationText"]).strip(),
    }


@router.post("/question-explanation")
def question_explanation_route(req: QuestionExplanationRequest):
    fallback = _build_rule_based_explanation(req)
    prompt = _build_question_explanation_prompt(req, fallback)
    raw = ask_llm(prompt)
    parsed = _parse_analysis_json(raw)

    if parsed:
        solution = str(parsed.get("solutionText") or "").strip()
        if solution:
            return {"solutionText": solution}

    cleaned = (raw or "").strip()
    if cleaned and not cleaned.startswith("مفتاح GEMINI_API_KEY") and "GEMINI_API_KEY" not in cleaned:
        return {"solutionText": cleaned}

    return {"solutionText": fallback}


@router.post("/personalized-recommendation")
def personalized_recommendation_route(req: PersonalizedRecommendationRequest):
    fallback = _build_rule_based_recommendation(req)
    prompt = _build_personalized_recommendation_prompt(req)
    raw = ask_llm(prompt)
    parsed = _parse_analysis_json(raw)

    if not parsed:
        return fallback

    return {
        "recommendationText": str(parsed.get("recommendationText") or fallback["recommendationText"]).strip(),
        "focusSubjects": _clean_list(parsed.get("focusSubjects")) or fallback["focusSubjects"],
        "weeklyStudyHours": _clean_int(parsed.get("weeklyStudyHours"), fallback["weeklyStudyHours"]),
        "lessonOrder": _clean_list(parsed.get("lessonOrder")) or fallback["lessonOrder"],
        "strengthAreas": _clean_list(parsed.get("strengthAreas")) or fallback["strengthAreas"],
        "weakAreas": _clean_list(parsed.get("weakAreas")) or fallback["weakAreas"],
        "subjectAnalyses": _clean_subject_analyses(parsed.get("subjectAnalyses")) or fallback["subjectAnalyses"],
    }


def _build_exam_analysis_prompt(req: ExamAnalysisRequest) -> str:
    wrong_questions = [q for q in req.questions if not q.isCorrect][:8]
    correct_questions = [q for q in req.questions if q.isCorrect][:5]

    def format_question(q: ExamQuestionResult) -> str:
        return (
            f"- السؤال: {q.questionText}\n"
            f"  إجابة الطالب: {q.selectedAnswer or 'غير محددة'}\n"
            f"  الإجابة الصحيحة: {q.correctAnswer or 'غير محددة'}"
        )

    return f"""
أنت محلل أداء تعليمي لمنصة EduNext.
حلل نتيجة امتحان الطالب وأعد JSON فقط بدون markdown وبدون شرح خارجي.

المادة: {req.subjectName or 'غير محددة'}
نوع الامتحان: {req.examType or 'غير محدد'}
العلامة: {req.score}%

أسئلة صحيحة:
{chr(10).join(format_question(q) for q in correct_questions) or '- لا يوجد'}

أسئلة خاطئة:
{chr(10).join(format_question(q) for q in wrong_questions) or '- لا يوجد'}

أعد JSON بهذا الشكل تماماً:
{{
  "strengthAreas": ["نقطة قوة قصيرة", "نقطة قوة قصيرة"],
  "weakAreas": ["نقطة ضعف قصيرة", "نقطة ضعف قصيرة"],
  "levelMessage": "جملة قصيرة تصف مستوى الطالب",
  "recommendationText": "توصية عملية مخصصة من جملة إلى جملتين"
}}

إذا كانت البيانات قليلة، اكتب تحليلاً جديداً مختصراً من البيانات المتاحة فقط.
""".strip()


def _build_personalized_recommendation_prompt(req: PersonalizedRecommendationRequest) -> str:
    subjects_payload = [
        {
            "subjectName": s.subjectName,
            "progressPercent": s.progressPercent,
            "averageScore": s.averageScore,
            "completedLessons": s.completedLessons,
            "totalLessons": s.totalLessons,
            "remainingLessons": s.remainingLessons,
            "nextLessonTitle": s.nextLessonTitle,
        }
        for s in req.subjects[:8]
    ]

    return f"""
أنت مستشار دراسي ذكي داخل منصة EduNext. استخدم بيانات الطالب من المنصة لتوليد توصية شخصية قابلة للتنفيذ.
أعد JSON فقط بدون markdown وبدون شرح خارجي.

نوع السياق: {req.contextType or 'recommendations'}
اسم الطالب: {req.studentName or 'الطالب'}
الفرع: {req.stream or 'غير محدد'}
المستوى الحالي من التهيئة: {req.currentLevel or 'غير محدد'}
الهدف: {req.goal or 'غير محدد'}
وقت الدراسة المتاح: {req.studyHours or 'غير محدد'}
خبرة الاختبارات: {req.examExperience or 'غير محدد'}
طرق التعلم المفضلة: {', '.join(req.learningMethods) or 'غير محدد'}
المواد الصعبة في التهيئة: {', '.join(req.difficultSubjects) or 'غير محدد'}
متوسط العلامات: {req.averageScore}%
الدروس المكتملة: {req.completedLessons} من {req.totalLessons}
تقدم المواد ونسبة مشاهدة/إكمال الدروس:
{json.dumps(subjects_payload, ensure_ascii=False)}

قواعد التوصية:
- اربط التوصية بنتائج الاختبارات، مستوى التهيئة، المواد الصعبة، ونسبة إكمال دروس كل مادة.
- إذا كانت مادة علامتها منخفضة أو نسبة إكمال دروسها منخفضة فاجعلها ضمن focusSubjects.
- اقترح ترتيب دروس قصير من nextLessonTitle عندما يكون متاحاً.
- اجعل النص بالعربية، قصيراً، ومباشراً للطالب.

أعد JSON بهذا الشكل تماماً:
{{
  "recommendationText": "توصية مخصصة من جملة إلى جملتين",
  "focusSubjects": ["مادة 1", "مادة 2"],
  "weeklyStudyHours": 12,
  "lessonOrder": ["درس 1", "درس 2", "درس 3"],
  "strengthAreas": ["نقطة قوة عامة قصيرة", "نقطة قوة عامة قصيرة"],
  "weakAreas": ["نقطة ضعف عامة قصيرة", "نقطة ضعف عامة قصيرة"],
  "subjectAnalyses": [
    {{
      "subjectName": "اسم المادة",
      "strengths": ["نقطة قوة خاصة بالمادة"],
      "weaknesses": ["نقطة ضعف خاصة بالمادة"]
    }}
  ]
}}

إذا كانت البيانات قليلة، اكتب توصية جديدة مختصرة من البيانات المتاحة فقط.
""".strip()


def _parse_analysis_json(raw: str) -> dict | None:
    raw = (raw or "").strip()
    if not raw:
        return None

    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.IGNORECASE | re.MULTILINE).strip()
    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match:
        raw = match.group(0)

    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return None

    return value if isinstance(value, dict) else None


def _build_question_explanation_prompt(req: QuestionExplanationRequest, fallback: str) -> str:
    selected = req.selectedAnswerText or req.selectedAnswer or "لم يختر الطالب إجابة"

    return f"""
أنت مدرس ذكي في منصة EduNext وتستخدم نفس أسلوب شات بوت المواد.
اشرح حل السؤال للطالب خطوة بخطوة بلغة واضحة ومختصرة.
أعد JSON فقط بدون markdown:
{{"solutionText": "شرح منظم على عدة أسطر"}}

المادة: {req.subjectName or 'غير محددة'}
السؤال:
{req.questionText}

إجابة الطالب:
{selected}

الإجابة الصحيحة:
{req.correctAnswerText or req.correctAnswer}

قواعد الشرح:
- ابدأ بفكرة السؤال.
- وضح لماذا الإجابة الصحيحة مناسبة.
- إذا كانت إجابة الطالب خاطئة، اشرح سبب الخطأ بلطف.
- اختم بنصيحة قصيرة مرتبطة بالسؤال.
- لا تكتب كلاماً عاماً لا يشرح السؤال.

إذا لم تكف البيانات، استخدم هذا الشرح:
{fallback}
""".strip()


def _build_rule_based_explanation(req: QuestionExplanationRequest) -> str:
    selected = req.selectedAnswerText or req.selectedAnswer or "لم يختر الطالب إجابة"
    correct = req.correctAnswerText or req.correctAnswer or "غير محددة"

    if req.isCorrect:
        return (
            f"فكرة السؤال هي اختيار الإجابة الأنسب من الخيارات.\n"
            f"إجابتك كانت: {selected}، وهي صحيحة.\n"
            f"السبب أن الإجابة المطابقة هي: {correct}.\n"
            "استمر بنفس الطريقة، وراجع نص السؤال جيداً قبل تثبيت الإجابة."
        )

    return (
        f"فكرة السؤال هي فهم المطلوب ثم مقارنة الخيارات.\n"
        f"إجابتك كانت: {selected}.\n"
        f"الإجابة الصحيحة هي: {correct}.\n"
        "سبب الخطأ غالباً هو الخلط بين الخيارات أو عدم الانتباه للكلمة المفتاحية في السؤال.\n"
        "راجع السؤال مرة أخرى وحدد الدليل الذي يقود للإجابة الصحيحة."
    )


def _clean_list(value) -> list[str]:
    if not isinstance(value, list):
        return []

    return [str(item).strip() for item in value if str(item).strip()][:5]


def _clean_int(value, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback

    return parsed if parsed > 0 else fallback


def _clean_subject_analyses(value) -> list[dict]:
    if not isinstance(value, list):
        return []

    analyses = []
    for item in value[:8]:
        if not isinstance(item, dict):
            continue

        subject_name = str(item.get("subjectName") or "").strip()
        strengths = _clean_list(item.get("strengths"))
        weaknesses = _clean_list(item.get("weaknesses"))

        if subject_name and (strengths or weaknesses):
            analyses.append(
                {
                    "subjectName": subject_name,
                    "strengths": strengths,
                    "weaknesses": weaknesses,
                }
            )

    return analyses


def _build_rule_based_recommendation(req: PersonalizedRecommendationRequest) -> dict:
    subjects = sorted(
        req.subjects,
        key=lambda s: (
            s.averageScore if s.averageScore > 0 else 100,
            s.progressPercent,
            -s.remainingLessons,
        ),
    )

    focus_subjects = [s.subjectName for s in subjects if s.subjectName][:2]
    if not focus_subjects:
        focus_subjects = req.difficultSubjects[:2]

    lesson_order = [
        s.nextLessonTitle
        for s in subjects
        if s.nextLessonTitle and s.subjectName in focus_subjects
    ][:3]

    strength_areas = []
    weak_areas = []
    subject_analyses = []

    for subject in subjects[:8]:
        strengths = []
        weaknesses = []

        if subject.averageScore >= 70:
            strengths.append(f"أداء جيد في {subject.subjectName}.")
        elif subject.completedLessons > 0:
            strengths.append(f"بدأت ببناء أساس في {subject.subjectName}.")

        if subject.averageScore < 65:
            weaknesses.append(f"تحتاج لمراجعة إضافية في {subject.subjectName}.")
        if subject.remainingLessons > 0:
            weaknesses.append(f"استكمال الدروس المتبقية في {subject.subjectName}.")

        if strengths:
            strength_areas.extend(strengths[:1])
        if weaknesses:
            weak_areas.extend(weaknesses[:1])

        if subject.subjectName and (strengths or weaknesses):
            subject_analyses.append(
                {
                    "subjectName": subject.subjectName,
                    "strengths": strengths[:2],
                    "weaknesses": weaknesses[:2],
                }
            )

    if not strength_areas and req.completedLessons > 0:
        strength_areas.append(f"أنجزت {req.completedLessons} من أصل {req.totalLessons} درس.")

    if not weak_areas and req.averageScore < 65:
        weak_areas.append("رفع متوسط الدرجات من خلال مراجعة الأساسيات.")

    if focus_subjects:
        recommendation = (
            f"ركّز هذا الأسبوع على {' و'.join(focus_subjects)} لأنها تحتاج دعماً حسب نتائجك وتقدمك. "
            "ابدأ بمراجعة الدروس غير المكتملة ثم حل اختبار قصير للتأكد من التحسن."
        )
    else:
        recommendation = "ابدأ بدرس واحد واختبار قصير حتى نتمكن من بناء توصيات أدق بناءً على بياناتك الفعلية."

    weekly_hours = 12
    if "٤" in req.studyHours or "4" in req.studyHours:
        weekly_hours = 18
    elif "أقل" in req.studyHours:
        weekly_hours = 6

    return {
        "recommendationText": recommendation,
        "focusSubjects": focus_subjects,
        "weeklyStudyHours": weekly_hours,
        "lessonOrder": lesson_order,
        "strengthAreas": strength_areas[:3],
        "weakAreas": weak_areas[:3],
        "subjectAnalyses": subject_analyses,
    }


def _build_rule_based_analysis(req: ExamAnalysisRequest) -> dict:
    wrong_answers = [q for q in req.questions if not q.isCorrect]

    if req.score >= 85:
        level = "أداء ممتاز. الطالب متمكن من أغلب مهارات الامتحان."
        recommendation = "استمر على نفس الخطة، وراجع الأخطاء القليلة قبل الانتقال إلى أسئلة أعلى مستوى."
        strengths = ["فهم المفاهيم", "الدقة في الإجابة"]
        weaknesses = ["تفاصيل بسيطة تحتاج مراجعة"] if wrong_answers else ["لا توجد نقاط ضعف واضحة حالياً"]
    elif req.score >= 60:
        level = "أداء جيد، لكن يحتاج إلى تدريب إضافي على الأسئلة التي تسببت بأخطاء."
        recommendation = "راجع الأسئلة الخاطئة، ثم حل تدريباً قصيراً على نفس الأفكار قبل إعادة المحاولة."
        strengths = ["امتلاك أساس مناسب", "القدرة على حل جزء جيد من الأسئلة"]
        weaknesses = ["الأسئلة التطبيقية", "التركيز أثناء الحل"]
    else:
        level = "المستوى يحتاج إلى تحسين من الأساسيات قبل الانتقال للأسئلة الصعبة."
        recommendation = "ارجع إلى شرح الدرس وملخصه، ثم ابدأ بالأسئلة السهلة تدريجياً قبل الانتقال إلى الأسئلة الأصعب."
        strengths = ["المحاولة والاستمرار"]
        weaknesses = ["المفاهيم الأساسية", "الدقة في اختيار الإجابة"]

    return {
        "strengthAreas": strengths,
        "weakAreas": weaknesses,
        "levelMessage": level,
        "recommendationText": recommendation,
    }
