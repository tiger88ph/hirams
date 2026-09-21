import {
  ShoppingCartOutlined,
  CancelOutlined,
  CloseOutlined,
  ReceiptLongOutlined,
  LockOutlined,
  PrintOutlined,
  BadgeOutlined,
  Inventory2Outlined,
} from "@mui/icons-material";

// ── Shared color variants ─────────────────────────────────────────────────
// Light values are the original hardcoded hex; dark values use the same
// translucent-tint approach as AlertBox / CanvasView / JournalAccountsView.
const VARIANTS = {
  red: {
    light: {
      color: "#dc2626",
      bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
      border: "#fecaca",
      dotColor: "#ef4444",
      iconColor: "#dc2626",
      confirmBg: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    },
    dark: {
      color: "#fca5a5",
      bg: "linear-gradient(135deg, rgba(239,68,68,0.16) 0%, rgba(185,28,28,0.22) 100%)",
      border: "rgba(248,113,113,0.4)",
      dotColor: "#f87171",
      iconColor: "#fca5a5",
      confirmBg: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
    },
  },
  blue: {
    light: {
      color: "#1D4ED8",
      bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
      border: "#BFDBFE",
      dotColor: "#3B82F6",
      iconColor: "#1D4ED8",
      confirmBg: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)",
    },
    dark: {
      color: "#93c5fd",
      bg: "linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(29,78,216,0.22) 100%)",
      border: "rgba(147,197,253,0.4)",
      dotColor: "#60a5fa",
      iconColor: "#93c5fd",
      confirmBg: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
    },
  },
  green: {
    light: {
      color: "#15803d",
      bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      border: "#86efac",
      dotColor: "#22c55e",
      iconColor: "#15803d",
      confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
    },
    dark: {
      color: "#86efac",
      bg: "linear-gradient(135deg, rgba(34,197,94,0.16) 0%, rgba(21,128,61,0.22) 100%)",
      border: "rgba(134,239,172,0.4)",
      dotColor: "#4ade80",
      iconColor: "#86efac",
      confirmBg: "linear-gradient(135deg, #15803d 0%, #14532d 100%)",
    },
  },
  amber: {
    light: {
      color: "#b45309",
      bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      border: "#fde68a",
      dotColor: "#f59e0b",
      iconColor: "#b45309",
      confirmBg: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
    },
    dark: {
      color: "#fde68a",
      bg: "linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(180,83,9,0.22) 100%)",
      border: "rgba(253,230,138,0.4)",
      dotColor: "#fbbf24",
      iconColor: "#fde68a",
      confirmBg: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
    },
  },
};

// ── Resolve helper ──────────────────────────────────────────────────────
// Takes ONE style entry (e.g. VOUCHER_CONFIRM_STYLES.cancel) plus isDark,
// and returns it merged with the right light/dark color variant.
// Call this from inside ConfirmationStructure, which already has useTheme().
export function resolveConfirmStyle(entry, isDark) {
  if (!entry) return null;
  const { variant, ...rest } = entry;
  return { ...VARIANTS[variant][isDark ? "dark" : "light"], ...rest };
}

// ── Voucher confirm dialogs ──────────────────────────────────────────────
export const VOUCHER_CONFIRM_STYLES = {
  cancel: {
    variant: "red",
    Icon: CloseOutlined,
    title: "Cancel this Voucher?",
    desc: "Cancelling the voucher will void all entries. This action cannot be undone.",
    confirmLabel: "Yes, Cancel Voucher",
  },
  finalize_jev: {
    variant: "blue",
    Icon: BadgeOutlined,
    title: "Finalize JEV?",
    desc: "Upon Finalizing this JEV, this JEV will become the Active JEV for this Voucher.",
    confirmLabel: "Yes, Finalize",
  },
  undo_finalize_jev: {
    variant: "red",
    Icon: CloseOutlined,
    title: "Undo Finalize JEV?",
    desc: "This action will mark this JEV as Pending for this Voucher.",
    confirmLabel: "Yes, Undo Finalize",
  },
  add_jev: {
    variant: "green",
    Icon: BadgeOutlined,
    title: "Create JEV for this Voucher?",
    desc: "A new JEV will be created and linked to this voucher.",
    confirmLabel: "Yes, Create JEV",
  },
  reopen: {
    variant: "blue",
    Icon: ReceiptLongOutlined,
    title: "Re-open this Voucher?",
    desc: "This will reactivate the voucher and allow further edits.",
    confirmLabel: "Yes, Re-open Voucher",
  },
  print_only: {
    variant: "green",
    Icon: PrintOutlined,
    title: "Print this Voucher?",
    desc: "This will open the print view for this voucher.",
    confirmLabel: "Yes, Print Voucher",
  },
  print_cheque: {
    variant: "green",
    Icon: PrintOutlined,
    title: "Print Cheque?",
    desc: "This will open the cheque print view for this voucher.",
    confirmLabel: "Yes, Print Cheque",
  },
  paid: {
    variant: "green",
    Icon: BadgeOutlined,
    title: "Mark as Paid?",
    desc: "This will mark the voucher as paid. This action cannot be undone.",
    confirmLabel: "Yes, Mark as Paid",
  },
  unpaid: {
    variant: "amber",
    Icon: BadgeOutlined,
    title: "Mark as Unpaid?",
    desc: "This will revert the voucher back to unpaid status.",
    confirmLabel: "Yes, Mark as Unpaid",
  },
  close: {
    variant: "green",
    Icon: LockOutlined,
    title: "Close this Voucher?",
    desc: "Closing the voucher will lock it from further edits until reopened.",
    confirmLabel: "Yes, Close Voucher",
  },
  create_voucher: {
    variant: "blue",
    Icon: ReceiptLongOutlined,
    title: "Create Voucher?",
    desc: "Before creating a voucher, please ensure that the Purchase Order has been Approved. Vouchers should only be created for approved purchase orders.",
    confirmLabel: "Yes, Create Voucher",
  },
  link_voucher: {
    variant: "blue",
    Icon: ReceiptLongOutlined,
    title: "Link to Voucher?",
    desc: "This will link the current Purchase Order to the selected voucher.",
    confirmLabel: "Yes, Link Voucher",
  },
  unlink_voucher: {
    variant: "red",
    Icon: CloseOutlined,
    title: "Unlink this Voucher?",
    desc: "This will remove the link between the Purchase Order and the voucher. If this is the last PO linked, the voucher will be automatically deleted.",
    confirmLabel: "Yes, Unlink Voucher",
  },
};

