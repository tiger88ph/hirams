import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";

const useColors = (c) => ({
  bgColor: c.slate.outerBg,
  arrowColor: c.blue.text,
});

/**
 * UpDownIndicatorWidget
 *
 * Sticky indicator anchored to either the TOP or BOTTOM edge of a
 * scrollable element, chosen via `direction`. Each instance has a FIXED
 * arrow direction (up-widget always shows an up arrow, down-widget
 * always shows a down arrow) — what changes is VISIBILITY:
 *   - direction="up"   -> hidden while at the top (nothing above),
 *                          visible once scrolled down at all
 *   - direction="down" -> hidden while at the bottom (nothing below),
 *                          visible while there's more to scroll to
 *   - in the middle of a scrollable area -> both are visible
 *
 * IMPORTANT (how sticky positioning is made reliable):
 * `position: sticky` sticks based on an element's FLOW position within
 * its scrolling ancestor. Simply portaling into scrollRef.current always
 * appends at the end, which breaks "stick to top". We used to fix this
 * by manually moving the DOM node with insertBefore/appendChild — but
 * that fights React: whenever `children` re-renders inside the same
 * scroll container, React reconciles its own child list and can wipe
 * out or reorder a node it doesn't know about.
 *
 * Instead: the scroll container must be a `display:flex; flex-direction:
 * column` box. Browsers resolve a sticky element's flow position using
 * FLEX ORDER, not raw DOM order — so we portal normally (React-safe,
 * always appends, no manual DOM writes) and just set `order: -1` for
 * "up" (always visually first) and `order: 1` for "down" (always
 * visually last). Your scroll container needs `flex flex-col` (or the
 * sx equivalent) for this to work — see usage note below.
 *
 * Usage:
 *   const scrollRef = useRef(null);
 *   <div
 *     ref={scrollRef}
 *     style={{ overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }}
 *   >
 *     ...scrollable content...
 *   </div>
 *   <UpDownIndicatorWidget scrollRef={scrollRef} direction="up" />
 *   <UpDownIndicatorWidget scrollRef={scrollRef} direction="down" />
 *
 * Props:
 *  - scrollRef:   ref object pointing at the scrollable element (required)
 *  - direction:   "up" | "down" (default: "down")
 *  - bgColor:     optional override for the fade gradient color
 *  - arrowColor:  optional override for the chevron arrow color
 *  - threshold:   px tolerance used to detect "at edge" (default: 4)
 *  - hintHeight:  height in px of the hint bar (default: 40)
 *  - arrowSize:   width in px of the arrow icon (default: 18)
 *  - watch:       optional array of deps that should trigger a re-check
 */
const UpDownIndicatorWidget = ({
  scrollRef,
  direction = "down",
  bgColor,
  arrowColor,
  threshold = 4,
  hintHeight = 40,
  arrowSize = 20,
  watch = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const resolvedBgColor = bgColor ?? colors.bgColor;
  const resolvedArrowColor = arrowColor ?? colors.arrowColor;

  const [mountEl, setMountEl] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // Pick up the scroll element once it's attached to the DOM (and if it
  // ever changes). Safe to run every render — setState bails out if the
  // value hasn't actually changed, so this won't loop.
  useEffect(() => {
    if (scrollRef?.current !== mountEl) {
      setMountEl(scrollRef?.current || null);
    }
  });

  const checkScroll = useCallback(() => {
    const el = scrollRef?.current;
    if (!el) return;

    const scrollable = el.scrollHeight - el.clientHeight > threshold;
    if (!scrollable) {
      setShowHint(false);
      return;
    }

    if (direction === "up") {
      const atTop = el.scrollTop < threshold;
      setShowHint(!atTop); // hide when nothing above
    } else {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setShowHint(!atBottom); // hide when nothing below
    }
  }, [scrollRef, threshold, direction]);

  const handleClick = () => {
    const el = scrollRef?.current;
    if (!el) return;
    if (direction === "up") {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };
useEffect(() => {
  const el = scrollRef?.current;
  if (!el) return;

  checkScroll();
  const raf1 = requestAnimationFrame(checkScroll);
  const t1 = setTimeout(checkScroll, 150);
  const t2 = setTimeout(checkScroll, 500);

  el.addEventListener("scroll", checkScroll, { passive: true });
  window.addEventListener("resize", checkScroll);

  let resizeObserver;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
  }

  // ✅ ResizeObserver only catches el's own box resizing, not its
  // scrollHeight changing from content mutations (items added/removed,
  // sections collapsing, etc.) while el's outer size stays fixed.
  // MutationObserver catches exactly that case.
  let mutationObserver;
  if (typeof MutationObserver !== "undefined") {
    mutationObserver = new MutationObserver(checkScroll);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  return () => {
    cancelAnimationFrame(raf1);
    clearTimeout(t1);
    clearTimeout(t2);
    el.removeEventListener("scroll", checkScroll);
    window.removeEventListener("resize", checkScroll);
    if (resizeObserver) resizeObserver.disconnect();
    if (mutationObserver) mutationObserver.disconnect();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [checkScroll, mountEl, ...watch]);
  if (!mountEl) return null;

  const content = (
    <>
      <style>{`
        @keyframes udiw-arrow-fade {
          0%   { opacity: 0; }
          40%  { opacity: 1; }
          80%  { opacity: 0; }
          100% { opacity: 0; }
        }
        .udiw-arrows path {
          fill: transparent;
          stroke-width: 4px;
          animation: udiw-arrow-fade 2s infinite;
        }
        .udiw-arrows path.udiw-a1 { animation-delay: -1s; }
        .udiw-arrows path.udiw-a2 { animation-delay: -0.5s; }
        .udiw-arrows path.udiw-a3 { animation-delay: 0s; }
      `}</style>

      <Box
        sx={{
          position: "sticky",
          ...(direction === "up"
            ? { top: 0, order: -1 }
            : { bottom: 0, order: 1 }),
          height: 0,
          flexShrink: 0,
          width: "100%",
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        <Box
          onClick={handleClick}
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            ...(direction === "up" ? { top: 0, pt: 1 } : { bottom: 0, pb: 1 }),
            height: hintHeight,
            display: "flex",
            alignItems: direction === "up" ? "flex-start" : "flex-end",
            justifyContent: "center",
            background:
              direction === "up"
                ? `linear-gradient(to top, transparent, ${resolvedBgColor} 75%)`
                : `linear-gradient(to bottom, transparent, ${resolvedBgColor} 75%)`,
            opacity: showHint ? 1 : 0,
            pointerEvents: showHint ? "auto" : "none",
            transition: "opacity 0.25s ease",
            cursor: "pointer",
          }}
        >
          {/* "up" widget: arrow always points UP. "down" widget: arrow always points DOWN. */}
          <svg
            className="udiw-arrows"
            width={arrowSize}
            height={arrowSize * 1.2}
            viewBox="0 0 60 72"
            style={{
              display: "block",
              ...(direction === "up" ? { transform: "scaleY(-1)" } : {}),
            }}
          >
            <path
              className="udiw-a1"
              stroke={resolvedArrowColor}
              d="M0 0 L30 32 L60 0"
            />
            <path
              className="udiw-a2"
              stroke={resolvedArrowColor}
              d="M0 20 L30 52 L60 20"
            />
            <path
              className="udiw-a3"
              stroke={resolvedArrowColor}
              d="M0 40 L30 72 L60 40"
            />
          </svg>
        </Box>
      </Box>
    </>
  );

  return createPortal(content, mountEl);
};

export default UpDownIndicatorWidget;
