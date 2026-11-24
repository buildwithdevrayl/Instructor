/* DARK MODE (self-contained: styles + toggle button)
   - Applies the saved theme before the page paints (no white flash).
   - First visit follows the device setting (light / dark).
   - Adds a sun/moon button; the choice is remembered in localStorage and
     separately for each portal (student, instructor, admin). */
(function () {
    var KEY = "cr_theme_instructor";   // each portal keeps its OWN dark-mode setting
    var root = document.documentElement;

    /* Dark colors are built into this file, so no extra css file is needed. */
    if (!document.getElementById("cr-dark-css")) {
        var darkStyle = document.createElement("style");
        darkStyle.id = "cr-dark-css";
        darkStyle.textContent = `
/* =========================================================
   CLASSROOMRESERVE - DARK MODE (student, instructor, admin)
   Load AFTER the page's own css. Everything dark lives under
   html[data-theme="dark"]; light mode is not touched.
========================================================= */

/* ---------- theme button (works in light + dark) ---------- */
.theme-toggle .i-sun { display: none; }
html[data-theme="dark"] .theme-toggle .i-sun { display: block; }
html[data-theme="dark"] .theme-toggle .i-moon { display: none; }
.theme-toggle svg { flex-shrink: 0; }

.s-actions { display: flex; align-items: center; gap: 8px; }
.s-refresh.s-theme { padding: 9px 11px; }


@media print { .theme-toggle, .theme-fab { display: none !important; } }

/* =========================================================
   DARK
========================================================= */
html[data-theme="dark"] { color-scheme: dark; }

html[data-theme="dark"] {
    /* shared palette */
    --d-bg: #0E1512;
    --d-surface: #16201B;
    --d-surface-2: #1C2924;
    --d-border: #2B3A33;
    --d-text: #E4EEE8;
    --d-muted: #93A69C;
    --d-accent: #5FD39A;          /* green used for text/icons on dark */

    /* student */
    --bg: var(--d-bg);
    --white: var(--d-surface);
    --line: var(--d-border);
    --text: var(--d-text);
    --muted: var(--d-muted);
    --ink: #E4EEE8;
    --green: #2E9B68;

    --free-bg: #12362A;  --free-line: #25664A;  --free-text: #6FDDA5;
    --part-bg: #3A2E12;  --part-line: #7A5B1E;  --part-text: #F0C676;
    --full-bg: #3A1D1F;  --full-line: #7A3A3C;  --full-text: #F29A9A;
    --past-bg: #1C2420;  --past-text: #6F8179;

    /* admin */
    --light: #1B3A2C;
    --border: var(--d-border);

    /* instructor */
    --background: var(--d-bg);
    --primary-light: #1B3A2C;
    --shadow: 0 3px 12px rgba(0, 0, 0, .35);
}

html[data-theme="dark"] body {
    background: var(--d-bg);
    color: var(--d-text);
}

html[data-theme="dark"] :focus-visible { outline-color: #3FAE7B; }
html[data-theme="dark"] ::placeholder { color: #6F8179; opacity: 1; }
html[data-theme="dark"] ::selection { background: #2E9B6866; }
html[data-theme="dark"] input,
html[data-theme="dark"] select,
html[data-theme="dark"] textarea { color: var(--d-text); }
html[data-theme="dark"] option { background: #16201B; color: var(--d-text); }

/* ---------------------------------------------------------
   STUDENT PORTAL
--------------------------------------------------------- */
html[data-theme="dark"] .s-header { background: #0B1511; border-bottom: 1px solid var(--d-border); }
html[data-theme="dark"] .s-logo { background: #17382B; }
html[data-theme="dark"] .s-brand strong { color: #fff; }
html[data-theme="dark"] .s-intro h1,
html[data-theme="dark"] .s-cal-head h2,
html[data-theme="dark"] .s-day h2,
html[data-theme="dark"] .s-booked h3 { color: var(--d-text); }

html[data-theme="dark"] .s-field select,
html[data-theme="dark"] .s-roominfo,
html[data-theme="dark"] .s-calendar,
html[data-theme="dark"] .s-day,
html[data-theme="dark"] .s-nav,
html[data-theme="dark"] .s-today,
html[data-theme="dark"] .s-legend li { background: var(--d-surface); }

html[data-theme="dark"] .s-roominfo img { background: #223029; }
html[data-theme="dark"] .s-nav { color: var(--d-accent); }
html[data-theme="dark"] .s-nav:hover { background: #1F3329; }
html[data-theme="dark"] .s-today { color: var(--d-accent); border-color: #2E9B68; }
html[data-theme="dark"] .s-today:hover { background: #2E9B68; color: #fff; }

html[data-theme="dark"] .s-notice { background: #3A2E12; border-color: #7A5B1E; color: #F0D9A5; }

html[data-theme="dark"] .s-day-cell:hover { box-shadow: 0 3px 12px rgba(0, 0, 0, .5); }
html[data-theme="dark"] .s-day-cell.today { box-shadow: 0 0 0 2px #E4EEE8; }
html[data-theme="dark"] .s-day-cell.selected {
    background: #2E9B68;
    border-color: #2E9B68;
    color: #06150E;
}
html[data-theme="dark"] .s-fill { background: rgba(0, 0, 0, .35); }
html[data-theme="dark"] .s-day-cell.selected .s-fill { background: rgba(0, 0, 0, .25); }
html[data-theme="dark"] .s-day-cell.selected .s-fill b { background: #06150E; }

html[data-theme="dark"] .dot.past { border-color: #3A4A43; }
html[data-theme="dark"] .dot.free { border-color: #3FAE7B; }
html[data-theme="dark"] .dot.part { border-color: #C28C2C; }
html[data-theme="dark"] .dot.full { border-color: #C45858; }
html[data-theme="dark"] .dot.today { background: var(--d-surface); border-color: #E4EEE8; }

html[data-theme="dark"] .s-slot.passed { border-color: #2B3A33; }
html[data-theme="dark"] .s-booked li { background: #2A1A1C; border-color: #5E3032; }
html[data-theme="dark"] .s-who small + small { color: #D9A0A0; }
html[data-theme="dark"] .s-slot.reserved.done { background: #1A2B23; border-color: #2F4A3D; color: #9CC4AE; }
html[data-theme="dark"] .s-booked li.done { background: #172720; border-color: #2F4A3D; }
html[data-theme="dark"] .s-booked li.done .s-when { color: #9CC4AE; }
html[data-theme="dark"] .s-booked li.done .s-who small + small { color: var(--d-muted); }
html[data-theme="dark"] .s-done,
html[data-theme="dark"] .s-slot.done .s-state { color: #6FDDA5; }

/* ---------------------------------------------------------
   ADMIN PORTAL
--------------------------------------------------------- */
html[data-theme="dark"] .login-card,
html[data-theme="dark"] .admin-modal-content,
html[data-theme="dark"] .admin-topbar,
html[data-theme="dark"] .admin-stat,
html[data-theme="dark"] .admin-table-card,
html[data-theme="dark"] .admin-room-card,
html[data-theme="dark"] .admin-notification,
html[data-theme="dark"] .fb-card { background: var(--d-surface); }

html[data-theme="dark"] .login-card { box-shadow: 0 20px 50px rgba(0, 0, 0, .55); }
html[data-theme="dark"] .login-card h1 { color: var(--d-text); }
html[data-theme="dark"] .admin-auth { background: linear-gradient(140deg, #07100C, #14513A); }

html[data-theme="dark"] .login-card input,
html[data-theme="dark"] .admin-modal-content input,
html[data-theme="dark"] .admin-modal-content select,
html[data-theme="dark"] .admin-modal-content textarea,
html[data-theme="dark"] .admin-search,
html[data-theme="dark"] .admin-filters input,
html[data-theme="dark"] .admin-filters select,
html[data-theme="dark"] .fb-card textarea { background: #101914; border-color: var(--d-border); }

html[data-theme="dark"] .admin-sidebar { background: #0B1511; border-right: 1px solid var(--d-border); }
html[data-theme="dark"] .admin-toast { background: #1C2924; border: 1px solid var(--d-border); }
html[data-theme="dark"] .admin-modal { background: rgba(0, 0, 0, .7); }

html[data-theme="dark"] .admin-outline,
html[data-theme="dark"] .small-btn,
html[data-theme="dark"] .notif-tab { background: var(--d-surface-2); border-color: var(--d-border); }
html[data-theme="dark"] .admin-outline,
html[data-theme="dark"] .small-btn { color: var(--d-accent); }
html[data-theme="dark"] .small-btn.danger { color: #F28585; }
html[data-theme="dark"] .notif-tab.active { background: #2E9B68; border-color: #2E9B68; color: #fff; }

html[data-theme="dark"] .admin-avatar,
html[data-theme="dark"] .admin-logo,
html[data-theme="dark"] .admin-chip { background-color: #1B3A2C; color: var(--d-accent); }
html[data-theme="dark"] .admin-stat > i,
html[data-theme="dark"] .admin-notification i { color: var(--d-accent); }
html[data-theme="dark"] .admin-stat { box-shadow: 0 3px 12px rgba(0, 0, 0, .3); }

html[data-theme="dark"] .admin-welcome { background: linear-gradient(110deg, #0F2E22, #1B6B47); }

html[data-theme="dark"] th,
html[data-theme="dark"] .dept-row td { background: #1C2A23; color: #A9C4B6; }
html[data-theme="dark"] tr.group-row td { background: #1A2B23; border-top-color: #2F4A3D; color: var(--d-text); }
html[data-theme="dark"] tbody tr:hover { background: #1B2823; }
html[data-theme="dark"] .admin-room-card img { background: #223029; }
html[data-theme="dark"] .usage-bar { background: #26352E; }

html[data-theme="dark"] .admin-notification.unread,
html[data-theme="dark"] .fb-card.unread {
    background: #15332A;
    border-color: #25664A;
    box-shadow: 0 2px 10px rgba(0, 0, 0, .3);
}

html[data-theme="dark"] .danger-outline { color: #F28585; border-color: #6B3335; }

/* status pills (admin + instructor) */
html[data-theme="dark"] .status-active,
html[data-theme="dark"] .status-confirmed,
html[data-theme="dark"] .fb-status.resolved { color: #6FDDA5; background: #12362A; }
html[data-theme="dark"] .status-inactive,
html[data-theme="dark"] .status-cancelled { color: #F29A9A; background: #3A1D1F; }
html[data-theme="dark"] .status-completed,
html[data-theme="dark"] .history-count { color: #B6C2CC; background: #26313A; }
html[data-theme="dark"] .status-pending,
html[data-theme="dark"] .fb-status.reviewed { color: #F0C676; background: #3A2E12; }
html[data-theme="dark"] .fb-status.new,
html[data-theme="dark"] .status-new { color: #8DB8F5; background: #1B2B45; }

/* ---------------------------------------------------------
   INSTRUCTOR PORTAL
--------------------------------------------------------- */
html[data-theme="dark"] .auth-screen,
html[data-theme="dark"] .auth-content { background: var(--d-bg); }
html[data-theme="dark"] .auth-box h2,
html[data-theme="dark"] .form-section-title { color: var(--d-text); }
html[data-theme="dark"] .auth-box input { background: #101914; }

html[data-theme="dark"] .topbar,
html[data-theme="dark"] .stat-card,
html[data-theme="dark"] .room-card,
html[data-theme="dark"] .table-card,
html[data-theme="dark"] .form-card,
html[data-theme="dark"] .calendar-card,
html[data-theme="dark"] .notification-item,
html[data-theme="dark"] .modal-content,
html[data-theme="dark"] .modal-close,
html[data-theme="dark"] .empty-state,
html[data-theme="dark"] .footer,
html[data-theme="dark"] .date-picker,
html[data-theme="dark"] .schedule-preview,
html[data-theme="dark"] .feedback-card { background: var(--d-surface); }

html[data-theme="dark"] .sidebar { background: #0B1511; border-right: 1px solid var(--d-border); }
html[data-theme="dark"] .toast { background: #1C2924; border: 1px solid var(--d-border); }
html[data-theme="dark"] .toast.success { background: #14573B; border-color: #1F7A54; }
html[data-theme="dark"] .toast.error { background: #6B2326; border-color: #8E3236; }
html[data-theme="dark"] .modal { background: rgba(0, 0, 0, .7); }
html[data-theme="dark"] .empty-state { border-color: #2F4A3D; }
html[data-theme="dark"] .breadcrumb strong { color: var(--d-text); }

html[data-theme="dark"] .filter-bar input,
html[data-theme="dark"] .filter-bar select,
html[data-theme="dark"] .calendar-controls select,
html[data-theme="dark"] .calendar-controls input,
html[data-theme="dark"] .form-group input,
html[data-theme="dark"] .form-group select,
html[data-theme="dark"] .form-group textarea,
html[data-theme="dark"] .schedule-preview td input[type="time"] { background: #101914; border-color: var(--d-border); color: var(--d-text); }
html[data-theme="dark"] .form-group input:read-only { background: #17211C; color: var(--d-muted); }

html[data-theme="dark"] .btn-outline,
html[data-theme="dark"] .btn-light,
html[data-theme="dark"] .small-btn,
html[data-theme="dark"] .photo-upload-btn,
html[data-theme="dark"] .view-tab,
html[data-theme="dark"] .dp-head button,
html[data-theme="dark"] .action-btn { background: var(--d-surface-2); border-color: var(--d-border); }
html[data-theme="dark"] .btn-outline,
html[data-theme="dark"] .btn-light,
html[data-theme="dark"] .photo-upload-btn,
html[data-theme="dark"] .dp-head button { color: var(--d-accent); }
html[data-theme="dark"] .btn-outline:hover,
html[data-theme="dark"] .btn-light:hover,
html[data-theme="dark"] .photo-upload-btn:hover,
html[data-theme="dark"] .small-btn:hover,
html[data-theme="dark"] .dp-head button:hover { background: #24382F; }
html[data-theme="dark"] .action-btn { color: #F28585; border-color: #8E3236; }
html[data-theme="dark"] .action-btn:hover { background: #C73737; color: #fff; }
html[data-theme="dark"] .action-btn.neutral { color: var(--d-accent); border-color: #2E9B68; background: transparent; }
html[data-theme="dark"] .action-btn.neutral:hover { background: #2E9B68; color: #fff; }
html[data-theme="dark"] .view-tab.active { background: #2E9B68; border-color: #2E9B68; color: #fff; }
html[data-theme="dark"] .btn-primary { background: #1F8A5B; }
html[data-theme="dark"] .btn-primary:hover { background: #2AA06C; }
html[data-theme="dark"] .text-btn,
html[data-theme="dark"] .mobile-brand,
html[data-theme="dark"] .form-section-title i,
html[data-theme="dark"] .room-card .room-status { color: var(--d-accent); }
html[data-theme="dark"] .icon-btn:hover { background: #24382F; color: var(--d-accent); }

html[data-theme="dark"] .avatar,
html[data-theme="dark"] .profile-avatar,
html[data-theme="dark"] .notification-icon { background-color: #1B3A2C; color: var(--d-accent); }
/* keep uploaded photos exactly as they are */
html[data-theme="dark"] .avatar.has-photo,
html[data-theme="dark"] .profile-avatar.has-photo,
html[data-theme="dark"] .admin-avatar.has-photo { color: transparent; }
html[data-theme="dark"] .facility-tag,
html[data-theme="dark"] .notif-chip,
html[data-theme="dark"] .sp-summary { background: #1B3A2C; color: #9CE2B7; }
html[data-theme="dark"] .sp-end { color: #9CE2B7; }
html[data-theme="dark"] .sp-remove:hover,
html[data-theme="dark"] .small-btn.danger:hover { background: #3A1D1F; }

html[data-theme="dark"] .stat-icon.blue   { color: #5FD39A; background: #16352A; }
html[data-theme="dark"] .stat-icon.green  { color: #4FD69B; background: #123A2A; }
html[data-theme="dark"] .stat-icon.orange { color: #F2B45E; background: #3A2E12; }
html[data-theme="dark"] .stat-icon.purple { color: #B79AF0; background: #2A2142; }

html[data-theme="dark"] .room-card:hover { box-shadow: 0 7px 20px rgba(0, 0, 0, .5); }
html[data-theme="dark"] .room-card img { background: #223029; }

html[data-theme="dark"] thead,
html[data-theme="dark"] .schedule-preview th { background: #1C2A23; }
html[data-theme="dark"] th { color: #A9C4B6; }
html[data-theme="dark"] .availability-notice { background: #15332A; color: #6FDDA5; }

/* booking calendar slots */
html[data-theme="dark"] .time-slot { background: #12362A; border-color: #25664A; color: #6FDDA5; }
html[data-theme="dark"] .time-slot:hover:not(:disabled) { background: #1B4A37; border-color: #3FAE7B; color: #9CE2B7; }
html[data-theme="dark"] .time-slot.booked,
html[data-theme="dark"] .time-slot.booked:hover { background: #3A1D1F; border-color: #7A3A3C; color: #F29A9A; }
html[data-theme="dark"] .time-slot.selected { background: #1F8A5B; border-color: #3FAE7B; color: #fff; }
html[data-theme="dark"] .time-slot.done,
html[data-theme="dark"] .time-slot.done:hover { background: #1C2420; border-color: #2B3A33; color: #6F8179; }

html[data-theme="dark"] .dp-day { color: var(--d-text); }
html[data-theme="dark"] .dp-day:hover:not(:disabled) { background: #24382F; }
html[data-theme="dark"] .dp-day:disabled { color: #4A5C53; }
html[data-theme="dark"] .dp-day.selected { background: #1F8A5B; color: #fff; }

html[data-theme="dark"] .notification-item.unread {
    background: #15332A;
    border-color: #25664A;
    box-shadow: 0 2px 10px rgba(0, 0, 0, .3);
}
html[data-theme="dark"] .notification-item.unread p { color: var(--d-text); }
html[data-theme="dark"] .feedback-reply { background: #12362A; border-left-color: #3FAE7B; }

/* ---------------------------------------------------------
   Scrollbars
--------------------------------------------------------- */
html[data-theme="dark"] * { scrollbar-color: #33463D #0E1512; }

`;
        (document.head || document.documentElement).appendChild(darkStyle);
    }

    function saved() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }

    function systemTheme() {
        return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function apply(theme) {
        root.setAttribute("data-theme", theme);

        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "theme-color";
            document.head.appendChild(meta);
        }
        meta.content = theme === "dark" ? "#0B1511" : "#123D2C";

        document.querySelectorAll(".theme-toggle").forEach(function (b) {
            var label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
            b.setAttribute("aria-label", label);
            b.title = label;
            b.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        });
    }

    // 1) before first paint
    apply(saved() || systemTheme());

    // 2) follow the device while the user has not chosen manually
    if (window.matchMedia) {
        var mq = matchMedia("(prefers-color-scheme: dark)");
        var onChange = function () { if (!saved()) apply(systemTheme()); };
        if (mq.addEventListener) mq.addEventListener("change", onChange);
        else if (mq.addListener) mq.addListener(onChange);
    }

    // 3) keep several open tabs of THIS portal in step
    window.addEventListener("storage", function (e) {
        if (e.key === KEY && e.newValue) apply(e.newValue);
    });

    var ICONS =
        '<svg class="i-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
        '<svg class="i-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

    function makeButton(cls) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "theme-toggle " + cls;
        b.innerHTML = ICONS;
        b.addEventListener("click", function () {
            var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            try { localStorage.setItem(KEY, next); } catch (e) {}
            apply(next);
        });
        return b;
    }

    function init() {
        // Student page: toggle next to "Refresh"
        var refresh = document.getElementById("refreshBtn");
        if (refresh && refresh.parentNode.classList.contains("s-header")) {
            var wrap = document.createElement("div");
            wrap.className = "s-actions";
            refresh.parentNode.insertBefore(wrap, refresh);
            wrap.appendChild(makeButton("s-refresh s-theme"));
            wrap.appendChild(refresh);
        }

        // Instructor portal: inside the top bar actions
        var actions = document.querySelector(".topbar-actions");
        if (actions) actions.insertBefore(makeButton("icon-btn"), actions.firstChild);

        // Admin portal: inside the top bar, before the user name
        var adminUser = document.querySelector(".admin-user");
        if (adminUser) adminUser.insertBefore(makeButton("admin-icon"), adminUser.firstChild);


        apply(root.getAttribute("data-theme"));
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();


/************************************************************
 CLASSROOMRESERVE - INSTRUCTOR FRONTEND
************************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbyxrdkkAAmclfl4RZDhYD6Ep6MJNlCDQQXsRsMe1_s9D6zmIreMRYXVdd7BxOgS3MmM8A/exec";

/* "Remember me" keeps the sign-in (token) and the email on this device.
   The PASSWORD is never stored by the page: the browser's own password
   manager saves and autofills it. */
function readStored(key) {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || "";
}

let instructorToken = readStored("cr_token");
let instructorUser = JSON.parse(readStored("cr_user") || "null");
let rooms = [];
let reservations = [];
let notifications = [];

const $ = id => document.getElementById(id);

/* Network call with a timeout. Reads (GET) are retried once because Google
   Apps Script occasionally returns a temporary error under load. */
async function fetchJSON(url, options = {}, retries = 0) {
    for (let attempt = 0; ; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(url, {...options, signal: controller.signal});
            return await response.json();
        } catch (error) {
            if (attempt >= retries) {
                throw new Error(error.name === "AbortError"
                    ? "The server is taking too long. Please try again."
                    : "Connection problem. Check your internet and try again.");
            }
            await new Promise(r => setTimeout(r, 700));
        } finally {
            clearTimeout(timer);
        }
    }
}

