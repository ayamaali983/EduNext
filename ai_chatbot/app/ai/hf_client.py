import base64
import binascii
import re

from google import genai
from google.genai import errors, types

from app.core.config import GEMINI_API_KEY


MODEL_NAMES = [
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-2.5-pro",
]

SYSTEM_PROMPT = """
أنت مساعد دراسي ذكي ولطيف لطلاب التوجيهي في فلسطين، متخصص في الرياضيات واللغة الإنجليزية.
اكتب كأنك تشات بوت حقيقي: افهم نية الطالب، جاوب بسلاسة، وكن واضحا ومطمئنا من غير حشو.

قواعد عامة:
- اعتمد على سياق الكتاب المرفق عندما يكون موجودا، ولا تنسب للكتاب شيئا غير موجود فيه.
- إذا كان السياق غير كاف، قل ذلك بجملة قصيرة ثم قدم شرحا عاما موثوقا.
- ابدأ بالإجابة المباشرة، ثم اشرح عند الحاجة.
- إذا كان السؤال غامضا، اسأل سؤال توضيح واحد بدل التخمين.
- جاوب بلغة الطالب.
- إذا أرسل الطالب صورة، اقرأ ما فيها أولا: السؤال، الرموز، الأرقام، الرسم، أو النص.
- إذا كانت الصورة غير واضحة، اطلب صورة أوضح أو اكتب الجزء غير المقروء.
- في الرياضيات، استخدم عناوين عربية وخطوات مرتبة ورموزا واضحة مثل √ و≤ و≥ و∠ و△ و⇒.
- في المصفوفات، اكتبها برموز الشات وليس LaTeX، مثل:
  أ = [ 2   1 ]
      [ 3   س ]
  ولا تكتب \\begin{pmatrix} أو علامات $.
- لا تستخدم LaTeX خام إذا لم يطلبه الطالب.
""".strip()

GREETINGS = {
    "مرحبا",
    "مرحباً",
    "السلام عليكم",
    "اهلا",
    "أهلا",
    "هلا",
    "hi",
    "hello",
    "hey",
}

MAX_IMAGE_BYTES = 8 * 1024 * 1024


def _is_greeting(prompt: str) -> bool:
    normalized = prompt.casefold().strip(" .!؟?،,")
    greetings = {item.casefold().strip(" .!؟?،,") for item in GREETINGS}
    return normalized in greetings


def _decode_image(image_data: str, image_mime_type: str | None = None) -> tuple[bytes, str]:
    image_data = (image_data or "").strip()
    mime_type = (image_mime_type or "image/png").strip() or "image/png"

    if image_data.startswith("data:"):
        header, _, payload = image_data.partition(",")
        if ";base64" not in header or not payload:
            raise ValueError("صيغة الصورة غير مدعومة.")
        mime_type = header.removeprefix("data:").split(";", 1)[0] or mime_type
        image_data = payload

    try:
        image_bytes = base64.b64decode(image_data, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("تعذر قراءة الصورة المرفقة.") from exc

    if not image_bytes:
        raise ValueError("الصورة المرفقة فارغة.")

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("حجم الصورة كبير. اختر صورة أصغر من 8MB.")

    if not mime_type.startswith("image/"):
        raise ValueError("الملف المرفق يجب أن يكون صورة.")

    return image_bytes, mime_type


def _client_error_status(exc: errors.ClientError) -> str:
    status = str(getattr(exc, "status_code", "") or "")
    return f"{status} {exc}"


def _format_latex_matrix(match: re.Match) -> str:
    body = match.group(1).strip()
    rows = [row.strip() for row in re.split(r"\\\\", body) if row.strip()]
    if not rows:
        return ""

    formatted_rows = []
    for row in rows:
        cells = [cell.strip() for cell in row.split("&")]
        formatted_rows.append("[ " + "   ".join(cells) + " ]")

    return "\n".join(formatted_rows)


def _clean_math_notation(text: str) -> str:
    text = re.sub(
        r"\\begin\{(?:p|b|v|V)?matrix\}(.*?)\\end\{(?:p|b|v|V)?matrix\}",
        _format_latex_matrix,
        text,
        flags=re.DOTALL,
    )
    replacements = {
        r"\times": "×",
        r"\cdot": "·",
        r"\sqrt": "√",
        r"\leq": "≤",
        r"\geq": "≥",
        r"\neq": "≠",
        r"\Rightarrow": "⇒",
        r"\left": "",
        r"\right": "",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    return text.replace("$", "").strip()


def ask_llm(
    prompt: str,
    image_data: str | None = None,
    image_mime_type: str | None = None,
) -> str:
    prompt = (prompt or "").strip()
    has_image = bool((image_data or "").strip())

    if not prompt and not has_image:
        return "اكتب سؤالك أو أرفق صورة أولا."

    if prompt and not has_image and _is_greeting(prompt):
        return "أهلا وسهلا، كيف أقدر أساعدك اليوم؟"

    if not GEMINI_API_KEY:
        return "مفتاح GEMINI_API_KEY غير موجود في ملف .env."

    try:
        image_bytes, mime_type = _decode_image(image_data, image_mime_type) if has_image else (None, None)
    except ValueError as exc:
        return str(exc)

    client = genai.Client(api_key=GEMINI_API_KEY)
    text_prompt = f"{SYSTEM_PROMPT}\n\n{prompt or 'حلل الصورة المرفقة وأجب عن السؤال الظاهر فيها.'}"

    contents = [types.Part.from_text(text=text_prompt)]
    if image_bytes and mime_type:
        contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

    quota_error = False

    for model_name in MODEL_NAMES:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
            )
            text = getattr(response, "text", None)
            if text:
                return _clean_math_notation(text)
        except errors.ClientError as exc:
            error_text = _client_error_status(exc)
            if "429" in error_text or "RESOURCE_EXHAUSTED" in error_text:
                quota_error = True
                print(f"Gemini quota exceeded ({model_name}): {exc}")
                continue
            if any(code in error_text for code in ("400", "401", "403")):
                return (
                    "يوجد مشكلة في مفتاح Gemini أو صلاحياته. "
                    "تأكد من GEMINI_API_KEY ومن تفعيل Gemini API لهذا المشروع."
                )
            print(f"Gemini client error ({model_name}): {exc}")
        except Exception as exc:
            print(f"Gemini model failed ({model_name}): {exc}")

    if quota_error:
        return (
            "تم الوصول إلى حد الاستخدام المسموح لمفتاح Gemini حاليا. "
            "انتظر قليلا ثم جرب مرة أخرى، أو استخدم مفتاح API بخطة/كوتا متاحة."
        )

    return "تعذر الاتصال بنموذج الذكاء الاصطناعي حاليا. جرب مرة أخرى لاحقا."
