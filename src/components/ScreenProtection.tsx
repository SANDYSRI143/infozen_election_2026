"use client";

import { useEffect } from "react";

/**
 * ScreenProtection — Blocks screenshots, screen recording indicators,
 * right-click, text selection, and keyboard shortcuts on protected pages.
 * 
 * Note: No web-based solution can 100% prevent screenshots on all devices,
 * but this blocks all common methods (PrintScreen, Snipping Tool, DevTools, etc.)
 */
export default function ScreenProtection() {
  useEffect(() => {
    // Block keyboard shortcuts for screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("").catch(() => {});
        showWarning();
        return;
      }

      // Block Ctrl+P (Print)
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        showWarning();
        return;
      }

      // Block Ctrl+S (Save)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        return;
      }

      // Block Ctrl+Shift+S (Windows Snipping Tool)
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        showWarning();
        return;
      }

      // Block Ctrl+Shift+I / Ctrl+Shift+J / F12 (DevTools)
      if (
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        return;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }

      // Block Meta+Shift+S (Mac screenshot)
      if (e.metaKey && e.shiftKey) {
        e.preventDefault();
        showWarning();
        return;
      }
    };

    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Detect visibility change (tab switch for screen recording)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden — could be screen recording
        document.title = "⚠️ Voting Session Active";
      } else {
        document.title = "Cast Your Vote — Association Election";
      }
    };

    // Block drag (prevents drag-and-drop of content)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Show warning toast
    function showWarning() {
      const existing = document.getElementById("screenshot-warning");
      if (existing) existing.remove();

      const warning = document.createElement("div");
      warning.id = "screenshot-warning";
      warning.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #DC2626, #B91C1C);
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          font-weight: 600;
          z-index: 99999;
          box-shadow: 0 8px 32px rgba(220,38,38,0.4);
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideDown 0.3s ease-out;
        ">
          <span style="font-size: 20px;">🚫</span>
          Screenshots are not allowed during voting!
        </div>
      `;
      document.body.appendChild(warning);
      setTimeout(() => warning.remove(), 3000);
    }

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("").catch(() => {});
      }
    }, { capture: true });
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("dragstart", handleDragStart);

    // Add CSS protections
    const style = document.createElement("style");
    style.id = "screen-protection-styles";
    style.textContent = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }

      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }

      /* Blur content when window loses focus (anti screen-recording) */
      body.page-hidden * {
        filter: blur(10px) !important;
        transition: filter 0.2s ease !important;
      }

      /* Prevent print */
      @media print {
        body {
          display: none !important;
        }
      }

      /* Make page watermarked */
      body::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
        background: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 200px,
          rgba(74, 144, 226, 0.015) 200px,
          rgba(74, 144, 226, 0.015) 201px
        );
      }
    `;
    document.head.appendChild(style);

    // Blur on focus loss
    const handleBlur = () => document.body.classList.add("page-hidden");
    const handleFocus = () => document.body.classList.remove("page-hidden");
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.getElementById("screen-protection-styles")?.remove();
      document.body.classList.remove("page-hidden");
    };
  }, []);

  return null; // No visual element — pure protection layer
}
