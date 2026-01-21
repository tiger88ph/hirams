import React from "react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Access Not Available
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          The page you are trying to access is not available for your current
          login status or role.
        </p>

        <button
          onClick={() => {
            if (window.history.length > 2) {
              navigate(-1); // Go back if history exists
            } else {
              navigate("/"); // Otherwise go home
            }
          }}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg transition font-medium"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
