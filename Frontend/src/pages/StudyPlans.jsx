
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  CalendarDays,
  Sparkles,
  Clock,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Loader2,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { API_BASE_URL } from "@/config/api";
import "../styles/StudyPlans.css";

const dayLabels = [
  { key: "السبت", short: "س" },
  { key: "الأحد", short: "ح" },
  { key: "الإثنين", short: "ن" },
  { key: "الثلاثاء", short: "ث" },
  { key: "الأربعاء", short: "ر" },
  { key: "الخميس", short: "خ" },
  { key: "الجمعة", short: "ج" },
];

const durationOptions = [
  { value: 60, label: "ساعة واحدة يوميًا" },
  { value: 120, label: "ساعتان يوميًا" },
  { value: 180, label: "3 ساعات يوميًا" },
];

const studyPlanTips = [
  {
    title: "هل تعلم؟",
    description: "الطلاب الذين يلتزمون بخطة دراسية مسبقة يحققون نتائج أعلى بنسبة 40% من أقرانهم.",
  },
  {
    title: "قسّم وقتك",
    description: "جلسات قصيرة من 25 دقيقة مع استراحة بسيطة تساعدك على الاستمرار دون إرهاق.",
  },
  {
    title: "ابدأ بالأهم",
    description: "رتّب دروسك حسب الصعوبة والموعد، وابدأ بالدرس الذي يؤثر أكثر على نتيجتك.",
  },
  {
    title: "راجع بعد التعلم",
    description: "مراجعة سريعة بعد كل درس تثبت المعلومات وتكشف النقاط التي تحتاج تدريباً إضافياً.",
  },
  {
    title: "تابع تقدمك",
    description: "مراقبة نسبة الإنجاز أسبوعياً تساعدك تعدّل خطتك قبل تراكم الدروس.",
  },
];

const planColors = [
  "hsl(220, 85%, 55%)",
  "hsl(152, 70%, 40%)",
  "hsl(38, 90%, 50%)",
  "hsl(270, 70%, 55%)",
  "hsl(199, 80%, 50%)",
];

const normalizeSubject = (s) => ({
  id: s.id || s.Id,
  title: s.title || s.Title || s.name || s.Name || "",
});

const normalizeSubjectDetails = (s) => ({
  id: s.id || s.Id,
  title: s.title || s.Title || s.name || s.Name || "",
  units: (s.units || s.Units || []).map((u) => ({
    id: u.id || u.Id,
    title: u.title || u.Title || "",
    orderNumber: u.orderNumber || u.OrderNumber || 0,
    lessons: (u.lessons || u.Lessons || []).map((l) => ({
      id: l.id || l.Id,
      lessonId: l.lessonId || l.LessonId,
      title: l.title || l.Title || "",
      duration: l.duration || l.Duration || "غير محدد",
      completed: l.completed ?? l.Completed ?? false,
    })),
  })),
});

const normalizePlan = (p) => ({
  id: p.id || p.Id,
  subjectId: p.subjectId || p.SubjectId,
  subjectName: p.subjectName || p.SubjectName || "",
  title: p.title || p.Title || "",
  description: p.description || p.Description || "",
  studyDays: p.studyDays || p.StudyDays || [],
  dailyDurationMinutes: p.dailyDurationMinutes || p.DailyDurationMinutes || 0,
  totalItems: p.totalItems || p.TotalItems || 0,
  completedItems: p.completedItems || p.CompletedItems || 0,
  progressPercent: p.progressPercent || p.ProgressPercent || 0,
  isAiGenerated: p.isAiGenerated ?? p.IsAiGenerated ?? false,
  items: (p.items || p.Items || []).map((item) => ({
    id: item.id || item.Id,
    lessonId: item.lessonId || item.LessonId,
    lessonTitle: item.lessonTitle || item.LessonTitle || "",
    orderNumber: item.orderNumber || item.OrderNumber || 0,
    isCompleted: item.isCompleted ?? item.IsCompleted ?? false,
  })),
});

