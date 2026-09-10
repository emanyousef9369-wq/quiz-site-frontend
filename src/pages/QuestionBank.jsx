import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuestionBank.css";

const API_BASE_URL = "http://localhost:5000/api";

function QuestionBank() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All Difficulty");
  const [selectedTag, setSelectedTag] = useState("All Tags");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    question: "",
    options: "",
    correctAnswer: "",
    topic: "",
    difficulty: "Easy",
    tags: "",
  });

  useEffect(() => {
    getQuestions();
  }, []);

  const getQuestions = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/questions`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();

      const fetchedQuestions = Array.isArray(data)
        ? data
        : data.questions || data.data || [];

      const mappedQuestions = fetchedQuestions.map((q) => ({
        ...q,
        question: q.question || q.statement || "",
        correctAnswer: q.correctAnswer || q.answer || "",
        options: q.options || q.choices || [],
      }));

      setQuestions(mappedQuestions);
    } catch (err) {
      console.warn("Server error fetching questions:", err);
      setError("Failed to fetch questions from server.");
    } finally {
      setLoading(false);
    }
  };

  const getCleanUserId = () => {
    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) return null;

    try {
      const parsed = JSON.parse(storedUserRaw);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed.userId || parsed._id || parsed.id || null;
      }
      if (typeof parsed === "string") return parsed;
    } catch {
      return storedUserRaw;
    }
    return null;
  };

  const openAddModal = () => {
    setFormData({
      question: "",
      options: "",
      correctAnswer: "",
      topic: "General",
      difficulty: "Easy",
      tags: "",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNewQuestion = async (e) => {
    e.preventDefault();
    if (!formData.question.trim()) return;

    let choicesList = formData.options.split(",").map((opt) => opt.trim()).filter(Boolean);
    let cleanCorrect = formData.correctAnswer.trim();

    if (cleanCorrect && !choicesList.includes(cleanCorrect)) {
      choicesList.push(cleanCorrect);
    }

    if (choicesList.length < 2) {
      choicesList.push("Option 2");
    }

    const tagsList = formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : ["Custom"];
    const userId = getCleanUserId();

    const newObj = {
      statement: formData.question.trim(),
      question: formData.question.trim(),
      choices: choicesList,
      options: choicesList,
      correctAnswer: cleanCorrect || choicesList[0],
      answer: cleanCorrect || choicesList[0],
      topic: formData.topic || "General",
      difficulty: formData.difficulty || "Easy",
      tags: tagsList,
    };

    if (userId) newObj.createdBy = userId;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newObj),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save: ${response.status}`);
      }

      await getQuestions();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Server POST failed:", err);
      alert(`Error saving question: ${err.message}`);
    }
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);

    const rawOpts = q.choices || q.options || [];
    const cleanOptsList = Array.isArray(rawOpts)
      ? rawOpts.map((opt) => String(opt).trim()).filter(Boolean)
      : [];

    const rawAnswer = String(q.correctAnswer || q.answer || "").trim();

    setFormData({
      question: q.question || q.statement || "",
      options: cleanOptsList.join(", "),
      correctAnswer: rawAnswer,
      topic: q.topic || "General",
      difficulty: q.difficulty || "Easy",
      tags: q.tags ? q.tags.join(", ") : "",
    });

    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    const targetId = editingQuestion?._id || editingQuestion?.id;
    if (!targetId) {
      alert("Error: Question ID not found!");
      return;
    }

    // 1. معالجة وتجهيز مصفوفة الخيارات
    const choicesArray = formData.options
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    // 2. تنظيف الإجابة المحددة ومطابقتها مع الخيارات
    let selectedAnswer = (formData.correctAnswer || "").trim();

    const matchedChoice = choicesArray.find(
      (c) => c.toLowerCase() === selectedAnswer.toLowerCase()
    );

    if (matchedChoice) {
      selectedAnswer = matchedChoice;
    } else if (choicesArray.length > 0) {
      selectedAnswer = choicesArray[0];
    }

    // 3. تجهيز الـ Payload المقبول للـ API
    const payload = {
      statement: formData.question.trim(),
      question: formData.question.trim(),
      choices: choicesArray,
      options: choicesArray,
      correctAnswer: selectedAnswer,
      answer: selectedAnswer,
      topic: formData.topic || "General",
      difficulty: formData.difficulty || "Easy",
      tags: typeof formData.tags === "string"
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : formData.tags || [],
    };

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/questions/${targetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      await getQuestions();
      setIsEditModalOpen(false);
      setEditingQuestion(null);
      alert("Question updated successfully!");
    } catch (err) {
      console.error("Update Error:", err.message);
      alert(`Update Failed: ${err.message}`);
    }
  };

  const openDeleteModal = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/questions/${deletingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete from server");

      setQuestions((prev) => prev.filter((q) => (q._id || q.id) !== deletingId));
    } catch (err) {
      console.error("Server DELETE failed:", err);
      alert("Failed to delete question from server.");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const availableTopics = ["All Topics", ...new Set(questions.map((q) => q.topic).filter(Boolean))];
  const availableDifficulties = ["All Difficulty", "Easy", "Medium", "Hard"];
  const availableTags = ["All Tags", ...new Set(questions.flatMap((q) => q.tags || []))];

  const filteredQuestions = questions.filter((q) => {
    const qText = q.question || q.statement || "";
    const matchesSearch = qText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === "All Topics" || q.topic === selectedTopic;
    const matchesDifficulty =
      selectedDifficulty === "All Difficulty" ||
      q.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchesTag = selectedTag === "All Tags" || q.tags?.includes(selectedTag);

    return matchesSearch && matchesTopic && matchesDifficulty && matchesTag;
  });

  const currentOptionsList = formData.options
    .split(",")
    .map((opt) => opt.trim())
    .filter(Boolean);

  return (
    <div className="question-bank-page">
      <aside className="qb-sidebar">
        <div className="qb-logo">
          🎓 <span>Quiz Platform</span>
        </div>
        <nav>
          <a href="/create-quiz" className="qb-nav-item">
            ◉ <span>Create Quiz</span>
          </a>
          <a href="/question-bank" className="qb-nav-item active">
            ▣ <span>Question Bank</span>
          </a>
          <a href="/login" className="qb-nav-item logout">
            ⇥ <span>Logout</span>
          </a>
        </nav>
      </aside>

      <main className="qb-main">
        <div className="qb-header">
          <h1>Question Bank</h1>
          <p>Manage and organize your questions.</p>
        </div>

        <div className="qb-filters">
          <div className="search-box">
            🔍
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
            {availableTopics.map((topic, index) => (
              <option key={index} value={topic}>{topic}</option>
            ))}
          </select>

          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            {availableDifficulties.map((diff, index) => (
              <option key={index} value={diff}>{diff}</option>
            ))}
          </select>

          <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
            {availableTags.map((tag, index) => (
              <option key={index} value={tag}>{tag}</option>
            ))}
          </select>

          <button className="add-question" onClick={openAddModal}>
            + Add Question
          </button>
        </div>

        <div className="questions-table">
          <div className="table-header">
            <span>Question</span>
            <span>Answer</span>
            <span>Topic</span>
            <span>Difficulty</span>
            <span>Tags</span>
            <span>Actions</span>
          </div>

          {loading && <div className="table-message">Loading questions...</div>}
          {error && <div className="table-message error">{error}</div>}
          {!loading && !error && filteredQuestions.length === 0 && (
            <div className="table-message">No questions found.</div>
          )}

          {!loading &&
            !error &&
            filteredQuestions.map((question) => {
              const qId = question._id || question.id;
              return (
                <div className="table-row" key={qId}>
                  <span className="question-text">{question.question || question.statement}</span>
                  <span className="answer-text">
                    {question.correctAnswer || question.answer || "-"}
                  </span>
                  <span>{question.topic}</span>
                  <span>
                    <span className={`difficulty ${question.difficulty?.toLowerCase()}`}>
                      {question.difficulty}
                    </span>
                  </span>
                  <span>{question.tags?.join(", ")}</span>
                  <span className="actions">
                    <span onClick={() => openEditModal(question)} style={{ cursor: "pointer", marginRight: "10px" }} title="Edit">
                      ✎
                    </span>
                    <span onClick={() => openDeleteModal(qId)} style={{ cursor: "pointer" }} title="Delete">
                      🗑
                    </span>
                  </span>
                </div>
              );
            })}
        </div>
      </main>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>{isAddModalOpen ? "Add New Question" : "Edit Question"}</h2>
            <form onSubmit={isAddModalOpen ? handleSaveNewQuestion : handleSaveEdit}>
              <div className="modal-field">
                <label>Question Text</label>
                <input
                  type="text"
                  required
                  placeholder="Enter question text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Choices (comma separated)</label>
                <input
                  type="text"
                  placeholder="Option A, Option B, Option C"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Correct Answer</label>
                {currentOptionsList.length > 0 ? (
                  <select
                    required
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  >
                    <option value="">-- Select Correct Answer --</option>
                    {currentOptionsList.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter correct answer"
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  />
                )}
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. React, JS"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  />
                </div>
                <div className="modal-field">
                  <label>Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. JS, React"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {isAddModalOpen ? "Add Question" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card small">
            <h2>Delete Question</h2>
            <p>Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionBank;