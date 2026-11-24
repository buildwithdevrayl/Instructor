/************************************************************
 CLASSROOMRESERVE - CLASSROOM RESERVATION SYSTEM
 DATABASE: GOOGLE SHEETS
 BACKEND: GOOGLE APPS SCRIPT
************************************************************/

const CONFIG = {
  ADMIN_EMAIL: "admin@university.edu",
  ADMIN_PASSWORD: "Admin@12345",
  SESSION_HOURS: 8,
  TIMEZONE: Session.getScriptTimeZone()
};

const HEADERS = {
  Instructors: [
    "InstructorID", "FullName", "EmployeeID", "Department",
    "Email", "Contact", "PasswordHash", "Salt", "Status",
    "CreatedAt", "PhotoURL"
  ],
  Rooms: [
    "RoomID", "RoomName", "Building", "Floor", "Capacity",
    "Facilities", "PhotoURL", "Description", "Status", "CreatedAt"
  ],
  Reservations: [
    "ReservationID", "InstructorID", "InstructorName",
    "RoomID", "RoomName", "Date", "StartTime", "EndTime",
    "Students", "Subject", "Purpose", "Notes", "Status",
    "CancellationReason", "CreatedAt", "CancelledAt", "InstructorView", "AdminView"
  ],
  Notifications: [
    "NotificationID", "Recipient", "Title", "Message",
    "Type", "IsRead", "CreatedAt",
    "RoomName", "BookingDate", "BookingTime", "IsArchived"
  ],
  Feedback: [
    "FeedbackID", "InstructorID", "InstructorName", "InstructorEmail",
    "Type", "RoomID", "RoomName", "Title", "Message",
    "Status", "AdminReply", "CreatedAt", "UpdatedAt",
    "InstructorDeleted", "AdminDeleted"
  ],
  Admins: [
    "AdminID", "FullName", "Email", "PasswordHash",
    "Salt", "Status", "CreatedAt"
  ],
  Settings: ["Setting", "Value"]
};

/* PERFORMANCE: every request is one execution. The spreadsheet is opened once
   and each sheet is read once (memo), then re-read only after a write. */
let _dbMemo_ = null;
let _rowsMemo_ = {};
let _fmtMemo_ = {};

let _verMemo_ = {};

/* Every write calls this, so the shared (cross-request) sheet cache is
   invalidated immediately and nobody ever reads stale rows. */
function clearRowsMemo_() {
  _rowsMemo_ = {};
  bumpVer_("db");
}

/* Cross-request cache for values bigger than 100 KB (split into chunks). */
function cacheGetBig_(key) {
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get(key + ":n") || 0);

  if (!n) return null;

  const keys = [];
  for (let i = 0; i < n; i++) keys.push(key + ":" + i);

  const parts = cache.getAll(keys);
  let text = "";

  for (let i = 0; i < n; i++) {
    const p = parts[keys[i]];
    if (p === undefined || p === null) return null;
    text += p;
  }

  try { return JSON.parse(text); } catch (err) { return null; }
}

function cachePutBig_(key, value, ttl) {
  try {
    const text = JSON.stringify(value);
    const size = 30000;                       // safe for multi-byte text (100 KB limit)
    const n = Math.ceil(text.length / size);

    if (n > 30) return;                       // too big: skip caching

    const all = {};
    for (let i = 0; i < n; i++) all[key + ":" + i] = text.slice(i * size, (i + 1) * size);
    all[key + ":n"] = String(Math.max(n, 1));

    CacheService.getScriptCache().putAll(all, ttl);
  } catch (err) {}
}

function getDB() {
  if (_dbMemo_) return _dbMemo_;

  const id = PropertiesService.getScriptProperties()
    .getProperty("SPREADSHEET_ID");

  if (!id) throw new Error("Database not configured.");

  _dbMemo_ = SpreadsheetApp.openById(id);
  return _dbMemo_;
}

/* Cross-request cache. The key carries a version number that is bumped on
   every write, so users never see stale rooms or calendars. */
function newVer_() {
  return String(Date.now()) + Math.random().toString(36).slice(2, 6);
}

function getVer_(name) {
  if (_verMemo_[name]) return _verMemo_[name];

  const cache = CacheService.getScriptCache();
  let v = cache.get("ver_" + name);

  if (!v) {
    v = newVer_();
    cache.put("ver_" + name, v, 21600);
  }

  _verMemo_[name] = v;
  return v;
}

function bumpVer_(name) {
  const v = newVer_();
  _verMemo_[name] = v;
  CacheService.getScriptCache().put("ver_" + name, v, 21600);
}

/* Runs when someone edits the Google Sheet BY HAND, so manual changes show up
   in the portals immediately (script writes already refresh the cache). */
function onEdit() {
  try { bumpVer_("db"); bumpVer_("res"); bumpVer_("rooms"); } catch (err) {}
}

/* Short fingerprint of the data. The portals send it back so the server can
   answer "unchanged" instead of re-sending everything. It also changes every
   2 minutes and every day, so time-based screens stay correct. */
function dataVer_() {
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
  return getVer_("db") + "|" + today + "|" + Math.floor(Date.now() / 120000);
}

function cached_(key, ttl, compute) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(key);

  if (hit) {
    try { return JSON.parse(hit); } catch (err) {}
  }

  const value = compute();

  try { cache.put(key, JSON.stringify(value), ttl); } catch (err) {} // too big: skip

  return value;
}

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) throw new Error("Open this script from your Google Sheet.");

  PropertiesService.getScriptProperties()
    .setProperty("SPREADSHEET_ID", ss.getId());

  Object.keys(HEADERS).forEach(name => {
    let sheet = ss.getSheetByName(name);

    if (!sheet) sheet = ss.insertSheet(name);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS[name].length)
        .setValues([HEADERS[name]]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS[name].length)
        .setFontWeight("bold");
    }
  });

  const admins = getRows("Admins");

  if (!admins.length) {
    const salt = Utilities.getUuid();
    const hash = hashPassword_(CONFIG.ADMIN_PASSWORD, salt);

    appendRow("Admins", [
      "ADM-001",
      "System Administrator",
      CONFIG.ADMIN_EMAIL,
      hash,
      salt,
      "Active",
      new Date()
    ]);
  }

  const settings = getRows("Settings");

  if (!settings.some(r => r.Setting === "SystemName")) {
    appendRow("Settings", ["SystemName", "ClassroomReserve"]);
  }

  return "ClassroomReserve database initialized successfully.";
}

/* ---------------- RESPONSE ---------------- */

