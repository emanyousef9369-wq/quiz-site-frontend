import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CreateQuiz.css";

const API_BASE_URL = "http://localhost:5000/api"; 

function CreateQuiz() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("JavaScript");
  const [duration, setDuration] = useState(20);

  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filterTopic, setFilterTopic] = useState("All Topics");
  const [filterDifficulty, setFilterDifficulty] = useState("All Difficulty");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/questions`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch questions from server");
      const data = await response.json();
      
      const fetchedQuestions = Array.isArray(data) 
        ? data 
        : data.questions || data.data || [];

      setAllQuestions(fetchedQuestions);
    } catch (error) {
      console.error("Server Error:", error);
      alert("Failed to load questions from server.");
      setAllQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (question) => {
    const qId = question._id || question.id;
    const isSelected = selectedQuestions.some((q) => (q._id || q.id) === qId);
    
    if (isSelected) {
      setSelectedQuestions(selectedQuestions.filter((q) => (q._id || q.id) !== qId));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };


  const filteredQuestions = (allQuestions || []).filter((q) => {
    if (!q) return false;

    const qTopic = q.topic || "General";
    const qDiff = q.difficulty || "Easy";
    const questionText = q.question || q.statement || q.title || "";

    const matchesTopic = filterTopic === "All Topics" || qTopic === filterTopic;
    const matchesDiff =
      filterDifficulty === "All Difficulty" ||
      qDiff.toLowerCase() === filterDifficulty.toLowerCase();
      
    const matchesSearch = questionText.toLowerCase().includes((searchTerm || "").toLowerCase());

    return matchesTopic && matchesDiff && matchesSearch;
  });


const handlePublish = async () => {
  if (!title.trim()) {
    alert("Please enter a quiz title.");
    return;
  }
  if (selectedQuestions.length === 0) {
    alert("Please select at least one question.");
    return;
  }

  const quizPayload = {
    title,
    description: `${topic} Quiz`,
 
    questions: selectedQuestions.map((q) => ({
      questionId: q._id || q.id,
    })),
  };

  setIsSubmitting(true);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(quizPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      alert(`Server Error: ${errorData.message || "Failed to create quiz"}`);
      return;
    }

    alert("Quiz Published Successfully!");
    navigate("/question-bank");
  } catch (error) {
    console.error("Network Error:", error);
    alert("Failed to connect to server.");
  } finally {
    setIsSubmitting(false);
  }
};

  const topicsList = [
    "All Topics", 
    ...new Set((allQuestions || []).map((q) => q?.topic).filter(Boolean))
  ];

  return (
    <div className="create-quiz-page">
      {/* Sidebar */}
      <aside className="qb-sidebar">
        <div className="qb-logo">🎓 <span>Quiz Platform</span></div>
        <nav>
          <Link to="/create-quiz" className="qb-nav-item active">◉ <span>Create Quiz</span></Link>
          <Link to="/question-bank" className="qb-nav-item">▣ <span>Question Bank</span></Link>
          <Link to="/login" className="qb-nav-item logout">⇥ <span>Logout</span></Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="cq-main">
        <div className="cq-header">
          <h1>Create Quiz</h1>
          <p>Build a quiz by selecting questions from the question bank.</p>
        </div>

        <div className="cq-container">
          <div className="cq-left-panel">
            {/* Step 1 */}
            <section className="cq-card">
              <div className="step-title">
                <span className="step-number">1</span>
                <h3>Quiz Details</h3>
              </div>
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Quiz Title</label>
                  <input
                    type="text"
                    placeholder="e.g. JavaScript Basics Quiz"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Topic</label>
                  <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="JavaScript">JavaScript</option>
                    <option value="React">React</option>
                    <option value="Frontend">Frontend</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section className="cq-card">
              <div className="step-title">
                <span className="step-number">2</span>
                <h3>Select Questions</h3>
              </div>

              <div className="cq-table-filters">
                <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
                  {topicsList.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>

                <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                  <option value="All Difficulty">All Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <div className="cq-search-box">
                  🔍 <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="cq-table">
                <div className="cq-table-header">
                  <span className="col-check"></span>
                  <span className="col-q">Question</span>
                  <span className="col-diff">Difficulty</span>
                  <span className="col-tags">Tags</span>
                </div>

                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center" }}>Loading questions...</div>
                ) : filteredQuestions.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center" }}>No questions found.</div>
                ) : (
                  filteredQuestions.map((q, index) => {
                    const qId = q._id || q.id || index;
                    const isChecked = selectedQuestions.some((sq) => (sq._id || sq.id) === qId);
                    const questionText = q.question || q.statement || q.title || "Untitled Question";
                    const difficultyText = q.difficulty || "Medium";
                    const tagsText = Array.isArray(q.tags) ? q.tags.join(", ") : (q.tags || "-");

                    return (
                      <div key={qId} className={`cq-table-row ${isChecked ? "selected" : ""}`}>
                        <span className="col-check">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleQuestionSelection(q)}
                          />
                        </span>
                        <span className="col-q">{questionText}</span>
                        <span className="col-diff">
                          <span className={`difficulty ${difficultyText.toLowerCase()}`}>
                            {difficultyText}
                          </span>
                        </span>
                        <span className="col-tags">{tagsText}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Right Summary Sidebar */}
          <div className="cq-right-panel">
            <div className="cq-summary-card">
              <h4>Selected Questions ({selectedQuestions.length})</h4>
              <ol className="selected-list">
                {selectedQuestions.map((sq, index) => (
                  <li key={sq._id || sq.id || index}>
                    <span>{sq.question || sq.statement || sq.title}</span>
                    <button className="remove-btn" onClick={() => toggleQuestionSelection(sq)}>✕</button>
                  </li>
                ))}
              </ol>
              <button 
                className="publish-btn" 
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Publishing..." : "Review & Publish"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateQuiz;