import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardList,
  HelpCircle,
  BookOpenCheck,
  GraduationCap,
  TimerReset,
  UsersRound,
  Sparkles,
  Save,
  X,
  Loader2,
} from "lucide-react";

import "../AdminStyles/AdminExams.css";
import DashboardLayout from "../components/DashboardLayout";
import { API_BASE_URL } from "@/config/api";

const emptyQuestion = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  text: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  solutionText: "",
});

const emptyFormData = {
  title: "",
  subjectId: "",
  lessonId: "",
};

const optionLabels = ["أ", "ب", "ج", "د"];

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    testedStudents: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [examType, setExamType] = useState("short");
  const [formData, setFormData] = useState({ ...emptyFormData });
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const errorBoxStyle = {
    marginTop: "12px",
    marginBottom: "8px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    fontSize: "14px",
    textAlign: "right",
  };

  const successBoxStyle = {
    marginTop: "12px",
    marginBottom: "8px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    fontSize: "14px",
    textAlign: "right",
  };

  const normalizeExam = (exam) => ({
    id: exam.id || exam.Id,
    title: exam.title || exam.Title || "",
    subjectId: exam.subjectId || exam.SubjectId || "",
    subjectName: exam.subjectName || exam.SubjectName || "",
    lessonId: exam.lessonId || exam.LessonId || "",
    lessonTitle: exam.lessonTitle || exam.LessonTitle || "",
    type: exam.type || exam.Type || "short",
    typeLabel: exam.typeLabel || exam.TypeLabel || "",
    typeColor: exam.typeColor || exam.TypeColor || "#d97706",
    questionCount: exam.questionCount ?? exam.QuestionCount ?? 0,
    isActive: exam.isActive ?? exam.IsActive ?? true,
    questions: exam.questions || exam.Questions || [],
  });

  const normalizeSubject = (subject) => ({
    id: subject.id || subject.Id,
    name: subject.name || subject.Name || "",
    department: subject.department || subject.Department || "",
  });

  const normalizeLesson = (lesson) => ({
    id: lesson.id || lesson.Id,
    subjectId: lesson.subjectId || lesson.SubjectId || "",
    title: lesson.title || lesson.Title || "",
  });

  const normalizeStats = (rawStats) => ({
    totalExams: rawStats?.totalExams ?? rawStats?.TotalExams ?? 0,
    activeExams: rawStats?.activeExams ?? rawStats?.ActiveExams ?? 0,
    testedStudents: rawStats?.testedStudents ?? rawStats?.TestedStudents ?? 0,
  });

  const normalizeQuestion = (question) => {
    const options = question.options || question.Options || ["", "", "", ""];

    return {
      id:
        question.id ||
        question.Id ||
        (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      text: question.text || question.Text || "",
      options: [
        options[0] || "",
        options[1] || "",
        options[2] || "",
        options[3] || "",
      ],
      correctAnswer: question.correctAnswer ?? question.CorrectAnswer ?? 0,
      solutionText: question.solutionText || question.SolutionText || "",
    };
  };

  const readResponseBody = async (response) => {
    const rawText = await response.text();

    try {
      return JSON.parse(rawText);
    } catch {
      return { message: rawText };
    }
  };

  const loadExams = async ({ silent = false } = {}) => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      if (silent) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/exams?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders,
        }
      );

      const data = await readResponseBody(response);

      if (!response.ok) {
        setPageError(data.message || "فشل تحميل الامتحانات");
        return;
      }

      const pageExams = data.exams || data.Exams || [];
      const pageSubjects = data.subjects || data.Subjects || [];
      const pageLessons = data.lessons || data.Lessons || [];
      const pageStats = data.stats || data.Stats || {};

      setExams(pageExams.map(normalizeExam));
      setSubjects(pageSubjects.map(normalizeSubject));
      setLessons(pageLessons.map(normalizeLesson));
      setStats(normalizeStats(pageStats));
    } catch (err) {
      console.error(err);
      setPageError("تعذر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadExams({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;

    const delay = setTimeout(() => {
      loadExams({ silent: true });
    }, 400);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredLessonsBySubject = formData.subjectId
    ? lessons.filter((lesson) => lesson.subjectId === formData.subjectId)
    : [];

  const getTypeLabel = (type) => {
    if (type === "comprehensive") return "شامل";
    if (type === "short") return "اختبار قصير";
    return type;
  };

  const getTypeColor = (type) => {
    return type === "comprehensive" ? "#2563eb" : "#d97706";
  };

  const resetForm = () => {
    setFormData({ ...emptyFormData });
    setExamType("short");
    setQuestions([emptyQuestion()]);
    setEditingExam(null);
    setShowForm(false);
    setFormError("");
    setFormSuccess("");
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (exam) => {
    setFormData({
      title: exam.title,
      subjectId: exam.subjectId || "",
      lessonId: exam.lessonId || "",
    });

    setExamType(exam.type || "short");

    const examQuestions =
      exam.questions && exam.questions.length > 0
        ? exam.questions.map(normalizeQuestion)
        : [emptyQuestion()];

    setQuestions(examQuestions);
    setEditingExam(exam);
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const updateQuestion = (qIndex, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q))
    );

    setFormError("");
    setFormSuccess("");
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;

        const options = [...q.options];
        options[oIndex] = value;

        return { ...q, options };
      })
    );

    setFormError("");
    setFormSuccess("");
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
    setFormError("");
    setFormSuccess("");
  };

  const removeQuestion = (qIndex) => {
    if (questions.length === 1) {
      setFormError("يجب أن يحتوي الامتحان على سؤال واحد على الأقل.");
      return;
    }

    setQuestions((prev) => prev.filter((_, index) => index !== qIndex));
    setFormError("");
    setFormSuccess("");
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "عنوان الامتحان مطلوب.";
    }

    if (!formData.subjectId) {
      return "اختيار المادة مطلوب.";
    }

    if (!questions.length) {
      return "يجب إضافة سؤال واحد على الأقل.";
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.text.trim()) {
        return `نص السؤال رقم ${i + 1} مطلوب.`;
      }

      if (!question.options || question.options.length < 4) {
        return `يجب إدخال أربعة خيارات للسؤال رقم ${i + 1}.`;
      }

      for (let j = 0; j < 4; j++) {
        if (!question.options[j]?.trim()) {
          return `الخيار ${optionLabels[j]} في السؤال رقم ${i + 1} مطلوب.`;
        }
      }

      if (question.correctAnswer < 0 || question.correctAnswer > 3) {
        return `الإجابة الصحيحة للسؤال رقم ${i + 1} غير صحيحة.`;
      }
    }

    return "";
  };

  const handleSave = async () => {
    const validationMessage = validateForm();

    if (validationMessage) {
      setFormSuccess("");
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setFormSuccess("");

      const isEdit = Boolean(editingExam);

      const url = isEdit
        ? `${API_BASE_URL}/api/admin/exams/${editingExam.id}`
        : `${API_BASE_URL}/api/admin/exams`;

      const payload = {
        title: formData.title.trim(),
        subjectId: formData.subjectId,
        lessonId: formData.lessonId || null,
        type: examType,
        questions: questions.map((question) => ({
          text: question.text.trim(),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer,
          solutionText: question.solutionText?.trim() || "",
        })),
      };

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await readResponseBody(response);

      if (!response.ok) {
        setFormSuccess("");
        setFormError(data.message || "فشل حفظ الامتحان");
        return;
      }

      setFormError("");
      setFormSuccess(
        isEdit ? "تم تعديل الامتحان بنجاح." : "تمت إضافة الامتحان بنجاح."
      );

      await loadExams({ silent: true });

      setTimeout(() => {
        resetForm();
      }, 900);
    } catch (err) {
      console.error(err);
      setFormSuccess("");
      setFormError("تعذر الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setSaving(true);
      setDeleteError("");
      setDeleteSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/exams/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data = await readResponseBody(response);

      if (!response.ok) {
        setDeleteSuccess("");
        setDeleteError(data.message || "فشل حذف الامتحان");
        return;
      }

      setDeleteError("");
      setDeleteSuccess("تم حذف الامتحان بنجاح.");

      await loadExams({ silent: true });

      setTimeout(() => {
        setDeleteConfirm(null);
        setDeleteError("");
        setDeleteSuccess("");
      }, 900);
    } catch (err) {
      console.error(err);
      setDeleteSuccess("");
      setDeleteError("تعذر الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div
          className="admin-main-ex rtl"
          style={{
            minHeight: "350px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <Loader2 className="animate-spin" />
          <span>جاري تحميل الامتحانات...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="app-container" dir="rtl">
        <main className="admin-main-ex rtl">
          <div className="page-header-ex">
            <div className="header-text-ex">
              <span className="page-kicker-ex">
                <Sparkles size={15} />
                مركز الاختبارات
              </span>
              <h1>إدارة الامتحانات</h1>
              <p>نظام إدارة وتقييم الاختبارات التعليمية للطلاب</p>
            </div>

            <div className="exam-hero-panel" aria-hidden="true">
              <div className="exam-floating-badge exam-floating-badge-one">
                <ClipboardList size={22} />
              </div>
              <div className="exam-floating-badge exam-floating-badge-two">
                <GraduationCap size={20} />
              </div>
              <div className="exam-hero-card">
                <BookOpenCheck size={34} />
                <span>جاهز للتقييم</span>
              </div>
            </div>

            <button className="btn-primary-ex" onClick={handleAddNew}>
              <Plus size={18} />
              <span>إضافة امتحان جديد</span>
            </button>
          </div>

          {pageError && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              {pageError}
            </div>
          )}

          <div className="ex-stats-row">
            <div className="ex-stat-card">
              <span className="ex-stat-icon ex-stat-icon-blue">
                <ClipboardList size={22} />
              </span>
              <span className="ex-stat-value">{stats.totalExams}</span>
              <span className="ex-stat-label">إجمالي الامتحانات</span>
            </div>

            <div className="ex-stat-card">
              <span className="ex-stat-icon ex-stat-icon-green">
                <TimerReset size={22} />
              </span>
              <span className="ex-stat-value">{stats.activeExams}</span>
              <span className="ex-stat-label">امتحانات نشطة</span>
            </div>

            <div className="ex-stat-card">
              <span className="ex-stat-icon ex-stat-icon-amber">
                <UsersRound size={22} />
              </span>
              <span className="ex-stat-value">
                {Number(stats.testedStudents).toLocaleString()}
              </span>
              <span className="ex-stat-label">الطلاب المختبرين</span>
            </div>
          </div>

          <div className="table-section-ex">
            <div className="table-header-ex">
              <h2>قائمة الامتحانات الحالية</h2>

              <div className="search-input-wrapper-ex">
                <Search size={18} className="search-icon-ex" />
                <input
                  type="text"
                  placeholder="ابحث عن امتحان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {tableLoading && (
              <div
                style={{
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#64748b",
                }}
              >
                <Loader2 className="animate-spin" size={16} />
                <span>تحديث البيانات...</span>
              </div>
            )}

            <table className="exams-table">
              <thead>
                <tr>
                  <th>عنوان الامتحان</th>
                  <th>المادة</th>
                  <th>نوع الامتحان</th>
                  <th>عدد الأسئلة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#94a3b8",
                      }}
                    >
                      لا توجد امتحانات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id}>
                      <td className="exam-title-cell">{exam.title}</td>

                      <td>{exam.subjectName || "غير محدد"}</td>

                      <td>
                        <span
                          className="type-badge"
                          style={{
                            backgroundColor:
                              (exam.typeColor || getTypeColor(exam.type)) +
                              "18",
                            color: exam.typeColor || getTypeColor(exam.type),
                          }}
                        >
                          {exam.typeLabel || getTypeLabel(exam.type)}
                        </span>
                      </td>

                      <td>{exam.questionCount}</td>

                      <td>
                        <div className="actions-cell-ex">
                          <button
                            className="aa-action-btn edit"
                            onClick={() => handleEdit(exam)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="aa-action-btn delete"
                            onClick={() => {
                              setDeleteError("");
                              setDeleteSuccess("");
                              setDeleteConfirm(exam);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {deleteConfirm && (
            <div
              className="modal-overlay-ex"
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteError("");
                setDeleteSuccess("");
              }}
            >
              <div
                className="modal-content-ex"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-icon-ex">
                  <Trash2 size={32} />
                </div>

                <h3>تأكيد الحذف</h3>

                <p>
                  هل أنت متأكد من حذف امتحان "{deleteConfirm.title}"؟ لا يمكن
                  التراجع عن هذا الإجراء.
                </p>

                {deleteError && <div style={errorBoxStyle}>{deleteError}</div>}
                {deleteSuccess && (
                  <div style={successBoxStyle}>{deleteSuccess}</div>
                )}

                <div className="modal-actions-ex">
                  <button
                    className="btn-danger-ex"
                    onClick={handleDelete}
                    disabled={saving || Boolean(deleteSuccess)}
                  >
                    <Trash2 size={16} />
                    <span>{saving ? "جاري الحذف..." : "حذف"}</span>
                  </button>

                  <button
                    className="btn-cancel-ex"
                    onClick={() => {
                      setDeleteConfirm(null);
                      setDeleteError("");
                      setDeleteSuccess("");
                    }}
                    disabled={saving}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="form-card-ex">
              <div className="form-header-ex">
                <h2>{editingExam ? "تعديل الامتحان" : "إضافة امتحان جديد"}</h2>

                <button className="form-close-btn-ex" onClick={resetForm}>
                  <X size={20} />
                </button>
              </div>

              <div className="form-grid-ex">
                <div className="form-group-ex">
                  <label>عنوان الامتحان</label>
                  <input
                    type="text"
                    placeholder="مثال: امتحان نهاية الفصل"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setFormError("");
                      setFormSuccess("");
                    }}
                  />
                </div>

                <div className="form-group-ex">
                  <label>نوع الامتحان</label>

                  <div className="exam-type-selector">
                    <button
                      type="button"
                      className={`type-card ${
                        examType === "short" ? "type-card--active" : ""
                      }`}
                      onClick={() => {
                        setExamType("short");
                        setFormError("");
                        setFormSuccess("");
                      }}
                    >
                      <HelpCircle size={28} />
                      <span className="type-card-title">اختبار قصير</span>
                      <span className="type-card-sub">كويز سريع للدروس</span>
                    </button>

                    <button
                      type="button"
                      className={`type-card ${
                        examType === "comprehensive"
                          ? "type-card--active"
                          : ""
                      }`}
                      onClick={() => {
                        setExamType("comprehensive");
                        setFormError("");
                        setFormSuccess("");
                      }}
                    >
                      <ClipboardList size={28} />
                      <span className="type-card-title">شامل</span>
                      <span className="type-card-sub">امتحان نهائي للمادة</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-grid-ex">
                <div className="form-group-ex">
                  <label>اختر المادة</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        subjectId: e.target.value,
                        lessonId: "",
                      });
                      setFormError("");
                      setFormSuccess("");
                    }}
                  >
                    <option value="">اختر المادة</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.department
                          ? `${subject.name} - ${subject.department}`
                          : subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ex">
                  <label>اختر الدرس (اختياري)</label>
                  <select
                    value={formData.lessonId}
                    onChange={(e) => {
                      setFormData({ ...formData, lessonId: e.target.value });
                      setFormError("");
                      setFormSuccess("");
                    }}
                    disabled={!formData.subjectId}
                  >
                    <option value="">جميع الدروس</option>
                    {filteredLessonsBySubject.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {questions.map((q, qIndex) => (
                <div className="question-card" key={q.id}>
                  <div className="question-card-header">
                    <div className="question-number">
                      <span className="question-number-badge">
                        {qIndex + 1}
                      </span>
                      <span>محرر الأسئلة</span>
                    </div>

                    <span className="question-counter">
                      السؤال {qIndex + 1} من {questions.length}
                    </span>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="action-btn-ex delete-ex"
                        onClick={() => removeQuestion(qIndex)}
                        title="حذف السؤال"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="form-group-ex">
                    <label>نص السؤال</label>
                    <textarea
                      rows={4}
                      placeholder="اكتب نص السؤال هنا..."
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(qIndex, "text", e.target.value)
                      }
                    />
                  </div>

                  <div className="options-section">
                    <label>خيارات الإجابة</label>

                    <div className="options-grid">
                      {q.options.map((opt, oIndex) => (
                        <div className="option-input-row" key={oIndex}>
                          <span className="option-label">
                            {optionLabels[oIndex]}
                          </span>

                          <input
                            type="text"
                            placeholder={`الخيار ${
                              optionLabels[oIndex] === "أ"
                                ? "الأول"
                                : optionLabels[oIndex] === "ب"
                                ? "الثاني"
                                : optionLabels[oIndex] === "ج"
                                ? "الثالث"
                                : "الرابع"
                            }`}
                            value={opt}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="correct-answer-section">
                    <label>تحديد الإجابة الصحيحة</label>

                    <div className="correct-answer-options">
                      {optionLabels.map((label, index) => (
                        <button
                          type="button"
                          key={label}
                          className={`correct-btn ${
                            q.correctAnswer === index
                              ? "correct-btn--active"
                              : ""
                          }`}
                          onClick={() =>
                            updateQuestion(qIndex, "correctAnswer", index)
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group-ex">
                    <label>شرح الإجابة (اختياري)</label>
                    <textarea
                      rows={3}
                      placeholder="اكتب شرحاً مختصراً للإجابة الصحيحة..."
                      value={q.solutionText}
                      onChange={(e) =>
                        updateQuestion(qIndex, "solutionText", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn-add-question"
                onClick={addQuestion}
              >
                <Plus size={18} />
                <span>إضافة سؤال آخر</span>
              </button>

              {formError && <div style={errorBoxStyle}>{formError}</div>}
              {formSuccess && <div style={successBoxStyle}>{formSuccess}</div>}

              <div className="form-actions-ex">
                <button
                  className="btn-primary-ex"
                  onClick={handleSave}
                  disabled={saving || Boolean(formSuccess)}
                >
                  <Save size={18} />
                  <span>
                    {saving
                      ? "جاري الحفظ..."
                      : editingExam
                      ? "حفظ التعديلات"
                      : "حفظ الامتحان"}
                  </span>
                </button>

                <button
                  className="btn-cancel-ex"
                  onClick={resetForm}
                  disabled={saving}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