function output(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = e.parameter.action || "";

    if (action === "health") {
      return output({success:true, message:"ClassroomReserve API is running."});
    }

    /* PUBLIC (no login): classroom availability for students and visitors.
       Room details, reserved TIMES, the NAME of the instructor who booked and
       the SUBJECT are returned - never purposes, notes or contact details.
       These answers are cached, so most student requests never open the sheet. */
    if (action === "publicRooms") {
      return output({
        success:true,
        rooms:getPublicRooms_()
      });
    }

    if (action === "publicSchedule") {
      return output({
        success:true,
        reservations:getPublicScheduleCached_(e.parameter.from, e.parameter.to, e.parameter.roomId)
      });
    }

    // rooms + schedule in ONE request (faster for the student page)
    if (action === "publicAll") {
      return output({
        success:true,
        rooms:getPublicRooms_(),
        reservations:getPublicScheduleCached_(e.parameter.from, e.parameter.to, e.parameter.roomId)
      });
    }

    const token = e.parameter.token || "";
    const session = verifySession_(token);

    if (!session) throw new Error("Invalid or expired session.");

    switch (action) {
      case "getRooms":
        return output({
          success:true,
          rooms:getActiveRooms_()
        });

      case "getBootstrap": {
        // ONE request loads everything a portal needs (much faster than 4-5 calls).
        // If the page already has the latest data ("since"), answer in a few bytes.
        const ver = dataVer_();

        if (e.parameter.since && e.parameter.since === ver) {
          return output({success:true, unchanged:true, ver:ver});
        }

        return output(Object.assign({success:true, ver:ver}, getBootstrap_(session)));
      }

      case "getDashboard":
        return output({
          success:true,
          data:getDashboard_(session)
        });

      case "getReservations":
        return output({
          success:true,
          reservations:getReservations_(session)
        });

      case "getCalendar":
        // Any logged-in user (instructor or admin) can see booked slots
        return output({
          success:true,
          reservations:cached_(
            "cal:" + getVer_("res") + ":" + e.parameter.roomId + ":" + e.parameter.date,
            120,
            () => getCalendar_(e.parameter.roomId, e.parameter.date)
          )
        });

      case "getNotifications":
        return output({
          success:true,
          notifications:getNotifications_(session)
        });

      case "getReports":
        requireAdmin_(session);
        return output({
          success:true,
          reports:getReports_()
        });

      case "getInstructors":
        requireAdmin_(session);
        return output({
          success:true,
          instructors:listInstructors_()
        });

      case "getAllReservations":
        requireAdmin_(session);
        return output({
          success:true,
          reservations:getRows("Reservations")
        });

      case "getMyFeedback":
        requireInstructor_(session);
        return output({
          success:true,
          feedback:getMyFeedback_(session)
        });

      case "getAllFeedback":
        requireAdmin_(session);
        return output({
          success:true,
          feedback:getFeedbackRows_()
        });

      default:
        throw new Error("Unknown action.");
    }

  } catch (err) {
    return output({success:false, message:err.message});
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    const data = JSON.parse(e.postData.contents || "{}");
    const action = data.action;

    let result;

    switch (action) {
      case "register":
        result = registerInstructor_(data);
        break;

      case "login":
        result = login_(data);
        break;

      case "requestPasswordReset":
        result = requestPasswordReset_(data);
        break;

      case "resetPassword":
        result = resetPassword_(data);
        break;

      case "logout":
        result = logout_(data);
        break;

      case "createReservation":
        result = createReservation_(data);
        break;

      case "createReservations":
        result = createReservations_(data);
        break;

      case "cancelReservation":
        result = cancelReservation_(data);
        break;

      case "setReservationView":
        result = setReservationView_(data);
        break;

      case "setAdminReservationView":
        result = setAdminReservationView_(data);
        break;

      case "updateProfile":
        result = updateProfile_(data);
        break;

      case "markNotificationsRead":
        result = markNotificationsRead_(data);
        break;

      case "adminSaveRoom":
        result = adminSaveRoom_(data);
        break;

      case "adminDeleteRoom":
        result = adminDeleteRoom_(data);
        break;

      case "adminUpdateReservation":
        result = adminUpdateReservation_(data);
        break;

      case "adminSaveInstructor":
        result = adminSaveInstructor_(data);
        break;

      case "adminRemoveRoom":
        result = adminRemoveRoom_(data);
        break;

      case "adminRemoveInstructor":
        result = adminRemoveInstructor_(data);
        break;

      case "archiveNotification":
        result = archiveNotification_(data);
        break;

      case "deleteNotification":
        result = deleteNotification_(data);
        break;

      case "deleteArchivedNotifications":
        result = deleteArchivedNotifications_(data);
        break;

      case "submitFeedback":
        result = submitFeedback_(data);
        break;

      case "updateFeedback":
        result = updateFeedback_(data);
        break;

      case "deleteFeedback":
        result = deleteFeedback_(data);
        break;

      case "adminPublishReport":
        result = {message:"Reports are generated from reservation records."};
        break;

      default:
        throw new Error("Unknown action.");
    }

    return output({success:true, ...result});

  } catch (err) {
    return output({success:false, message:err.message});

  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/* ---------------- DATABASE HELPERS ---------------- */

/* Google Sheets converts "2026-11-19" and "08:00" typed into cells into
   real Date objects. Normalize them back to plain strings so that every
   comparison (calendar, conflicts, reports) works:
     Date               -> "yyyy-MM-dd"
     StartTime/EndTime  -> "HH:mm"
   All other Date cells -> ISO string (as before). */
function cell_(header, v) {
  if (!(v instanceof Date)) return v;

  const kind = (header === "Date" || header === "BookingDate") ? "D"
             : (header === "StartTime" || header === "EndTime") ? "T" : "I";
  const key = kind + v.getTime();

  if (_fmtMemo_[key] !== undefined) return _fmtMemo_[key];

  let out;

  if (kind === "D") {
    out = Utilities.formatDate(v, CONFIG.TIMEZONE, "yyyy-MM-dd");
  } else if (kind === "T") {
    const h = Number(Utilities.formatDate(v, CONFIG.TIMEZONE, "HH"));
    const m = Number(Utilities.formatDate(v, CONFIG.TIMEZONE, "mm"));

    // Sheets time-only cells carry an odd 1899 offset; snap to 5 minutes
    const total = Math.round((h * 60 + m) / 5) * 5;
    const pad = n => ("0" + n).slice(-2);

    out = pad(Math.floor(total / 60) % 24) + ":" + pad(total % 60);
  } else {
    out = v.toISOString();
  }

  _fmtMemo_[key] = out;
  return out;
}

function getRows(name) {
  if (_rowsMemo_[name]) return _rowsMemo_[name].slice();

  // 1) shared cache (no spreadsheet access at all when it hits)
  const ckey = "rows:" + name + ":" + getVer_("db");
  let rows = cacheGetBig_(ckey);

  // 2) read the sheet once, then remember it for the next requests
  if (!rows) {
    const sheet = getDB().getSheetByName(name);
    rows = [];

    if (sheet && sheet.getLastRow() >= 2) {
      const values = sheet.getDataRange().getValues();
      const headers = values.shift();

      rows = values.filter(row => row.some(v => v !== ""))
        .map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = cell_(h, row[i]);
          });
          return obj;
        });
    }

    cachePutBig_(ckey, rows, 300);
  }

  _rowsMemo_[name] = rows;
  return rows.slice();
}

function appendRow(name, values) {
  getDB().getSheetByName(name).appendRow(values);
  clearRowsMemo_();
}

function updateRecord(name, idColumn, id, updates) {
  const sheet = getDB().getSheetByName(name);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const idIndex = headers.indexOf(idColumn);

  if (idIndex < 0) throw new Error("Invalid database field.");

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(id)) {
      Object.keys(updates).forEach(key => {
        const index = headers.indexOf(key);
        if (index >= 0) {
          sheet.getRange(i + 1, index + 1).setValue(updates[key]);
        }
      });
      clearRowsMemo_();
      return true;
    }
  }

  return false;
}

function makeID(prefix) {
  return prefix + "-" + Utilities.getUuid().replace(/-/g, "")
    .substring(0, 10).toUpperCase();
}

/* ---------- SIMPLE SEQUENTIAL IDs (INS-0001, ROOM-0001, NOT-0001) ----------
   A saved counter guarantees an ID is never reused, even after deleting rows. */

function formatID_(prefix, n) {
  const s = String(n);
  return prefix + "-" + ("0000" + s).slice(-Math.max(4, s.length));
}

function saveCounter_(prefix, n) {
  const props = PropertiesService.getScriptProperties();
  const key = "LAST_" + prefix;
  props.setProperty(key, String(Math.max(Number(props.getProperty(key) || 0), n)));
}

function nextID_(sheetName, column, prefix) {
  const sheet = getDB().getSheetByName(sheetName);
  const re = new RegExp("^" + prefix + "-(\\d{1,6})$");
  let max = 0;
  const last = sheet.getLastRow();

  if (last >= 2) {
    const col = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf(column);

    if (col >= 0) {
      sheet.getRange(2, col + 1, last - 1, 1).getValues().forEach(r => {
        const m = String(r[0]).match(re);
        if (m) max = Math.max(max, Number(m[1]));
      });
    }
  }

  const props = PropertiesService.getScriptProperties();
  const key = "LAST_" + prefix;
  const next = Math.max(Number(props.getProperty(key) || 0), max) + 1;

  props.setProperty(key, String(next));

  return formatID_(prefix, next);
}

/* Delete every row whose `column` value is in `ids`. Returns how many. */
function deleteRecords_(sheetName, column, ids) {
  const sheet = getDB().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const index = values[0].indexOf(column);

  if (index < 0) throw new Error("Invalid database field.");

  const wanted = {};
  [].concat(ids).forEach(id => wanted[String(id)] = true);

  let count = 0;

  for (let i = values.length - 1; i >= 1; i--) {
    if (wanted[String(values[i][index])]) {
      sheet.deleteRow(i + 1);
      count++;
    }
  }

  clearRowsMemo_();
  return count;
}

