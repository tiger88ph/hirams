/**
 * Resolves the correct profile image URL for a given user object.
 * Falls back to sex-based defaults, then a generic placeholder.
 *
 * @param {Object} user - Raw user object from localStorage or API response
 * @param {string} [user.strProfileImage] - Uploaded profile image filename
 * @param {string} [user.cSex] - Sex code: "M" | "F"
 * @returns {string} Full resolved image URL
 */
/**
 * Resolves the correct profile image URL.
 */
export const resolveProfileImage = (user, previewUrl = null) => {
  if (previewUrl) return previewUrl;

  const base = import.meta.env.VITE_API_IMAGES;

  if (user?.strProfileImage) {
    return `${base}profile/${user.strProfileImage}`;
  }

  if (user?.cSex === "M") {
    return `${base}profile/profile-male.png`;
  }

  if (user?.cSex === "F") {
    return `${base}profile/profile-female.png`;
  }

  return `${base}profile/index.png`;
};
/**
 * Resolves the correct logo URL for a given company object.
 * Falls back to null (caller shows a fallback icon) if no logo is set.
 *
 * @param {Object|null} company - Company object from API
 * @param {string} [company.strLogo] - Logo filename stored in /logo/
 * @param {string} [previewUrl] - Local object URL from a pending file selection
 * @returns {string|null} Full resolved logo URL, or null if no logo
 */
export const resolveCompanyLogo = (company, previewUrl = null) => {
  if (previewUrl) return previewUrl;
  const base = import.meta.env.VITE_API_IMAGES;
  if (company?.strLogo) return `${base}logo/${company.strLogo}`;
  return null;
};
