import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import mockData from "../mockdata.json";
import "./TakeQuiz.css";

function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200);


  
  const loadLocalQuizData = () => {
    const savedQuizzes = JSON.parse(localStorage.getItem("my_quizzes")) || mockData.quizzes || [];
    const currentQuiz = savedQuizzes.find((q) => String(q._id || q.id) === String(quizId));

    const localQuestions = JSON.parse(localStorage.getItem("my_questions")) || [];
    const mockQuestions = mockData.questions || [];

    const allBankQuestionsMap = new Map();
    [...mockQuestions, ...localQuestions].forEach((q) => {
      allBankQuestionsMap.set(String(q._id || q.id), q);
    });
    const allBankQuestions = Array.from(allBankQuestionsMap.values());

    if (currentQuiz) {
      setQuiz(currentQuiz);
      if (currentQuiz.duration) {
        setTimeLeft(currentQuiz.duration * 60);
      }

      if (currentQuiz.questions && currentQuiz.questions.length > 0) {
        const matchedQuestions = allBankQuestions.filter((q) =>
          currentQuiz.questions.some((qId) => String(qId) === String(q._id || q.id))
        );
        setQuestions(matchedQuestions.length > 0 ? matchedQuestions : allBankQuestions);
      } else {
        setQuestions(allBankQuestions);
      }
    }
  };


  
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (response.ok && result.data) {
          const fetchedQuiz = result.data;
          setQuiz(fetchedQuiz);

          if (fetchedQuiz.duration) {
            setTimeLeft(fetchedQuiz.duration * 60);
          }

          if (Array.isArray(fetchedQuiz.questions)) {
            setQuestions(fetchedQuiz.questions);
          }
        } else {
          console.warn("Backend error, falling back to local quiz data:", result.message);
          loadLocalQuizData();
        }
      } catch (error) {
        console.warn("Server unavailable. Loading local quiz data.");
        loadLocalQuizData();
      }
    };

    fetchQuizDetails();
  }, [quizId]);


  
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSelectOption = (questionId, option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: option,
    });
  };


  
  const handleLocalSubmit = () => {
    let correctCount = 0;

    const details = questions.map((q) => {
      const qId = q._id || q.id;
      const studentChoice = selectedAnswers[qId] || "No answer";
      const rightAnswer = q.correctAnswer || q.answer || "";
      const isCorrect = studentChoice.trim().toLowerCase() === rightAnswer.trim().toLowerCase();

      if (isCorrect) correctCount++;

      return {
        questionId: qId,
        question: q.statement || q.question, 
        userAnswer: studentChoice,
        correctAnswer: rightAnswer,
        isCorrect: isCorrect,
      };
    });

    const wrongCount = questions.length - correctCount;
    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    const newResult = {
      _id: Date.now().toString(),
      quizTitle: quiz?.title || "Quiz",
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      score: scorePercentage,
      correct: correctCount,
      wrong: wrongCount,
      totalQuestions: questions.length,
      details: details,
    };

    const existingResults = JSON.parse(localStorage.getItem("my_results")) || [];
    localStorage.setItem("my_results", JSON.stringify([newResult, ...existingResults]));

    alert(`Quiz Submitted Successfully! Your Score: ${scorePercentage}%`);
    navigate("/my-results");
  };

 
  
  const handleSubmitQuiz = async () => {
   
    
    const formattedAnswers = Object.keys(selectedAnswers).map((qId) => ({
      questionId: qId,
      answer: selectedAnswers[qId], 
    }));

    try {
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      const result = await response.json();

      if (response.ok) {
       
        
        const finalScore = result.data?.percentage ?? result.data?.score ?? 0;
        alert(`Quiz Submitted Successfully! Your Score: ${finalScore}%`);
        navigate("/my-results");
      } else {
        console.warn("Backend error submitting quiz, using local calculation:", result.message);
        handleLocalSubmit();
      }
    } catch (error) {
      console.warn("Server unavailable. Submitting quiz locally.");
      handleLocalSubmit();
    }
  };

  if (!quiz || questions.length === 0) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading Quiz Questions...</div>;
  }

  const currentQ = questions[currentIndex];
  const currentQId = currentQ._id || currentQ.id;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  const defaultChoices = [
    "Option A",
    "Option B",
    "Option C",
    "Option D",
  ];
  const options = currentQ.choices || currentQ.options || defaultChoices;

  return (
    <div className="take-quiz-page">
      {/* Top Banner */}
      <div className="tq-header">
        <div className="tq-header-left" onClick={() => navigate("/student-dashboard")}>
          ‹ <span>{quiz.title}</span>
        </div>

        <div className="tq-header-center">
          ⏱ <span>{formatTime(timeLeft)}</span>
        </div>

        <div className="tq-header-right">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="tq-progress-container">
        <div className="tq-progress-bar" style={{ width: `${progressPercent}%` }}></div>
      </div>

      {/* Main Content Card */}
      <div className="tq-body">
        <div className="tq-card">
         
         
          <h3 className="question-statement">{currentQ.statement || currentQ.question}</h3>

          <div className="options-list">
            {options.map((choice, idx) => {
              const isSelected = selectedAnswers[currentQId] === choice;
              return (
                <label
                  key={idx}
                  className={`option-item ${isSelected ? "active" : ""}`}
                  onClick={() => handleSelectOption(currentQId, choice)}
                >
                  <input
                    type="radio"
                    name={`q-${currentQId}`}
                    checked={isSelected}
                    onChange={() => {}}
                  />
                  <span>{choice}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="tq-footer">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
          >
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button onClick={() => setCurrentIndex(currentIndex + 1)}>
              Next
            </button>
          ) : (
            <button style={{ backgroundColor: "#16a34a" }} onClick={handleSubmitQuiz}>
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TakeQuiz;