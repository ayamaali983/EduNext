import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Edit3,
  Save,
  BookOpen,
  Trophy,
  Star,
  AlertTriangle,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config/api";

const activityIconMap = {
  lesson: BookOpen,
  exam: Star,
  achievement: Trophy,
};

const colorClassMap = {
  blue: "blue",
  amber: "amber",
  green: "green",
  purple: "purple",
};

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

const normalizeProfile = (data) => ({
  id: data.id || data.Id,
  fullName: data.fullName || data.FullName || "",
  email: data.email || data.Email || "",
  phone: data.phone || data.Phone || "",
  role: data.role || data.Role || "",
  branch: data.branch || data.Branch || "",
  academicYear: data.academicYear || data.AcademicYear || "",
  activityHistory: (data.activityHistory || data.ActivityHistory || []).map((group) => ({
    dateLabel: group.dateLabel || group.DateLabel || "",
    items: (group.items || group.Items || []).map((item) => ({
      type: item.type || item.Type || "lesson",
      text: item.text || item.Text || "",
      time: item.time || item.Time || "",
      color: item.color || item.Color || "blue",
    })),
  })),
});

const normalizeInternationalPhone = (value) => {
  return String(value || "")
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");
};

const isValidInternationalPhone = (value) => {
  if (!value) return true;

  return /^\+[1-9]\d{7,14}$/.test(value);
};

