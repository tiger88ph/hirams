import React from "react";

function Index() {
  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white px-4 py-2 border-b border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          Hirams Supply Wholesaling System - Documentation
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Introduction */}
        <section className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Introduction</h2>
          <p className="text-gray-600 text-sm">
            The Hirams Supply Wholesaling System is a modern, web-based platform designed to streamline 
            inventory management, order processing, and customer tracking for wholesale businesses. 
            This system helps Hirams Supply maintain accurate records of products, monitor stock levels, 
            and enhance operational efficiency.
          </p>
        </section>

        {/* Features */}
        <section className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Key Features</h2>
          <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
            <li>Real-time inventory tracking with automatic updates</li>
            <li>Easy order processing and management</li>
            <li>Customer and supplier management</li>
            <li>Automated report generation for sales and stock levels</li>
            <li>User-friendly dashboard with quick access to critical information</li>
          </ul>
        </section>

        {/* Benefits */}
        <section className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Benefits</h2>
          <p className="text-gray-600 text-sm">
            By using the Hirams Supply Wholesaling System, the business can reduce manual errors, 
            save time on administrative tasks, improve order accuracy, and make data-driven decisions 
            to optimize stock levels and improve overall efficiency.
          </p>
        </section>

        {/* How to Use */}
        <section className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">How to Use</h2>
          <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
            <li>Log in to the system using your authorized credentials.</li>
            <li>Access the dashboard to view current stock levels and recent orders.</li>
            <li>Manage inventory by adding new products or updating existing ones.</li>
            <li>Process customer orders efficiently and generate invoices.</li>
            <li>Use reports to monitor sales performance and stock trends.</li>
          </ol>
        </section>

        {/* Contact & Support */}
        <section className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Contact & Support</h2>
          <p className="text-gray-600 text-sm">
            For any inquiries or technical support regarding the system, please contact the IT team 
            at <a href="mailto:support@hiramswholesale.com" className="text-blue-600 underline">support@hiramswholesale.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Index;