async function apiPost(action, data = {}) {
    const result = await fetchJSON(API_URL, {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify({
            action,
            token: instructorToken,
            ...data
        })
    });

    if (!result.success) throw new Error(result.message);
    return result;
}

/* Run fn at most once every `wait` ms after the last call (search boxes) */
function debounce(fn, wait = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

async function apiGet(action, params = {}) {
    const query = new URLSearchParams({
        action,
        token: instructorToken,
        ...params
    });

    const result = await fetchJSON(`${API_URL}?${query}`, {}, 1);

    if (!result.success) throw new Error(result.message);
    return result;
}

function toast(message, type = "success", duration = 3500) {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.className = `toast ${type}`;

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        el.classList.add("hidden");
    }, duration);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;",
        '"':"&quot;", "'":"&#39;"
    })[char]);
}


/* ---------- DATE / TIME HELPERS ----------
   Google Sheets returns dates and times as ISO strings
   (e.g. "2026-11-18T16:00:00.000Z" or "1899-12-30T..."),
   so they are normalised to "YYYY-MM-DD" and "HH:MM" first. */
const OPEN_TIME = "07:00";
const CLOSE_TIME = "21:00";

function pad2(n) { return String(n).padStart(2, "0"); }

function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

/* A reservation is "done" once its end time has passed */
function isDone(r) {
    if (r.Status === "Cancelled") return false;
    const today = localToday();
    if (r.Date < today) return true;
    if (r.Date > today) return false;
    const d = new Date();
    const now = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return !!r.EndTime && r.EndTime <= now;
}

