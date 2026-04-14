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

export const buildRoleGroups = (userTypes) => {
  const keys = Object.keys(userTypes);
  return {
    managementKey: [keys[0], keys[1]],
    procurementKey: [keys[2], keys[3]],
    accountOfficerKey: [keys[4], keys[5]],
    aotlKey: keys[5],
    procurementtlKey: keys[3],
  };
};
export const getUserRoles = (userTypes) => {
  const userType = String(getUserType());
  const { managementKey, procurementKey, accountOfficerKey, aotlKey, procurementtlKey } =
    buildRoleGroups(userTypes);

  return {
    isManagement: managementKey.includes(userType),
    isProcurement: procurementKey.includes(userType),
    isAccountOfficer: accountOfficerKey.includes(userType), // AO + AOTL
    isAOTL: userType === String(aotlKey), // AOTL only
    isProcurementTL: userType === String(procurementtlKey), // Procurement TL only
  };
};
