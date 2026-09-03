import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import ConfirmationStructure from "../../../../../components/structure/ConfirmationStructure.jsx";
import { CART_CONFIRM_STYLES } from "../../../../../utils/style/sharedConfirmStyles.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  paperBg: c.slate.outerBg,
  border: c.slate.border,
});

export default function PurchaseCartUpdateModal({
  open,
  action,
  purchaseOrderNumber,
  loading,
  onConfirm,
  onClose,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      contentOnly
      disableBackdropClick
      width={{ xs: "90%", sm: 420 }}
    >
      {action && CART_CONFIRM_STYLES[action] && (
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: c.paperBg,
            border: `1px solid ${c.border}`,
          }}
        >
          <ConfirmationStructure
            style={CART_CONFIRM_STYLES[action]}
            voucherNumber={purchaseOrderNumber}
            loading={loading}
            onConfirm={onConfirm}
            onBack={onClose}
          />
        </Box>
      )}
    </ModalContainer>
  );
}
