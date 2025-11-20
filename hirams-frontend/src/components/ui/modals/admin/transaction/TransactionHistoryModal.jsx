import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import CustomTable from "../../../../common/Table";

function TransactionHistoryModal({ open, onClose, transactionId, transactionCode }) {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const { transacstatus } = useMapping();

  useEffect(() => {
    if (!open || !transactionId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`transactions/${transactionId}/history`);
        const { history } = response.data || response;
        setTransactionHistory(Array.isArray(history) ? history : []);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        setTransactionHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, transactionId]);

  if (!open) return null;

  // Columns for reusable table
  const columns = [
    {
      key: "dtOccur",
      label: "Date Occurred",
      align: "center",
      render: (val) =>
        val
          ? new Date(val).toLocaleString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour12: true,
            })
          : "N/A",
    },
    {
      key: "nStatus",
      label: "Status",
      align: "center",
      render: (val) => transacstatus[val] || `Unknown (${val})`,
    },
    {
      key: "nUserId",
      label: "User",
      align: "left",
      render: (val) => val || "System",
    },
    {
      key: "strRemarks",
      label: "Remarks",
      align: "left",
      render: (val) => val || "No remarks",
    },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Activity Log"
      subTitle={transactionCode.trim() || ""}
      showSave={false}
      width={950}
    >
      <Box sx={{ pb: 1 }}>
        {/* Table Wrapper with Scroll */}
        <Box>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : transactionHistory.length > 0 ? (
            <CustomTable
              columns={columns}
              rows={transactionHistory}
              loading={loading}
              enableSorting={false}
              rowsPerPage={1000} // Show all entries with scroll
            />
          ) : (
            <Typography
              align="center"
              color="text.secondary"
              sx={{ py: 3, fontSize: "0.9rem" }}
            >
              No transaction history found.
            </Typography>
          )}
        </Box>
      </Box>
    </ModalContainer>
  );
}

export default TransactionHistoryModal;
