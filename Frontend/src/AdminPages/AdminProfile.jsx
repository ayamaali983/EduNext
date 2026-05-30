import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
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
  RefreshCw,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config/api";

const PROFILE_ENDPOINT = `${API_BASE_URL}/api/admin/profile`;
const CHANGE_PASSWORD_ENDPOINT = `${API_BASE_URL}/api/admin/profile/change-password`;

const activityIconMap = {
  lesson: BookOpen,
  exam: Star,
  achievement: Trophy,
  admin: ShieldCheck,
};

const colorClassMap = {
  blue: "blue",
  amber: "amber",
  green: "green",
  purple: "purple",
};

const normalizeProfile = (data) => ({
  id: data?.id || data?.Id || "",
  fullName: data?.fullName || data?.FullName || "",
  email: data?.email || data?.Email || "",
  phone: data?.phone || data?.Phone || "",
  role: data?.role || data?.Role || "admin",
  roleLabel: data?.roleLabel || data?.RoleLabel || "مسؤول",
  activityHistory: (data?.activityHistory || data?.ActivityHistory || []).map(
    (group) => ({
      dateLabel: group.dateLabel || group.DateLabel || "",
      items: (group.items || group.Items || []).map((item) => ({
        type: item.type || item.Type || "admin",
        text: item.text || item.Text || "",
        time: item.time || item.Time || "",
        color: item.color || item.Color || "purple",
      })),
    })
  ),
});

