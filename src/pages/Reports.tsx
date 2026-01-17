import { Navigate } from "react-router-dom";

export default function Reports() {
  // Legacy SEO reports page (table: `reports`) has been deprecated.
  // Redirect to the new Backlink Reports experience.
  return <Navigate to="/backlink-reports" replace />;
}
