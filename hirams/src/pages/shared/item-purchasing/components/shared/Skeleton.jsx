import { useTheme } from "@mui/material/styles";
import { Box, Skeleton } from "@mui/material";
import {
  StoreOutlined,
  LocalShippingOutlined,
  ReceiptLongOutlined,
  AccountCircleOutlined,
} from "@mui/icons-material";
import getThemeColors from "../../../../../utils/style/getThemeColors";

// ── Pulse keyframes (theme-aware) ─────────────────────────────────────────────
const getPulseStyles = (isDark) => `
  @keyframes pulseCard {
    0%, 100% { opacity: 1; }
    50% { opacity: ${isDark ? 0.75 : 0.82}; }
  }
  @keyframes cart-update-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: ${isDark ? 0.78 : 0.85}; }
  }
`;

// ── Purchase Cart Skeleton Preloader ──────────────────────────────────────────
export function CartSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const c = getThemeColors(isDark);
  const cardCount = 6;

  const SkeletonPOCard = ({ index }) => (
    <Box
      sx={{
        border: `0.5px solid ${c.slate.border}`,
        borderRadius: 2,
        overflow: "hidden",
        background: c.slate.outerBg,
        boxShadow: isDark
          ? "0 1px 4px rgba(0,0,0,0.25)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        animation: `pulseCard 1.8s ease-in-out ${index * 0.08}s infinite`,
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.875,
          background: c.slate.itemHeaderBg,
          borderBottom: `0.5px solid ${c.slate.border}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.15,
            mr: 0.7,
          }}
        >
          <Skeleton
            variant="circular"
            width={14}
            height={14}
            sx={{ bgcolor: c.skeleton.skelLight }}
          />
          <Skeleton
            variant="text"
            width={22}
            height={6}
            sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
          />
        </Box>
        <Skeleton
          variant="circular"
          width={22}
          height={22}
          sx={{ flexShrink: 0, bgcolor: c.skeleton.skelLight }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.35 }}
          >
            <Skeleton
              variant="circular"
              width={12}
              height={12}
              sx={{ bgcolor: c.skeleton.skelLight }}
            />
            <Skeleton
              variant="text"
              width="60%"
              height={10}
              sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Skeleton
              variant="rounded"
              width={90}
              height={16}
              sx={{ bgcolor: c.skeleton.skelLight, borderRadius: "50px" }}
            />
            <Skeleton
              variant="rounded"
              width={70}
              height={16}
              sx={{ bgcolor: c.skeleton.skelLight, borderRadius: "50px" }}
            />
          </Box>
        </Box>
        <Skeleton
          variant="text"
          width={60}
          height={10}
          sx={{ bgcolor: c.skeleton.skelLight, flexShrink: 0, my: 0 }}
        />
        <Skeleton
          variant="circular"
          width={22}
          height={22}
          sx={{ flexShrink: 0, bgcolor: c.skeleton.skelLight }}
        />
      </Box>

      {/* Expanded body */}
      <Box sx={{ maxHeight: 220, overflow: "hidden" }}>
        {[0, 1].map((row) => (
          <Box
            key={row}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1.5,
              py: 1,
              borderBottom: row < 1 ? `0.5px solid ${c.slate.divider}` : "none",
              gap: 0.75,
            }}
          >
            <Skeleton
              variant="text"
              width={14}
              height={10}
              sx={{ bgcolor: c.skeleton.skelLight, flexShrink: 0, my: 0 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.2,
                }}
              >
                <Skeleton
                  variant="rounded"
                  width={44}
                  height={14}
                  sx={{ bgcolor: c.skeleton.skelLight, borderRadius: "3px" }}
                />
                <Skeleton
                  variant="text"
                  width="55%"
                  height={10}
                  sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                />
              </Box>
              <Skeleton
                variant="text"
                width="80%"
                height={8}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
              />
              <Skeleton
                variant="text"
                width="45%"
                height={6}
                sx={{ bgcolor: c.skeleton.skelFaint, my: 0, mt: 0.2 }}
              />
            </Box>
            <Skeleton
              variant="text"
              width={50}
              height={10}
              sx={{ bgcolor: c.skeleton.skelLight, flexShrink: 0, my: 0 }}
            />
            <Skeleton
              variant="rounded"
              width={44}
              height={22}
              sx={{
                bgcolor: c.skeleton.skelLight,
                flexShrink: 0,
                borderRadius: "4px",
              }}
            />
            <Skeleton
              variant="text"
              width={56}
              height={10}
              sx={{ bgcolor: c.skeleton.skelLight, flexShrink: 0, my: 0 }}
            />
            {row === 0 && index % 2 === 0 && (
              <Skeleton
                variant="rounded"
                width={22}
                height={22}
                sx={{ bgcolor: c.red.bg, flexShrink: 0, borderRadius: "6px" }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Footer bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.875,
          background: c.slate.innerBg,
          borderTop: `0.5px solid ${c.slate.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
          <Skeleton
            variant="circular"
            width={10}
            height={10}
            sx={{ bgcolor: c.skeleton.skelLight }}
          />
          <Skeleton
            variant="text"
            width={90}
            height={8}
            sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
          />
        </Box>
        <Skeleton
          variant="rounded"
          width={60}
          height={22}
          sx={{ bgcolor: c.skeleton.skelLight, borderRadius: "6px" }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <style>{getPulseStyles(isDark)}</style>
      {/* Mobile */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 0.5,
          width: "100%",
        }}
      >
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonPOCard key={i} index={i} />
        ))}
      </Box>
      {/* Desktop: 2-column grid */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "row",
          gap: 0.5,
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        {[0, 1].map((col) => (
          <Box
            key={col}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            {Array.from({ length: cardCount / 2 }).map((_, i) => (
              <SkeletonPOCard key={i} index={col * 3 + i} />
            ))}
          </Box>
        ))}
      </Box>
    </>
  );
}

