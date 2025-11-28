import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import DotSpinner from "../../../../common/DotSpinner";

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

  const formatDate = (val) =>
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
      : "N/A";

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Activity Log"
      subTitle={transactionCode.trim() || ""}
      showSave={false}
      width={900}
    >
      <Box sx={{ pb: 1 }}>
        <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: "#444" }}>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Remarks</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 2 }}>
                    <Box display="flex" justifyContent="center" alignItems="center">
                      <DotSpinner size={10} gap={0.5} />
                      
                    </Box>
                  </TableCell>
                </TableRow>
              ) : transactionHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 3 }}>
                    <Typography align="center" color="text.secondary">
                      No transaction history found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactionHistory.map((row, index) => {
                  const isLatest = index === 0;
                  return (
                    <TableRow
                      key={index}
                      sx={{
                        background: isLatest ? "#333" : "#f4f4f4",
                        "& td": {
                          color: isLatest ? "white" : "#555",
                          paddingY: "4px",
                          fontSize: "0.82rem",
                        },
                      }}
                    >
                      <TableCell>{formatDate(row.dtOccur)}</TableCell>
                      <TableCell>{transacstatus[row.nStatus] || "Unknown"}</TableCell>
                      <TableCell>{row.nUserId || "System"}</TableCell>
                      <TableCell>{row.strRemarks || "No remarks"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </ModalContainer>
  );
}

export default TransactionHistoryModal;
