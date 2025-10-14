import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-700 p-4 mt-auto md:ml-0 md:max-w-full md:px-6">
      <div className="text-center text-sm">
        &copy; {new Date().getFullYear()} HIRAMS. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
