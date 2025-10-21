import React from "react";
import HEADER_TITLES from "../../utils/header/page";

function Dashboard() {
  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          {HEADER_TITLES.DASHBOARD}
        </h1>
      </header>

      <div className="space-y-4">
        {/* 1. Welcome Section */}
        <section className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Welcome Back!
          </h2>
          <p className="text-gray-600 text-sm">
            Everything is working perfectly! Explore your dashboard and manage
            your content.
          </p>
          <button className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm">
            Get Started
          </button>
        </section>

        {/* 2. Main Cards Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Card 1</h3>
            <p className="text-gray-600 text-sm">
              This is a responsive card example with hover effect.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Card 2</h3>
            <p className="text-gray-600 text-sm">
              Tailwind makes creating responsive layouts easy.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Card 3</h3>
            <p className="text-gray-600 text-sm">
              Add more content here for your dashboard widgets.
            </p>
          </div>
        </section>

        {/* 3. Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg shadow flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800">120</span>
            <span className="text-gray-500 text-sm">Users</span>
          </div>
          <div className="bg-white p-3 rounded-lg shadow flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800">35</span>
            <span className="text-gray-500 text-sm">Projects</span>
          </div>
          <div className="bg-white p-3 rounded-lg shadow flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800">89%</span>
            <span className="text-gray-500 text-sm">Completion</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