const readResponseBody = async (response) => {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

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
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const activityHistory = useMemo(() => {
    return profileData?.activityHistory || [];
  }, [profileData]);

  const fetchProfile = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const response = await fetch(PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readResponseBody(response);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        setPageError(data?.message || "فشل تحميل الملف الشخصي");
        setProfileData(null);
        return;
      }

      const normalized = normalizeProfile(data);

      setProfileData(normalized);

      setFormData({
        fullName: normalized.fullName || "",
        email: normalized.email || "",
        phone: normalized.phone || "",
      });
    } catch (err) {
      console.error(err);
      setPageError("تعذر الاتصال بالسيرفر");
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      setPageError("الاسم مطلوب.");
      return;
    }

    try {
      setSavingProfile(true);
      setPageError("");
      setProfileSaved(false);

      const response = await fetch(PROFILE_ENDPOINT, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone?.trim() || "",
        }),
      });

      const data = await readResponseBody(response);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        setPageError(data?.message || "فشل تحديث البيانات");
        return;
      }

      const updated = normalizeProfile(data || {});

      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              fullName: updated.fullName || formData.fullName.trim(),
              phone: updated.phone || formData.phone,
            }
          : prev
      );

      setFormData((prev) => ({
        ...prev,
        fullName: updated.fullName || formData.fullName.trim(),
        phone: updated.phone || formData.phone,
      }));

      localStorage.setItem(
        "fullName",
        updated.fullName || formData.fullName.trim()
      );

      setEditing(false);
      setProfileSaved(true);

      setTimeout(() => {
        setProfileSaved(false);
      }, 2200);
    } catch (err) {
      console.error(err);
      setPageError("تعذر الاتصال بالسيرفر");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setFormData({
        fullName: profileData.fullName || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
      });
    }

    setEditing(false);
    setPageError("");
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      setPasswordError("كلمة المرور الحالية مطلوبة.");
      return;
    }

    if (!passwordData.newPassword) {
      setPasswordError("كلمة المرور الجديدة مطلوبة.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError("كلمتا المرور غير متطابقتين.");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError("");
      setPasswordChanged(false);

      const response = await fetch(CHANGE_PASSWORD_ENDPOINT, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(passwordData),
      });

      const data = await readResponseBody(response);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
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
      }, 1600);
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
      setPageError("");

      const response = await fetch(PROFILE_ENDPOINT, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readResponseBody(response);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
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
        title="👤 الملف الشخصي"
        subtitle="جاري تحميل بياناتك"
        fullName={profileData?.fullName}
      >
        <div
          className="card"
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
      <DashboardLayout
        title="👤 الملف الشخصي"
        subtitle="حدثت مشكلة أثناء التحميل"
      >
        <div
          className="card"
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "hsl(0, 84%, 60%)",
          }}
        >
          <p style={{ marginBottom: "1rem", fontWeight: 700 }}>{pageError}</p>

          <button
            className="btn btn-primary btn-sm"
            onClick={fetchProfile}
            style={{
              width: "fit-content",
              minWidth: "180px",
              margin: "0 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="الملف الشخصي" subtitle="معلوماتك الشخصية ونشاطك" titleIcon={User}>
      <div className="profile-grid">
        <motion.div
          className="card"
          style={{ padding: "2rem" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-header-section">
            <div className="profile-avatar-large">
              <span>{(formData.fullName || "A").charAt(0).toUpperCase()}</span>
            </div>

            <div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700 }}>
                {formData.fullName || "مسؤول النظام"}
              </h2>

              <p
                style={{
                  color: "var(--muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  marginTop: "0.25rem",
                }}
              >
                <ShieldCheck size={15} />
                {profileData?.roleLabel || "مسؤول"}
              </p>
            </div>

            <div
              style={{
                marginRight: "auto",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {editing && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                >
                  إلغاء
                </button>
              )}

              <button
                className={`btn ${
                  editing ? "btn-primary" : "btn-outline"
                } btn-sm`}
                onClick={() => {
                  if (editing) {
                    handleSaveProfile();
                  } else {
                    setEditing(true);
                    setPageError("");
                    setProfileSaved(false);
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
            <div
              style={{
                marginTop: "1rem",
                marginBottom: "1rem",
                color: "hsl(0, 84%, 60%)",
                fontWeight: 600,
              }}
            >
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
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              ) : (
                <p className="profile-field-value">
                  {formData.fullName || "—"}
                </p>
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
                <input
                  className="input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="مثال: 0590000000"
                />
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
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3
              className="card-title-dash"
              style={{
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ScrollText size={18} />
              سجل النشاطات
            </h3>

            <div
              className="activity-timeline"
              style={{
                maxHeight: "260px",
                overflowY: "auto",
                paddingLeft: "6px",
                paddingRight: "2px",
              }}
            >
              {activityHistory.length === 0 ? (
                <p style={{ color: "var(--muted-foreground)" }}>
                  لا يوجد نشاطات بعد.
                </p>
              ) : (
                activityHistory.map((group) => (
                  <div key={group.dateLabel} className="activity-group">
                    <h4 className="activity-date">{group.dateLabel}</h4>

                    {group.items.map((item, index) => {
                      const IconComponent =
                        activityIconMap[item.type] || ShieldCheck;
                      const color = colorClassMap[item.color] || "purple";

                      return (
                        <div key={index} className="activity-item">
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
          className="card"
          style={{ padding: "1.5rem", gridColumn: "1 / -1" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: showPasswordSection ? "1.25rem" : 0,
              gap: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Lock size={18} style={{ color: "var(--primary)" }} />
              تغيير كلمة المرور
            </h3>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setPasswordChanged(false);
                setPasswordError("");
              }}
              style={{
                width: "fit-content",
                minWidth: "96px",
                justifyContent: "center",
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
                maxWidth: "430px",
              }}
            >
              {[
                {
                  label: "كلمة المرور الحالية",
                  field: "currentPassword",
                  show: showCurrentPass,
                  toggle: () => setShowCurrentPass(!showCurrentPass),
                },
                {
                  label: "كلمة المرور الجديدة",
                  field: "newPassword",
                  show: showNewPass,
                  toggle: () => setShowNewPass(!showNewPass),
                },
                {
                  label: "تأكيد كلمة المرور الجديدة",
                  field: "confirmNewPassword",
                  show: showConfirmPass,
                  toggle: () => setShowConfirmPass(!showConfirmPass),
                },
              ].map(({ label, field, show, toggle }) => (
                <div key={field} className="profile-field">
                  <label className="label">{label}</label>

                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={show ? "text" : "password"}
                      value={passwordData[field]}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          [field]: e.target.value,
                        })
                      }
                      placeholder={label}
                      style={{ paddingLeft: "2.5rem" }}
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
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "hsl(0, 84%, 60%)",
                    }}
                  >
                    كلمتا المرور غير متطابقتين
                  </p>
                )}

              {passwordError && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "hsl(0, 84%, 60%)",
                  }}
                >
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
                  width: "fit-content",
                  minWidth: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
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
          className="card"
          style={{
            padding: "1.5rem",
            gridColumn: "1 / -1",
            borderColor: "hsl(0, 84%, 60%)",
            borderWidth: "1px",
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

              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--muted-foreground)",
                }}
              >
                حذف الحساب سيؤدي إلى تعطيل حسابك أو حذف بياناتك حسب إعدادات
                النظام.
              </p>
            </div>

            <button
              className="btn btn-sm"
              style={{
                background: "hsl(0, 84%, 60%)",
                color: "white",
                border: "none",
                width: "fit-content",
                minWidth: "130px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            className="card"
            style={{
              padding: "2rem",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
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
              هذا الإجراء حساس. سيتم حذف أو تعطيل الحساب حسب منطق الباك إند.
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
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
                    <Loader2 size={14} className="animate-spin" /> جاري
                    التنفيذ...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> تأكيد
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
