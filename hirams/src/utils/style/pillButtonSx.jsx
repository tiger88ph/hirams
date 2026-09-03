const PILL_BUTTON_STYLES = {
  green: {
    color: "#FFFFFF !important",
    bgcolor: "#16A34A !important",
    borderColor: "#16A34A !important",
    "&:hover": {
      bgcolor: "#15803D !important",
      borderColor: "#15803D !important",
    },
  },
  red: {
    color: "#FFFFFF !important",
    bgcolor: "#DC2626 !important",
    borderColor: "#DC2626 !important",
    "&:hover": {
      bgcolor: "#B91C1C !important",
      borderColor: "#B91C1C !important",
    },
  },
  blue: {
    color: "#FFFFFF !important",
    bgcolor: "#2563EB !important",
    borderColor: "#2563EB !important",
    "&:hover": {
      bgcolor: "#1D4ED8 !important",
      borderColor: "#1D4ED8 !important",
    },
  },
};

export const pillButtonSx = (variant) => ({
  ...PILL_BUTTON_STYLES[variant],
  borderRadius: "50px !important",
  borderWidth: "1px !important",
  fontWeight: 700,
  px: 1.25,
});
