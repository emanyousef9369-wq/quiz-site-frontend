import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SignImage from "../assets/signup.png";
import mockData from "../mockdata.json";
import "./login.css";

function SignUp() {
  const [role, setRole] = useState("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLocalMockSignup = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    const localUsers = JSON.parse(localStorage.getItem("mock_users")) || mockData.users || [];
    

    const existingUser = localUsers.find(
      (u) => (u.email || u.username)?.trim().toLowerCase() === email.trim().toLowerCase());

    if (existingUser) {
      setError("Username / Email already exists!");
      return;
    }

    const newUser = {
      _id: Date.now().toString(),
      fullName,
      username: email.trim().toLowerCase(),
      password,
      role,
    };

    localStorage.setItem("mock_users", JSON.stringify([...localUsers, newUser]));
    localStorage.setItem("token", "fake-jwt-token-signup-123");
    localStorage.setItem("user", JSON.stringify(newUser));

    if (role === "lecturer") {
      navigate("/question-bank");
    } else {
      navigate("/student-dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    try {
     
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
          role: role,
        }),
      });

      const result = await response.json();

      if (response.status === 201 || response.ok) {
       
        localStorage.setItem("token", result.data?.token || "fake-token");
        localStorage.setItem("user", JSON.stringify(result.data?.user || { username: email, role }));

        if (role === "lecturer") {
          navigate("/question-bank");
        } else {
          navigate("/student-dashboard");
        }
      } else {
       
        if (response.status === 409) {
          setError("Username already exists!");
        } else {
          setError(result.message || "Invalid input data!");
        }
      }
    } catch (err) {
      console.warn("Backend unavailable. Falling back to local mock signup:", err);
      handleLocalMockSignup();
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "1150px", height: "auto", minHeight: "700px" }}>
        
        {/* Left Side */}
        <div className="login-left" style={{ width: "45%" }}>
          <div style={{ padding: "40px", color: "white", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", fontWeight: "bold" }}>
              🎓 Quiz Platform
            </div>
            <div>
              <img src={SignImage} alt="Quiz illustration" className="login-image" style={{ maxHeight: "350px", objectFit: "contain" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Learn. Assess. Improve.</h2>
              <p style={{ fontSize: "14px", color: "#a5b4fc" }}>Create quizzes, track progress and achieve more together.</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-right" style={{ width: "55%", padding: "40px" }}>
          <div className="login-container" style={{ maxWidth: "480px" }}>
            <div className="welcome" style={{ textAlign: "left", marginBottom: "20px" }}>
              <h1 style={{ fontSize: "28px" }}>Sign Up 👋</h1>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Create your account to get started</p>
            </div>

            {error && <p style={{ color: "red", fontSize: "14px", marginBottom: "15px" }}>{error}</p>}

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: "13px", color: "#374151" }}>Sign up as</label>
              <div className="role-container" style={{ marginBottom: "15px" }}>
                <button
                  type="button"
                  className={role === "student" ? "role active" : "role"}
                  onClick={() => setRole("student")}
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  className={role === "lecturer" ? "role active" : "role"}
                  onClick={() => setRole("lecturer")}
                >
                  👨‍🏫 Lecturer
                </button>
              </div>

              {/* Full Name */}
              <label htmlFor="fullName" style={{ fontSize: "13px", color: "#374151" }}>Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ marginBottom: "10px" }}
              />

              {/* Email */}
              <label htmlFor="email" style={{ fontSize: "13px", color: "#374151" }}>Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ marginBottom: "10px" }}
              />

              {/* Password & Confirm Password */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                <div>
                  <label htmlFor="password" style={{ fontSize: "13px", color: "#374151", display: "block", marginBottom: "5px" }}>Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" style={{ fontSize: "13px", color: "#374151", display: "block", marginBottom: "5px" }}>Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "15px 0", fontSize: "13px", color: "#4b5563" }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="terms" style={{ margin: 0, fontWeight: "normal", cursor: "pointer" }}>
                  I agree to the <span style={{ color: "#6366f1" }}>Terms & Conditions</span> and <span style={{ color: "#6366f1" }}>Privacy Policy</span>
                </label>
              </div>

              {/* Create Account Button */}
              <button className="login-button" type="submit" style={{ width: "100%", marginTop: "5px" }}>
                Create Account
              </button>
            </form>

            <p className="register-text" style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
              Already have an account? <Link to="/" style={{ color: "#6366f1", fontWeight: "bold", textDecoration: "none" }}>Login</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SignUp;