function normDate(v) {
    if (!v) return "";
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (isNaN(d)) return s;
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function normTime(v) {
    if (v === null || v === undefined || v === "") return "";
    const s = String(v).trim();

    let m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (m) {
        let h = Number(m[1]) % 12;
        if (m[3].toUpperCase() === "PM") h += 12;
        return `${pad2(h)}:${m[2]}`;
    }

    m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m) return `${pad2(m[1])}:${m[2]}`;

    const d = new Date(s);
    if (isNaN(d)) return s;

    let h = d.getHours(), min = d.getMinutes();
    if (d.getFullYear() < 1950) {
        // Sheets time-only cells carry a 1899 timezone offset; snap to 5 min
        const total = Math.round((h * 60 + min) / 5) * 5;
        h = Math.floor(total / 60) % 24;
        min = total % 60;
    }
    return `${pad2(h)}:${pad2(min)}`;
}

function addHours(time, hours) {
    const [h, m] = normTime(time).split(":").map(Number);
    const total = h * 60 + m + hours * 60;
    if (total > 24 * 60) return "24:00";
    return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

function normRes(r) {
    const pick = (...keys) => keys.map(k => r[k]).find(v => v !== undefined && v !== null);
    return {...r,
        ReservationID: pick("ReservationID", "reservationID", "reservationId", "id"),
        RoomID: pick("RoomID", "roomID", "roomId"),
        Status: pick("Status", "status"),
        Purpose: pick("Purpose", "purpose"),
        Subject: pick("Subject", "subject", "Course", "course", "SubjectName", "subjectName"),
        InstructorName: pick("InstructorName", "instructorName", "FullName", "fullName", "Instructor", "instructor"),
        Date: normDate(pick("Date", "date")),
        StartTime: normTime(pick("StartTime", "startTime")),
        EndTime: normTime(pick("EndTime", "endTime"))
    };
}

/* All active reservations for a room on a date, from EVERY user.
   The server's getCalendar result is the source of truth; the instructor's
   own loaded reservations are merged in as a fallback (no duplicates). */
async function getBookedFor(roomId, date) {
    let serverList = [];
    try {
        const result = await apiGet("getCalendar", {roomId, date});
        serverList = result.reservations || result.bookings || result.data || [];
    } catch (error) {
        // Still show the instructor's own bookings if the server call fails
        toast(error.message, "error");
    }

    const fromServer = serverList.map(normRes).filter(r =>
        (!r.Date || r.Date === date) &&
        (!r.RoomID || String(r.RoomID) === String(roomId))
    );
    const mine = reservations.filter(r =>
        String(r.RoomID) === String(roomId) && r.Date === date
    );

    const seen = new Set();
    return [...fromServer, ...mine]
        .filter(r => String(r.Status || "").toLowerCase() !== "cancelled" && r.StartTime && r.EndTime)
        .filter(r => {
            const key = `${r.Date}|${r.StartTime}|${r.EndTime}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

/* Short, readable reservation ID for display (the full ID is still used internally) */
function shortID(id) {
    // Show the exact Reservation ID saved in the database
    return String(id ?? "").trim();
}

function dateText(value) {
    if (!value) return "";
    const parts = normDate(value).split("-");
    if (parts.length !== 3) return value;
    return new Date(parts[0], parts[1]-1, parts[2])
        .toLocaleDateString();
}

function formatTime(value) {
    const parts = normTime(value).split(":");
    if (parts.length < 2) return value;
    const d = new Date();
    d.setHours(Number(parts[0]), Number(parts[1]));
    return d.toLocaleTimeString([], {
        hour:"numeric", minute:"2-digit"
    });
}

/* Show the uploaded picture, or the first letter when there is none */
function setAvatar(el, user, photoOverride) {
    const photo = photoOverride || user.photoURL || "";
    if (photo) {
        el.style.backgroundImage = `url("${photo}")`;
        el.classList.add("has-photo");
        el.textContent = "";
    } else {
        el.style.backgroundImage = "";
        el.classList.remove("has-photo");
        el.textContent = (user.name || "I").charAt(0).toUpperCase();
    }
}

function setUser(user) {
    instructorUser = user;
    sessionStorage.setItem("cr_user", JSON.stringify(user));
    if (localStorage.getItem("cr_token")) localStorage.setItem("cr_user", JSON.stringify(user));

    $("topUserName").textContent = user.name;
    $("welcomeName").textContent = user.name.split(" ")[0];
    setAvatar($("topAvatar"), user);
    setAvatar($("profileAvatar"), user);

    $("profileName").value = user.name || "";
    $("profileEmployeeID").value = user.employeeID || "";
    $("profileDepartment").value = user.department || "";
    $("profileEmail").value = user.email || "";
    $("profileContact").value = user.contact || "";
}

function showApp() {
    $("authScreen").classList.add("hidden");
    $("appScreen").classList.remove("hidden");
    setUser(instructorUser);
    navigate("dashboard");
    loadAll();
}

function showAuth() {
    $("authScreen").classList.remove("hidden");
    $("appScreen").classList.add("hidden");
}

function navigate(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));

    const target = $("page-" + page);
    if (!target) return;

    target.classList.add("active");

    const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (nav) nav.classList.add("active");

    const title = {
        dashboard:"Dashboard",
        classrooms:"Browse Classrooms",
        calendar:"Room Calendar",
        reservation:"Make Reservation",
        myReservations:"My Reservations",
        history:"Reservation History",
        notifications:"Notifications",
        feedback:"Report / Feedback",
        profile:"My Profile"
    };

    $("pageTitle").textContent = title[page] || page;

    $("sidebar").classList.remove("open");

    if (page === "classrooms") renderRooms();
    if (page === "myReservations") renderReservations();
    if (page === "history") renderHistory();
    if (page === "notifications") renderNotifications();
    if (page === "feedback") loadFeedback();
}

function clearSession() {
    ["cr_token", "cr_user"].forEach(k => {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
    });
    instructorToken = "";
    instructorUser = null;
}

let dataVer = "";

async function loadAll(opts = {}) {
    try {
        let data;

        try {
            // One request for everything (fast)
            // background refresh: send the version we have; the server answers
            // "unchanged" (a few bytes) when nothing new happened
            data = await apiGet("getBootstrap", opts.silent && !opts.force && dataVer ? {since: dataVer} : {});
        } catch (error) {
            if (!/unknown action/i.test(error.message)) throw error;

            // Older backend: fall back to separate requests
            const [roomData, reservationData, notificationData, dashboardData] =
                await Promise.all([
                    apiGet("getRooms"),
                    apiGet("getReservations"),
                    apiGet("getNotifications"),
                    apiGet("getDashboard")
                ]);

            data = {
                rooms: roomData.rooms,
                reservations: reservationData.reservations,
                notifications: notificationData.notifications,
                dashboard: dashboardData.data
            };
        }

        if (data.unchanged) {
            // nothing new on the server: only refresh the time-based lists
            renderReservations();
            renderHistory();
            return;
        }
        dataVer = data.ver || "";

        rooms = data.rooms || [];
        reservations = (data.reservations || []).map(normRes);
        notifications = data.notifications || [];

        renderRooms();
        renderReservations();
        renderHistory();
        renderNotifications();
        renderDashboard(data.dashboard);

        populateRoomSelects();
    } catch (error) {
        if (!opts.silent) toast(error.message, "error");

        // Remembered sign-in that expired: go back to the login screen
        if (/session|expired/i.test(error.message)) {
            clearSession();
            showAuth();
        }
    }
}

function renderDashboard(data) {
    $("statUpcoming").textContent = data.upcoming;
    $("statTotal").textContent = data.total;
    $("statNotifications").textContent = data.notifications;
    $("statRooms").textContent = data.rooms;

    updateNotificationBadge();

    $("dashboardReservations").innerHTML =
        reservations.filter(r =>
            r.Status === "Confirmed" &&
            !isDone(r)
        ).slice(0,5).map(r => `
            <tr>
                <td>${escapeHTML(dateText(r.Date))}</td>
                <td>${escapeHTML(formatTime(r.StartTime))} - ${escapeHTML(formatTime(r.EndTime))}</td>
                <td>${escapeHTML(r.RoomName)}</td>
                <td>${escapeHTML(r.Purpose)}</td>
                <td><span class="status status-confirmed">Confirmed</span></td>
            </tr>
        `).join("") || `<tr><td colspan="5" class="empty-cell">No upcoming reservations.</td></tr>`;
}

function renderRooms() {
    const search = ($("roomSearch")?.value || "").toLowerCase();
    const building = $("buildingFilter")?.value || "";
    const capacity = Number($("capacityFilter")?.value || 0);

    const filtered = rooms.filter(r =>
        (r.RoomName + " " + r.Building).toLowerCase().includes(search) &&
        (!building || r.Building === building) &&
        (!capacity || Number(r.Capacity) >= capacity)
    );

    const html = filtered.map(r => `
        <article class="room-card">
            <img loading="lazy" decoding="async" src="${escapeHTML(r.PhotoURL || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800")}"
                 alt="${escapeHTML(r.RoomName)}"
                 onerror="this.src='https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'">
            <div class="room-card-content">
                <h3>${escapeHTML(r.RoomName)}</h3>
                <p><i data-lucide="map-pin"></i>${escapeHTML(r.Building)} ${escapeHTML(r.Floor || "")}</p>
                <p><i data-lucide="users"></i>Capacity: ${escapeHTML(r.Capacity)}</p>
                <p><i data-lucide="check-circle"></i><span class="room-status">Active classroom</span></p>
                <div class="room-facilities">
                    ${escapeHTML(r.Facilities || "Standard classroom")}
                </div>
                <button class="btn-primary" data-room-book="${escapeHTML(r.RoomID)}">
                    Reserve Classroom
                </button>
            </div>
        </article>
    `).join("") || `<div class="empty-state">No classrooms found.</div>`;

    $("classroomList").innerHTML = html;
    $("dashboardRooms").innerHTML = filtered.slice(0,3).map(r => `
        <article class="room-card">
            <img src="${escapeHTML(r.PhotoURL || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800")}"
                 alt="${escapeHTML(r.RoomName)}">
            <div class="room-card-content">
                <h3>${escapeHTML(r.RoomName)}</h3>
                <p>${escapeHTML(r.Building)} · Capacity ${escapeHTML(r.Capacity)}</p>
                <button class="btn-primary" data-room-book="${escapeHTML(r.RoomID)}">Reserve</button>
            </div>
        </article>
    `).join("") || `<div class="empty-state">No classrooms available.</div>`;

    if (window.lucide) lucide.createIcons();
}

function populateRoomSelects() {
    const keep = ["reserveRoom", "calendarRoom", "buildingFilter", "feedbackRoom"].map(id => [id, $(id).value]);
    const options = rooms.map(r =>
        `<option value="${escapeHTML(r.RoomID)}">${escapeHTML(r.RoomName)} - ${escapeHTML(r.Building)}</option>`
    ).join("");

    $("reserveRoom").innerHTML = `<option value="">Choose a classroom</option>` + options;
    $("calendarRoom").innerHTML = `<option value="">Select Classroom</option>` + options;
    $("feedbackRoom").innerHTML = `<option value="">Not about a specific classroom</option>` + options;

    $("buildingFilter").innerHTML =
        `<option value="">All Buildings</option>` +
        [...new Set(rooms.map(r => r.Building))]
            .map(b => `<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`)
            .join("");

    // keep what the person already picked when the data refreshes
    keep.forEach(([id, value]) => {
        if (value && [...$(id).options].some(o => o.value === value)) $(id).value = value;
    });
}

function renderReservations() {
    const search = ($("reservationSearch")?.value || "").toLowerCase();
    const status = $("reservationStatusFilter")?.value || "";

    const list = reservations.filter(r =>
        r.Status !== "Cancelled" &&
        !isDone(r) &&
        (!status || r.Status === status) &&
        (r.ReservationID + " " + shortID(r.ReservationID) + " " + r.RoomName + " " + (r.Subject || "") + " " + r.Purpose)
            .toLowerCase().includes(search)
    );

    // grouped by classroom, then by date and time inside each classroom
    list.sort((a, b) =>
        String(a.RoomName).localeCompare(String(b.RoomName), undefined, {numeric: true}) ||
        (a.Date + a.StartTime).localeCompare(b.Date + b.StartTime)
    );

    const roomTotals = {};
    list.forEach(r => { roomTotals[r.RoomName] = (roomTotals[r.RoomName] || 0) + 1; });

    let lastRoom = null;

    $("myReservationsList").innerHTML = list.map(r => {
        const header = r.RoomName !== lastRoom
            ? `<tr class="group-row"><td colspan="8">
                    <strong>${escapeHTML(r.RoomName || "No classroom")}</strong>
                    <span>${roomTotals[r.RoomName]} reservation${roomTotals[r.RoomName] === 1 ? "" : "s"}</span>
               </td></tr>`
            : "";
        lastRoom = r.RoomName;

        return header + `
        <tr>
            <td title="${escapeHTML(r.ReservationID)}">${escapeHTML(shortID(r.ReservationID))}</td>
            <td>${escapeHTML(r.RoomName)}</td>
            <td><strong>${escapeHTML(r.Subject || "\u2014")}</strong></td>
            <td>${escapeHTML(dateText(r.Date))}</td>
            <td>${escapeHTML(formatTime(r.StartTime))} - ${escapeHTML(formatTime(r.EndTime))}</td>
            <td>${escapeHTML(r.Purpose)}</td>
            <td><span class="status status-confirmed">${escapeHTML(r.Status)}</span></td>
            <td>
                <button class="action-btn" data-cancel="${escapeHTML(r.ReservationID)}">Cancel</button>
            </td>
        </tr>`;
    }).join("") || `<tr><td colspan="8" class="empty-cell">No matching reservations.</td></tr>`;
}

let histView = "active";

function renderHistory() {
    const inTrash = histView === "trash";

    const row = (r, label, cls) => `
        <tr>
            <td title="${escapeHTML(r.ReservationID)}">${escapeHTML(shortID(r.ReservationID))}</td>
            <td>${escapeHTML(r.RoomName)}</td>
            <td><strong>${escapeHTML(r.Subject || "\u2014")}</strong></td>
            <td>${escapeHTML(dateText(r.Date))}</td>
            <td>${escapeHTML(formatTime(r.StartTime))} - ${escapeHTML(formatTime(r.EndTime))}</td>
            <td>${escapeHTML(r.Purpose)}</td>
            <td><span class="status ${cls}">${label}</span></td>
            <td class="row-actions">
                ${inTrash ? `
                <button type="button" class="action-btn neutral" data-h-restore="${escapeHTML(r.ReservationID)}">Restore</button>
                <button type="button" class="action-btn" data-h-purge="${escapeHTML(r.ReservationID)}">Delete permanently</button>
                ` : `
                <button type="button" class="action-btn neutral" data-h-archive="${escapeHTML(r.ReservationID)}">${histView === "archived" ? "Restore" : "Archive"}</button>
                <button type="button" class="action-btn" data-h-delete="${escapeHTML(r.ReservationID)}">Delete</button>
                `}
            </td>
        </tr>
    `;

    const byNewest = (a, b) =>
        (b.Date + (b.StartTime || "")).localeCompare(a.Date + (a.StartTime || ""));

    const eligible = reservations
        .filter(r => isDone(r) || r.Status === "Cancelled")
        .sort(byNewest);

    const trashed = r => r.InstructorView === "Trash";
    const archived = r => r.InstructorView === "Archived";

    const inView = r =>
        histView === "trash" ? trashed(r)
        : histView === "archived" ? !trashed(r) && archived(r)
        : !trashed(r) && !archived(r);

    const shown = eligible.filter(inView);
    const done = shown.filter(isDone);
    const cancelled = shown.filter(r => r.Status === "Cancelled");

    const counts = {
        active: eligible.filter(r => !trashed(r) && !archived(r)).length,
        archived: eligible.filter(r => !trashed(r) && archived(r)).length,
        trash: eligible.filter(trashed).length
    };

    document.querySelectorAll("[data-hist-view]").forEach(b => {
        const v = b.dataset.histView;
        b.classList.toggle("active", v === histView);
        b.textContent = v === "archived" ? `Archived (${counts.archived})`
                      : v === "trash" ? `Trash (${counts.trash})`
                      : `History (${counts.active})`;
    });

    $("deleteArchivedHistoryBtn").classList.toggle("hidden", !(histView === "archived" && counts.archived));
    $("emptyTrashHistoryBtn").classList.toggle("hidden", !(inTrash && counts.trash));

    const word = histView === "archived" ? "archived " : histView === "trash" ? "deleted " : "";
    $("historyList").innerHTML = done.map(r => row(r, "Completed", "status-completed")).join("")
        || `<tr><td colspan="8" class="empty-cell">No ${word}completed reservations${histView === "active" ? " yet" : ""}.</td></tr>`;

    $("cancelledList").innerHTML = cancelled.map(r => row(r, "Cancelled", "status-cancelled")).join("")
        || `<tr><td colspan="8" class="empty-cell">No ${word}cancelled reservations.</td></tr>`;

    if ($("historyDoneCount")) $("historyDoneCount").textContent = done.length;
    if ($("historyCancelledCount")) $("historyCancelledCount").textContent = cancelled.length;
}

function describeRes(r) {
    return `${r.RoomName || "classroom"} on ${dateText(r.Date)}, ${formatTime(r.StartTime)} - ${formatTime(r.EndTime)}`;
}

/* Saved on the server (Reservations sheet), so every device shows the same history */
async function setResView(ids, view) {
    const result = await apiPost("setReservationView", {reservationIDs: ids, view});
    if ((result.count || 0) < ids.length) {
        await loadAll({silent: true, force: true});   // show what the server really has
        throw new Error("The change could not be saved on the server. Please try again.");
    }
    reservations.forEach(r => { if (ids.includes(r.ReservationID)) r.InstructorView = view; });
    if (view === "Deleted") reservations = reservations.filter(r => !ids.includes(r.ReservationID));
    renderHistory();
}

$("page-history").addEventListener("click", async e => {
    const tab = e.target.closest("[data-hist-view]");
    if (tab) { histView = tab.dataset.histView; renderHistory(); return; }

    try {
        const arch = e.target.closest("[data-h-archive]");
        if (arch) {
            await setResView([arch.dataset.hArchive], histView === "archived" ? "" : "Archived");
            toast(histView === "archived" ? "Reservation restored to history." : "Reservation archived.");
            return;
        }

        const del = e.target.closest("[data-h-delete]");
        if (del) {
            const id = del.dataset.hDelete;
            const r = reservations.find(x => x.ReservationID === id);
            await setResView([id], "Trash");
            toast("Moved to Trash. Open the Trash tab to restore or delete it permanently.", "success", 5000);
            if (r) addLocalNotif("Reservation deleted", `You moved the reservation for ${describeRes(r)} to Trash.`, {
                RoomName: r.RoomName, BookingDate: r.Date, BookingTime: `${r.StartTime}-${r.EndTime}`
            });
            return;
        }

        const restore = e.target.closest("[data-h-restore]");
        if (restore) {
            await setResView([restore.dataset.hRestore], "");
            toast("Reservation restored.");
            return;
        }

        const purge = e.target.closest("[data-h-purge]");
        if (purge) {
            const id = purge.dataset.hPurge;
            const r = reservations.find(x => x.ReservationID === id);
            await setResView([id], "Deleted");
            toast("Reservation permanently deleted from your history.");
            if (r) addLocalNotif("Reservation permanently deleted", `You permanently deleted the reservation for ${describeRes(r)} from your history.`, {
                RoomName: r.RoomName, BookingDate: r.Date, BookingTime: `${r.StartTime}-${r.EndTime}`
            });
        }
    } catch (error) {
        toast(error.message, "error");
    }
});

$("deleteArchivedHistoryBtn").onclick = async () => {
    const ids = reservations.filter(r => r.InstructorView === "Archived").map(r => r.ReservationID);
    if (!ids.length) return;
    if (!confirm(`Move ${ids.length} archived reservation(s) to Trash?`)) return;
    try {
        await setResView(ids, "Trash");
        toast("Moved to Trash. You can restore them from the Trash tab.");
        addLocalNotif("Reservations deleted", `${ids.length} archived reservation(s) were moved to Trash.`);
    } catch (error) { toast(error.message, "error"); }
};

$("emptyTrashHistoryBtn").onclick = async () => {
    const ids = reservations.filter(r => r.InstructorView === "Trash").map(r => r.ReservationID);
    if (!ids.length) return;
    if (!confirm(`Permanently delete ${ids.length} reservation(s) in Trash from your history? This cannot be undone.`)) return;
    try {
        await setResView(ids, "Deleted");
        toast("Trash emptied.");
        addLocalNotif("Trash emptied", `${ids.length} reservation(s) were permanently deleted from your history.`);
    } catch (error) { toast(error.message, "error"); }
};

function fmtDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    return isNaN(d) ? String(value) : d.toLocaleString(undefined, {
        year:"numeric", month:"short", day:"numeric",
        hour:"numeric", minute:"2-digit"
    });
}

/* Room + booked date/time chips for a notification */
function notifDetails(n) {
    const dates = String(n.BookingDate || "").split(",").map(x => x.trim()).filter(Boolean);
    const times = String(n.BookingTime || "").split(",").map(x => x.trim()).filter(Boolean);
    const chips = [];

    if (n.RoomName) {
        chips.push(`<span class="notif-chip"><i data-lucide="door-open"></i>${escapeHTML(n.RoomName)}</span>`);
    }

    dates.forEach((d, i) => {
        const t = times[times.length === 1 ? 0 : i] || "";
        const [from, to] = t.split("-");
        const range = from && to ? `${formatTime(from)} - ${formatTime(to)}` : "";
        chips.push(`<span class="notif-chip"><i data-lucide="calendar-clock"></i>${escapeHTML(dateText(d))}${range ? " · " + escapeHTML(range) : ""}</span>`);
    });

    return chips.length ? `<div class="notif-meta">${chips.join("")}</div>` : "";
}

/* ---------- Inbox / history state (kept on this device, per account) ---------- */

let uiState = null;
let uiStateKey = "";

function stateKey() {
    const u = instructorUser || {};
    const id = u.Email || u.email || u.InstructorID || u.instructorID || u.EmployeeID || "guest";
    return "cr_state_" + String(id).toLowerCase();
}

function st() {
    const key = stateKey();
    if (!uiState || uiStateKey !== key) {
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) {}
        uiState = {
            read: saved.read || [],
            archivedNotifs: saved.archivedNotifs || [],
            deletedNotifs: saved.deletedNotifs || [],      // in Trash
            purgedNotifs: saved.purgedNotifs || [],        // permanently deleted
            unread: saved.unread || [],                    // marked unread again
            archivedRes: saved.archivedRes || [],
            deletedRes: saved.deletedRes || [],            // in Trash
            purgedRes: saved.purgedRes || [],              // permanently deleted
            localNotifs: saved.localNotifs || []
        };
        uiStateKey = key;
    }
    return uiState;
}

function saveState() {
    try { localStorage.setItem(uiStateKey || stateKey(), JSON.stringify(st())); } catch (e) {}
}

function nid(n) {
    return String(n.NotificationID || ((n.Title || "") + "|" + (n.CreatedAt || "")));
}

/* A confirmation message for something the instructor just did */
function addLocalNotif(title, message, extra = {}) {
    const s = st();
    s.localNotifs.unshift({
        NotificationID: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        Title: title,
        Message: message,
        CreatedAt: new Date().toISOString(),
        IsRead: false,
        ...extra
    });
    s.localNotifs = s.localNotifs.slice(0, 100);
    saveState();
    renderNotifications();
}

function rawNotifications() {
    const s = st();
    return [...s.localNotifs, ...notifications]
        .filter(n => !s.purgedNotifs.includes(nid(n)))
        .sort((a, b) => {
            const da = new Date(a.CreatedAt), db = new Date(b.CreatedAt);
            return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
        });
}

function isTrashedNotif(n) {
    return st().deletedNotifs.includes(nid(n));
}

/* everything that is not in the Trash */
function allNotifications() {
    return rawNotifications().filter(n => !isTrashedNotif(n));
}

function isArchivedNotif(n) {
    return st().archivedNotifs.includes(nid(n));
}

function isUnread(n) {
    const s = st();
    if (s.unread.includes(nid(n))) return true;
    if (s.read.includes(nid(n))) return false;
    return n.IsRead !== true && n.IsRead !== "TRUE";
}

/* Sidebar counter + red bell dot follow the number of unread inbox messages */
function updateNotificationBadge() {
    const unread = allNotifications().filter(n => !isArchivedNotif(n) && isUnread(n)).length;
    $("notificationCount").textContent = unread;
    $("notificationCount").classList.toggle("hidden", unread === 0);
    document.querySelectorAll(".notification-dot")
        .forEach(d => d.classList.toggle("hidden", unread === 0));
    return unread;
}

let notifView = "active";

function renderNotifications() {
    const all = allNotifications();
    const archived = all.filter(isArchivedNotif);
    const inbox = all.filter(n => !isArchivedNotif(n));
    const trash = rawNotifications().filter(isTrashedNotif);
    const list = notifView === "archived" ? archived : notifView === "trash" ? trash : inbox;

    document.querySelectorAll("[data-notif-view]").forEach(b => {
        const v = b.dataset.notifView;
        b.classList.toggle("active", v === notifView);
        b.textContent = v === "archived" ? `Archived (${archived.length})`
                      : v === "trash" ? `Trash (${trash.length})`
                      : `Inbox (${inbox.length})`;
    });

    $("markAllReadBtn").classList.toggle("hidden", notifView !== "active");
    $("deleteArchivedNotifsBtn").classList.toggle("hidden", !(notifView === "archived" && archived.length));
    $("emptyTrashNotifsBtn").classList.toggle("hidden", !(notifView === "trash" && trash.length));

    const empty = notifView === "archived" ? "No archived notifications."
                : notifView === "trash" ? "Trash is empty."
                : "No notifications yet.";

    $("notificationList").innerHTML = list.map(n => {
        const id = escapeHTML(nid(n));
        const unread = isUnread(n);
        const inTrash = notifView === "trash";

        const buttons = inTrash ? `
                <button type="button" class="small-btn" data-n-restore="${id}">Restore</button>
                <button type="button" class="small-btn danger" data-n-purge="${id}">Delete permanently</button>
        ` : `
                ${unread
                    ? `<button type="button" class="small-btn" data-n-read="${id}">Mark read</button>`
                    : `<button type="button" class="small-btn" data-n-unread="${id}">Mark unread</button>`}
                <button type="button" class="small-btn" data-n-archive="${id}">${notifView === "archived" ? "Restore" : "Archive"}</button>
                <button type="button" class="small-btn danger" data-n-delete="${id}">Delete</button>
        `;

        return `
        <div class="notification-item ${unread && !inTrash ? "unread" : ""}" data-nid="${id}">
            <div class="notification-icon"><i data-lucide="${/cancel/i.test(n.Title || n.Type || "") ? "calendar-x" : "bell"}"></i></div>
            <div class="notification-content">
                <h3>${escapeHTML(n.Title)}${unread && !inTrash ? ' <span class="new-badge">NEW</span>' : ""}</h3>
                <p>${escapeHTML(n.Message)}</p>
                ${notifDetails(n)}
                <small class="notif-time">Received: ${escapeHTML(fmtDateTime(n.CreatedAt))}</small>
            </div>
            <div class="notif-actions">${buttons}</div>
        </div>`;
    }).join("") || `<div class="empty-state">${empty}</div>`;

    updateNotificationBadge();
    if (window.lucide) lucide.createIcons();
}

function markNotifRead(id) {
    const s = st();
    if (!s.read.includes(id)) s.read.push(id);
    s.unread = s.unread.filter(x => x !== id);
    const local = s.localNotifs.find(n => n.NotificationID === id);
    if (local) local.IsRead = true;
    saveState();
    renderNotifications();
}

function markNotifUnread(id) {
    const s = st();
    s.read = s.read.filter(x => x !== id);
    if (!s.unread.includes(id)) s.unread.push(id);
    const local = s.localNotifs.find(n => n.NotificationID === id);
    if (local) local.IsRead = false;
    saveState();
    renderNotifications();
}

/* LOGIN */

$("instructorLoginForm").addEventListener("submit", async e => {
    e.preventDefault();

    try {
        const result = await apiPost("login", {
            role:"Instructor",
            email:$("loginEmail").value,
            password:$("loginPassword").value
        });

        instructorToken = result.token;
        sessionStorage.setItem("cr_token", instructorToken);
        setUser(result.user);

        // Remember me: keep email + sign-in on this device
        if ($("rememberMe").checked) {
            localStorage.setItem("cr_email", $("loginEmail").value.trim());
            localStorage.removeItem("cr_remember_off");
            localStorage.setItem("cr_token", instructorToken);
            localStorage.setItem("cr_user", JSON.stringify(result.user));

            // Ask the browser to save the password in its password manager
            if (window.PasswordCredential) {
                try {
                    navigator.credentials.store(new PasswordCredential({
                        id: $("loginEmail").value.trim(),
                        password: $("loginPassword").value,
                        name: result.user.name
                    }));
                } catch (err) {}
            }
        } else {
            localStorage.removeItem("cr_email");
            localStorage.removeItem("cr_token");
            localStorage.removeItem("cr_user");
            localStorage.setItem("cr_remember_off", "1");
        }

        showApp();
        toast("Welcome back!");
    } catch (error) {
        toast(error.message, "error");
    }
});

/* REGISTRATION */

$("instructorRegisterForm").addEventListener("submit", async e => {
    e.preventDefault();

    if ($("regPassword").value !== $("regConfirmPassword").value) {
        return toast("Passwords do not match.", "error");
    }

    try {
        await apiPost("register", {
            fullName:$("regName").value,
            employeeID:$("regEmployeeID").value,
            department:$("regDepartment").value,
            email:$("regEmail").value,
            contact:$("regContact").value,
            password:$("regPassword").value
        });

        toast("Account created. Please log in.");
        $("instructorRegisterForm").reset();
        $("registerForm").classList.add("hidden");
        $("loginForm").classList.remove("hidden");
    } catch (error) {
        toast(error.message, "error");
    }
});

$("showRegister").onclick = () => {
    $("loginForm").classList.add("hidden");
    $("registerForm").classList.remove("hidden");
};

$("showLogin").onclick = () => {
    $("registerForm").classList.add("hidden");
    $("loginForm").classList.remove("hidden");
};

/* FORGOT PASSWORD */

let forgotEmailValue = "";

function showAuthPanel(id) {
    ["loginForm", "registerForm", "forgotForm"].forEach(x =>
        $(x).classList.toggle("hidden", x !== id)
    );
}

$("showForgot").onclick = () => {
    $("forgotRequestForm").classList.remove("hidden");
    $("forgotResetForm").classList.add("hidden");
    $("forgotHint").textContent = "Enter your registered email. We will send you a 6-digit reset code.";
    $("forgotEmail").value = $("loginEmail").value;
    showAuthPanel("forgotForm");
};

$("backToLogin").onclick = () => showAuthPanel("loginForm");

$("forgotRequestForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;

    try {
        forgotEmailValue = $("forgotEmail").value.trim();
        const result = await apiPost("requestPasswordReset", {email:forgotEmailValue});

        toast(result.message, "success", 6000);
        $("forgotRequestForm").classList.add("hidden");
        $("forgotResetForm").classList.remove("hidden");
        $("forgotHint").textContent = "Enter the code sent to " + forgotEmailValue + " and choose a new password.";
    } catch (error) {
        toast(error.message, "error", 6000);
    } finally {
        btn.disabled = false;
    }
});

$("forgotResetForm").addEventListener("submit", async e => {
    e.preventDefault();

    if ($("forgotNewPassword").value !== $("forgotConfirmPassword").value) {
        toast("Passwords do not match.", "error");
        return;
    }

    try {
        const result = await apiPost("resetPassword", {
            email:forgotEmailValue,
            code:$("forgotCode").value.trim(),
            password:$("forgotNewPassword").value
        });

        toast(result.message, "success", 6000);
        $("forgotResetForm").reset();
        $("loginEmail").value = forgotEmailValue;
        $("loginPassword").value = "";
        showAuthPanel("loginForm");
    } catch (error) {
        toast(error.message, "error", 6000);
    }
});

/* NAVIGATION */

document.addEventListener("click", e => {
    const pageButton = e.target.closest("[data-page]");
    if (pageButton) navigate(pageButton.dataset.page);

    const roomButton = e.target.closest("[data-room-book]");
    if (roomButton) {
        navigate("reservation");
        $("reserveRoom").value = roomButton.dataset.roomBook;
    }

    const cancelButton = e.target.closest("[data-cancel]");
    if (cancelButton) {
        $("cancelReservationID").value = cancelButton.dataset.cancel;
        $("cancelModal").classList.remove("hidden");
    }
});

$("menuToggle").onclick = () => $("sidebar").classList.toggle("open");

$("logoutBtn").onclick = async () => {
    try { await apiPost("logout"); } catch(e) {}
    clearSession();
    showAuth();
};

/* CREATE RESERVATION */

/* ---------- MULTI-DAY RESERVATION ----------
   The instructor clicks one or more class dates. The subject's total
   hours (1 unit = 1 hour) are divided automatically across those days. */

const pickedDates = new Set();
const startOverrides = {};
let pickMonth = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
})();

function minutesOf(t) {
    const [h, m] = normTime(t).split(":").map(Number);
    return h * 60 + m;
}

function timeOf(min) {
    min = Math.min(min, 24 * 60);
    return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}

function durationText(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ") || "0 min";
}

/* Split totalMin across `count` days in 5-minute steps (3 hr over 2 days = 90 + 90) */
function splitMinutes(totalMin, count) {
    if (!count) return [];
    const base = Math.floor(totalMin / count / 5) * 5;
    let rest = totalMin - base * count;
    return Array.from({length: count}, () => {
        const extra = Math.min(5, rest);
        rest -= extra;
        return base + extra;
    });
}

function getSessions() {
    const units = Number($("reserveUnits").value || 1);
    const globalStart = normTime($("reserveStart").value);
    const dates = [...pickedDates].sort();
    const parts = splitMinutes(units * 60, dates.length);

    return dates.map((date, i) => {
        const startTime = startOverrides[date] || globalStart;
        return {
            date,
            startTime,
            minutes: parts[i],
            endTime: startTime ? timeOf(minutesOf(startTime) + parts[i]) : ""
        };
    });
}

function renderDatePicker() {
    const y = pickMonth.getFullYear(), m = pickMonth.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const today = localToday();

    let cells = ["S","M","T","W","T","F","S"]
        .map(d => `<div class="dp-dow">${d}</div>`).join("");

    for (let i = 0; i < first; i++) cells += `<div></div>`;

    for (let d = 1; d <= days; d++) {
        const iso = `${y}-${pad2(m + 1)}-${pad2(d)}`;
        const cls = ["dp-day", iso === today ? "today" : "", pickedDates.has(iso) ? "selected" : ""]
            .filter(Boolean).join(" ");
        cells += `<button type="button" class="${cls}" data-date="${iso}" ${iso < today ? "disabled" : ""}>${d}</button>`;
    }

    $("datePicker").innerHTML = `
        <div class="dp-head">
            <button type="button" data-nav="-1">‹</button>
            <span>${pickMonth.toLocaleDateString(undefined, {month:"long", year:"numeric"})}</span>
            <button type="button" data-nav="1">›</button>
        </div>
        <div class="dp-grid">${cells}</div>`;
}

function renderSchedulePreview() {
    const units = Number($("reserveUnits").value || 1);
    $("reserveTotalHours").value = `${units} hour${units > 1 ? "s" : ""}`;

    const sessions = getSessions();

    if (!sessions.length) {
        $("schedulePreview").innerHTML =
            `<div class="sp-empty">No dates selected yet. Click the class days on the calendar above.</div>`;
        return;
    }

    const rows = sessions.map(s => `
        <tr data-date="${s.date}">
            <td>${escapeHTML(new Date(s.date + "T00:00").toLocaleDateString(undefined, {weekday:"short", month:"short", day:"numeric", year:"numeric"}))}</td>
            <td><input type="time" data-start value="${escapeHTML(s.startTime)}"></td>
            <td class="sp-end">${s.endTime ? formatTime(s.endTime) : "—"}</td>
            <td>${durationText(s.minutes)}</td>
            <td><button type="button" class="sp-remove" data-remove="${s.date}" title="Remove date">×</button></td>
        </tr>`).join("");

    $("schedulePreview").innerHTML = `
        <div class="sp-summary">
            <strong>${units} unit${units > 1 ? "s" : ""} = ${units} hour${units > 1 ? "s" : ""}</strong>
            divided across <strong>${sessions.length} day${sessions.length > 1 ? "s" : ""}</strong>
            (${durationText(sessions[0].minutes)}${new Set(sessions.map(s => s.minutes)).size > 1 ? " or similar" : " each"}).
            You can change the start time of any day.
        </div>
        <table>
            <thead><tr><th>Date</th><th>Start</th><th>End (auto)</th><th>Duration</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function refreshEndTimes() {
    const byDate = Object.fromEntries(getSessions().map(s => [s.date, s]));
    document.querySelectorAll("#schedulePreview tr[data-date]").forEach(tr => {
        const s = byDate[tr.dataset.date];
        tr.querySelector(".sp-end").textContent = s && s.endTime ? formatTime(s.endTime) : "—";
    });
}

