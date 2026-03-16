// timeZone.js
// This module provides current date and time in Philippines Time (PHT, UTC+8)

export const getPhilippinesTime = () => {
  // Create a new date object in UTC
  const utcDate = new Date();

  // Offset for Philippines (UTC+8)
  const philippinesOffset = 8 * 60; // in minutes

  // Calculate Philippines time
  const philippinesTime = new Date(
    utcDate.getTime() + philippinesOffset * 60 * 1000 + utcDate.getTimezoneOffset() * 60 * 1000
  );

  return philippinesTime;
};

// Optional: formatted string
export const getPhilippinesTimeString = (options = {}) => {
  const philippinesTime = getPhilippinesTime();
  // Default formatting options
  const formatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    ...options,
  };
  return philippinesTime.toLocaleString("en-PH", formatOptions);
};

// Example usage:
// import { getPhilippinesTime, getPhilippinesTimeString } from './timeZone';
// console.log(getPhilippinesTime()); // Date object
// console.log(getPhilippinesTimeString()); // "February 12, 2026, 10:15:30 PM"
