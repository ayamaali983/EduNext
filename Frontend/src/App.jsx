import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ExamRecordsProvider } from "./context/ExamRecordsContext.jsx";

const Login = lazy(() => import("./AdminPages/Login.jsx"));
const Register = lazy(() => import("./AdminPages/Register.jsx"));

const OnboardingStep1 = lazy(() => import("./pages/OnboardingStep1.jsx"));
const OnboardingStep2 = lazy(() => import("./pages/OnboardingStep2.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Subjects = lazy(() => import("./pages/Subjects.jsx"));
const Exams = lazy(() => import("./pages/Exams.jsx"));
const ExamCreate = lazy(() => import("./pages/ExamCreate.jsx"));
const ExamTake = lazy(() => import("./pages/ExamTake.jsx"));
const StudyPlans = lazy(() => import("./pages/StudyPlans.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const Achievements = lazy(() => import("./pages/Achievements.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const MainDashboard = lazy(() => import("./AdminPages/MainDashboard.jsx"));
const Home = lazy(() => import("./AdminPages/Home"));
const AdminSubjects = lazy(() => import("./AdminPages/AdminSubjects"));
const AdminLessons = lazy(() => import("./AdminPages/AdminLessons"));
const AdminExams = lazy(() => import("./AdminPages/AdminExams"));
const AdminUsers = lazy(() => import("./AdminPages/AdminUsers"));
const AdminAnalytics = lazy(() => import("./AdminPages/AdminAnalytics"));
const AdminAchievements = lazy(() => import("./AdminPages/AdminAchievements"));
const AdminProfile = lazy(() => import("./AdminPages/AdminProfile.jsx"));

import {
  GuestOnlyRoute,
  StudentRoute,
  OnboardingRoute,
  AdminRoute,
} from "./routes/ProtectedRoute.jsx";

const App = () => (
  <BrowserRouter>
    <ExamRecordsProvider>
      <Suspense fallback={<div className="page-loading">جاري التحميل...</div>}>
        <Routes>
          <Route element={<GuestOnlyRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding/1" element={<OnboardingStep1 />} />
            <Route path="/onboarding/2" element={<OnboardingStep2 />} />
          </Route>

          <Route element={<StudentRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/exams/new" element={<ExamCreate />} />
            <Route path="/exams/take" element={<ExamTake />} />
            <Route path="/plans" element={<StudyPlans />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin-dashboard" element={<MainDashboard />} />
            <Route path="/admin-subjects" element={<AdminSubjects />} />
            <Route path="/admin-lessons" element={<AdminLessons />} />
            <Route path="/admin-exams" element={<AdminExams />} />
            <Route path="/admin-users" element={<AdminUsers />} />
            <Route path="/admin-analytics" element={<AdminAnalytics />} />
            <Route path="/admin-achievements" element={<AdminAchievements />} />
            <Route path="/admin-profile" element={<AdminProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ExamRecordsProvider>
  </BrowserRouter>
);

export default App;