function refreshReservationPlanner() {
    renderDatePicker();
    renderSchedulePreview();
}

$("datePicker").addEventListener("click", e => {
    const nav = e.target.closest("[data-nav]");
    if (nav) {
        pickMonth = new Date(pickMonth.getFullYear(), pickMonth.getMonth() + Number(nav.dataset.nav), 1);
        renderDatePicker();
        return;
    }

    const day = e.target.closest("[data-date]");
    if (!day) return;

    const iso = day.dataset.date;
    if (pickedDates.has(iso)) {
        pickedDates.delete(iso);
        delete startOverrides[iso];
    } else {
        pickedDates.add(iso);
    }
    refreshReservationPlanner();
});

$("schedulePreview").addEventListener("click", e => {
    const remove = e.target.closest("[data-remove]");
    if (!remove) return;
    pickedDates.delete(remove.dataset.remove);
    delete startOverrides[remove.dataset.remove];
    refreshReservationPlanner();
});

$("schedulePreview").addEventListener("input", e => {
    if (!e.target.matches("[data-start]")) return;
    startOverrides[e.target.closest("tr").dataset.date] = normTime(e.target.value);
    refreshEndTimes();
});

$("reserveStart").addEventListener("input", () => {
    Object.keys(startOverrides).forEach(k => delete startOverrides[k]);
    renderSchedulePreview();
});

