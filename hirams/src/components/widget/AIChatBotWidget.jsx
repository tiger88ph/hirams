import React, { useState, useCallback } from "react";
import { IconButton, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import AIChatBotPanel from "../../pages/ai-chatbot/component/AIChatBotPanel";
import AIChatBotModal from "../../pages/ai-chatbot/modal/AIChatBotModal";
import AIChatBotAPI from "../../api/endpoints/ai-chatbot.api";

/**
 * AIChatbotWidget
 *
 * Fully self-contained AI assistant entry point: owns open/closed state,
 * message history, and the send-to-API handler. Renders the floating
 * trigger button plus the desktop panel or mobile modal depending on
 * viewport. Consumers just drop <AIChatbotWidget /> in — no wiring needed.
 *
 * Props:
 *  - accentColor: hex/rgb used for the floating button background + glow
 */
function AIChatbotWidget({ accentColor = "#2563EB" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const handleSend = useCallback(
    async (text) => {
      const userMsg = { id: `u-${Date.now()}`, role: "user", text };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.text,
        }));
        const reply = await AIChatBotAPI.send(history);
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", text: reply },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: "Sorry, something went wrong reaching the AI service.",
          },
        ]);
      }
    },
    [messages],
  );

  return (
    <>
      {!isMobile && (
        <AIChatBotPanel
          open={open}
          onClose={() => setOpen(false)}
          messages={messages}
          onSend={handleSend}
        />
      )}

      {!open && (
        <Tooltip title="Ask AI" placement="left">
          <IconButton
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: accentColor,
              color: "#fff",
              overflow: "hidden",
              boxShadow: `0 4px 12px rgba(0,0,0,0.25), 0 0 0 0 ${accentColor}`,
              zIndex: 15,
              animation: "aiPulse 2.4s ease-out infinite",
              "@keyframes aiPulse": {
                "0%": { boxShadow: `0 4px 12px rgba(0,0,0,0.25), 0 0 0 0 ${accentColor}66` },
                "70%": { boxShadow: `0 4px 12px rgba(0,0,0,0.25), 0 0 0 12px ${accentColor}00` },
                "100%": { boxShadow: `0 4px 12px rgba(0,0,0,0.25), 0 0 0 0 ${accentColor}00` },
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-150%",
                width: "60%",
                height: "100%",
                background:
                  "linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent)",
                animation: "aiShine 2.8s ease-in-out infinite",
              },
              "@keyframes aiShine": {
                "0%": { left: "-150%" },
                "50%": { left: "150%" },
                "100%": { left: "150%" },
              },
              "&:hover": {
                backgroundColor: accentColor,
                filter: "brightness(0.92)",
                animationPlayState: "paused",
              },
            }}
          >
            <AutoAwesome
              fontSize="small"
              sx={{ position: "relative", zIndex: 1, animation: "aiSpark 1.8s ease-in-out infinite" }}
            />
            <style>{`
              @keyframes aiSpark {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.75; transform: scale(1.15); }
              }
            `}</style>
          </IconButton>
        </Tooltip>
      )}

      {isMobile && (
        <AIChatBotModal
          open={open}
          onClose={() => setOpen(false)}
          messages={messages}
          onSend={handleSend}
        />
      )}
    </>
  );
}

export default AIChatbotWidget;