// ── Cart confirm dialogs ──────────────────────────────────────────────────
export const CART_CONFIRM_STYLES = {
  open: {
    variant: "blue",
    Icon: ShoppingCartOutlined,
    title: "Re-open this Cart?",
    desc: "This will reactivate the cart and allow further edits.",
    confirmLabel: "Yes, Re-open Cart",
  },
  undo_approval: {
    variant: "amber",
    Icon: CancelOutlined,
    title: "Undo Approval?",
    desc: "This will revert the purchase order back to Cart status, undoing the approval.",
    confirmLabel: "Yes, Undo Approval",
  },
  close: {
    variant: "green",
    Icon: LockOutlined,
    title: "Close this Cart?",
    desc: "Closing the cart will lock it from further edits. This action can be reviewed later.",
    confirmLabel: "Yes, Close Cart",
  },
  cancel: {
    variant: "red",
    Icon: CancelOutlined,
    title: "Cancel this Cart?",
    desc: "Cancelling the cart will void all items. This action cannot be undone.",
    confirmLabel: "Yes, Cancel Cart",
  },
  approve: {
    variant: "green",
    Icon: LockOutlined,
    title: "Approve this Purchase Order?",
    desc: "This will mark the purchase order as approved and move it to For Payment.",
    confirmLabel: "Yes, Approve PO",
  },
  print_po: {
    variant: "green",
    Icon: PrintOutlined,
    title: "Print this Purchase Order?",
    desc: "This will open the print view for this purchase order.",
    confirmLabel: "Yes, Print PO",
  },
  received: {
    variant: "blue",
    Icon: Inventory2Outlined,
    title: "Confirm Received Quantity?",
    desc: "This will update the received inventory count for this item.",
    confirmLabel: "Yes, Confirm Received",
  },
  delivered: {
    variant: "green",
    Icon: Inventory2Outlined,
    title: "Confirm Delivered Quantity?",
    desc: "This will update the delivered inventory count for this item.",
    confirmLabel: "Yes, Confirm Delivered",
  },
};
export const CART_STATUS_STYLES = {
  VOID: {
    label: "VOID",
    colorKey: "red.text",
    bgKey: "red.bg",
    borderKey: "red.border",
    innerLight: "rgba(220,38,38,0.15)",
    innerDark: "rgba(248,113,113,0.12)",
  },
  DLVRD: {
    label: "DLVRD",
    colorKey: "green.text",
    bgKey: "green.bg",
    borderKey: "green.border",
    innerLight: "rgba(21,128,61,0.15)",
    innerDark: "rgba(74,222,128,0.12)",
  },
  RCVD: {
    label: "RCV'D",
    colorKey: "cyan.text",
    bgKey: "cyan.bg",
    borderKey: "cyan.border",
    innerLight: "rgba(3,105,161,0.15)",
    innerDark: "rgba(125,211,252,0.12)",
  },
  PENDING: {
    label: "PEND",
    colorKey: "amber.text",
    bgKey: "amber.bg",
    borderKey: "amber.border",
    innerLight: "rgba(180,83,9,0.15)",
    innerDark: "rgba(252,211,77,0.12)",
  },
  PAID: {
    label: "PAID",
    colorKey: "teal.text",
    bgKey: "teal.bg",
    borderKey: "teal.border",
    innerLight: "rgba(15,118,110,0.15)",
    innerDark: "rgba(94,234,212,0.12)",
  },
  PO: {
    label: "P.O.",
    colorKey: "indigo.text",
    bgKey: "indigo.bg",
    borderKey: "indigo.border",
    innerLight: "rgba(79,70,229,0.15)",
    innerDark: "rgba(196,181,253,0.12)",
  },
  CART: {
    label: "CART",
    colorKey: "blue.text",
    bgKey: "blue.bg",
    borderKey: "blue.border",
    innerLight: "rgba(59,130,246,0.12)",
    innerDark: "rgba(96,165,250,0.12)",
  },
};
