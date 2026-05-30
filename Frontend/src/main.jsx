import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./styles/global.css";
import { GOOGLE_CLIENT_ID } from "./config/google.js";

if (!GOOGLE_CLIENT_ID) {
  console.error("VITE_GOOGLE_CLIENT_ID is missing from .env file");
}

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