// ── Purchase Cart Update Page Skeleton ────────────────────────────────────────
export function CartUpdateSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const c = getThemeColors(isDark);
  const lineItemCount = 3;

  return (
    <>
      <style>{getPulseStyles(isDark)}</style>

      {/* Stepper */}
      <Box
        sx={{
          background: c.slate.itemHeaderBg,
          borderBottom: `0.5px solid ${c.slate.border}`,
          px: 2,
          pt: 1.25,
          pb: 1.75,
          mb: 0.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.25,
          }}
        >
          <Skeleton
            variant="text"
            width={90}
            height={10}
            sx={{ bgcolor: c.skeleton.skelLight }}
          />
          <Skeleton
            variant="text"
            width={40}
            height={10}
            sx={{ bgcolor: c.skeleton.skelLight }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Skeleton
                variant="circular"
                width={22}
                height={22}
                sx={{ bgcolor: c.skeleton.skelLight }}
              />
              <Skeleton
                variant="text"
                width="70%"
                height={9}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
              />
              <Skeleton
                variant="text"
                width="50%"
                height={8}
                sx={{ bgcolor: c.skeleton.skelFaint, my: 0 }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Header Cards: Company | Supplier | Print */}
      <Box sx={{ pt: 2, pb: 1 }}>
        <Box
          sx={{
            background: c.slate.totalBg,
            border: `1px solid ${c.slate.border}`,
            borderRadius: "16px",
            p: 1.5,
            animation: "cart-update-pulse 1.8s ease-in-out infinite",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
            {/* Company */}
            <Box
              sx={{
                flex: 1,
                px: 1,
                py: 0.75,
                borderRadius: "8px",
                background: c.slate.innerBg,
                border: `0.5px solid ${c.slate.border}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  mb: 0.3,
                }}
              >
                <StoreOutlined
                  sx={{ fontSize: "0.6rem", color: c.slate.mutedColor }}
                />
                <Skeleton
                  variant="text"
                  width={55}
                  height={8}
                  sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                />
              </Box>
              <Skeleton
                variant="text"
                width="80%"
                height={10}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0, mb: 0.2 }}
              />
              <Skeleton
                variant="text"
                width="65%"
                height={7}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0, mb: 0.2 }}
              />
              <Skeleton
                variant="text"
                width="45%"
                height={7}
                sx={{ bgcolor: c.skeleton.skelFaint, my: 0 }}
              />
            </Box>

            {/* Supplier */}
            <Box
              sx={{
                flex: 1,
                px: 1,
                py: 0.75,
                borderRadius: "8px",
                background: c.slate.innerBg,
                border: `0.5px solid ${c.slate.border}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  mb: 0.3,
                }}
              >
                <LocalShippingOutlined
                  sx={{ fontSize: "0.6rem", color: c.slate.mutedColor }}
                />
                <Skeleton
                  variant="text"
                  width={55}
                  height={8}
                  sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                />
              </Box>
              <Skeleton
                variant="text"
                width="75%"
                height={10}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0, mb: 0.2 }}
              />
              <Skeleton
                variant="text"
                width="60%"
                height={7}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0, mb: 0.2 }}
              />
              <Skeleton
                variant="text"
                width="40%"
                height={7}
                sx={{ bgcolor: c.skeleton.skelFaint, my: 0 }}
              />
            </Box>

            {/* Print PO */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0.5,
                px: 1,
                py: 0.75,
                borderRadius: "8px",
                background: c.slate.innerBg,
                border: `0.5px solid ${c.slate.border}`,
                minWidth: "140px",
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.35,
                    mb: 0.2,
                  }}
                >
                  <ReceiptLongOutlined
                    sx={{ fontSize: "0.7rem", color: c.slate.mutedColor }}
                  />
                  <Skeleton
                    variant="text"
                    width={70}
                    height={10}
                    sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.3,
                  }}
                >
                  <AccountCircleOutlined
                    sx={{ fontSize: "0.7rem", color: c.slate.mutedColor }}
                  />
                  <Skeleton
                    variant="text"
                    width={55}
                    height={8}
                    sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                  />
                </Box>
              </Box>
              <Skeleton
                variant="rounded"
                width="100%"
                height={26}
                sx={{ bgcolor: c.skeleton.skelLight, borderRadius: "6px" }}
              />
            </Box>
          </Box>

          {/* Shipping + Payment */}
          <Box
            sx={{ mt: 1, display: "flex", gap: 1, alignItems: "flex-start" }}
          >
            <Box
              sx={{
                flex: 1,
                px: 1.25,
                py: 1.25,
                borderRadius: "8px",
                background: c.slate.innerBg,
                border: `0.5px solid ${c.slate.border}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <LocalShippingOutlined
                sx={{
                  fontSize: "0.85rem",
                  color: c.slate.mutedColor,
                  flexShrink: 0,
                  mt: 0.1,
                }}
              />
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Skeleton
                  variant="text"
                  width={80}
                  height={7}
                  sx={{
                    bgcolor: c.skeleton.skelLight,
                    my: 0,
                    mb: 0.15,
                    flexShrink: 0,
                  }}
                />
                <Skeleton
                  variant="text"
                  width="90%"
                  height={8}
                  sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                />
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                px: 1.25,
                py: 1.25,
                borderRadius: "8px",
                background: c.slate.innerBg,
                border: `0.5px solid ${c.slate.border}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <ReceiptLongOutlined
                sx={{
                  fontSize: "0.85rem",
                  color: c.slate.mutedColor,
                  flexShrink: 0,
                  mt: 0.1,
                }}
              />
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Skeleton
                  variant="text"
                  width={80}
                  height={7}
                  sx={{
                    bgcolor: c.skeleton.skelLight,
                    my: 0,
                    mb: 0.15,
                    flexShrink: 0,
                  }}
                />
                <Skeleton
                  variant="text"
                  width="70%"
                  height={8}
                  sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Offers Header + Badges */}
      <Box
        sx={{
          pt: 1,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <Skeleton
          variant="text"
          width={45}
          height={8}
          sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
        />
        <Box sx={{ flex: 1, height: "0.5px", background: c.slate.border }} />
        <Skeleton
          variant="rounded"
          width={80}
          height={22}
          sx={{ bgcolor: c.orange.bg, borderRadius: "50px" }}
        />
        <Skeleton
          variant="rounded"
          width={70}
          height={22}
          sx={{ bgcolor: c.amber.bg, borderRadius: "50px" }}
        />
      </Box>

      {/* Line Items */}
      <Box
        sx={{
          mb: 1.5,
          borderRadius: "10px",
          border: `0.5px solid ${c.slate.border}`,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: lineItemCount }).map((_, idx) => (
          <Box
            key={idx}
            sx={{
              px: 1.5,
              py: 0.875,
              display: "flex",
              alignItems: "stretch",
              borderBottom:
                idx < lineItemCount - 1
                  ? `0.5px solid ${c.slate.divider}`
                  : "none",
              gap: 0.75,
              animation: `cart-update-pulse 1.8s ease-in-out ${idx * 0.1}s infinite`,
            }}
          >
            <Box
              sx={{
                width: 18,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 0.75,
                alignSelf: "center",
              }}
            >
              <Skeleton
                variant="text"
                width={14}
                height={10}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  mb: 0.2,
                }}
              >
                <Skeleton
                  variant="rounded"
                  width={44}
                  height={14}
                  sx={{ bgcolor: c.blue.bg, borderRadius: "3px" }}
                />
                <Skeleton
                  variant="text"
                  width="55%"
                  height={10}
                  sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
                />
              </Box>
              <Skeleton
                variant="text"
                width="80%"
                height={8}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0, mb: 0.1 }}
              />
              <Skeleton
                variant="text"
                width="45%"
                height={7}
                sx={{ bgcolor: c.skeleton.skelFaint, my: 0 }}
              />
            </Box>
            <Box
              sx={{
                width: 72,
                flexShrink: 0,
                textAlign: "right",
                alignSelf: "center",
                pr: 1,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Skeleton
                variant="text"
                width={50}
                height={10}
                sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
              />
            </Box>
            <Box
              sx={{
                width: 60,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Skeleton
                variant="rounded"
                width={44}
                height={22}
                sx={{ bgcolor: c.skeleton.skelLight, borderRadius: "4px" }}
              />
            </Box>
            <Box
              sx={{
                width: 80,
                flexShrink: 0,
                textAlign: "right",
                alignSelf: "center",
                pl: 1,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Skeleton
                variant="text"
                width={56}
                height={10}
                sx={{ bgcolor: c.amber.warnBg, my: 0 }}
              />
            </Box>
          </Box>
        ))}

        {/* Grand Total Footer */}
        <Box
          sx={{
            px: 1.5,
            py: 0.875,
            display: "flex",
            alignItems: "center",
            background: c.slate.innerBg,
          }}
        >
          <Skeleton
            variant="circular"
            width={34}
            height={34}
            sx={{ bgcolor: c.skeleton.skelLight, mr: 1, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton
              variant="text"
              width={70}
              height={10}
              sx={{ bgcolor: c.skeleton.skelLight, my: 0, mb: 0.1 }}
            />
            <Skeleton
              variant="text"
              width={50}
              height={7}
              sx={{ bgcolor: c.skeleton.skelLight, my: 0 }}
            />
          </Box>
          <Box sx={{ width: 44, flexShrink: 0 }} />
          <Box
            sx={{
              width: 80,
              flexShrink: 0,
              textAlign: "right",
              pl: 1,
              mr: 1.5,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Skeleton
              variant="text"
              width={60}
              height={12}
              sx={{ bgcolor: c.orange.text, my: 0 }}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}
