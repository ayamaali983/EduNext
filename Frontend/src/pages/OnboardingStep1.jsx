import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Clock, Target, ArrowLeft, Loader2 } from "lucide-react";
import logo from "../assets/EDU.svg";
import { API_BASE_URL } from "@/config/api";

const branches = ["العلمي", "الأدبي", "الصناعي", "التجاري", "الشرعي"];
const studyHours = ["أقل من ساعة", "١-٢ ساعة", "٣-٤ ساعات", "أكثر من ٤ ساعات"];
const goals = ["أعلى من ٩٠٪", "٨٠٪ - ٩٠٪", "٧٠٪ - ٨٠٪", "النجاح فقط"];

const Chip = ({ label, selected, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`chip ${selected ? "chip-selected" : ""}`}
  >
    {label}
  </button>
);

const normalizeSubject = (subject) => ({
  subjectId: subject.subjectId || subject.SubjectId,
  subjectName: subject.subjectName || subject.SubjectName || "",
});

const OnboardingStep1 = () => {
  const navigate = useNavigate();

  const [branch, setBranch] = useState("");
  const [difficult, setDifficult] = useState([]);
  const [hours, setHours] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isOnboardingCompleted = localStorage.getItem("isOnboardingCompleted");

    if (!token) {
      navigate("/login");
      return;
    }

    if (isOnboardingCompleted === "true") {
      navigate("/dashboard");
      return;
    }

    const savedData = JSON.parse(localStorage.getItem("onboarding") || "{}");

    if (savedData.branch) setBranch(savedData.branch);
    if (savedData.difficult) setDifficult(savedData.difficult);
    if (savedData.hours) setHours(savedData.hours);
    if (savedData.goal) setGoal(savedData.goal);
  }, [navigate]);

  useEffect(() => {
    const fetchSubjectsByBranch = async () => {
      if (!branch) {
        setSubjects([]);
        setSubjectsError("");
        return;
      }

      try {
        setSubjectsLoading(true);
        setSubjectsError("");

        const response = await fetch(
          `${API_BASE_URL}/api/student/subjects/by-branch?branch=${encodeURIComponent(branch)}`
        );

        const rawText = await response.text();
        let data;

        try {
          data = JSON.parse(rawText);
        } catch {
          data = [];
        }

        if (!response.ok) {
          setSubjectsError(data?.message || "فشل تحميل المواد");
          setSubjects([]);
          return;
        }

        setSubjects((Array.isArray(data) ? data : []).map(normalizeSubject));
      } catch (err) {
        console.error(err);
        setSubjectsError("تعذر الاتصال بالسيرفر");
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjectsByBranch();
  }, [branch]);

  const handleBranchSelect = (selectedBranch) => {
    setBranch(selectedBranch);
    setDifficult([]);
    setSubjects([]);
    setSubjectsError("");
  };

  const toggleDifficult = (subjectName) => {
    setDifficult((prev) =>
      prev.includes(subjectName)
        ? prev.filter((x) => x !== subjectName)
        : [...prev, subjectName]
    );
  };

  const handleNext = () => {
    if (!branch || difficult.length === 0 || !hours || !goal) {
      setError("الرجاء تعبئة جميع الحقول");
      return;
    }

    setError("");

    localStorage.setItem(
      "onboarding",
      JSON.stringify({
        branch,
        difficult,
        hours,
        goal,
      })
    );

    navigate("/onboarding/2");
  };

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
            <div className="progress-bar progress-bar-inactive" />
          </div>

          <p className="onboarding-step-text">الخطوة ١ من ٢</p>
          <h1 className="onboarding-title">أخبرنا عن نفسك</h1>
          <p className="onboarding-desc">
            سنستخدم هذه المعلومات لبناء خطة دراسية مخصصة لك.
          </p>
        </div>

        <div className="onboarding-card">
          <div>
            <div className="onboarding-section-header">
              <div className="onboarding-section-icon">
                <GraduationCap />
              </div>
              <span className="onboarding-section-label">ما هو فرعك الدراسي؟</span>
            </div>

            <div className="chips-wrap">
              {branches.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  selected={branch === b}
                  onClick={() => handleBranchSelect(b)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="onboarding-section-header">
              <div className="onboarding-section-icon">
                <Target />
              </div>
              <span className="onboarding-section-label">
                ما المواد التي تجدها صعبة؟
              </span>
            </div>

            {!branch ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  marginTop: "10px",
                }}
              >
                اختر الفرع أولًا لتظهر المواد الخاصة به
              </p>
            ) : subjectsLoading ? (
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <Loader2 className="animate-spin" style={{ marginBottom: "8px" }} />
                <p style={{ color: "var(--muted-foreground)" }}>جاري تحميل المواد...</p>
              </div>
            ) : subjectsError ? (
              <p
                style={{
                  textAlign: "center",
                  color: "red",
                  marginTop: "10px",
                }}
              >
                {subjectsError}
              </p>
            ) : subjects.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  marginTop: "10px",
                }}
              >
                لا توجد مواد متاحة لهذا الفرع حاليًا
              </p>
            ) : (
              <div className="chips-wrap">
                {subjects.map((s) => (
                  <Chip
                    key={s.subjectId}
                    label={s.subjectName}
                    selected={difficult.includes(s.subjectName)}
                    onClick={() => toggleDifficult(s.subjectName)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="onboarding-section-header">
              <div className="onboarding-section-icon">
                <Clock />
              </div>
              <span className="onboarding-section-label">كم ساعة تدرس يوميًا؟</span>
            </div>

            <div className="chips-wrap">
              {studyHours.map((h) => (
                <Chip
                  key={h}
                  label={h}
                  selected={hours === h}
                  onClick={() => setHours(h)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="onboarding-section-header">
              <div className="onboarding-section-icon">
                <Target />
              </div>
              <span className="onboarding-section-label">ما هدفك في التوجيهي؟</span>
            </div>

            <div className="chips-wrap">
              {goals.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  selected={goal === g}
                  onClick={() => setGoal(g)}
                />
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: "red", textAlign: "center", marginBottom: "10px" }}>
              {error}
            </p>
          )}

          <button
            className="btn btn-lg btn-primary btn-full"
            style={{ fontSize: "1rem", height: "3rem" }}
            onClick={handleNext}
          >
            التالي
            <ArrowLeft
              style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }}
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingStep1;