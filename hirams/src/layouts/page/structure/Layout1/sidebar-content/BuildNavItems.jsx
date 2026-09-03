import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import ArchiveIcon from "@mui/icons-material/Archive";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import { SECTION_LABELS } from "../../../../../constants/navigations";

import UserNavSection from "./navigations/UserNav";
import ClientNavSection from "./navigations/ClientNav";
import SupplierNavSection from "./navigations/SupplierNav";
import AssigneeNavSection from "./navigations/AssigneeNav";
import TransactionNavSection from "./navigations/TransactionNav";
import CartNavSection from "./navigations/CartNav";
import VoucherNavSection from "./navigations/VoucherNav";
import InventoryNavSection from "./navigations/InventoryNav";
import JevNavSection from "./navigations/JevNav";
import ArchiveNavSection from "./navigations/ArchiveNav";
export const buildNavItems = () => ({
  overview: [
    {
      type: "section",
      title: SECTION_LABELS.overview,
      items: [
        {
          icon: <DashboardIcon fontSize="small" />,
          label: "Dashboard",
          to: "/dashboard",
        },
      ],
    },
  ],
  management: {
    common: [
      { type: "nav", key: "user", component: UserNavSection },
      { type: "nav", key: "client", component: ClientNavSection },
      { type: "nav", key: "supplier", component: SupplierNavSection },
      { type: "nav", key: "assignee", component: AssigneeNavSection },
      {
        type: "item",
        key: "company",
        icon: <BusinessIcon fontSize="small" />,
        label: "Company",
        to: "/company",
      },
      {
        type: "item",
        key: "directCost",
        icon: <LocalAtmIcon fontSize="small" />,
        label: "Direct Cost Options",
        to: "/direct-cost",
      },
    ],
    transaction: {
      type: "nav",
      key: "transaction",
      component: TransactionNavSection,
    },
    cart: { type: "nav", key: "cart", component: CartNavSection },
    archive: {
      type: "nav",
      key: "archive",
      component: ArchiveNavSection,
    },
    inventory: {
      type: "nav",
      key: "inventory",
      component: InventoryNavSection,
    },
    accounting: [
      { type: "nav", key: "voucher", component: VoucherNavSection },
      { type: "nav", key: "jev", component: JevNavSection },
      {
        type: "item",
        key: "journalEntry",
        icon: <BusinessIcon fontSize="small" />,
        label: "Journal Entry Voucher",
        to: "/journal-entry-voucher",
      },
      {
        type: "item",
        key: "journalAccounts",
        icon: <AccountBalanceWalletIcon fontSize="small" />,
        label: "Journal Accounts",
        to: "/journal-account",
      },
    ],
  },
});