$("reserveUnits").addEventListener("input", renderSchedulePreview);

$("reservationForm").addEventListener("reset", () => {
    pickedDates.clear();
    Object.keys(startOverrides).forEach(k => delete startOverrides[k]);
    setTimeout(refreshReservationPlanner, 0);
});

/* Check the chosen room/date/time against existing reservations.
   Returns an error message string, or "" when the slot is free. */
async function validateReservation(res) {
    if (![1, 2, 3, 4].includes(res.units)) {
        return "Subject units must be 1, 2, 3 or 4.";
    }

    if (!res.roomId || !res.date || !res.startTime || !res.endTime) {
        return "Please complete the classroom, date, start time and end time.";
    }

    if (res.date < localToday()) {
        return "You cannot reserve a classroom for a past date.";
    }

    if (res.endTime <= res.startTime) {
        return "End time must be later than start time.";
    }

    if (res.startTime < OPEN_TIME || res.endTime > CLOSE_TIME) {
        return `A ${res.units}-unit class starting at ${formatTime(res.startTime)} would end at ${formatTime(res.endTime)}. Classrooms can only be reserved between ${formatTime(OPEN_TIME)} and ${formatTime(CLOSE_TIME)}.`;
    }

    if (res.date === localToday()) {
        const now = new Date();
        const nowTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
        if (res.startTime <= nowTime) {
            return "That start time has already passed. Choose a later time.";
        }
    }

    // Fresh schedule from the server for this room and date
    const conflicts = (await getBookedFor(res.roomId, res.date))
        .filter(r => res.startTime < r.EndTime && res.endTime > r.StartTime);

    if (conflicts.length) {
        const roomName = rooms.find(r => r.RoomID === res.roomId)?.RoomName || "This classroom";
        const times = conflicts
            .map(r => `${formatTime(r.StartTime)} - ${formatTime(r.EndTime)}`)
            .join(", ");
        return `Schedule conflict: ${roomName} is already reserved on ${dateText(res.date)} (${times}). Please choose a different time or classroom.`;
    }

    return "";
}

