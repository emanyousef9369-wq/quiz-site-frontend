import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MyResults.css";

function MyResults() {
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/results", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (response.ok && result.data) {
          setResults(result.data);
        } else {
          setError(result.message || "Failed to fetch results.");
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);


  const handleDeleteResult = async (id) => {
    if (!window.confirm("Are you sure you want to delete this result?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/results/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
     
        setResults((prevResults) => prevResults.filter((res) => (res._id || res.id) !== id));
        if (selectedResult && (selectedResult._id || selectedResult.id) === id) {
          setSelectedResult(null);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to delete result.");
      }
    } catch (err) {
      console.error("Error deleting result:", err);
      alert("Server error. Could not delete result.");
    }
  };

  return (
    <div className="results-container">
      {/* Sidebar */}
      <aside className="results-sidebar">
        <div className="results-logo">
          🎓 <span>Quiz Platform</span>
        </div>

        <nav className="results-nav">
          <Link to="/student-dashboard" className="results-nav-item">
            ◉ <span>My Quizzes</span>
          </Link>
          <Link to="/my-results" className="results-nav-item active">
            ▤ <span>My Results</span>
          </Link>
          <Link to="/login" className="results-nav-item logout">
            ⇥ <span>Logout</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="results-main">
        <div className="results-header">
          <h1>My Results</h1>
          <p>Track your quiz performance.</p>
        </div>

        <div className="results-card">
          {loading ? (
            <div className="no-data" style={{ padding: "2rem" }}>Loading results...</div>
          ) : error ? (
            <div className="no-data" style={{ color: "red", padding: "2rem" }}>{error}</div>
          ) : (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res._id || res.id}>
                      <td className="font-bold">{res.quizTitle || res.title}</td>
                      <td className="text-muted">{res.date}</td>
                      <td className={`score-cell ${res.score >= 50 ? "score-pass" : "score-fail"}`}>
                        {res.score}%
                      </td>
                      <td className="text-muted">{res.correct}</td>
                      <td className="text-muted">{res.wrong}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn-action btn-view" onClick={() => setSelectedResult(res)}>
                          View
                        </button>
                        <button className="btn-action btn-delete" onClick={() => handleDeleteResult(res._id || res.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for viewing detailed results */}
        {selectedResult && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <button className="btn-back" onClick={() => setSelectedResult(null)}>
                  ← Back
                </button>
                <h3>{selectedResult.quizTitle || selectedResult.title}</h3>
                <span className="modal-date">{selectedResult.date}</span>
              </div>

              <div className="modal-body">
                <div className="stats-grid">
                  <div className="stat-card">
                    <h2 className="text-indigo">{selectedResult.score}%</h2>
                    <span className="stat-label">{selectedResult.score >= 50 ? "Good" : "Needs Work"}</span>
                  </div>
                  <div className="stat-card">
                    <h2 className="text-green">{selectedResult.correct}</h2>
                    <span className="stat-label">Correct</span>
                  </div>
                  <div className="stat-card">
                    <h2 className="text-red">{selectedResult.wrong}</h2>
                    <span className="stat-label">Wrong</span>
                  </div>
                  <div className="stat-card">
                    <h2 className="text-blue">
                      {selectedResult.totalQuestions || selectedResult.correct + selectedResult.wrong}
                    </h2>
                    <span className="stat-label">Total Questions</span>
                  </div>
                </div>

                <h4 className="section-title">Questions Review</h4>
                <div className="questions-list">
                  {selectedResult.details && selectedResult.details.length > 0 ? (
                    selectedResult.details.map((q, idx) => (
                      <div
                        key={idx}
                        className={`question-item ${q.isCorrect ? "border-green" : "border-red"}`}
                      >
                        <h5>
                          {idx + 1}. {q.question}
                        </h5>
                        <p className={q.isCorrect ? "text-green" : "text-red"}>
                          <strong>Your Answer:</strong> {q.userAnswer} {q.isCorrect ? "✓" : "✗"}
                        </p>
                        {!q.isCorrect && (
                          <p className="text-green">
                            <strong>Correct Answer:</strong> {q.correctAnswer}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No detailed breakdown available for this quiz.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyResults;