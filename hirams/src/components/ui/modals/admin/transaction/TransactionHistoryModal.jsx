import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, useMediaQuery, useTheme } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import DotSpinner from "../../../../common/DotSpinner";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

function TransactionHistoryModal({
  open,
  onClose,
  transactionId,
  transactionCode,
}) {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { transacstatus } = useMapping();
  const theme = useTheme();

  // Define breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // mobile
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // tablet

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
      width={isMobile ? "100%" : 900}
      customLoading={loading}
    >
      <Box sx={{ position: "relative", width: "100%", py: 4 }}>
        {/* Timeline Line */}
        <Box
          sx={{
            position: "absolute",
            left: isMobile ? "20px" : "50%",
            top: 0,
            bottom: 0,
            width: "4px",
            bgcolor: "primary.main",
            transform: isMobile ? "none" : "translateX(-50%)",
            borderRadius: 2,
          }}
        />

        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.7)",
              zIndex: 20,
            }}
          >
            <DotSpinner size={18} />
          </Box>
        )}

        {!loading && transactionHistory.length === 0 && (
          <Typography align="center" sx={{ mt: 6 }} color="text.secondary">
            No transaction history found.
          </Typography>
        )}

        {!loading &&
          transactionHistory.map((row, index) => {
            const formattedDate = formatDate(row.dtOccur);
            const isLeft = !isMobile && index % 2 === 0;

            return (
              <Box
                key={index}
                sx={{
                  position: "relative",
                  mb: 3, // reduce vertical gap from 6 -> 3
                  display: "flex",
                  justifyContent: isMobile
                    ? "flex-start"
                    : isLeft
                      ? "flex-start"
                      : "flex-end",
                  pr: isMobile ? 0 : isLeft ? "50%" : 0,
                  pl: isMobile ? 0 : isLeft ? 0 : "50%",
                  px: 1,
                }}
              >
                {/* Timeline Dot */}
                <Box
                  sx={{
                    position: "absolute",
                    left: isMobile ? 14 : "50%",
                    top: 16, // reduce from 20 -> 16
                    width: 16,
                    height: 16,
                    bgcolor: "background.paper",
                    border: "4px solid",
                    borderColor: "primary.main",
                    borderRadius: "50%",
                    transform: isMobile ? "none" : "translateX(-50%)",
                    zIndex: 10,
                    boxShadow: 1,
                  }}
                />

                {/* Horizontal connecting line */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 24, // reduce from 28 -> 24
                    left: isMobile ? 30 : "50%",
                    width: isMobile ? "calc(100% - 60px)" : "45%",
                    height: "2px",
                    bgcolor: "#B0B0B0",
                    transform: isMobile
                      ? "none"
                      : isLeft
                        ? "translateX(-100%)"
                        : "translateX(0)",
                    zIndex: 1,
                  }}
                />

                <Paper
                  elevation={3}
                  sx={{
                    width: isMobile ? "calc(100% - 60px)" : "45%",
                    p: 1.5, // slightly smaller padding
                    borderRadius: 2, // slightly smaller radius
                    bgcolor: "background.paper",
                    borderLeft:
                      !isMobile && isLeft ? "4px solid primary.main" : "none",
                    borderRight:
                      !isMobile && !isLeft ? "4px solid primary.main" : "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s",
                    ml: isMobile ? "40px" : 0,
                    position: "relative",
                    zIndex: 2,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 400, color: "primary.main" }}
                  >
                    {transacstatus[row.nStatus] || "Unknown Status"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", mb: 1 }}
                  >
                    {row.strRemarks || "No remarks"}
                  </Typography>

                  {/* Bottom info: responsive alignment */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile || isTablet ? "column" : "row",
                      justifyContent:
                        isMobile || isTablet ? "flex-start" : "space-between",
                      mt: 2,
                      alignItems:
                        isMobile || isTablet ? "flex-start" : "center",
                      gap: isMobile || isTablet ? 0.5 : 0,
                    }}
                  >
                    {/* User */}
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <PersonIcon
                        sx={{
                          fontSize: isMobile || isTablet ? 12 : 14,
                          color: "text.secondary",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: isMobile || isTablet ? 10 : 12,
                        }}
                      >
                        {row.nUserId || "System"}
                      </Typography>
                    </Box>

                    {/* Date */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: isMobile || isTablet ? 0.5 : 0, // spacing in stacked view
                      }}
                    >
                      <CalendarTodayIcon
                        sx={{
                          fontSize: isMobile || isTablet ? 12 : 14,
                          color: "text.secondary",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: isMobile || isTablet ? 10 : 12,
                        }}
                      >
                        {formattedDate}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            );
          })}
      </Box>
    </ModalContainer>
  );
}

export default TransactionHistoryModal;
