import React, { useState, useEffect } from "react";
import AlertDialog from "./AlertDialog";
import announcementHtml from "../../utils/announcement/example.txt?raw";

const SESSION_FLAG = "announcement_shown";

// Inline styles guarantee correct rendering regardless of Tailwind's
// class-scanning, since this markup lives in a .txt file, not a .jsx file.
const announcementStyles = `
  .ann-body h3 {
    font-size: 0.85rem;
    font-weight: 700;
    color: #0F172A;
    margin: 14px 0 6px;
  }
  .ann-body p {
    font-size: 0.8rem;
    color: #64748B;
    line-height: 1.6;
    margin: 0 0 8px;
  }
  .ann-body .status-flow {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0 14px;
  }
  .ann-body .chip {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .ann-body .chip-amber { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
  .ann-body .chip-violet { background: #F5F3FF; color: #7C3AED; border: 1px solid #DDD6FE; }
  .ann-body .chip-teal { background: #F0FDFA; color: #0F766E; border: 1px solid #99F6E4; }
  .ann-body .chip-blue { background: #F0F9FF; color: #0369A1; border: 1px solid #BAE6FD; }
  .ann-body .chip-green { background: #F0FDF4; color: #15803D; border: 1px solid #86EFAC; }
  .ann-body .arrow {
    font-size: 0.7rem;
    color: #CBD5E1;
  }
  .ann-body .callout {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-left: 3px solid #0566C7;
    border-radius: 6px;
    padding: 10px 12px;
    margin: 6px 0 14px;
  }
  .ann-body .callout p { margin: 0; }
  .ann-body .footer-note {
    font-size: 0.72rem;
    color: #94A3B8;
    margin-top: 4px;
  }
`;

function AnnouncementDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    if (!announcementHtml?.trim()) return;
    setOpen(true);
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(SESSION_FLAG, "1");
    setOpen(false);
  };

  if (!announcementHtml?.trim()) return null;

  // Extract <h2>...</h2> as the dialog title; strip it from the body
  const titleMatch = announcementHtml.match(/<h2>(.*?)<\/h2>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/&amp;/g, "&")
    : "Announcement";
  const bodyHtml = announcementHtml.replace(/<h2>.*?<\/h2>/i, "").trim();

  return (
    <AlertDialog
      open={open}
      onClose={handleClose}
      title={title}
      headerTitle="Announcement"
      type="info"
      maxWidth={660} // ← ADD
      message={
        <>
          <style>{announcementStyles}</style>
          <div
            className="ann-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </>
      }
      confirmText="Got it"
      onConfirm={handleClose}
    />
  );
}

export default AnnouncementDialog;
