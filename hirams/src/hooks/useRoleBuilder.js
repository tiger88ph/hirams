import { getItem } from "../utils/storage/localStorage";

export const getUser = () => getItem("user", {});

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
    aoKey: keys[4], 
    financeOfficerKey: [keys[6]],
    aotlKey: keys[5],
    procurementtlKey: keys[3],
    managementOnlyKey: [keys[0]],
  };
};

export const getUserRoles = (userTypes) => {
  const userType = String(getUserType());
  const {
    managementKey,
    generalManagerKey,
    procurementKey,
    accountOfficerKey,
    aoKey,
    financeOfficerKey,
    aotlKey,
    procurementtlKey,
    managementOnlyKey
  } = buildRoleGroups(userTypes);

  return {
    isManagement: managementKey.includes(userType),
    isGeneralManager: generalManagerKey.includes(userType),
    isProcurement: procurementKey.includes(userType),
    isAccountOfficer: accountOfficerKey.includes(userType),
    isAO: userType === String(aoKey), 
    isFinanceOfficer: financeOfficerKey.includes(userType),
    isAOTL: userType === String(aotlKey), // index 5 — AO Team Leader
    isProcurementTL: userType === String(procurementtlKey),
    isManagementOnly: managementOnlyKey.includes(userType),
  };
};