/* ONE-TIME: run simplifyIds() from the Apps Script editor to renumber the IDs
   that already exist (INS-0001, ROOM-0001, NOT-0001) and update every sheet
   that refers to them. Instructors must log in again afterwards. */
function renumberSheet_(sheetName, column, prefix) {
  const sheet = getDB().getSheetByName(sheetName);
  const map = {};
  const last = sheet.getLastRow();

  if (last < 2) return map;

  const col = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf(column);

  if (col < 0) return map;

  const range = sheet.getRange(2, col + 1, last - 1, 1);
  const values = range.getValues();
  const re = new RegExp("^" + prefix + "-(\\d{1,6})$");
  let max = 0;

  values.forEach(r => {
    const m = String(r[0]).match(re);
    if (m) max = Math.max(max, Number(m[1]));
  });

  values.forEach(r => {
    const old = String(r[0]);

    if (old && !re.test(old)) {
      max++;
      map[old] = formatID_(prefix, max);
      r[0] = map[old];
    }
  });

  range.setValues(values);
  clearRowsMemo_();
  saveCounter_(prefix, max);

  return map;
}

function remapColumn_(sheetName, column, map) {
  if (!Object.keys(map).length) return;

  const sheet = getDB().getSheetByName(sheetName);
  const last = sheet.getLastRow();

  if (last < 2) return;

  const col = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf(column);

  if (col < 0) return;

  const range = sheet.getRange(2, col + 1, last - 1, 1);
  const values = range.getValues();

  values.forEach(r => {
    if (map[String(r[0])]) r[0] = map[String(r[0])];
  });

  range.setValues(values);
  clearRowsMemo_();
}

function simplifyIds() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const instructors = renumberSheet_("Instructors", "InstructorID", "INS");
    const rooms = renumberSheet_("Rooms", "RoomID", "ROOM");
    const notes = renumberSheet_("Notifications", "NotificationID", "NOT");

    remapColumn_("Reservations", "InstructorID", instructors);
    remapColumn_("Reservations", "RoomID", rooms);
    remapColumn_("Notifications", "Recipient", instructors);
    bumpVer_("res");
    bumpVer_("rooms");

    return "Done. Renumbered " + Object.keys(instructors).length + " instructors, " +
           Object.keys(rooms).length + " rooms, " + Object.keys(notes).length + " notifications.";
  } finally {
    lock.releaseLock();
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword_(password, salt) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + String(password),
    Utilities.Charset.UTF_8
  );

  return Utilities.base64Encode(digest);
}

function findUser_(email, role) {
  const table = role === "Admin" ? "Admins" : "Instructors";
  return getRows(table).find(r =>
    normalizeEmail(r.Email) === normalizeEmail(email)
  );
}

/* "HH:mm" -> minutes since midnight */
function toMinutes_(t) {
  const s = String(t || "");
  return Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
}

/* ---------------- AUTHENTICATION ---------------- */

function registerInstructor_(d) {
  const name = String(d.fullName || "").trim();
  const email = normalizeEmail(d.email);
  const employeeID = String(d.employeeID || "").trim();
  const password = String(d.password || "");

  if (!name || !email || !employeeID || password.length < 8) {
    throw new Error("Complete all required fields. Password must be at least 8 characters.");
  }

  if (getRows("Instructors").some(r =>
    normalizeEmail(r.Email) === email ||
    String(r.EmployeeID).toLowerCase() === employeeID.toLowerCase()
  )) {
    throw new Error("Email or Employee ID is already registered.");
  }

  const salt = Utilities.getUuid();
  const id = nextID_("Instructors", "InstructorID", "INS");

  appendRow("Instructors", [
    id, name, employeeID, String(d.department || ""),
    email, String(d.contact || ""),
    hashPassword_(password, salt), salt,
    "Active", new Date()
  ]);

  return {message:"Registration successful. You can now log in."};
}