const normalizeSuggestion = (s) => ({
  recommendationText: s.recommendationText || s.RecommendationText || "",
  focusSubjects: s.focusSubjects || s.FocusSubjects || [],
  weeklyStudyHours: s.weeklyStudyHours || s.WeeklyStudyHours || 0,
  lessonOrder: s.lessonOrder || s.LessonOrder || [],
  subjectId: s.subjectId || s.SubjectId || "",
  lessonIds: s.lessonIds || s.LessonIds || [],
});

const getDayNames = (days) => {
  if (!days || days.length === 0) return "غير محدد";
  if (days.length === 7) return "يوميًا";
  return days.join("، ");
};

const getDurationText = (minutes) => {
  if (!minutes) return "غير محدد";
  if (minutes === 60) return "ساعة يوميًا";
  if (minutes === 120) return "ساعتان يوميًا";
  if (minutes === 180) return "3 ساعات يوميًا";
  return `${minutes} دقيقة يوميًا`;
};

const StudyPlans = () => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const formRef = useRef(null);
  const menuContainerRef = useRef(null);
  const pendingAiApplyRef = useRef(Boolean(location.state?.openAiSuggestion));

  const [subjects, setSubjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(true);

  const [pageError, setPageError] = useState("");
  const [createError, setCreateError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectUnits, setSubjectUnits] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [selectedDays, setSelectedDays] = useState(["الأحد", "الثلاثاء", "الخميس"]);
  const [duration, setDuration] = useState(60);

  const [creating, setCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [expandedUnitId, setExpandedUnitId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [tipIndex, setTipIndex] = useState(0);
  const activeStudyTip = studyPlanTips[tipIndex];

  useEffect(() => {
    fetchSubjects();
    fetchPlans();
    fetchAiSuggestion();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((currentIndex) => (currentIndex + 1) % studyPlanTips.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);
      setPageError("");

      const response = await fetch(`${API_BASE_URL}/api/student/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setPageError(data.message || "فشل تحميل المواد");
        return;
      }

      setSubjects((Array.isArray(data) ? data : []).map(normalizeSubject));
    } catch (error) {
      console.error(error);
      setPageError("تعذر الاتصال بالسيرفر");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      setPageError("");

      const response = await fetch(`${API_BASE_URL}/api/student/study-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setPageError(data.message || "فشل تحميل الخطط");
        return;
      }

      setPlans((Array.isArray(data) ? data : []).map(normalizePlan));
    } catch (error) {
      console.error(error);
      setPageError("تعذر الاتصال بالسيرفر");
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchAiSuggestion = async () => {
    try {
      setSuggestionLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/student/study-plans/ai-suggestion`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setAiSuggestion(normalizeSuggestion(data));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const fetchLessonsForSubject = async (subjectId) => {
    try {
      setLessonsLoading(true);
      setCreateError("");
      setSubjectUnits([]);
      setExpandedUnitId(null);

      const response = await fetch(`${API_BASE_URL}/api/student/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.message || "فشل تحميل الوحدات والدروس");
        return [];
      }

      const normalized = normalizeSubjectDetails(data);
      setSubjectUnits(normalized.units);

      if (normalized.units.length > 0) {
        setExpandedUnitId(normalized.units[0].id);
      }

      return normalized.units;
    } catch (error) {
      console.error(error);
      setCreateError("تعذر تحميل الوحدات والدروس");
      return [];
    } finally {
      setLessonsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPlanId(null);
    setSelectedSubject("");
    setSubjectUnits([]);
    setSelectedLessons([]);
    setSelectedDays(["الأحد", "الثلاثاء", "الخميس"]);
    setDuration(60);
    setExpandedUnitId(null);
    setCreateError("");
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleLesson = (lessonId) => {
    setSelectedLessons((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const toggleUnit = (unitId) => {
    setExpandedUnitId((prev) => (prev === unitId ? null : unitId));
  };

  const isUnitFullySelected = (unit) => {
    if (!unit.lessons?.length) return false;
    return unit.lessons.every((lesson) => selectedLessons.includes(lesson.lessonId));
  };

  const handleToggleUnitSelection = (unit) => {
    const lessonIds = unit.lessons.map((lesson) => lesson.lessonId);

    if (isUnitFullySelected(unit)) {
      setSelectedLessons((prev) => prev.filter((id) => !lessonIds.includes(id)));
      return;
    }

    setSelectedLessons((prev) => [...new Set([...prev, ...lessonIds])]);
  };

  const selectedSubjectName = useMemo(
    () => subjects.find((s) => s.id === selectedSubject)?.title || "",
    [subjects, selectedSubject]
  );

  const handleSubjectChange = async (e) => {
    const value = e.target.value;
    setSelectedSubject(value);
    setCreateError("");
    setSelectedLessons([]);
    setEditingPlanId(null);

    if (!value) {
      setSubjectUnits([]);
      setExpandedUnitId(null);
      return;
    }

    await fetchLessonsForSubject(value);
  };

  const handleCreateOrUpdatePlan = async () => {
    if (!selectedSubject || selectedLessons.length === 0 || selectedDays.length === 0) {
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const isEditing = Boolean(editingPlanId);
      const url = isEditing
        ? `${API_BASE_URL}/api/student/study-plans/${editingPlanId}`
        : `${API_BASE_URL}/api/student/study-plans`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          title: `خطة - ${selectedSubjectName}`,
          description: `خطة دراسية مخصصة لمادة ${selectedSubjectName}`,
          isAiGenerated: selectedSubject === aiSuggestion?.subjectId,
          studyDays: selectedDays,
          dailyDurationMinutes: duration,
          lessonIds: selectedLessons,
        }),
      });

      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        setCreateError(data?.message || (isEditing ? "فشل تعديل الخطة" : "فشل إنشاء الخطة"));
        return;
      }

      const normalizedPlan = normalizePlan(data);

      if (isEditing) {
        setPlans((prev) =>
          prev.map((plan) => (plan.id === editingPlanId ? normalizedPlan : plan))
        );
      } else {
        setPlans((prev) => [normalizedPlan, ...prev]);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      resetForm();
    } catch (error) {
      console.error(error);
      setCreateError("تعذر الاتصال بالسيرفر");
    } finally {
      setCreating(false);
    }
  };

  const handleEditPlan = async (plan) => {
    setOpenMenuId(null);
    setCreateError("");
    setEditingPlanId(plan.id);
    setSelectedSubject(plan.subjectId || "");
    setSelectedDays(Array.isArray(plan.studyDays) ? plan.studyDays : []);
    setDuration(plan.dailyDurationMinutes || 60);

    const units = await fetchLessonsForSubject(plan.subjectId);
    const lessonIds = (plan.items || []).map((item) => item.lessonId).filter(Boolean);
    setSelectedLessons(lessonIds);

    if (units.length > 0) {
      const firstMatchedUnit = units.find((unit) =>
        unit.lessons.some((lesson) => lessonIds.includes(lesson.lessonId))
      );

      if (firstMatchedUnit) {
        setExpandedUnitId(firstMatchedUnit.id);
      }
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleApplyAiSuggestion = async () => {
    if (!aiSuggestion?.subjectId) return;

    setSelectedSubject(aiSuggestion.subjectId);
    setEditingPlanId(null);
    setCreateError("");

    await fetchLessonsForSubject(aiSuggestion.subjectId);

    if (aiSuggestion.lessonIds?.length) {
      setSelectedLessons(aiSuggestion.lessonIds);
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!pendingAiApplyRef.current || suggestionLoading || !aiSuggestion?.subjectId) {
      return;
    }

    pendingAiApplyRef.current = false;
    handleApplyAiSuggestion();
  }, [suggestionLoading, aiSuggestion?.subjectId]);

  const handleDeletePlan = async (planId) => {
    try {
      setDeletingId(planId);

      const response = await fetch(`${API_BASE_URL}/api/student/study-plans/${planId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let data = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        }

        setPageError(data?.message || "فشل حذف الخطة");
        return;
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== planId));

      if (editingPlanId === planId) {
        resetForm();
      }

      setOpenMenuId(null);
    } catch (error) {
      console.error(error);
      setPageError("تعذر الاتصال بالسيرفر");
    } finally {
      setDeletingId(null);
    }
  };
  

  const toggleItemCompletion = async (planId, item) => {
  const newCompleted = !item.isCompleted;

  // تحديث متفائل
  setPlans((prev) =>
    prev.map((p) => {
      if (p.id !== planId) return p;
      const items = p.items.map((it) =>
        it.id === item.id ? { ...it, isCompleted: newCompleted } : it
      );
      const completedItems = items.filter((it) => it.isCompleted).length;
      const progressPercent = p.totalItems
        ? (completedItems / p.totalItems) * 100
        : 0;
      return { ...p, items, completedItems, progressPercent };
    })
  );

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/student/study-plans/${planId}/items/${item.id}/completion?isCompleted=${newCompleted}`,
      {
        method: "PUT",
        headers: {
          // "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // body: JSON.stringify({ isCompleted: newCompleted }),
      }
    );
    if (!response.ok) throw new Error("failed");
  } catch (e) {
    // تراجع عن التحديث عند الفشل
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const items = p.items.map((it) =>
          it.id === item.id ? { ...it, isCompleted: !newCompleted } : it
        );
        const completedItems = items.filter((it) => it.isCompleted).length;
        const progressPercent = p.totalItems
          ? (completedItems / p.totalItems) * 100
          : 0;
        return { ...p, items, completedItems, progressPercent };
      })
    );
    setPageError("فشل تحديث حالة الدرس");
  }
};


  return (
    <DashboardLayout
      title="خطط الدراسة"
      subtitle="نظّم جدولك الدراسي وحافظ على استمرارك في التحضير للتوجيهي."
      hideSearch
    >
      {showSuccess && (
        <motion.div
          className="sp-success-toast"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle2 size={20} />
          <span>{editingPlanId ? "تم تعديل الخطة بنجاح! 🎉" : "تم إنشاء الخطة بنجاح! 🎉"}</span>
        </motion.div>
      )}

      <div className="sp-layout">
        <div className="sp-main">
          <div className="sp-create-card" ref={formRef}>
            <div className="sp-create-header">
              <CalendarDays size={22} />
              <h2>{editingPlanId ? "تعديل الخطة الدراسية" : "إنشاء خطة دراسية مخصصة"}</h2>
            </div>

            {editingPlanId && (
              <div className="sp-edit-mode-banner">
                <span>أنتِ الآن تعدّلين خطة موجودة</span>
                <button type="button" className="sp-cancel-edit-btn" onClick={resetForm}>
                  <X size={16} />
                  <span>إلغاء التعديل</span>
                </button>
              </div>
            )}

            <div className="sp-form">
              <div className="sp-form-row">
                <div className="sp-form-group">
                  <label>اختر المادة</label>
                  <select
                    className="sp-select"
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    disabled={subjectsLoading || creating}
                  >
                    <option value="">اختر المادة</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sp-form-group">
                  <label>مدة الدراسة</label>
                  <select
                    className="sp-select"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    disabled={creating}
                  >
                    {durationOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sp-form-group">
                <label>اختر أيام الدراسة</label>
                <div className="sp-days">
                  {dayLabels.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      className={`sp-day-btn ${
                        selectedDays.includes(d.key) ? "sp-day-active" : ""
                      }`}
                      onClick={() => toggleDay(d.key)}
                      disabled={creating}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sp-form-group">
                <label>اختر الوحدات والدروس</label>

                {!selectedSubject ? (
                  <p className="sp-helper-text">اختر المادة أولًا</p>
                ) : lessonsLoading ? (
                  <p className="sp-helper-text">جاري تحميل الوحدات والدروس...</p>
                ) : subjectUnits.length === 0 ? (
                  <p className="sp-helper-text">لا توجد وحدات أو دروس لهذه المادة</p>
                ) : (
                  <div className="sp-units-list">
                    {subjectUnits.map((unit) => {
                      const expanded = expandedUnitId === unit.id;
                      const lessonsCount = unit.lessons.length;

                      return (
                        <div key={unit.id} className="sp-unit-block">
                          <div className="sp-unit-header">
                            <button
                              type="button"
                              className="sp-unit-toggle"
                              onClick={() => toggleUnit(unit.id)}
                            >
                              <div className="sp-unit-toggle-content">
                                <span className="sp-unit-title">{unit.title}</span>
                                <span className="sp-unit-count">
                                  {lessonsCount} {lessonsCount === 1 ? "درس" : "دروس"}
                                </span>
                              </div>

                              <ChevronDown
                                size={18}
                                className={`sp-unit-chevron ${
                                  expanded ? "sp-unit-chevron-open" : ""
                                }`}
                              />
                            </button>

                            <button
                              type="button"
                              className="sp-unit-select-all-btn"
                              onClick={() => handleToggleUnitSelection(unit)}
                              disabled={creating}
                            >
                              {isUnitFullySelected(unit)
                                ? "إلغاء تحديد الوحدة"
                                : "تحديد كل دروس الوحدة"}
                            </button>
                          </div>

                          {expanded && (
                            <div className="sp-lessons-checklist">
                              {unit.lessons.map((lesson) => (
                                <label key={lesson.lessonId} className="sp-lesson-row">
                                  <div className="sp-lesson-row-main">
                                    <input
                                      type="checkbox"
                                      checked={selectedLessons.includes(lesson.lessonId)}
                                      onChange={() => toggleLesson(lesson.lessonId)}
                                      disabled={creating}
                                    />
                                    <span className="sp-lesson-title">{lesson.title}</span>
                                  </div>

                                  <small className="sp-lesson-duration">{lesson.duration}</small>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedLessons.length > 0 && (
                <p className="sp-selected-lessons-count">
                  تم اختيار {selectedLessons.length} درس
                </p>
              )}

              {createError && <p className="sp-create-error">{createError}</p>}

              <div className="sp-action-row">
                <motion.button
                  className="sp-create-btn"
                  whileHover={{ scale: creating ? 1 : 1.01 }}
                  whileTap={{ scale: creating ? 1 : 0.98 }}
                  onClick={handleCreateOrUpdatePlan}
                  disabled={
                    !selectedSubject ||
                    selectedLessons.length === 0 ||
                    selectedDays.length === 0 ||
                    creating
                  }
                >
                  {creating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <BookOpen size={18} />
                  )}
                  {creating
                    ? editingPlanId
                      ? "جاري حفظ التعديلات..."
                      : "جاري إنشاء الخطة..."
                    : editingPlanId
                    ? "حفظ التعديلات"
                    : "إنشاء الخطة"}
                </motion.button>

                {editingPlanId && (
                  <button
                    type="button"
                    className="sp-secondary-btn"
                    onClick={resetForm}
                    disabled={creating}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="sp-existing">
            <div className="sp-existing-header">
              <h2>خططك الدراسية الحالية ({plans.length})</h2>
            </div>

            {plansLoading ? (
              <div className="sp-plans-grid">
                <div className="sp-plan-card">
                  <p>جاري تحميل الخطط...</p>
                </div>
              </div>
            ) : (
              <div className="sp-plans-grid">
                {plans.map((plan, index) => {
                  const color = planColors[index % planColors.length];
                  const lessonsLeft = Math.max(0, plan.totalItems - plan.completedItems);

                  return (
                    <motion.div
                      key={plan.id}
                      className="sp-plan-card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      layout
                    >
                      <div className="sp-plan-top">
                        <span
                          className="sp-plan-badge"
                          style={{ background: `${color}15`, color }}
                        >
                          {plan.subjectName || "مادة"}
                        </span>

                        <div
                          className="sp-plan-menu-wrapper"
                          ref={openMenuId === plan.id ? menuContainerRef : null}
                        >
                          <button
                            type="button"
                            className="sp-plan-menu-btn"
                            onClick={() =>
                              setOpenMenuId((prev) => (prev === plan.id ? null : plan.id))
                            }
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenuId === plan.id && (
                            <div className="sp-plan-menu-dropdown">
                              <button
                                type="button"
                                className="sp-plan-menu-item"
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Pencil size={16} />
                                <span>تعديل الخطة</span>
                              </button>

                              <button
                                type="button"
                                className="sp-plan-menu-item sp-plan-menu-item-danger"
                                onClick={() => handleDeletePlan(plan.id)}
                                disabled={deletingId === plan.id}
                              >
                                <Trash2 size={16} />
                                <span>
                                  {deletingId === plan.id ? "جاري الحذف..." : "حذف الخطة"}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="sp-plan-title">{plan.title}</h3>

                      <div className="sp-plan-progress">
                        <span>التقدم</span>
                        <span>{Math.round(plan.progressPercent)}%</span>
                      </div>

                      <div className="sp-plan-bar">
                        <motion.div
                          className="sp-plan-bar-fill"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${plan.progressPercent}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>

                      <div className="sp-plan-meta">
                        <span>
                          <BookOpen size={13} /> {lessonsLeft} دروس متبقية
                        </span>
                        <span>
                          <Clock size={13} /> {getDayNames(plan.studyDays)}
                        </span>
                      </div>

                      <div className="sp-plan-meta sp-plan-meta-secondary">
                        <span>
                          <Clock size={13} /> {getDurationText(plan.dailyDurationMinutes)}
                        </span>
                      </div>
                      {/* بعد div شريط التقدم */}
{plan.items && plan.items.length > 0 && (
  <div className="sp-plan-topics">
    <div className="sp-plan-topics-title">المواضيع</div>
    <ul className="sp-plan-topics-list">
      {plan.items
        .slice()
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .map((item) => (
          <li key={item.id} className="sp-plan-topic-row">
            <label className="sp-plan-topic-label">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => toggleItemCompletion(plan.id, item)}
              />
              <span
                className={
                  item.isCompleted
                    ? "sp-plan-topic-text sp-plan-topic-text-done"
                    : "sp-plan-topic-text"
                }
              >
                {item.lessonTitle}
              </span>
            </label>
          </li>
        ))}
    </ul>
  </div>
)}

                    </motion.div>
                    
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="sp-sidebar">
          <div className="sp-ai-card">
            <div className="sp-ai-header">
              <Sparkles size={20} />
              <span>خطط مقترحة بالذكاء الاصطناعي</span>
            </div>

            <div className="sp-ai-info">
              <span className="sp-ai-label">المواد الموصى بها</span>
              <p className="sp-ai-value">
                {suggestionLoading
                  ? "جاري التحليل..."
                  : aiSuggestion?.focusSubjects?.length
                  ? aiSuggestion.focusSubjects.join(" + ")
                  : "ابدأ باختبار قصير"}
              </p>
            </div>

            <div className="sp-ai-info">
              <span className="sp-ai-label">الوقت المتوقع</span>
              <p className="sp-ai-value sp-ai-value-lg">
                {aiSuggestion?.weeklyStudyHours
                  ? `${aiSuggestion.weeklyStudyHours} ساعة دراسية / أسبوع`
                  : "حسب تقدمك الحالي"}
              </p>
            </div>

            <div className="sp-ai-info">
              <span className="sp-ai-label">الترتيب المقترح للدروس:</span>
              <ul className="sp-ai-lessons">
                {(aiSuggestion?.lessonOrder?.length
                  ? aiSuggestion.lessonOrder
                  : [aiSuggestion?.recommendationText || "أكمل درساً واحداً ثم حل اختباراً قصيراً"]
                ).slice(0, 3).map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <span className="sp-ai-num">{index + 1}</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <motion.button
              className="sp-ai-apply-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleApplyAiSuggestion}
              disabled={!aiSuggestion?.subjectId}
            >
              تطبيق هذه الخطة
            </motion.button>
          </div>

          <div className="sp-tip-card">
            <div className="sp-tip-icon">
              <TrendingUp size={24} />
            </div>
            <h4 key={`study-tip-title-${activeStudyTip.title}`}>{activeStudyTip.title}</h4>
            <p key={`study-tip-desc-${activeStudyTip.description}`}>{activeStudyTip.description}</p>
          </div>
        </aside>
      </div>

      {pageError && <p className="sp-page-error">{pageError}</p>}
    </DashboardLayout>
  );
};

export default StudyPlans;