const Profile = () => {
  const navigate = useNavigate();
  const token = getAuthToken();

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [profileData, setProfileData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    branch: "",
    academicYear: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setPageError("");

        const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const rawText = await response.text();
        let data;

        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }

        if (!response.ok) {
          setPageError(data.message || "فشل تحميل الملف الشخصي");
          return;
        }

        const normalized = normalizeProfile(data);

        setProfileData(normalized);
        setFormData({
          fullName: normalized.fullName || "",
          email: normalized.email || "",
          phone: normalized.phone || "",
          branch: normalized.branch || "",
          academicYear: normalized.academicYear || "",
        });
      } catch (err) {
        console.error(err);
        setPageError("تعذر الاتصال بالسيرفر");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const activityHistory = useMemo(() => {
    return profileData?.activityHistory || [];
  }, [profileData]);

  const resetEditForm = () => {
    if (!profileData) return;

    setFormData({
      fullName: profileData.fullName || "",
      email: profileData.email || "",
      phone: profileData.phone || "",
      branch: profileData.branch || "",
      academicYear: profileData.academicYear || "",
    });

    setPhoneError("");
    setPageError("");
    setEditing(false);
  };

  const handlePhoneChange = (value) => {
    const cleaned = normalizeInternationalPhone(value);

    setFormData((prev) => ({
      ...prev,
      phone: cleaned,
    }));

    if (cleaned && !isValidInternationalPhone(cleaned)) {
      setPhoneError("رقم الهاتف يجب أن يكون بصيغة دولية مثل: +970599123456");
    } else {
      setPhoneError("");
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      setPageError("الاسم مطلوب.");
      return;
    }

    if (!isValidInternationalPhone(formData.phone)) {
      setPhoneError("رقم الهاتف يجب أن يكون بصيغة دولية مثل: +970599123456");
      return;
    }

    try {
      setSavingProfile(true);
      setPageError("");
      setProfileSaved(false);

      const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
        }),
      });

      const rawText = await response.text();
      let data = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }

      if (!response.ok) {
        setPageError(data?.message || "فشل تحديث البيانات");
        return;
      }

      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              fullName: formData.fullName.trim(),
              phone: formData.phone.trim(),
            }
          : prev
      );

      localStorage.setItem("fullName", formData.fullName.trim());
      sessionStorage.setItem("fullName", formData.fullName.trim());

      setEditing(false);
      setProfileSaved(true);

      setTimeout(() => {
        setProfileSaved(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setPageError("تعذر الاتصال بالسيرفر");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setPasswordError("");
      setPasswordChanged(false);

      const response = await fetch(`${API_BASE_URL}/api/student/profile/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const rawText = await response.text();
      let data = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }

      if (!response.ok) {
        setPasswordError(data?.message || "فشل تغيير كلمة المرور");
        return;
      }

      setPasswordChanged(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      setTimeout(() => {
        setShowPasswordSection(false);
        setPasswordChanged(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setPasswordError("تعذر الاتصال بالسيرفر");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);

      const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawText = await response.text();
      let data = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }

      if (!response.ok) {
        setPageError(data?.message || "فشل حذف الحساب");
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("fullName");
      localStorage.removeItem("role");
      localStorage.removeItem("branch");
      localStorage.removeItem("isOnboardingCompleted");
      localStorage.removeItem("onboarding");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("fullName");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("branch");
      sessionStorage.removeItem("isOnboardingCompleted");
      sessionStorage.removeItem("onboarding");

      navigate("/");
    } catch (err) {
      console.error(err);
      setPageError("تعذر الاتصال بالسيرفر");
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title=" الملف الشخصي"
        subtitle="جاري تحميل بياناتك"
        fullName={profileData?.fullName}
      >
        <div
          className="profile-card"
          style={{
            padding: "2rem",
            textAlign: "center",
            minHeight: "260px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <Loader2 className="animate-spin" />
          <span>جاري تحميل الملف الشخصي...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (pageError && !profileData) {
    return (
      <DashboardLayout title=" الملف الشخصي" subtitle="حدثت مشكلة أثناء التحميل">
        <div
          className="profile-card"
          style={{ padding: "2rem", textAlign: "center", color: "red" }}
        >
          {pageError}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={
        <>
          <User
            style={{
              color: "var(--primary)",
              padding: "0.25rem",
              backgroundColor: "var(--primary-light)",
              borderRadius: "50%",
              marginLeft: "0.25rem",
            }}
          />{" "}
          الملف الشخصي
        </>
      }
      subtitle="معلوماتك الشخصية ونشاطك"
    >
      <div className="profile-grid">
        <motion.div
          className="profile-card"
          style={{ padding: "2rem" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-header-section">
            <div className="profile-avatar-large">
              <span>{(formData.fullName || " ").charAt(0).toUpperCase()}</span>
            </div>

            <div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700 }}>
                {formData.fullName}
              </h2>
              <p style={{ color: "var(--muted-foreground)" }}>{formData.branch}</p>
            </div>

            <div style={{ marginRight: "auto", display: "flex", gap: "0.5rem" }}>
              {editing && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={resetEditForm}
                  disabled={savingProfile}
                >
                  إلغاء
                </button>
              )}

              <button
                className={`btn ${editing ? "btn-primary" : "btn-outline"} btn-sm`}
                onClick={() => {
                  if (editing) {
                    handleSaveProfile();
                  } else {
                    setEditing(true);
                    setProfileSaved(false);
                    setPageError("");
                    setPhoneError("");
                  }
                }}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> حفظ...
                  </>
                ) : editing ? (
                  <>
                    <Save size={16} /> حفظ
                  </>
                ) : (
                  <>
                    <Edit3 size={16} /> تعديل
                  </>
                )}
              </button>
            </div>
          </div>

          {profileSaved && (
            <div
              style={{
                marginTop: "1rem",
                marginBottom: "1rem",
                color: "hsl(142, 71%, 45%)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontWeight: 600,
              }}
            >
              <CheckCircle size={16} />
              تم حفظ البيانات بنجاح
            </div>
          )}

          {pageError && (
            <div style={{ marginTop: "1rem", marginBottom: "1rem", color: "red" }}>
              {pageError}
            </div>
          )}

          <div className="profile-form">
            <div className="profile-field">
              <label className="label">
                <User
                  size={14}
                  style={{
                    display: "inline",
                    marginLeft: "0.375rem",
                    verticalAlign: "middle",
                  }}
                />
                الاسم
              </label>

              {editing ? (
                <input
                  className="input"
                  name="fullName"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              ) : (
                <p className="profile-field-value">{formData.fullName || "—"}</p>
              )}
            </div>

            <div className="profile-field">
              <label className="label">
                <Phone
                  size={14}
                  style={{
                    display: "inline",
                    marginLeft: "0.375rem",
                    verticalAlign: "middle",
                  }}
                />
                رقم الهاتف
              </label>

              {editing ? (
                <>
                  <input
                    className="input"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+970599123456"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    dir="ltr"
                    style={{ textAlign: "left" }}
                  />

                  <p
                    style={{
                      marginTop: "0.4rem",
                      fontSize: "0.78rem",
                      color: phoneError
                        ? "hsl(0, 84%, 60%)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {phoneError || "اكتبي الرقم بصيغة دولية، مثال: +970599123456"}
                  </p>
                </>
              ) : (
                <p className="profile-field-value">{formData.phone || "—"}</p>
              )}
            </div>

            <div className="profile-field">
              <label className="label">
                <Mail
                  size={14}
                  style={{
                    display: "inline",
                    marginLeft: "0.375rem",
                    verticalAlign: "middle",
                  }}
                />
                البريد الإلكتروني
              </label>
              <p className="profile-field-value">{formData.email || "—"}</p>

              <label className="label" style={{ marginTop: "1rem" }}>
                <GraduationCap
                  size={14}
                  style={{
                    display: "inline",
                    marginLeft: "0.375rem",
                    verticalAlign: "middle",
                  }}
                />
                الفرع
              </label>
              <p className="profile-field-value">{formData.branch || "—"}</p>
            </div>

            {formData.academicYear && (
              <div className="profile-field">
                <label className="label">السنة الدراسية</label>
                <p className="profile-field-value">{formData.academicYear}</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div
            className="profile-card"
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              maxHeight: "620px",
              minHeight: "260px",
            }}
          >
            <h3 className="card-title-dash" style={{ marginBottom: "1.25rem" }}>
              سجل النشاطات
            </h3>

            <div
              className="activity-timeline"
              style={{
                overflowY: "auto",
                paddingLeft: "0.35rem",
                paddingRight: "0.15rem",
                flex: 1,
                scrollbarWidth: "thin",
              }}
            >
              {activityHistory.length === 0 ? (
                <p style={{ color: "var(--muted-foreground)" }}>لا يوجد نشاطات بعد.</p>
              ) : (
                activityHistory.map((group) => (
                  <div key={group.dateLabel} className="activity-group">
                    <h4 className="activity-date">{group.dateLabel}</h4>

                    {group.items.map((item, index) => {
                      const IconComponent = activityIconMap[item.type] || BookOpen;
                      const color = colorClassMap[item.color] || "blue";

                      return (
                        <div key={`${group.dateLabel}-${index}`} className="activity-item">
                          <div className={`activity-icon rec-icon-${color}`}>
                            <IconComponent size={16} />
                          </div>

                          <div className="activity-content">
                            <p className="activity-text">{item.text}</p>
                            <span className="activity-time">{item.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="profile-card"
          style={{
            padding: "1.25rem",
            gridColumn: "1 / -1",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: showPasswordSection ? "1rem" : 0,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                width: "340px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Lock size={19} />
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    margin: 0,
                    fontFamily: "inherit",
                  }}
                >
                  تغيير كلمة المرور
                </h3>

                <p
                  style={{
                    margin: "0.2rem 0 0",
                    fontSize: "0.82rem",
                    color: "var(--muted-foreground)",
                    fontFamily: "inherit",
                  }}
                >
                  حدّث كلمة المرور الخاصة بحسابك عند الحاجة.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={
                showPasswordSection ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"
              }
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setPasswordChanged(false);
                setPasswordError("");
              }}
              style={{
                width: "320px",
                maxWidth: "100%",
                minHeight: "42px",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              {showPasswordSection ? "إلغاء" : "تغيير"}
            </button>
          </div>

          {showPasswordSection && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginTop: "0.75rem",
                maxWidth: "620px",
              }}
            >
              {[
                {
                  label: "كلمة المرور الحالية",
                  field: "currentPassword",
                  show: showCurrentPass,
                  toggle: () => setShowCurrentPass(!showCurrentPass),
                  autoComplete: "current-password",
                },
                {
                  label: "كلمة المرور الجديدة",
                  field: "newPassword",
                  show: showNewPass,
                  toggle: () => setShowNewPass(!showNewPass),
                  autoComplete: "new-password",
                },
                {
                  label: "تأكيد كلمة المرور الجديدة",
                  field: "confirmNewPassword",
                  show: showConfirmPass,
                  toggle: () => setShowConfirmPass(!showConfirmPass),
                  autoComplete: "new-password",
                },
              ].map(({ label, field, show, toggle, autoComplete }) => (
                <div key={field} className="profile-field">
                  <label className="label">{label}</label>

                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={show ? "text" : "password"}
                      value={passwordData[field]}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, [field]: e.target.value })
                      }
                      placeholder={label}
                      autoComplete={autoComplete}
                      style={{ paddingLeft: "2.5rem", width: "100%" }}
                    />

                    <button
                      type="button"
                      onClick={toggle}
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted-foreground)",
                        padding: 0,
                      }}
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {passwordData.newPassword &&
                passwordData.confirmNewPassword &&
                passwordData.newPassword !== passwordData.confirmNewPassword && (
                  <p style={{ fontSize: "0.8125rem", color: "hsl(0, 84%, 60%)" }}>
                    كلمتا المرور غير متطابقتين
                  </p>
                )}

              {passwordError && (
                <p style={{ fontSize: "0.875rem", color: "hsl(0, 84%, 60%)" }}>
                  {passwordError}
                </p>
              )}

              {passwordChanged && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "hsl(142, 71%, 45%)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle size={16} />
                  تم تغيير كلمة المرور بنجاح
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                style={{
                  width: "100%",
                  minHeight: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1.1rem",
                  fontWeight: 700,
                }}
                disabled={
                  changingPassword ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmNewPassword ||
                  passwordData.newPassword !== passwordData.confirmNewPassword
                }
                onClick={handleChangePassword}
              >
                {changingPassword ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save size={14} /> حفظ كلمة المرور
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          className="profile-card"
          style={{
            padding: "1.5rem",
            gridColumn: "1 / -1",
            border: "2.5px solid hsl(0, 84%, 60%)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "hsl(0, 84%, 60%)",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertTriangle size={18} />
                منطقة الخطر
              </h3>

              <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                حذف الحساب سيؤدي إلى مسح كافة بياناتك نهائياً.
              </p>
            </div>

            <button
              className="btn btn-sm"
              style={{
                background: "hsl(0, 84%, 60%)",
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} /> حذف الحساب
            </button>
          </div>
        </motion.div>
      </div>

      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "hsla(0,0%,0%,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <motion.div
            className="profile-card"
            style={{
              padding: "2rem",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "50%",
                background: "hsla(0,84%,60%,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <AlertTriangle size={28} style={{ color: "hsl(0, 84%, 60%)" }} />
            </div>

            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              هل أنت متأكد؟
            </h3>

            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                marginBottom: "1.5rem",
                lineHeight: 1.7,
              }}
            >
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                إلغاء
              </button>

              <button
                className="btn btn-sm"
                style={{
                  background: "hsl(0, 84%, 60%)",
                  color: "white",
                  border: "none",
                }}
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> تأكيد الحذف
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;