function login_(d) {
  const email = normalizeEmail(d.email);
  const password = String(d.password || "");
  const role = d.role === "Admin" ? "Admin" : "Instructor";

  const user = findUser_(email, role);

  if (!user || user.Status !== "Active") {
    throw new Error("Invalid login or inactive account.");
  }

  if (hashPassword_(password, user.Salt) !== user.PasswordHash) {
    throw new Error("Incorrect email or password.");
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  const expires = Date.now() + CONFIG.SESSION_HOURS * 60 * 60 * 1000;

  CacheService.getScriptCache().put(
    "session_" + token,
    JSON.stringify({
      id: role === "Admin" ? user.AdminID : user.InstructorID,
      email: email,
      name: user.FullName,
      role: role
    }),
    CONFIG.SESSION_HOURS * 3600
  );

  return {
    token:token,
    expiresAt:expires,
    user:{
      id:role === "Admin" ? user.AdminID : user.InstructorID,
      name:user.FullName,
      email:email,
      employeeID:user.EmployeeID || "",
      department:user.Department || "",
      contact:user.Contact || "",
      photoURL:user.PhotoURL || "",
      role:role
    }
  };
}

function verifySession_(token) {
  if (!token) return null;

  const value = CacheService.getScriptCache()
    .get("session_" + token);

  if (!value) return null;

  const session = JSON.parse(value);

  // Deleted / deactivated accounts are signed out immediately
  if (CacheService.getScriptCache().get("revoked_" + session.id)) return null;

  return session;
}

function requireAdmin_(session) {
  if (!session || session.role !== "Admin") {
    throw new Error("Administrator permission required.");
  }
}

function requireInstructor_(session) {
  if (!session || session.role !== "Instructor") {
    throw new Error("Instructor permission required.");
  }
}

function getSession_(token, role) {
  const session = verifySession_(token);

  if (!session || session.role !== role) {
    throw new Error("Session expired. Please log in again.");
  }

  return session;
}

function logout_(d) {
  CacheService.getScriptCache().remove("session_" + d.token);
  return {message:"Logged out successfully."};
}

/* ---------------- FORGOT PASSWORD (instructors) ---------------- */

function requestPasswordReset_(d) {
  const email = normalizeEmail(d.email);

  if (!email) throw new Error("Enter your email address.");

  const user = findUser_(email, "Instructor");

  if (!user) throw new Error("No instructor account is registered with this email.");
  if (user.Status !== "Active") throw new Error("This account is inactive. Contact the administrator.");

  const cache = CacheService.getScriptCache();
  const key = "reset_" + email;

  if (cache.get(key + "_wait")) {
    throw new Error("Please wait one minute before requesting another code.");
  }

  const code = String(
    parseInt(Utilities.getUuid().replace(/-/g, "").slice(0, 8), 16) % 900000 + 100000
  );

  try {
    MailApp.sendEmail({
      to: email,
      name: "Admin",
      subject: "Classroom Reservation",
      body: "Hello " + user.FullName + ",\n\n" +
            "Your Classroom Reservation password reset code is: " + code + "\n\n" +
            "It expires in 15 minutes. If you did not request this, ignore this email.\n\n" +
            "Admin - Classroom Reservation",
      htmlBody: resetEmailHtml_(user.FullName, code)
    });
  } catch (err) {
    throw new Error(
      "The reset email could not be sent (" + err.message + "). " +
      "Administrator: run authorizeAll() once in Apps Script, then redeploy."
    );
  }

  // Save the code only after the email was really sent
  cache.put(key, JSON.stringify({hash:hashPassword_(code, email), tries:0}), 900);
  cache.put(key + "_wait", "1", 60);

  return {message:"A 6-digit reset code was sent to " + email + ". It expires in 15 minutes. Check your spam folder too."};
}

/* Pretty HTML email for the password reset code (inline styles + tables so it
   looks right in Gmail, Outlook and phone mail apps). */
function resetEmailHtml_(fullName, code) {
  const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
                                  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const digits = String(code).split("").map(d =>
    '<td style="width:44px;height:56px;background:#E6F6EC;border:1px solid #A9DFC0;' +
    'border-radius:10px;text-align:center;font-size:28px;font-weight:700;color:#11663F;' +
    'font-family:Consolas,Menlo,monospace;">' + d + '</td>'
  ).join('<td style="width:8px;"></td>');

  return '' +
  '<div style="margin:0;padding:0;background:#F5F7F6;">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7F6;padding:28px 12px;">' +
    '<tr><td align="center">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
        'style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;' +
        'border:1px solid #E1E9E3;font-family:Segoe UI,Arial,sans-serif;">' +

        // header
        '<tr><td style="background:#123D2C;padding:26px 24px;text-align:center;">' +
          '<div style="color:#FFFFFF;font-size:20px;font-weight:700;">Classroom Reservation</div>' +
          '<div style="color:#B6CEBF;font-size:13px;margin-top:2px;">Password reset</div>' +
        '</td></tr>' +

        // body
        '<tr><td style="padding:28px 24px 8px;color:#1D3329;font-size:15px;line-height:1.6;">' +
          '<p style="margin:0 0 10px;font-size:17px;font-weight:700;color:#123D2C;">Hello, ' + esc(fullName) + '!</p>' +
          '<p style="margin:0;">We received a request to reset your password. ' +
          'Enter the code below in the app to continue.</p>' +
        '</td></tr>' +

        // code
        '<tr><td align="center" style="padding:22px 24px 8px;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' + digits + '</tr></table>' +
        '</td></tr>' +

        // expiry
        '<tr><td align="center" style="padding:8px 24px 20px;">' +
          '<span style="display:inline-block;background:#FFF1D6;border:1px solid #F0C676;color:#8A5A06;' +
          'font-size:13px;font-weight:600;padding:6px 14px;border-radius:20px;">' +
          '&#9201; Expires in 15 minutes</span>' +
        '</td></tr>' +

        // note
        '<tr><td style="padding:0 24px 26px;color:#6B7C73;font-size:13px;line-height:1.6;">' +
          '<div style="border-top:1px solid #E1E9E3;padding-top:16px;">' +
          'Never share this code with anyone. If you did not request a password reset, ' +
          'you can safely ignore this email &mdash; your password will stay the same.</div>' +
        '</td></tr>' +

        // footer
        '<tr><td style="background:#F5F7F6;padding:16px 24px;text-align:center;color:#6B7C73;font-size:12px;">' +
          'Sent by <strong>Admin</strong> &middot; Classroom Reservation' +
        '</td></tr>' +

      '</table>' +
    '</td></tr>' +
  '</table></div>';
}

/* RUN THIS ONCE from the Apps Script editor (select authorizeAll > Run) and
   accept the permission prompts. It enables sending reset emails and saving
   classroom photos to Google Drive. Then redeploy a new version. */
function authorizeAll() {
  const quota = MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder();
  return "Authorized. Emails left today: " + quota;
}

function resetPassword_(d) {
  const email = normalizeEmail(d.email);
  const code = String(d.code || "").trim();
  const password = String(d.password || "");

  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const cache = CacheService.getScriptCache();
  const key = "reset_" + email;
  const raw = cache.get(key);

  if (!raw) throw new Error("Reset code is invalid or expired. Request a new one.");

  const data = JSON.parse(raw);

  if (data.tries >= 5) {
    cache.remove(key);
    throw new Error("Too many wrong attempts. Request a new code.");
  }

  if (hashPassword_(code, email) !== data.hash) {
    data.tries++;
    cache.put(key, JSON.stringify(data), 900);
    throw new Error("Incorrect reset code.");
  }

  const user = findUser_(email, "Instructor");

  if (!user) throw new Error("Account not found.");

  const salt = Utilities.getUuid();

  updateRecord("Instructors", "InstructorID", user.InstructorID, {
    PasswordHash:hashPassword_(password, salt),
    Salt:salt
  });

  cache.remove(key);

  return {message:"Password reset successful. You can now sign in."};
}

/* ---------------- NOTIFICATIONS ---------------- */

/* Make sure extra columns exist on the Notifications sheet (plain-text format
   so dates like 2026-11-20 are not converted into Date cells). */
function ensureColumns_(sheet, columns) {
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  columns.forEach(col => {
    if (headers.indexOf(col) === -1) {
      clearRowsMemo_();
      const index = headers.length + 1;
      sheet.getRange(1, index).setValue(col).setFontWeight("bold");
      sheet.getRange(1, index, sheet.getMaxRows(), 1).setNumberFormat("@");
      headers.push(col);
    }
  });

  return headers;
}

/* details (optional): {room, date, time}
   date: "2026-11-20" or "2026-11-20, 2026-11-22"
   time: "08:00-09:30" (one range for all dates, or one per date) */
function notify_(recipient, title, message, type, details) {
  const sheet = getDB().getSheetByName("Notifications");
  const headers = ensureColumns_(sheet, ["RoomName", "BookingDate", "BookingTime", "IsArchived"]);
  const d = details || {};

  const values = {
    NotificationID: nextID_("Notifications", "NotificationID", "NOT"),
    Recipient: recipient,
    Title: title,
    Message: message,
    Type: type,
    IsRead: false,
    CreatedAt: new Date(),
    RoomName: d.room || "",
    BookingDate: d.date || "",
    BookingTime: d.time || "",
    IsArchived: "No"
  };

  sheet.appendRow(headers.map(h => values[h] === undefined ? "" : values[h]));
  clearRowsMemo_();
}

function getNotifications_(session) {
  return getRows("Notifications")
    .filter(n => n.Recipient === session.id ||
                 (session.role === "Admin" && n.Recipient === "ALL_ADMINS"))
    .sort((a,b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)))
    .slice(0, 300);
}

function markNotificationsRead_(d) {
  const session = verifySession_(d.token);
  if (!session) throw new Error("Session expired.");

  const sheet = getDB().getSheetByName("Notifications");
  const last = sheet.getLastRow();

  if (last >= 2) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const recipientCol = headers.indexOf("Recipient") + 1;
    const readCol = headers.indexOf("IsRead") + 1;

    const recipients = sheet.getRange(2, recipientCol, last - 1, 1).getValues();
    const readRange = sheet.getRange(2, readCol, last - 1, 1);
    const reads = readRange.getValues();

    recipients.forEach((row, i) => {
      if (row[0] === session.id ||
          (session.role === "Admin" && row[0] === "ALL_ADMINS")) {
        reads[i][0] = true;
      }
    });

    readRange.setValues(reads);   // one write instead of one per row
  }

  clearRowsMemo_();
  return {message:"Notifications marked as read."};
}

function isYes_(v) {
  const t = String(v).toLowerCase();
  return v === true || t === "yes" || t === "true";
}

function ownsNotification_(session, n) {
  return n.Recipient === session.id ||
         (session.role === "Admin" && n.Recipient === "ALL_ADMINS");
}

function archiveNotification_(d) {
  const session = verifySession_(d.token);
  if (!session) throw new Error("Session expired.");

  ensureColumns_(getDB().getSheetByName("Notifications"), ["IsArchived"]);

  const id = String(d.notificationID || "");
  const note = getRows("Notifications").find(n => n.NotificationID === id);

  if (!note || !ownsNotification_(session, note)) throw new Error("Notification not found.");

  const archived = d.archived === true || d.archived === "true";

  updateRecord("Notifications", "NotificationID", id, {IsArchived:archived ? "Yes" : "No"});

  return {message: archived ? "Notification archived." : "Notification restored."};
}

function deleteNotification_(d) {
  const session = verifySession_(d.token);
  if (!session) throw new Error("Session expired.");

  const id = String(d.notificationID || "");
  const note = getRows("Notifications").find(n => n.NotificationID === id);

  if (!note || !ownsNotification_(session, note)) throw new Error("Notification not found.");

  deleteRecords_("Notifications", "NotificationID", id);

  return {message:"Notification deleted."};
}

function deleteArchivedNotifications_(d) {
  const session = verifySession_(d.token);
  if (!session) throw new Error("Session expired.");

  const ids = getRows("Notifications")
    .filter(n => ownsNotification_(session, n) && isYes_(n.IsArchived))
    .map(n => n.NotificationID);

  if (!ids.length) return {message:"No archived notifications to delete."};

  deleteRecords_("Notifications", "NotificationID", ids);

  return {message:ids.length + " archived notification(s) deleted."};
}

/* ---------------- ROOMS ---------------- */

/* Save an uploaded picture (data URL from the browser) in Google Drive and
   return a link that works inside <img src="...">. */
function saveRoomPhoto_(dataUrl, roomName, smallDataUrl) {
  return saveImage_(dataUrl, roomName, "PHOTO_FOLDER_ID", "ClassroomReserve Room Photos", smallDataUrl);
}

