import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, BookOpen, PenTool, BarChart3, Rocket } from "lucide-react";
import successImg from "@/assets/onboarding-success.png";
import logo from "../assets/EDU.svg";
import { API_BASE_URL } from "@/config/api";

const learningMethods = [
  { id: "فيديوهات", label: "فيديوهات", icon: Video, desc: "تعلم بالمشاهدة" },
  { id: "قراءة وملخصات", label: "قراءة وملخصات", icon: BookOpen, desc: "تعلم بالقراءة" },
  { id: "أسئلة وتمارين", label: "أسئلة وتمارين", icon: PenTool, desc: "تعلم بالتطبيق" },
];

const levels = ["مبتدئ", "متوسط", "متقدم"];
const examOptions = ["نعم، عدة مرات", "مرة واحدة", "لا، لم أجرب بعد"];

const SelectableCard = ({ label, desc, icon: Icon, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`selectable-card ${selected ? "selectable-card-selected" : ""}`}
  >
    <div className="selectable-card-icon">
      <Icon />
    </div>
    <span className="selectable-card-label">{label}</span>
    <span className="selectable-card-desc">{desc}</span>
  </button>
);

const Chip = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`chip ${selected ? "chip-selected" : ""}`}
  >
    {label}
  </button>
);

const OnboardingStep2 = () => {
  const navigate = useNavigate();

  const [methods, setMethods] = useState([]);
  const [level, setLevel] = useState("");
  const [examExp, setExamExp] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isOnboardingCompleted = localStorage.getItem("isOnboardingCompleted");
    const savedData = JSON.parse(localStorage.getItem("onboarding") || "{}");

    if (!token) {
      navigate("/login");
      return;
    }

    if (isOnboardingCompleted === "true") {
      navigate("/dashboard");
      return;
    }

    if (!savedData.branch || !savedData.difficult || !savedData.hours || !savedData.goal) {
      navigate("/onboarding/1");
      return;
    }

    if (savedData.methods) setMethods(savedData.methods);
    if (savedData.level) setLevel(savedData.level);
    if (savedData.examExp) setExamExp(savedData.examExp);
  }, [navigate]);

  const toggleMethod = (id) => {
    setMethods((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (methods.length === 0 || !level || !examExp) {
      setError("الرجاء تعبئة جميع الحقول");
      return;
    }

    setError("");

    const step1Data = JSON.parse(localStorage.getItem("onboarding") || "{}");
    const token = localStorage.getItem("token");

    const payload = {
      branch: step1Data.branch,
      difficult: step1Data.difficult || [],
      hours: step1Data.hours,
      goal: step1Data.goal,
      methods,
      level,
      examExp,
    };

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/student/setup/complete-onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "فشل حفظ بيانات الطالب");
        return;
      }

      localStorage.setItem(
        "onboarding",
        JSON.stringify({
          ...step1Data,
          methods,
          level,
          examExp,
        })
      );

      localStorage.setItem("isOnboardingCompleted", "true");
      localStorage.setItem("branch", data.branch || payload.branch);

      setDone(true);
    } catch (err) {
      console.error(err);
      setError("تعذر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="success-screen">
        <motion.div
          className="success-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="success-img-wrapper">
            <img src={successImg} alt="تم بنجاح" width={200} height={200} />
          </div>
          <h1>تم بنجاح! 🎉</h1>
          <p className="success-subtitle">خطتك الدراسية جاهزة</p>
          <p className="success-desc">
            سنساعدك خطوة بخطوة للوصول إلى هدفك في التوجيهي. يلا نبدأ!
          </p>
          <button
            className="btn btn-lg btn-primary shadow-primary-lg"
            onClick={() => {
              localStorage.removeItem("onboarding");
              navigate("/dashboard");
            }}
          >
            <Rocket style={{ marginLeft: "0.5rem" }} />
            انطلق الآن
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="onboarding-layout">
      <motion.div
        className="onboarding-wrapper"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="onboarding-header">
          <Link to="/" className="onboarding-logo">
            <div className="logo-icon" style={{ width: "2rem", height: "2rem" }}>
              <img
                src={logo}
                alt="logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <span className="logo-text">EduNext</span>
          </Link>

          <div className="progress-bars">
            <div className="progress-bar progress-bar-active" />
            <div className="progress-bar progress-bar-active" />
          </div>

          <p className="onboarding-step-text">الخطوة ٢ من ٢</p>
          <h1 className="onboarding-title">كيف تفضّل أن تتعلم؟</h1>
        </div>

        <div className="onboarding-card">
          <div>
            <span className="onboarding-section-label">طريقة التعلم المفضلة</span>
            <div className="selectable-cards-grid">
              {learningMethods.map((m) => (
                <SelectableCard
                  key={m.id}
                  label={m.label}
                  desc={m.desc}
                  icon={m.icon}
                  selected={methods.includes(m.id)}
                  onClick={() => toggleMethod(m.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="onboarding-section-header">
              <div className="onboarding-section-icon">
                <BarChart3 />
              </div>
              <span>مستواك الحالي</span>
            </div>

            <div className="chips-wrap">
              {levels.map((l) => (
                <Chip
                  key={l}
                  label={l}
                  selected={level === l}
                  onClick={() => setLevel(l)}
                />
              ))}
            </div>
          </div>

          <div>
            <span>هل سبق وأجريت اختبارات تجريبية؟</span>
            <div className="chips-wrap">
              {examOptions.map((o) => (
                <Chip
                  key={o}
                  label={o}
                  selected={examExp === o}
                  onClick={() => setExamExp(o)}
                />
              ))}
            </div>
          </div>

          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

          <button
            className="btn btn-lg btn-primary btn-full"
            onClick={handleFinish}
            disabled={loading}
          >
            <Rocket style={{ marginLeft: "0.5rem" }} />
            {loading ? "جاري حفظ البيانات..." : "ابدأ رحلتك التعليمية"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingStep2;