$("reservationForm").addEventListener("submit", async e => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        const units = Number($("reserveUnits").value || 1);
        const sessions = getSessions();

        if (!sessions.length) {
            toast("Click one or more class dates on the calendar.", "error", 6000);
            return;
        }

        if (sessions.some(s => s.minutes < 15)) {
            toast("Too many days selected for this subject. Each day needs at least 15 minutes.", "error", 6000);
            return;
        }

        const base = {
            roomId:$("reserveRoom").value,
            units,
            students:$("reserveStudents").value,
            subject:$("reserveSubject").value,
            purpose:$("reservePurpose").value,
            notes:$("reserveNotes").value
        };

        // Check every selected day before anything is saved
        const problems = await Promise.all(sessions.map(s =>
            validateReservation({...base, date:s.date, startTime:s.startTime, endTime:s.endTime})
        ));
        const problem = problems.find(Boolean);

        if (problem) {
            toast(problem, "error", 7000);
            return;   // nothing is created
        }

        const result = await apiPost("createReservations", {
            reservation:{
                roomId:base.roomId,
                students:base.students,
                subject:base.subject,
                purpose:base.purpose,
                notes:base.notes,
                sessions:sessions.map(s => ({
                    date:s.date,
                    startTime:s.startTime,
                    endTime:s.endTime
                }))
            }
        });

        toast(result.message);
        const roomName = (rooms.find(r => r.RoomID === base.roomId) || {}).RoomName || "the classroom";
        addLocalNotif(
            "Reservation submitted",
            `Your reservation for ${roomName} (${base.subject}) was submitted for ${sessions.length} day${sessions.length > 1 ? "s" : ""}.`,
            {
                RoomName: roomName,
                BookingDate: sessions.map(x => x.date).join(", "),
                BookingTime: sessions.map(x => `${x.startTime}-${x.endTime}`).join(", ")
            }
        );
        $("reservationForm").reset();
        await loadAll();
        navigate("myReservations");

    } catch(error) {
        toast(error.message, "error", 6000);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

/* CANCEL RESERVATION */

async function closeCancel() {
    $("cancelModal").classList.add("hidden");
    $("cancelForm").reset();
}

$("closeCancelModal").onclick = closeCancel;
$("cancelBackBtn").onclick = closeCancel;

$("cancelForm").addEventListener("submit", async e => {
    e.preventDefault();

    try {
        const cancelledRes = reservations.find(r => r.ReservationID === $("cancelReservationID").value);
        const result = await apiPost("cancelReservation", {
            reservationID:$("cancelReservationID").value,
            reason:$("cancelReason").value
        });
        const reasonText = $("cancelReason").value.trim();

        await closeCancel();
        toast(result.message);
        addLocalNotif(
            "Reservation cancelled",
            `You cancelled the reservation for ${cancelledRes ? describeRes(cancelledRes) : "your classroom"}. The administrator has been notified.` +
            (reasonText ? ` Reason: ${reasonText}` : ""),
            cancelledRes ? {
                RoomName: cancelledRes.RoomName,
                BookingDate: cancelledRes.Date,
                BookingTime: `${cancelledRes.StartTime}-${cancelledRes.EndTime}`
            } : {}
        );
        await loadAll();

    } catch(error) {
        toast(error.message, "error");
    }
});

/* CALENDAR */

$("checkCalendarBtn").onclick = async () => {
    const roomId = $("calendarRoom").value;
    const date = $("calendarDate").value;

    if (!roomId || !date) return toast("Select a room and date.", "error");

    try {
        const booked = await getBookedFor(roomId, date);

        $("calendarHeading").textContent = "Schedule for " + dateText(date);
        $("calendarRoomName").textContent =
            rooms.find(r => String(r.RoomID) === String(roomId))?.RoomName || "";

        const slots = [];

        const openHour = Number(OPEN_TIME.slice(0,2));
        const closeHour = Number(CLOSE_TIME.slice(0,2));

        for (let hour = openHour; hour < closeHour; hour++) {
            const start = `${pad2(hour)}:00`;
            const end = `${pad2(hour+1)}:00`;

            const hits = booked.filter(r =>
                start < r.EndTime && end > r.StartTime
            );
            const occupied = hits.length > 0;
            const completed = occupied && hits.every(isDone);

            slots.push(`
                <div class="time-slot ${completed ? "done" : occupied ? "booked" : ""}">
                    ${formatTime(start)} - ${formatTime(end)}
                    <br>${completed ? "Completed" : occupied ? "Reserved" : "Available"}
                </div>
            `);
        }

        const details = booked.length ? `
            <div style="grid-column:1/-1;text-align:left;font-size:13px;margin-top:6px">
                <strong>Reserved times</strong>
                ${booked.sort((a, b) => a.StartTime.localeCompare(b.StartTime)).map(r => `
                    <div class="reserved-row">
                        <span>
                            ${formatTime(r.StartTime)} - ${formatTime(r.EndTime)}
                            ${r.InstructorName ? " · " + escapeHTML(r.InstructorName) : ""}
                            ${r.Subject ? " · " + escapeHTML(r.Subject) : ""}
                            ${r.Purpose ? " · " + escapeHTML(r.Purpose) : ""}
                        </span>
                        ${isDone(r) ? `<span class="status status-completed">Completed</span>` : ""}
                    </div>`).join("")}
            </div>` : "";

        $("timeSlotContainer").innerHTML = slots.join("") + details;

    } catch(error) {
        toast(error.message, "error");
    }
};

/* PROFILE */

let profilePhotoData = "";
let profilePhotoSmall = "";

/* Resize the chosen picture in the browser (max 600px, JPEG) before upload */
function compressImage(file, maxSize = 600, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read the image."));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("This file is not a valid image."));
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

/* Small copy (under ~40,000 characters) kept as a fallback in the sheet
   if Google Drive refuses the upload. */
async function compressSmall(file, attempts, limit = 40000) {
    let last = "";
    for (const [size, quality] of attempts) {
        last = await compressImage(file, size, quality);
        if (last.length <= limit) return last;
    }
    return last;
}

$("profilePhotoFile").addEventListener("change", async e => {
    const file = e.target.files[0];
    profilePhotoData = "";
    profilePhotoSmall = "";

    if (!file) return;

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        toast("Please choose a JPG, PNG or WebP image.", "error");
        e.target.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        toast("Image is too large. Choose a picture under 10 MB.", "error");
        e.target.value = "";
        return;
    }

    try {
        profilePhotoData = await compressImage(file);
        profilePhotoSmall = await compressSmall(file, [[256,.8],[200,.7],[160,.6],[128,.5]]);
        setAvatar($("profileAvatar"), instructorUser || {}, profilePhotoData);
    } catch (error) {
        toast(error.message, "error");
        e.target.value = "";
    }
});

$("profileForm").addEventListener("submit", async e => {
    e.preventDefault();

    try {
        const result = await apiPost("updateProfile", {
            profile:{
                fullName:$("profileName").value,
                department:$("profileDepartment").value,
                email:$("profileEmail").value,
                contact:$("profileContact").value,
                photoData:profilePhotoData,
                photoSmall:profilePhotoSmall
            }
        });

        profilePhotoData = "";
        profilePhotoSmall = "";
        $("profilePhotoFile").value = "";

        if (result.user) setUser(result.user);

        toast("Profile updated.");
        await loadAll();

    } catch(error) {
        toast(error.message, "error");
    }
});

/* NOTIFICATIONS */

$("markAllReadBtn").onclick = async () => {
    try { await apiPost("markNotificationsRead"); } catch (error) { /* still mark here */ }

    const s = st();
    allNotifications().forEach(n => { if (!s.read.includes(nid(n))) s.read.push(nid(n)); });
    s.localNotifs.forEach(n => { n.IsRead = true; });
    saveState();
    renderNotifications();
    toast("All notifications marked as read.");
};

$("deleteArchivedNotifsBtn").onclick = () => {
    const archived = allNotifications().filter(isArchivedNotif);
    if (!archived.length) return;
    if (!confirm(`Move ${archived.length} archived notification(s) to Trash?`)) return;

    const s = st();
    archived.forEach(n => {
        const id = nid(n);
        if (!s.deletedNotifs.includes(id)) s.deletedNotifs.push(id);
        s.archivedNotifs = s.archivedNotifs.filter(x => x !== id);
    });
    saveState();
    renderNotifications();
    toast("Moved to Trash. You can restore them from the Trash tab.");
};

function purgeNotifs(ids) {
    const s = st();
    ids.forEach(id => {
        if (!s.purgedNotifs.includes(id)) s.purgedNotifs.push(id);
    });
    s.deletedNotifs = s.deletedNotifs.filter(x => !ids.includes(x));
    s.archivedNotifs = s.archivedNotifs.filter(x => !ids.includes(x));
    s.localNotifs = s.localNotifs.filter(n => !ids.includes(n.NotificationID));
    saveState();
    renderNotifications();
}

$("emptyTrashNotifsBtn").onclick = () => {
    const ids = rawNotifications().filter(isTrashedNotif).map(nid);
    if (!ids.length) return;
    if (!confirm(`Permanently delete ${ids.length} notification(s) in Trash? This cannot be undone.`)) return;
    purgeNotifs(ids);
    toast("Trash emptied.");
};

$("page-notifications").addEventListener("click", e => {
    const tab = e.target.closest("[data-notif-view]");
    if (tab) { notifView = tab.dataset.notifView; renderNotifications(); return; }

    const s = st();

    const readBtn = e.target.closest("[data-n-read]");
    if (readBtn) { markNotifRead(readBtn.dataset.nRead); return; }

    const unreadBtn = e.target.closest("[data-n-unread]");
    if (unreadBtn) { markNotifUnread(unreadBtn.dataset.nUnread); return; }

    const arch = e.target.closest("[data-n-archive]");
    if (arch) {
        const id = arch.dataset.nArchive;
        if (s.archivedNotifs.includes(id)) s.archivedNotifs = s.archivedNotifs.filter(x => x !== id);
        else { s.archivedNotifs.push(id); if (!s.read.includes(id)) s.read.push(id); s.unread = s.unread.filter(x => x !== id); }
        saveState();
        renderNotifications();
        toast(notifView === "archived" ? "Notification restored." : "Notification archived.");
        return;
    }

    const del = e.target.closest("[data-n-delete]");
    if (del) {
        const id = del.dataset.nDelete;
        if (!s.deletedNotifs.includes(id)) s.deletedNotifs.push(id);
        saveState();
        renderNotifications();
        toast("Moved to Trash. Open the Trash tab to restore or delete it permanently.", "success", 5000);
        return;
    }

    const restore = e.target.closest("[data-n-restore]");
    if (restore) {
        s.deletedNotifs = s.deletedNotifs.filter(x => x !== restore.dataset.nRestore);
        saveState();
        renderNotifications();
        toast("Notification restored.");
        return;
    }

    const purge = e.target.closest("[data-n-purge]");
    if (purge) {
        if (!confirm("Permanently delete this notification? This cannot be undone.")) return;
        purgeNotifs([purge.dataset.nPurge]);
        toast("Notification permanently deleted.");
        return;
    }

    // clicking an unread message reads it
    const card = e.target.closest(".notification-item.unread");
    if (card) markNotifRead(card.dataset.nid);
});

/* FILTERS */

const renderRoomsSoon = debounce(renderRooms);
const renderReservationsSoon = debounce(renderReservations);

["roomSearch","buildingFilter","capacityFilter"].forEach(id => {
    $(id).addEventListener("input", renderRoomsSoon);
});

["reservationSearch","reservationStatusFilter"].forEach(id => {
    $(id).addEventListener("input", renderReservationsSoon);
});

/* AUTO REFRESH: keep reservations, rooms and notifications up to date */

const REFRESH_MS = 30000;
let refreshing = false;

async function autoRefresh() {
    if (refreshing || document.hidden || !instructorToken) return;
    if ($("appScreen").classList.contains("hidden")) return;
    if (document.querySelector(".modal:not(.hidden)")) return;   // don't disturb an open dialog

    refreshing = true;
    const before = allNotifications().filter(n => !isArchivedNotif(n) && isUnread(n)).length;

    try {
        await loadAll({ silent: true });
        const after = allNotifications().filter(n => !isArchivedNotif(n) && isUnread(n)).length;
        if (after > before) toast("You have a new notification.", "success", 4000);
    } finally {
        refreshing = false;
    }
}

setInterval(autoRefresh, REFRESH_MS);
document.addEventListener("visibilitychange", () => { if (!document.hidden) autoRefresh(); });
window.addEventListener("online", autoRefresh);

/* REPORT / FEEDBACK */

let myFeedback = [];

function normFeedback(f) {
    const pick = (...keys) => keys.map(k => f[k]).find(v => v !== undefined && v !== null);
    return {
        FeedbackID: pick("FeedbackID", "feedbackID", "id"),
        CreatedAt: pick("CreatedAt", "createdAt", "Date", "date") || "",
        Type: pick("Type", "type") || "Feedback",
        RoomName: pick("RoomName", "roomName") || "",
        Title: pick("Title", "title") || "",
        Message: pick("Message", "message") || "",
        Status: pick("Status", "status") || "New",
        AdminReply: pick("AdminReply", "adminReply", "Reply", "reply") || ""
    };
}

function feedbackStatusClass(s) {
    return s === "Resolved" ? "status-confirmed" : s === "Reviewed" ? "status-pending" : "status-new";
}

function renderFeedback(error) {
    const box = $("feedbackList");
    if (!box) return;

    if (error) {
        box.innerHTML = `<div class="empty-state">${escapeHTML(error)}</div>`;
        return;
    }

    box.innerHTML = [...myFeedback]
        .sort((a, b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)))
        .map(f => `
            <div class="feedback-card">
                <div class="feedback-top">
                    <strong>${escapeHTML(f.Title)}</strong>
                    <span class="status ${feedbackStatusClass(f.Status)}">${escapeHTML(f.Status)}</span>
                </div>
                <small class="muted">
                    ${escapeHTML(f.Type)}${f.RoomName ? " · " + escapeHTML(f.RoomName) : ""}
                    ${f.CreatedAt ? " · " + escapeHTML(new Date(f.CreatedAt).toLocaleString()) : ""}
                </small>
                <p>${escapeHTML(f.Message)}</p>
                <div class="feedback-actions"><button type="button" class="action-btn" data-fb-delete="${escapeHTML(f.FeedbackID)}">Delete</button></div>
                ${f.AdminReply ? `<div class="feedback-reply"><strong>Administrator reply</strong><p>${escapeHTML(f.AdminReply)}</p></div>` : ""}
            </div>
        `).join("") || `<div class="empty-state">You have not sent any report or feedback yet.</div>`;
}