/* Save a picture in Google Drive and return a link usable in <img src>.
   If Drive refuses (permission / sharing policy), fall back to the small
   copy (data URL) sent by the browser and store that directly in the sheet. */
function saveImage_(dataUrl, name, propKey, folderName, smallDataUrl) {
  try {
    return saveImageToDrive_(dataUrl, name, propKey, folderName);
  } catch (err) {
    const small = String(smallDataUrl || "");

    if (small.indexOf("data:image/jpeg;base64,") === 0 && small.length <= 45000) {
      return small;
    }

    throw new Error(
      "Photo could not be saved (" + err.message + "). " +
      "Administrator: run authorizeAll() in Apps Script and redeploy."
    );
  }
}

function saveImageToDrive_(dataUrl, name, propKey, folderName) {
  const text = String(dataUrl || "");
  const marker = ";base64,";
  const at = text.indexOf(marker);
  const mime = text.slice(5, at);

  if (!text.startsWith("data:image/") || at < 0 ||
      ["image/jpeg", "image/png", "image/webp"].indexOf(mime) === -1) {
    throw new Error("Invalid image. Upload a JPG, PNG or WebP picture.");
  }

  const base64 = text.slice(at + marker.length);

  if (base64.length > 4000000) throw new Error("Image is too large. Choose a smaller picture.");

  const ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
  const safe = String(name || "image").replace(/[^A-Za-z0-9]+/g, "-").slice(0, 40);
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, safe + "-" + Date.now() + ext);

  const props = PropertiesService.getScriptProperties();
  let folder = null;
  const folderId = props.getProperty(propKey);

  if (folderId) {
    try { folder = DriveApp.getFolderById(folderId); } catch (err) { folder = null; }
  }

  if (!folder) {
    folder = DriveApp.createFolder(folderName);
    props.setProperty(propKey, folder.getId());
  }

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
}

function adminSaveRoom_(d) {
  getSession_(d.token, "Admin");
  const r = d.room || {};

  if (!r.roomName || !r.building || !Number(r.capacity)) {
    throw new Error("Complete room name, building, and capacity.");
  }

  if (Number(r.capacity) < 1) throw new Error("Invalid capacity.");

  const rooms = getRows("Rooms");

  // Uploaded picture (if any) replaces the old one; otherwise keep the current link
  const photoURL = r.photoData ? saveRoomPhoto_(r.photoData, r.roomName, r.photoSmall) : (r.photoURL || "");

  if (r.roomId) {
    const existing = rooms.find(x => x.RoomID === r.roomId);
    if (!existing) throw new Error("Room not found.");

    updateRecord("Rooms", "RoomID", r.roomId, {
      RoomName:r.roomName,
      Building:r.building,
      Floor:r.floor || "",
      Capacity:Number(r.capacity),
      Facilities:r.facilities || "",
      PhotoURL:photoURL,
      Description:r.description || "",
      Status:r.status || "Active"
    });
  } else {
    if (rooms.some(x => String(x.RoomName).toLowerCase() === String(r.roomName).toLowerCase() &&
      String(x.Building).toLowerCase() === String(r.building).toLowerCase())) {
      throw new Error("This room already exists.");
    }

    appendRow("Rooms", [
      nextID_("Rooms", "RoomID", "ROOM"), r.roomName, r.building,
      r.floor || "", Number(r.capacity),
      r.facilities || "", photoURL,
      r.description || "", "Active", new Date()
    ]);
  }

  bumpVer_("rooms");
  return {message:"Classroom saved successfully."};
}

function adminDeleteRoom_(d) {
  getSession_(d.token, "Admin");

  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  const active = getRows("Reservations").some(r =>
    r.RoomID === d.roomId &&
    r.Status === "Confirmed" &&
    r.Date >= today
  );

  if (active) throw new Error("Cannot deactivate a room with upcoming reservations.");

  updateRecord("Rooms", "RoomID", d.roomId, {Status:"Inactive"});

  bumpVer_("rooms");
  return {message:"Classroom deactivated."};
}

/* Permanently delete a classroom (only when it has no upcoming bookings).
   Past reservations keep the room name, so history and reports still read well. */
function adminRemoveRoom_(d) {
  getSession_(d.token, "Admin");

  const room = getRows("Rooms").find(r => String(r.RoomID) === String(d.roomId));

  if (!room) throw new Error("Classroom not found.");

  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  const upcoming = getRows("Reservations").filter(r =>
    String(r.RoomID) === String(room.RoomID) &&
    r.Status === "Confirmed" &&
    r.Date >= today
  ).length;

  if (upcoming) {
    throw new Error("Cannot delete " + room.RoomName + ": it has " + upcoming +
                    " upcoming reservation(s). Cancel them first.");
  }

  deleteRecords_("Rooms", "RoomID", room.RoomID);

  bumpVer_("rooms");
  return {message:room.RoomName + " was deleted."};
}

/* ---------------- RESERVATIONS ---------------- */

function validDateTime_(date, start, end) {
  const dateString = String(date || "");
  const startString = String(start || "");
  const endString = String(end || "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(startString) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(endString)) {
    throw new Error("Invalid date or time.");
  }

  const startMinutes = toMinutes_(startString);
  const endMinutes = toMinutes_(endString);

  if (endMinutes <= startMinutes) throw new Error("End time must be later than start time.");

  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  if (dateString < today) throw new Error("Cannot reserve a past date.");

  return {startMinutes, endMinutes};
}

function createReservation_(d) {
  const session = getSession_(d.token, "Instructor");
  const r = d.reservation || {};

  const times = validDateTime_(r.date, r.startTime, r.endTime);
  const room = getRows("Rooms").find(x =>
    String(x.RoomID) === String(r.roomId) && x.Status === "Active"
  );

  if (!room) throw new Error("Classroom is not available.");

  const students = Number(r.students);

  if (!Number.isInteger(students) || students < 1 ||
      students > Number(room.Capacity)) {
    throw new Error("Student count exceeds room capacity or is invalid.");
  }

  if (!r.subject || !r.purpose) {
    throw new Error("Subject and purpose are required.");
  }

  // Conflict check against EVERY instructor's confirmed bookings
  const clash = getRows("Reservations").find(x => {
    if (String(x.RoomID) !== String(room.RoomID) ||
        x.Date !== r.date ||
        x.Status !== "Confirmed") return false;

    return times.startMinutes < toMinutes_(x.EndTime) &&
           times.endMinutes > toMinutes_(x.StartTime);
  });

  if (clash) {
    throw new Error(
      "This classroom is already reserved from " +
      clash.StartTime + " to " + clash.EndTime + "."
    );
  }

  const id = nextReservationID_();
  const reservation = [
    id, session.id, session.name, room.RoomID,
    room.RoomName, r.date, r.startTime, r.endTime,
    students, r.subject, r.purpose,
    r.notes || "", "Confirmed", "", new Date(), ""
  ];

  appendRow("Reservations", reservation);
  bumpVer_("res");

  notify_(
    session.id,
    "Reservation Confirmed",
    room.RoomName + " has been reserved for " + r.date + ".",
    "reservation",
    {room:room.RoomName, date:r.date, time:r.startTime + "-" + r.endTime}
  );

  notify_(
    "ALL_ADMINS",
    "New Classroom Reservation",
    session.name + " reserved " + room.RoomName + " for " + r.date + ".",
    "new_booking",
    {room:room.RoomName, date:r.date, time:r.startTime + "-" + r.endTime}
  );

  return {
    message:"Reservation confirmed successfully.",
    reservationID:id
  };
}

/* Short sequential Reservation ID (RES-0001, RES-0002, ...).
   The same ID is saved in the database and shown in the portals.
   Reservation creation runs inside the script lock, so IDs never repeat. */
function maxReservationNumber_() {
  let max = 0;

  getRows("Reservations").forEach(r => {
    const m = String(r.ReservationID).match(/^RES-(\d{1,6})$/);
    if (m) max = Math.max(max, Number(m[1]));
  });

  return max;
}

function formatReservationID_(n) {
  const s = String(n);
  return "RES-" + ("0000" + s).slice(-Math.max(4, s.length));
}

function nextReservationID_() {
  return formatReservationID_(maxReservationNumber_() + 1);
}

/* MULTI-DAY RESERVATION
   One subject, one room, many class days. The frontend divides the subject's
   units (1 unit = 1 hour) across the chosen dates and sends one session per
   date. Every session is validated first; if any one fails, NOTHING is saved. */
