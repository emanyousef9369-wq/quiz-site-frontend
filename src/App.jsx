import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import SignUp from "./pages/SignUp";


import QuestionBank from "./pages/QuestionBank";
import CreateQuiz from "./pages/CreateQuiz";
import StudentDashboard from "./pages/StudentDashboard";

import TakeQuiz from "./pages/TakeQuiz";
import MyResults from "./pages/MyResults";
function App() {
  return (
    <Routes>

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />}/>

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Register */}
      <Route path="/SignUp" element={<SignUp />} />

     

   
     {/* QuestionBank */}
      <Route path="/question-bank" element={<QuestionBank />}/>

     {/* CreateQuiz */}
    <Route path="/create-quiz" element={<CreateQuiz />} />

    {/* StudentDashboard */}
    <Route path="/student-dashboard" element={<StudentDashboard />} />

    <Route path="/take-quiz/:quizId" element={<TakeQuiz />} />

    <Route path="/my-results" element={<MyResults />} />
      {/* Any wrong URL */}
      <Route path="*" element={<Navigate to="/login" replace />}/>

    </Routes>
  );
}

export default App;