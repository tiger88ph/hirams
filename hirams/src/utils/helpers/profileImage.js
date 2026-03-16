/**
 * Resolves the correct profile image URL for a given user object.
 * Falls back to sex-based defaults, then a generic placeholder.
 *
 * @param {Object} user - Raw user object from localStorage or API response
 * @param {string} [user.strProfileImage] - Uploaded profile image filename
 * @param {string} [user.cSex] - Sex code: "M" | "F"
 * @returns {string} Full resolved image URL
 */
export const resolveProfileImage = (user) => {
  if (!user) return `${import.meta.env.BASE_URL}profile/index.png`;
  const base = import.meta.env.BASE_URL;

  if (user.strProfileImage)
    return `${base}profile/${user.strProfileImage}`;
  if (user.cSex === "M")
    return `${base}profile/profile-male.png`;
  if (user.cSex === "F")
    return `${base}profile/profile-female.png`;

  return `${base}profile/index.png`;
};