function createReservations_(d) {
  const session = getSession_(d.token, "Instructor");
  const r = d.reservation || {};
  const sessions = Array.isArray(r.sessions) ? r.sessions : [];

  if (!sessions.length) throw new Error("Select at least one class date.");
  if (sessions.length > 31) throw new Error("You can reserve at most 31 dates at once.");

  const room = getRows("Rooms").find(x =>
    String(x.RoomID) === String(r.roomId) && x.Status === "Active"
  );

  if (!room) throw new Error("Classroom is not available.");

  const students = Number(r.students);

  if (!Number.isInteger(students) || students < 1 ||
      students > Number(room.Capacity)) {
    throw new Error("Student count exceeds room capacity or is invalid.");
  }

  if (!r.subject || !r.purpose) {
    throw new Error("Subject and purpose are required.");
  }

  const OPEN = toMinutes_("07:00");
  const CLOSE = toMinutes_("21:00");

  const existing = getRows("Reservations").filter(x =>
    String(x.RoomID) === String(room.RoomID) && x.Status === "Confirmed"
  );

  const seenDates = {};

  // 1) Validate EVERY day before saving anything
  const planned = sessions.map(s => {
    const times = validDateTime_(s.date, s.startTime, s.endTime);

    if (times.endMinutes - times.startMinutes < 15) {
      throw new Error("Each class day needs at least 15 minutes (" + s.date + ").");
    }

    if (times.startMinutes < OPEN || times.endMinutes > CLOSE) {
      throw new Error("Classrooms can only be reserved between 07:00 and 21:00 (" + s.date + ").");
    }

    if (seenDates[s.date]) throw new Error("Date selected twice: " + s.date + ".");
    seenDates[s.date] = true;

    const clash = existing.find(x =>
      x.Date === s.date &&
      times.startMinutes < toMinutes_(x.EndTime) &&
      times.endMinutes > toMinutes_(x.StartTime)
    );

    if (clash) {
      throw new Error(
        room.RoomName + " is already reserved on " + s.date + " from " +
        clash.StartTime + " to " + clash.EndTime + ". Nothing was saved."
      );
    }

    return s;
  }).sort((a, b) => a.date < b.date ? -1 : 1);

  // 2) Save all days in one write
  let n = maxReservationNumber_();
  const ids = [];
  const now = new Date();

  const rows = planned.map(s => {
    const id = formatReservationID_(++n);
    ids.push(id);

    return [
      id, session.id, session.name, room.RoomID,
      room.RoomName, s.date, s.startTime, s.endTime,
      students, r.subject, r.purpose,
      r.notes || "", "Confirmed", "", now, ""
    ];
  });

  const sheet = getDB().getSheetByName("Reservations");
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows);
  clearRowsMemo_();
  bumpVer_("res");

  const dates = planned.map(s => s.date).join(", ");
  const ranges = planned.map(s => s.startTime + "-" + s.endTime);
  const bookingInfo = {
    room: room.RoomName,
    date: dates,
    time: ranges.every(x => x === ranges[0]) ? ranges[0] : ranges.join(", ")
  };

  notify_(
    session.id,
    "Reservations Confirmed",
    room.RoomName + " reserved for " + r.subject + " on " + dates + ".",
    "reservation",
    bookingInfo
  );

  notify_(
    "ALL_ADMINS",
    "New Classroom Reservations",
    session.name + " reserved " + room.RoomName + " for " + r.subject +
    " on " + planned.length + " date(s): " + dates + ".",
    "new_booking",
    bookingInfo
  );

  return {
    message: planned.length === 1
      ? "Reservation confirmed successfully."
      : planned.length + " reservations confirmed successfully.",
    reservationIDs: ids
  };
}

function cancelReservation_(d) {
  const session = getSession_(d.token, "Instructor");
  const id = String(d.reservationID || "");
  const reason = String(d.reason || "").trim();

  if (!reason) throw new Error("Cancellation reason is required.");

  const reservation = getRows("Reservations")
    .find(r => r.ReservationID === id);

  if (!reservation) throw new Error("Reservation not found.");

  if (reservation.InstructorID !== session.id) {
    throw new Error("You cannot cancel another instructor's reservation.");
  }

  if (reservation.Status !== "Confirmed") {
    throw new Error("This reservation is no longer active.");
  }

  updateRecord("Reservations", "ReservationID", id, {
    Status:"Cancelled",
    CancellationReason:reason,
    CancelledAt:new Date()
  });

  bumpVer_("res");

  notify_(
    "ALL_ADMINS",
    "Reservation Cancelled",
    session.name + " cancelled reservation " + id +
    " for " + reservation.RoomName +
    ". Reason: " + reason,
    "cancellation",
    {room:reservation.RoomName, date:reservation.Date, time:reservation.StartTime + "-" + reservation.EndTime}
  );

  notify_(
    session.id,
    "Cancellation Successful",
    "Your reservation for " + reservation.RoomName + " has been cancelled.",
    "cancellation",
    {room:reservation.RoomName, date:reservation.Date, time:reservation.StartTime + "-" + reservation.EndTime}
  );

  return {message:"Reservation cancelled. Admin has been notified."};
}

/* Instructor's own view of finished/cancelled reservations, saved in the sheet
   so it is the same on every device.
   view: "" (normal) | "Archived" | "Trash" | "Deleted" (hidden for good).
   The row stays in the sheet for admin records and reports. */
function setReservationView_(d) {
  const session = getSession_(d.token, "Instructor");
  const view = String(d.view || "");

  if (["", "Archived", "Trash", "Deleted"].indexOf(view) < 0) throw new Error("Invalid view.");

  const ids = [].concat(d.reservationIDs || []).map(String);
  if (!ids.length) throw new Error("Nothing selected.");

  const sheet = getDB().getSheetByName("Reservations");
  const headers = ensureColumns_(sheet, ["InstructorView"]);

  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  // only the instructor's own cancelled or finished reservations
  // (date today or earlier, so server/browser timezone differences cannot block it)
  const ok = {};
  getRows("Reservations").forEach(r => {
    if (ids.indexOf(String(r.ReservationID)) < 0 || r.InstructorID !== session.id) return;
    if (r.Status === "Cancelled" || (r.Status === "Confirmed" && r.Date <= today)) {
      ok[String(r.ReservationID)] = true;
    }
  });

  const idCol = headers.indexOf("ReservationID") + 1;
  const viewCol = headers.indexOf("InstructorView") + 1;
  const last = sheet.getLastRow();
  let count = 0;

  if (last >= 2) {
    const idValues = sheet.getRange(2, idCol, last - 1, 1).getValues();
    const viewRange = sheet.getRange(2, viewCol, last - 1, 1);
    const viewValues = viewRange.getValues();

    idValues.forEach((row, i) => {
      if (ok[String(row[0])]) { viewValues[i][0] = view; count++; }
    });

    if (count) viewRange.setValues(viewValues);   // one write
  }

  clearRowsMemo_();
  return {message: count + " reservation(s) updated.", count: count};
}

/* Administrator's Trash / permanent delete of COMPLETED reservations, saved in the
   sheet so it is the same on every device. view: "" | "Trash" | "Deleted".
   Rows stay in the sheet and usage reports still count them. */
function setAdminReservationView_(d) {
  getSession_(d.token, "Admin");
  const view = String(d.view || "");

  if (["", "Trash", "Deleted"].indexOf(view) < 0) throw new Error("Invalid view.");

  const ids = [].concat(d.reservationIDs || []).map(String);
  if (!ids.length) throw new Error("Nothing selected.");

  const sheet = getDB().getSheetByName("Reservations");
  const headers = ensureColumns_(sheet, ["AdminView"]);
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  const ok = {};
  getRows("Reservations").forEach(r => {
    if (ids.indexOf(String(r.ReservationID)) < 0) return;
    if (r.Status === "Confirmed" && r.Date <= today) ok[String(r.ReservationID)] = true;
  });

  const idCol = headers.indexOf("ReservationID") + 1;
  const viewCol = headers.indexOf("AdminView") + 1;
  const last = sheet.getLastRow();
  let count = 0;

  if (last >= 2) {
    const idValues = sheet.getRange(2, idCol, last - 1, 1).getValues();
    const viewRange = sheet.getRange(2, viewCol, last - 1, 1);
    const viewValues = viewRange.getValues();

    idValues.forEach((row, i) => {
      if (ok[String(row[0])]) { viewValues[i][0] = view; count++; }
    });

    if (count) viewRange.setValues(viewValues);   // one write
  }

  clearRowsMemo_();
  return {message: count + " reservation(s) updated.", count: count};
}

