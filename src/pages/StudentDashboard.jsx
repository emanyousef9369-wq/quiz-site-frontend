import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

function StudentDashboard() {
  const [userName, setUserName] = useState("Student");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.username) setUserName(user.username);
        else if (user.name) setUserName(user.name);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }


    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5000/api/quizzes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
       
          const fetchedQuizzes = Array.isArray(result)
            ? result
            : result.data || result.quizzes || [];

          setQuizzes(fetchedQuizzes);
        } else {
          console.error("Backend error fetching quizzes:", result.message);
          setQuizzes([]);
        }
      } catch (error) {
        console.error("Server connection failed:", error);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  return (
    <div className="student-dashboard-page">
      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-logo">
          🎓 <span>Quiz Platform</span>
        </div>
        <nav>
          <Link to="/student-dashboard" className="sd-nav-item active">
            ◉ <span>My Quizzes</span>
          </Link>
          <Link to="/my-results" className="sd-nav-item">
            ▤ <span>My Results</span>
          </Link>
          <Link to="/login" className="sd-nav-item logout">
            ⇥ <span>Logout</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="sd-main">
        <div className="sd-header">
          <h2>Hello, {userName}! 👋</h2>
          <p>Let's continue learning today.</p>
        </div>

        <div className="sd-content-grid">
          <div className="sd-left-col">
            {/* Available Quizzes Section */}
            <div className="sd-card">
              <div className="sd-card-header">
                <h3>Available Quizzes</h3>
                <Link to="/student-dashboard" className="view-all">
                  View All
                </Link>
              </div>

              <div className="quiz-list">
                {loading ? (
                  <p style={{ color: "#6b7280", fontSize: "14px", padding: "10px" }}>
                    Loading quizzes from server...
                  </p>
                ) : quizzes.length === 0 ? (
                  <p style={{ color: "#6b7280", fontSize: "14px", padding: "10px" }}>
                    No quizzes created by lecturer yet.
                  </p>
                ) : (
                  quizzes.map((quiz) => {
                    const quizId = quiz._id || quiz.id;
                    return (
                      <div className="quiz-item" key={quizId}>
                        <div className="quiz-info">
                          <span className="quiz-icon green">📝</span>
                          <div>
                            <h4>{quiz.title}</h4>
                            <p>
                              {quiz.questionCount || quiz.questions?.length || 0} Questions • {quiz.duration || 20} Minutes
                            </p>
                          </div>
                        </div>

                        <button
                          className="start-btn"
                          onClick={() => navigate(`/take-quiz/${quizId}`)}
                        >
                          Start Quiz
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;