import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";

function TransactionHistoryModal({ open, onClose, transactionId }) {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ get status mapping from your custom hook
  const { transacstatus } = useMapping();

  useEffect(() => {
    if (!open || !transactionId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`transactions/${transactionId}/history`);
        const { history } = response.data || response; // handle both fetch/axios
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

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction History"
      width={950}
      showSave={false}
    >
      <Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2,
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            backgroundColor: "#fafafa",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "primary.main",
              textTransform: "uppercase",
              fontSize: "0.9rem",
            }}
          >
            Transaction Activity Log
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : transactionHistory.length > 0 ? (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Date Occurred
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionHistory.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        {item.dtOccur
                          ? new Date(item.dtOccur).toLocaleString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour12: true,
                            })
                          : "N/A"}
                      </TableCell>

                      <TableCell>
                        {transacstatus[item.nStatus] ||
                          `Unknown (${item.nStatus})`}
                      </TableCell>
                      <TableCell>{item.nUserId || "System"}</TableCell>
                      <TableCell>{item.strRemarks || "No remarks"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography
              align="center"
              color="text.secondary"
              sx={{ py: 3, fontSize: "0.9rem" }}
            >
              No transaction history found.
            </Typography>
          )}
        </Paper>
      </Box>
    </ModalContainer>
  );
}

export default TransactionHistoryModal;
