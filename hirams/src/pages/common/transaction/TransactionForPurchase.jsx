import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBack, Construction } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import PageLayout from "../../../components/common/PageLayout";
import BaseButton from "../../../components/common/BaseButton";

function TransactionForPurchase() {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Transaction"
      subtitle="/ For Purchase"
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <BaseButton
            label="Back"
            icon={<ArrowBack />}
            onClick={() => navigate(-1)}
            actionColor="back"
          />
        </Box>
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <Construction sx={{ fontSize: "3rem", color: "#94A3B8" }} />
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Under Development
        </Typography>
      </Box>
    </PageLayout>
  );
}

export default TransactionForPurchase;
