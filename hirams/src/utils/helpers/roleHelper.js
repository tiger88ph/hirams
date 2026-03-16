// roleHelper.js

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const getUserType = () => {
  const user = getUser();
  return user?.cUserType ?? null;
};

/**
 * Builds role groups from userTypes object.
 *
 * Index reference:
 *   keys[0] — Account Officer (AO)
 *   keys[1] — Management
 *   keys[2] — (reserved)
 *   keys[3] — Procurement
 *   keys[4] — Management (alt)
 *   keys[5] — Account Officer Team Lead (AOTL)  ← isAOTL
 *   keys[6] — Procurement (alt)
 */
export const buildRoleGroups = (userTypes) => {
  const keys = Object.keys(userTypes);
  return {
    managementKey:     [keys[1], keys[4]],
    procurementKey:    [keys[3], keys[6]],
    accountOfficerKey: [keys[0], keys[5]], // includes both AO and AOTL
    aotlKey:           keys[5],            // AOTL specifically
  };
};

/**
 * Main permission checker.
 *
 * Returns:
 *   isManagement     — true for management roles
 *   isProcurement    — true for procurement roles
 *   isAccountOfficer — true for AO and AOTL
 *   isAOTL           — true only for Account Officer Team Lead (keys[5])
 */
export const getUserRoles = (userTypes) => {
  const userType = String(getUserType());
  const {
    managementKey,
    procurementKey,
    accountOfficerKey,
    aotlKey,
  } = buildRoleGroups(userTypes);

  return {
    isManagement:     managementKey.includes(userType),
    isProcurement:    procurementKey.includes(userType),
    isAccountOfficer: accountOfficerKey.includes(userType), // AO + AOTL
    isAOTL:           userType === String(aotlKey),          // AOTL only
  };
};