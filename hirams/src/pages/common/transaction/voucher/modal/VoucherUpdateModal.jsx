import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import ConfirmationStructure from "../../../../../components/structure/ConfirmationStructure.jsx";
import { VOUCHER_CONFIRM_STYLES } from "../../../../../utils/style/sharedConfirmStyles.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  slate: { outerBg: c.slate.outerBg, border: c.slate.border },
});

export default function VoucherUpdateModal({
  open,
  action,
  voucherNumber,
  loading,
  onConfirm,
  onClose,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = getThemeColors(isDark);
  const colors = useColors(base);

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      contentOnly
      disableBackdropClick
      width={{ xs: "90%", sm: 420 }}
    >
      {action && (
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: colors.slate.outerBg,
            border: `1px solid ${colors.slate.border}`,
          }}
        >
          <ConfirmationStructure
            style={VOUCHER_CONFIRM_STYLES[action]}
            voucherNumber={voucherNumber}
            loading={loading}
            onConfirm={onConfirm}
            onBack={onClose}
          />
        </Box>
      )}
    </ModalContainer>
  );
}
