// lib/contentService.js
// All Firebase operations for user study content

import { db, storage } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// ── Firestore path: users/{uid}/documents ─────────────────────────────────
const userCol = (uid) => collection(db, "users", uid, "documents");

// ── Upload file to Storage + save everything to Firestore ─────────────────
export async function saveDocument(uid, {
  file,
  extractedText,
  flashcards,
  quiz,
  topic,
  segments,
  segmentStats,
}) {
  let downloadURL = "";
  let storagePath = "";

  // 1. Upload the raw file to Firebase Storage (if a real file)
  if (file) {
    storagePath = `users/${uid}/files/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file);
    downloadURL = await getDownloadURL(fileRef);
  }

  // 2. Save metadata + AI-generated content to Firestore
  const segGroups = segments || null;
  const segStats  = segmentStats || null;
  const segCount  = segStats?.totalSegments
    ?? (Array.isArray(segGroups) ? segGroups.reduce((acc, g) => acc + (g.segments?.length || 0), 0) : 0);

  const docRef = await addDoc(userCol(uid), {
    topic:          topic || file?.name || "Untitled",
    fileName:       file?.name || "Pasted text",
    fileType:       file ? file.name.split(".").pop().toLowerCase() : "txt",
    fileSize:       file?.size || 0,
    storagePath,
    downloadURL,
    extractedText:  (extractedText || "").slice(0, 12000), // Firestore 1MB doc limit
    flashcards:     flashcards || [],
    flashcardCount: (flashcards || []).length,
    quiz:           quiz || null,
    quizCount:      quiz
      ? (quiz.mcq?.length || 0) + (quiz.trueFalse?.length || 0) + (quiz.shortAnswer?.length || 0)
      : 0,
    segments:       segGroups,
    segmentCount:   segCount,
    segmentStats:   segStats,
    createdAt:      serverTimestamp(),
  });

  return docRef.id;
}

// ── Load all documents for a user (newest first) ──────────────────────────
export async function loadDocuments(uid) {
  const q    = query(userCol(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
  }));
}

// ── Delete document from Firestore + file from Storage ────────────────────
export async function deleteDocument(uid, docId, storagePath) {
  await deleteDoc(doc(db, "users", uid, "documents", docId));
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath));
    } catch (_) {
      // File may have already been deleted — ignore
    }
  }
}

// ── Update document (e.g. rename topic) ──────────────────────────────────
export async function updateDocument(uid, docId, updates) {
  await updateDoc(doc(db, "users", uid, "documents", docId), updates);
}

// ── Save flashcard progress back to Firestore ─────────────────────────────
export async function saveFlashcardProgress(uid, docId, progress) {
  await updateDoc(doc(db, "users", uid, "documents", docId), {
    flashcardProgress: progress,
  });
}

// ── Save quiz progress back to Firestore ──────────────────────────────────
export async function saveQuizProgress(uid, docId, progress) {
  await updateDoc(doc(db, "users", uid, "documents", docId), {
    quizProgress: progress,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────
export function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024)    return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function formatDate(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}