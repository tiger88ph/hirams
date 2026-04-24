import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowBack, Visibility } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import PageLayout from "../../../components/common/PageLayout";
import BaseButton from "../../../components/common/BaseButton";
import InfoDialog from "../../../components/common/InfoDialog";
import api from "../../../utils/api/api";
import { Business } from "@mui/icons-material";

const ProgressBar = ({ value = 50 }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
    <Box
      sx={{
        flex: 1,
        height: 10,
        background: "#e2e8f0",
        borderRadius: "99px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: `${value}%`,
          height: "100%",
          background:
            value === 100
              ? "linear-gradient(90deg, #16a34a, #22c55e)"
              : "linear-gradient(90deg, #1d4ed8, #3b82f6)",
          borderRadius: "99px",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)",
            backgroundSize: "20px 20px",
            animation: value < 100 ? "slide 0.6s linear infinite" : "none",
          },
          "@keyframes slide": {
            from: { backgroundPosition: "0 0" },
            to: { backgroundPosition: "20px 0" },
          },
          transition: "width 0.4s ease",
        }}
      />
    </Box>
    <Typography
      sx={{
        fontSize: "0.68rem",
        fontWeight: 700,
        color: value === 100 ? "#16a34a" : "#1d4ed8",
        minWidth: 34,
        textAlign: "right",
      }}
    >
      {value}%
    </Typography>
  </Box>
);

// ── Static "Add to Cart" badge ──
const AddToCartBadge = () => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      px: 1.15,
      py: 0.25,
      borderRadius: "99px",
      background: "#fef9c3",
      border: "0.5px solid #fde047",
      color: "#854d0e",
      fontSize: "0.52rem",
      fontWeight: 400,
      whiteSpace: "nowrap",
      letterSpacing: "0.02em",
    }}
  >
    ADD TO CART
  </Box>
);

function TransactionForPurchase() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { currentStatusLabel, transaction, selectedStatusCode } = state || {};
  const transactionCode =
    transaction?.strCode ||
    transaction?.transactionId ||
    transaction?.transactionCode ||
    "";

  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    const txnId = transaction?.nTransactionId ?? transaction?.id;
    if (!txnId) return;
    api
      .get(`transactions/${txnId}/items`)
      .then((res) =>
        setItems(
          (res.items || []).map((item) => ({
            ...item,
            purchaseOptions: item.purchaseOptions || [],
          })),
        ),
      )
      .catch(console.error)
      .finally(() => setItemsLoading(false));
  }, [transaction?.nTransactionId, transaction?.id]);

  const cardSx = {
    background: "#fff",
    border: "0.5px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  };

  return (
    <PageLayout
      title="Transaction"
      subtitle={`/ ${currentStatusLabel} / ${transactionCode}`}
      loading={itemsLoading}
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* ── Info header ── */}
        <InfoDialog p={1.5} mb={0}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                background: "#0369a1",
                borderRadius: "7px",
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Business sx={{ color: "white", fontSize: "1rem" }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.2 }}
              >
                <Box
                  sx={{
                    fontSize: "0.65rem",
                    background: "#bae6fd",
                    color: "#0c4a6e",
                    border: "0.5px solid #7dd3fc",
                    borderRadius: "5px",
                    px: 1,
                    py: 0.3,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    fontWeight: 600,
                  }}
                >
                  # {transactionCode}
                </Box>
                <Box
                  sx={{
                    fontSize: "0.6rem",
                    background: "#dbeafe",
                    color: "#1e40af",
                    border: "0.5px solid #bfdbfe",
                    borderRadius: "5px",
                    px: 0.75,
                    py: 0.3,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {currentStatusLabel}
                </Box>
              </Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontStyle: "italic",
                  color: "#0369a1",
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "left",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontWeight: 700,
                    fontStyle: "normal",
                    color: "#0c4a6e",
                  }}
                >
                  {transaction?.clientName || "—"}
                </Box>
                <Box
                  component="span"
                  sx={{ mx: 0.5, color: "#7dd3fc", fontStyle: "normal" }}
                >
                  :
                </Box>
                {transaction?.strTitle || transaction?.transactionName || "—"}
              </Typography>
            </Box>
          </Box>
        </InfoDialog>

        {/* ── Items list ── */}
        {items.length === 0 && !itemsLoading ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "#94a3b8",
              fontSize: "0.75rem",
              fontStyle: "italic",
            }}
          >
            No items available.
          </Box>
        ) : (
          <Box sx={cardSx}>
            {/* Col header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1.5,
                py: 0.75,
                background: "#f8fafc",
                borderBottom: "0.5px solid #e2e8f0",
                fontSize: "0.68rem",
                fontWeight: 600,
                color: "#94a3b8",
                gap: 1,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <Box sx={{ flex: 0.3, textAlign: "center" }}>#</Box>
              <Box sx={{ flex: 2, textAlign: "center" }}>Item</Box>
              <Box sx={{ flex: 4, textAlign: "center" }}>Progress</Box>
              <Box sx={{ flex: 2, textAlign: "center" }}>Status</Box>  {/* ← NEW */}
              <Box sx={{ flex: 1, textAlign: "center" }}>Action</Box>
            </Box>

            {items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  py: 1,
                  gap: 1,
                  borderBottom: "0.5px solid #f1f5f9",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Typography
                  sx={{
                    flex: 0.3,
                    fontSize: "0.71rem",
                    color: "#0369a1",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {item.nItemNumber}.
                </Typography>

                <Box sx={{ flex: 2, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "#1e293b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </Typography>
                </Box>

                <Box sx={{ flex: 4 }}>
                  <ProgressBar value={50} />
                </Box>

                {/* ── Status cell ── */}
                <Box
                  sx={{
                    flex: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <AddToCartBadge />
                </Box>

                <Box
                  sx={{ flex: 1, display: "flex", justifyContent: "center" }}
                >
                  <BaseButton
                    icon={<Visibility />}
                    tooltip="View"
                    size="small"
                    actionColor="view"
                    onClick={() => {
                      /* hook up action */
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </PageLayout>
  );
}

export default TransactionForPurchase;