async function loadFeedback() {
    try {
        const result = await apiGet("getMyFeedback");
        myFeedback = (result.feedback || []).map(normFeedback);
        renderFeedback();
    } catch (error) {
        renderFeedback(/unknown action/i.test(error.message)
            ? "Feedback is not enabled on the server yet."
            : error.message);
    }
}

$("feedbackList").addEventListener("click", async e => {
    const btn = e.target.closest("[data-fb-delete]");
    if (!btn) return;

    const item = myFeedback.find(f => String(f.FeedbackID) === btn.dataset.fbDelete);
    $("deleteFeedbackID").value = btn.dataset.fbDelete;
    $("deleteFeedbackName").textContent = item ? `"${item.Title}"` : "";
    $("deleteFeedbackModal").classList.remove("hidden");
    $("deleteFeedbackReason").focus();
});

function closeDeleteFeedback() {
    $("deleteFeedbackModal").classList.add("hidden");
    $("deleteFeedbackForm").reset();
}

$("closeDeleteFeedback").onclick = closeDeleteFeedback;
$("deleteFeedbackBack").onclick = closeDeleteFeedback;

$("deleteFeedbackForm").addEventListener("submit", async e => {
    e.preventDefault();

    const reason = $("deleteFeedbackReason").value.trim();
    if (!reason) return toast("A reason is required to delete.", "error");

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;

    try {
        await apiPost("deleteFeedback", {feedbackID: $("deleteFeedbackID").value, reason});
        closeDeleteFeedback();
        toast("Deleted. The administrator has been notified.");
        await loadFeedback();
    } catch (error) {
        toast(error.message, "error", 6000);
    } finally {
        btn.disabled = false;
    }
});

$("feedbackForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;

    try {
        await apiPost("submitFeedback", {
            feedback: {
                type: $("feedbackType").value,
                roomId: $("feedbackRoom").value,
                roomName: (rooms.find(r => String(r.RoomID) === $("feedbackRoom").value) || {}).RoomName || "",
                title: $("feedbackTitle").value.trim(),
                message: $("feedbackMessage").value.trim()
            }
        });
        toast("Sent! The administrator will see your message.");
        e.target.reset();
        await loadFeedback();
    } catch (error) {
        toast(/unknown action/i.test(error.message)
            ? "Feedback is not enabled on the server yet."
            : error.message, "error", 6000);
    } finally {
        if (btn) btn.disabled = false;
    }
});

/* STARTUP */

(function initialize() {
    $("calendarDate").value = localToday();
    $("reserveStart").min = OPEN_TIME;
    $("reserveStart").max = "20:00";
    refreshReservationPlanner();

    const savedEmail = localStorage.getItem("cr_email");
    if (savedEmail) $("loginEmail").value = savedEmail;
    $("rememberMe").checked = localStorage.getItem("cr_remember_off") !== "1";

    if (instructorToken && instructorUser) {
        showApp();
    } else {
        showAuth();
    }
})();
