import {
  ShoppingCartOutlined,
  ReceiptLongOutlined,
  FileDownloadOutlined,
  LocalShippingOutlined,
  Inventory2Outlined,
} from "@mui/icons-material";

export const CART_STEPS_STYLES = [
  {
    key: "addToCart",
    label: "Cart",

    icon: <ShoppingCartOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#93c5fd",
    activeBg: "#1d4ed8",
  },
  {
    key: "purchaseOrder",
    label: "P.O.",

    icon: <ReceiptLongOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
    activeBg: "#7c3aed",
  },
  {
    key: "paid",
    label: "Paid",

    icon: <FileDownloadOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#0f766e",
    bg: "#ccfbf1",
    border: "#5eead4",
    activeBg: "#0f766e",
  },
  {
    key: "received",
    label: "Received",

    icon: <LocalShippingOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    activeBg: "#0369a1",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: <Inventory2Outlined sx={{ fontSize: "0.78rem" }} />,
    color: "#15803d",
    bg: "#dcfce7",
    border: "#86efac",
    activeBg: "#15803d",
  },
];
