import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  async function loadProfile() {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data.user);
    } catch (err) {
      navigate("/login");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="container">
      <h2>Dashboard</h2>

      {user ? (
        <div className="card">
          <p><strong>User ID:</strong> {user.user_id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.client_name}</p>

          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className="message">Loading...</div>
      )}
    </div>
  );
}