/* Instructors do not see reservations they permanently deleted from their
   history ("Deleted"). Admins always see everything. */
function getReservations_(session) {
  return getRows("Reservations")
    .filter(r => session.role === "Admin" ||
                 (r.InstructorID === session.id && r.InstructorView !== "Deleted"))
    .sort((a,b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
}

function getActiveRooms_() {
  return cached_("rooms:" + getVer_("rooms"), 300, () =>
    getRows("Rooms").filter(r => r.Status === "Active")
  );
}

function listInstructors_() {
  return getRows("Instructors").map(r => ({
    instructorID:r.InstructorID,
    fullName:r.FullName,
    employeeID:r.EmployeeID,
    department:r.Department,
    email:r.Email,
    contact:r.Contact,
    status:r.Status
  }));
}

function getBootstrap_(session) {
  const rooms = getActiveRooms_();
  const notifications = getNotifications_(session);

  if (session.role === "Admin") {
    return {
      rooms: rooms,
      instructors: listInstructors_(),
      reservations: getRows("Reservations"),
      notifications: notifications,
      reports: getReports_()
    };
  }

  return {
    rooms: rooms,
    reservations: getReservations_(session),
    notifications: notifications,
    dashboard: getDashboard_(session)
  };
}

/* ROOM CALENDAR: ALL confirmed bookings for a room on a date, from EVERY
   instructor. Only non-private fields are returned. */
function getCalendar_(roomId, date) {
  if (!roomId || !date) return [];

  return getRows("Reservations")
    .filter(r =>
      String(r.RoomID) === String(roomId) &&
      r.Date === String(date) &&
      r.Status === "Confirmed")
    .map(r => ({
      ReservationID: r.ReservationID,
      RoomID: r.RoomID,
      Date: r.Date,
      StartTime: r.StartTime,
      EndTime: r.EndTime,
      Purpose: r.Purpose,
      InstructorName: r.InstructorName,
      Status: r.Status
    }));
}

/* PUBLIC rooms (no login), cached. The key carries the "rooms" version, which
   is bumped whenever a room is added, edited, deactivated or deleted. */
function getPublicRooms_() {
  return cached_("pubrooms:" + getVer_("rooms"), 600, () =>
    getRows("Rooms")
      .filter(r => r.Status === "Active")
      .map(r => ({
        RoomID:r.RoomID, RoomName:r.RoomName, Building:r.Building,
        Floor:r.Floor, Capacity:r.Capacity, Facilities:r.Facilities,
        PhotoURL:r.PhotoURL
      }))
  );
}

/* PUBLIC schedule (no login), cached. The key carries both the "res" and
   "rooms" versions, so every booking, cancellation or room change shows up
   for students immediately. A cache hit never opens the spreadsheet. */
function getPublicScheduleCached_(from, to, roomId) {
  return cached_(
    "pubsched:" + getVer_("res") + ":" + getVer_("rooms") + ":" +
      from + ":" + to + ":" + (roomId || ""),
    300,
    () => getPublicSchedule_(from, to, roomId)
  );
}

/* PUBLIC schedule (no login): reserved times + instructor name + subject, max 62 days at a time */
function getPublicSchedule_(from, to, roomId) {
  const ok = /^\d{4}-\d{2}-\d{2}$/;

  if (!ok.test(String(from || "")) || !ok.test(String(to || ""))) {
    throw new Error("Invalid date range.");
  }

  const days = (new Date(to + "T00:00:00") - new Date(from + "T00:00:00")) / 86400000;

  if (days < 0 || days > 62) throw new Error("Date range is too large.");

  const activeRooms = {};
  getRows("Rooms").filter(r => r.Status === "Active").forEach(r => activeRooms[r.RoomID] = true);

  return getRows("Reservations")
    .filter(r =>
      r.Status === "Confirmed" &&
      activeRooms[r.RoomID] &&
      r.Date >= from && r.Date <= to &&
      (!roomId || String(r.RoomID) === String(roomId)))
    .map(r => ({
      RoomID:r.RoomID,
      RoomName:r.RoomName,
      Date:r.Date,
      StartTime:r.StartTime,
      EndTime:r.EndTime,
      InstructorName:r.InstructorName,
      Subject:r.Subject
    }));
}

function adminUpdateReservation_(d) {
  getSession_(d.token, "Admin");

  const id = d.reservationID;
  const status = d.status;

  if (!["Confirmed", "Cancelled"].includes(status)) {
    throw new Error("Invalid reservation status.");
  }

  const record = getRows("Reservations")
    .find(r => r.ReservationID === id);

  if (!record) throw new Error("Reservation not found.");

  if (status === "Confirmed") {
    const conflict = getRows("Reservations").some(r =>
      r.ReservationID !== id &&
      String(r.RoomID) === String(record.RoomID) &&
      r.Date === record.Date &&
      r.Status === "Confirmed" &&
      toMinutes_(record.StartTime) < toMinutes_(r.EndTime) &&
      toMinutes_(record.EndTime) > toMinutes_(r.StartTime)
    );

    if (conflict) throw new Error("This room and time already conflict with another booking.");
  }

  updateRecord("Reservations", "ReservationID", id, {Status:status});
  bumpVer_("res");

  notify_(record.InstructorID, "Reservation Updated",
    "Administrator updated reservation " + id + " to " + status + ".",
    "reservation",
    {room:record.RoomName, date:record.Date, time:record.StartTime + "-" + record.EndTime});

  return {message:"Reservation updated."};
}

/* ---------------- INSTRUCTOR PROFILE ---------------- */

function updateProfile_(d) {
  const session = getSession_(d.token, "Instructor");
  const p = d.profile || {};

  if (!p.fullName || !p.department || !p.email) {
    throw new Error("Complete all required profile fields.");
  }

  const duplicate = getRows("Instructors").some(r =>
    r.InstructorID !== session.id &&
    normalizeEmail(r.Email) === normalizeEmail(p.email)
  );

  if (duplicate) throw new Error("Email already belongs to another instructor.");

  const updates = {
    FullName:p.fullName,
    Department:p.department,
    Email:normalizeEmail(p.email),
    Contact:p.contact || ""
  };

  if (p.photoData) {
    ensureColumns_(getDB().getSheetByName("Instructors"), ["PhotoURL"]);
    updates.PhotoURL = saveImage_(p.photoData, session.name, "PROFILE_FOLDER_ID", "ClassroomReserve Profile Photos", p.photoSmall);
  }

  updateRecord("Instructors", "InstructorID", session.id, updates);

  const u = getRows("Instructors").find(r => r.InstructorID === session.id);

  // Keep the logged-in session in step with the new name / email
  CacheService.getScriptCache().put(
    "session_" + d.token,
    JSON.stringify({id:session.id, email:normalizeEmail(u.Email), name:u.FullName, role:"Instructor"}),
    CONFIG.SESSION_HOURS * 3600
  );

  return {
    message:"Profile updated.",
    user:{
      id:u.InstructorID,
      name:u.FullName,
      email:normalizeEmail(u.Email),
      employeeID:u.EmployeeID || "",
      department:u.Department || "",
      contact:u.Contact || "",
      photoURL:u.PhotoURL || "",
      role:"Instructor"
    }
  };
}

/* ---------------- ADMIN INSTRUCTORS ---------------- */

function adminSaveInstructor_(d) {
  getSession_(d.token, "Admin");

  const id = d.instructorID;
  const status = d.status;

  if (!["Active", "Inactive"].includes(status)) {
    throw new Error("Invalid instructor status.");
  }

  const record = getRows("Instructors").find(r =>
    r.InstructorID === id
  );

  if (!record) throw new Error("Instructor not found.");

  updateRecord("Instructors", "InstructorID", id, {Status:status});

  // Deactivated instructors are signed out right away; reactivation lifts it
  const cache = CacheService.getScriptCache();

  if (status === "Inactive") cache.put("revoked_" + id, "1", 21600);
  else cache.remove("revoked_" + id);

  return {message:"Instructor account updated."};
}

/* Permanently delete an instructor (only without upcoming bookings). Their
   past reservations stay for the records; their notifications are removed. */
function adminRemoveInstructor_(d) {
  getSession_(d.token, "Admin");

  const id = String(d.instructorID || "");
  const record = getRows("Instructors").find(r => r.InstructorID === id);

  if (!record) throw new Error("Instructor not found.");

  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  const upcoming = getRows("Reservations").filter(r =>
    r.InstructorID === id &&
    r.Status === "Confirmed" &&
    r.Date >= today
  ).length;

  if (upcoming) {
    throw new Error("Cannot delete " + record.FullName + ": they have " + upcoming +
                    " upcoming reservation(s). Cancel them first.");
  }

  const noteIds = getRows("Notifications")
    .filter(n => n.Recipient === id)
    .map(n => n.NotificationID);

  if (noteIds.length) deleteRecords_("Notifications", "NotificationID", noteIds);

  deleteRecords_("Instructors", "InstructorID", id);

  CacheService.getScriptCache().put("revoked_" + id, "1", 21600);

  return {message:record.FullName + " was deleted."};
}

/* ---------------- DASHBOARD AND REPORTS ---------------- */

function getDashboard_(session) {
  const reservations = getReservations_(session);
  const rooms = getRows("Rooms").filter(r => r.Status === "Active");
  const notifications = getNotifications_(session);
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  return {
    total:reservations.length,
    upcoming:reservations.filter(r =>
      r.Status === "Confirmed" && r.Date >= today
    ).length,
    notifications:notifications.filter(n => !isYes_(n.IsArchived) && n.IsRead !== true && n.IsRead !== "TRUE").length,
    rooms:rooms.length
  };
}

function getReports_() {
  const reservations = getRows("Reservations");
  const rooms = getRows("Rooms");
  const instructors = getRows("Instructors");

  const confirmed = reservations.filter(r => r.Status === "Confirmed");
  const cancelled = reservations.filter(r => r.Status === "Cancelled");

  const roomUsage = rooms.map(room => ({
    roomName:room.RoomName,
    building:room.Building,
    total:confirmed.filter(r => r.RoomID === room.RoomID).length
  }));

  const monthly = {};

  confirmed.forEach(r => {
    const month = String(r.Date).substring(0,7);
    monthly[month] = (monthly[month] || 0) + 1;
  });

  return {
    totalReservations:reservations.length,
    confirmed:confirmed.length,
    cancelled:cancelled.length,
    totalRooms:rooms.filter(r => r.Status === "Active").length,
    totalInstructors:instructors.filter(r => r.Status === "Active").length,
    roomUsage:roomUsage,
    monthly:monthly
  };
}

/* ---------------- REPORT / FEEDBACK ---------------- */

/* Creates the "Feedback" sheet automatically if it does not exist yet, so
   you do not have to run setupSystem() again. */
function ensureFeedbackSheet_() {
  const ss = getDB();
  let sheet = ss.getSheetByName("Feedback");

  if (!sheet) {
    sheet = ss.insertSheet("Feedback");
    sheet.getRange(1, 1, 1, HEADERS.Feedback.length).setValues([HEADERS.Feedback]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.Feedback.length).setFontWeight("bold");
    clearRowsMemo_();
  }

  // Older sheets (created before deleting existed) get the two new columns
  ensureColumns_(sheet, ["InstructorDeleted", "AdminDeleted"]);

  return sheet;
}

/* Stop text that starts with = + - @ from being treated as a spreadsheet formula */
function safeText_(value) {
  const s = String(value || "");
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function allFeedbackRows_() {
  return getRows("Feedback")
    .sort((a, b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
}

/* Admin sees everything the admin has not deleted */
function getFeedbackRows_() {
  return allFeedbackRows_().filter(f => !isYes_(f.AdminDeleted));
}

/* An instructor sees only their own items they have not deleted */
function getMyFeedback_(session) {
  return allFeedbackRows_().filter(f =>
    String(f.InstructorID) === String(session.id) && !isYes_(f.InstructorDeleted));
}

function submitFeedback_(d) {
  const session = getSession_(d.token, "Instructor");
  const f = d.feedback || {};

  const title = String(f.title || "").trim().slice(0, 120);
  const message = String(f.message || "").trim().slice(0, 2000);

  if (!title || !message) throw new Error("Please enter a title and a message.");

  const type = ["Problem Report", "Feedback", "Suggestion"].indexOf(f.type) >= 0
    ? f.type : "Feedback";

  // Take the room name from the database, not from the browser
  let roomId = "";
  let roomName = "";

  if (f.roomId) {
    const room = getRows("Rooms").find(r => String(r.RoomID) === String(f.roomId));
    if (room) { roomId = room.RoomID; roomName = room.RoomName; }
  }

  const instructor = getRows("Instructors").find(r => r.InstructorID === session.id) || {};
  const sheet = ensureFeedbackSheet_();
  const id = nextID_("Feedback", "FeedbackID", "FB");
  const now = new Date();

  sheet.appendRow([
    id, session.id, session.name, normalizeEmail(instructor.Email || session.email),
    type, roomId, roomName, safeText_(title), safeText_(message),
    "New", "", now, now, "", ""
  ]);
  clearRowsMemo_();

  notify_(
    "ALL_ADMINS",
    "New " + type + " from " + session.name,
    title + (roomName ? " (" + roomName + ")" : ""),
    "feedback",
    {room: roomName}
  );

  return {message:"Sent! The administrator will see your message.", feedbackID:id};
}

function updateFeedback_(d) {
  getSession_(d.token, "Admin");

  const id = String(d.feedbackID || "");
  const record = getRows("Feedback").find(f => f.FeedbackID === id);

  if (!record) throw new Error("Report not found.");

  const status = ["New", "Reviewed", "Resolved"].indexOf(d.status) >= 0 ? d.status : "Reviewed";
  const reply = String(d.reply || "").trim().slice(0, 2000);

  updateRecord("Feedback", "FeedbackID", id, {
    Status:status,
    AdminReply:safeText_(reply),
    UpdatedAt:new Date()
  });

  // Tell the instructor when something changed (new reply or new status)
  if (!isYes_(record.InstructorDeleted) && reply !== String(record.AdminReply || "") || status !== record.Status) {
    notify_(
      record.InstructorID,
      reply !== String(record.AdminReply || "") ? "Administrator replied to your report" : "Your report was " + status.toLowerCase(),
      "\"" + record.Title + "\" is now " + status + (reply ? ". Reply: " + reply : "."),
      "feedback",
      {room: record.RoomName}
    );
  }

  return {message:"Saved."};
}

/* INSTRUCTOR delete: needs a reason, removes the report for BOTH the instructor
   and the administrator, and leaves a notification (with the reason) for the
   administrators so the deletion is not silent.
   ADMIN delete: removes the report from the admin list only (the instructor
   keeps their copy). The row is erased from the sheet once both sides are gone. */
function deleteFeedback_(d) {
  const session = verifySession_(d.token);
  if (!session) throw new Error("Session expired. Please log in again.");

  ensureFeedbackSheet_();

  const id = String(d.feedbackID || "");
  const record = getRows("Feedback").find(f => f.FeedbackID === id);

  if (!record) throw new Error("Report not found.");

  let instructorGone = isYes_(record.InstructorDeleted);
  let adminGone = isYes_(record.AdminDeleted);

  if (session.role === "Admin") {
    adminGone = true;
    updateRecord("Feedback", "FeedbackID", id, {AdminDeleted:"Yes"});
  } else if (session.role === "Instructor") {
    if (String(record.InstructorID) !== String(session.id)) {
      throw new Error("You cannot delete another instructor's report.");
    }

    const reason = String(d.reason || "").trim().slice(0, 500);
    if (!reason) throw new Error("Please give a reason for deleting this report.");

    notify_(
      "ALL_ADMINS",
      "Report deleted by " + session.name,
      "\"" + record.Title + "\" (" + record.Type + ") was deleted by the instructor. Reason: " + reason,
      "feedback",
      {room: record.RoomName}
    );

    instructorGone = true;
    adminGone = true;
  } else {
    throw new Error("Permission required.");
  }

  if (instructorGone && adminGone) deleteRecords_("Feedback", "FeedbackID", id);

  return {message:"Deleted."};
}
