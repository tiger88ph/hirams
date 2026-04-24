import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-700 p-3 md:p-4 mt-auto w-full">
      <div className="text-center text-sm">
        &copy; {new Date().getFullYear()} HIRAMS v01.67.90. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
