import React, { useState, useEffect } from "react";
import { Box, Skeleton } from "@mui/material";
import { ReceiptLongOutlined, ShoppingCart } from "@mui/icons-material";

const getBadgeSize = (sm) => (sm ? 24 : 22);

export function StampIcon({ config, sm, c }) {
  const size = getBadgeSize(sm);
  const iconSize = sm ? "0.9rem" : "0.8rem";
  const fontSize = sm ? "0.45rem" : "0.4rem";
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  useEffect(() => {
    if (!config || config.type !== "multi") return;
    const badges = config.badges;
    if (!badges || badges.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBadgeIndex((prev) => (prev + 1) % badges.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [config]);

  if (!config)
    return (
      <Skeleton
        variant="circular"
        width={size}
        height={size}
        sx={{ flexShrink: 0, bgcolor: c.borderRow }}
      />
    );

  if (config.type === "multi") {
    const visibleBadge = config.badges[currentBadgeIndex];
    return (
      <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <SingleStampBadge
          badge={visibleBadge}
          sm={sm}
          size={size}
          fontSize={fontSize}
        />
      </Box>
    );
  }

  if (config.label === "CART") {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `2px solid ${config.color}`,
          outline: `1px solid ${config.color}`,
          outlineOffset: "2px",
          boxShadow: `0 0 0 1px ${config.inner}`,
          backgroundColor: config.bg,
        }}
      >
        <ShoppingCart sx={{ fontSize: iconSize, color: config.color }} />
      </Box>
    );
  }

  return (
    <SingleStampBadge badge={config} sm={sm} size={size} fontSize={fontSize} />
  );
}

export function BadgeCycler({ showVoucher, isVoucherActive, stampConfig, sm, c }) {
  const slots = [];
  if (showVoucher) slots.push("voucher");
  slots.push("stamp");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (slots.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slots.length);
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVoucher]);

  const current = slots[index % slots.length];
  const containerSize = getBadgeSize(sm);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: containerSize,
        height: containerSize,
      }}
    >
      {current === "voucher" ? (
        <VoucherBadge isActive={isVoucherActive} sm={sm} c={c} />
      ) : (
        <StampIcon config={stampConfig} sm={sm} c={c} />
      )}
    </Box>
  );
}

export function SingleStampBadge({ badge, sm, size, fontSize }) {
  const pctFontSize = sm ? "0.42rem" : "0.38rem";
  const lblFontSize = sm ? "0.33rem" : "0.30rem";

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `2px solid ${badge.border}`,
        outline: `1px solid ${badge.border}`,
        outlineOffset: "2px",
        boxShadow: `0 0 0 1px ${badge.inner}`,
        backgroundColor: badge.bg,
      }}
    >
      {badge.pct != null ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "rotate(-12deg)",
            gap: "1px",
          }}
        >
          <Box
            sx={{
              fontSize: pctFontSize,
              fontWeight: 900,
              color: badge.color,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {badge.pct}%
          </Box>
          <Box
            sx={{
              fontSize: lblFontSize,
              fontWeight: 800,
              color: badge.color,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {badge.label}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            fontSize,
            fontWeight: 900,
            color: badge.color,
            backgroundColor: badge.bg,
            border: `2px solid ${badge.border}`,
            borderRadius: "4px",
            px: sm ? 0.4 : 0.3,
            py: sm ? 0.2 : 0.15,
            lineHeight: 1.3,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transform: "rotate(-15deg)",
            boxShadow: `inset 0 0 0 1px ${badge.inner}`,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {badge.label}
        </Box>
      )}
    </Box>
  );
}

export function VoucherBadge({ isActive, sm, c }) {
  const color = isActive ? c.blueText : c.greenText;
  const size = getBadgeSize(sm);
  const iconSize = sm ? "1rem" : "0.9rem";

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        gap: 0,
      }}
    >
      <ReceiptLongOutlined sx={{ fontSize: iconSize, color }} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 0.8,
        }}
      >
        <Box
          sx={{
            fontSize: sm ? "0.32rem" : "0.30rem",
            fontWeight: 800,
            color,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {isActive ? "OPEN" : "CLOSED"}
        </Box>
        <Box
          sx={{
            fontSize: sm ? "0.30rem" : "0.28rem",
            fontWeight: 700,
            color,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          VOUCHER
        </Box>
      </Box>
    </Box>
  );
}