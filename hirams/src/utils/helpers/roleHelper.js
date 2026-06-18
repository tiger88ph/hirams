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
    generalManagerKey: [keys[1]],
    procurementKey: [keys[2], keys[3]],
    accountOfficerKey: [keys[4], keys[5]],
    financeOfficerKey: [keys[6]], // single key, no Tl
    aotlKey: keys[5],
    procurementtlKey: keys[3],
  };
};

export const getUserRoles = (userTypes) => {
  const userType = String(getUserType());
  const {
    managementKey,
    generalManagerKey,
    procurementKey,
    accountOfficerKey,
    financeOfficerKey,
    aotlKey,
    procurementtlKey,
  } = buildRoleGroups(userTypes);

  return {
    isManagement: managementKey.includes(userType),
    isGeneralManager: generalManagerKey.includes(userType),
    isProcurement: procurementKey.includes(userType),
    isAccountOfficer: accountOfficerKey.includes(userType),
    isFinanceOfficer: financeOfficerKey.includes(userType),
    isAOTL: userType === String(aotlKey),
    isProcurementTL: userType === String(procurementtlKey),
  };
};
