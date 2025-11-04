import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";

function TransactionHistoryModal({ open, onClose }) {
  // 🧾 Static transaction history data
  const transactionHistory = [
    {
      dtOccur: "2025-11-01 10:32 AM",
      nStatus: "Created",
      nUserId: "Juan Dela Cruz",
      strRemarks: "Initial transaction created",
    },
    {
      dtOccur: "2025-11-02 03:10 PM",
      nStatus: "Reviewed",
      nUserId: "Maria Santos",
      strRemarks: "Transaction details verified",
    },
    {
      dtOccur: "2025-11-03 09:45 AM",
      nStatus: "Approved",
      nUserId: "Carlos Reyes",
      strRemarks: "Transaction approved by AO",
    },
    {
      dtOccur: "2025-11-03 02:20 PM",
      nStatus: "Finalized",
      nUserId: "Admin User",
      strRemarks: "Transaction finalized successfully",
    },
  ];

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction History"
      width={800}
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

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date Occurred</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionHistory.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{item.dtOccur}</TableCell>
                    <TableCell>{item.nStatus}</TableCell>
                    <TableCell>{item.nUserId}</TableCell>
                    <TableCell>{item.strRemarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </ModalContainer>
  );
}

export default TransactionHistoryModal;
