import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../assets/login.jpeg";
import mockData from "../mockdata.json";
import "./login.css";

function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleLocalMockLogin = () => {
    const localUsers = JSON.parse(localStorage.getItem("mock_users"));
    const usersList = localUsers || mockData.users;

    const validUser = usersList.find(
      (u) =>
        (u.email?.trim().toLowerCase() === email.trim().toLowerCase() ||
         u.username?.trim().toLowerCase() === email.trim().toLowerCase()) &&
        u.password === password &&
        u.role === role
    );

    if (!validUser) {
      setError("Invalid email/username, password, or role!");
      return;
    }

    localStorage.setItem("token", "fake-jwt-token-123");
    localStorage.setItem("user", JSON.stringify(validUser));

    if (role === "lecturer") {
      navigate("/question-bank");
    } else {
      navigate("/student-dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
    
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(), 
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));

        if (role === "lecturer") {
          navigate("/question-bank");
        } else {
          navigate("/student-dashboard");
        }
      } else {
        setError(result.message || "Invalid credentials!");
      }
    } catch (err) {
      console.warn("Backend unavailable. Falling back to local mock login:", err);
      handleLocalMockLogin();
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">
        
        {/* Left Side */}
        <div className="login-left">
          <img
            src={loginImage}
            alt="Quiz illustration"
            className="login-image"
          />
        </div>

        {/* Right Side */}
        <div className="login-right">
          <div className="login-container">
            <div className="welcome">
              <h1>Welcome Back! 👋</h1>
              <p>Login to your account</p>
            </div>

            {error && <p style={{ color: "red", textAlign: "center", marginBottom: "10px" }}>{error}</p>}

            <form onSubmit={handleSubmit}>
              {/* Role */}
              <label>Login as</label>

              <div className="role-container">
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

              {/* Email / Username */}
              <label htmlFor="email">Email / Username</label>
              <input
                id="email"
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Password */}
              <div className="password-header">
                <label htmlFor="password">Password</label>
                <button type="button">Forgot password?</button>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Login */}
              <button className="login-button" type="submit">
                Login
              </button>
            </form>

            <br />
            <p className="register-text">
             Don't have an account? <Link to="/SignUp">SignUp</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;