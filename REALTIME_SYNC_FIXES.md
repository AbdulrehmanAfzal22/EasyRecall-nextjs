# Real-Time Dashboard Sync - Issue Analysis & Solutions

## Problem Summary
Your dashboard boxes weren't syncing in real-time across different devices because:

1. **Data stored in localStorage** - Flashcards, quizzes, and segments were stored in browser-local storage, not distributed database
2. **No cross-device communication** - Each device maintains its own separate data copy
3. **Listener dependency issue** - The `useUserStats` hook wasn't properly managing authentication state

---

## Issues Fixed

### 1. **localStorage-Based Storage (Main Issue)**
**Problem:** 
- `flashcardStore.js`, `quizStore.js`, and `segmentStore.js` only used `localStorage`
- localStorage is unique per device/browser - no cross-device sync
- Opening your app on phone wouldn't see data from laptop

**Solution:** 
- Created `firebaseStore.js` with Firestore integration
- Updated all stores to sync with Firestore while maintaining localStorage fallback
- Implemented `onSnapshot` listeners for real-time updates

### 2. **useUserStats Hook Dependency Problems**
**Problem:**
```javascript
const user = auth.currentUser;  // ❌ Gets user once, never updates
useEffect(() => {
  // ...
}, [user])  // ❌ Object reference changes, unnecessary re-renders
```

**Solution:**
```javascript
const [user, setUser] = useState(null);  // ✅ Track user state
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((currentUser) => {
    setUser(currentUser);  // ✅ Update state when auth changes
  });
  return () => unsubscribe();
}, []);

useEffect(() => {
  // ...
}, [user?.uid])  // ✅ Depend on stable UID, not user object
```

### 3. **Missing Real-Time Hooks**
**Problem:** Components couldn't subscribe to real-time data updates

**Solution:** Created `useRealtimeData.js` with hooks for:
- `useRealtimeFlashcards()` - Live flashcard sync across devices
- `useRealtimeFlashcardProgress()` - Live study progress
- `useRealtimeQuiz()` - Live quiz data
- `useRealtimeQuizProgress()` - Live quiz answers
- `useRealtimeSegments()` - Live content segments

---

## Firestore Collection Structure

```
users/
  {userId}/
    userStats/
      (existing - kept as is)
    flashcards/
      data → { cards: [...], meta: {...} }
      progress → { progress: {...} }
    quizzes/
      data → { quiz: {...}, meta: {...} }
      progress → { progress: {...} }
    segments/
      data → { groups: [...], stats: {...}, fileNames, topic }
```

---

## How to Use in Components

### Before (localStorage only):
```javascript
import { loadFlashcards } from "../../lib/flashcardStore";

const flashcards = loadFlashcards();  // ❌ Static, once only
```

### After (Real-time sync):
```javascript
import { useRealtimeFlashcards } from "../../hooks/useRealtimeData";

export default function MyComponent() {
  const { cards, meta, loading } = useRealtimeFlashcards();
  
  return (
    <div>
      {loading ? "Loading..." : `${cards.length} cards`}
    </div>
  );
}
```

---

## Migration Checklist

### Phase 1: Dashboard Components (Immediate)
- [x] Update `dash-home/page.jsx` to use real-time hooks
- [ ] Update `content-intake/page.jsx` 
- [ ] Update `flashcard/page.jsx`
- [ ] Update `quiz/page.jsx`
- [ ] Update `progress-flashcard/page.jsx`

### Phase 2: Data Updates
- [x] Updated `flashcardStore.js` to sync with Firestore
- [x] Updated `quizStore.js` to sync with Firestore
- [x] Updated `segmentStore.js` to sync with Firestore

### Phase 3: Backend Updates (API Routes)
- [ ] Update `/api/extract-segments/route.js` to save to Firestore
- [ ] Update `/api/generate-flashcards/route.js` to save to Firestore

---

## Example: Update a Component to Use Real-Time Data

### Current: `app/page/dashboard/flashcard/page.jsx`
```javascript
// Before (static)
import { loadFlashcards, loadProgress } from "../../../lib/flashcardStore";

export default function FlashcardPage() {
  const data = loadFlashcards();
  const progress = loadProgress();
}
```

### Updated: Using Real-Time Hooks
```javascript
// After (real-time sync)
import { useRealtimeFlashcards, useRealtimeFlashcardProgress } from "../../../hooks/useRealtimeData";

export default function FlashcardPage() {
  const { cards, meta, loading: cardsLoading } = useRealtimeFlashcards();
  const { data: progress, loading: progressLoading } = useRealtimeFlashcardProgress();
  
  if (cardsLoading || progressLoading) return <div>Loading...</div>;
  
  // cards and progress now update in real-time across all devices
}
```

---

## Offline Support

**How it works:**
1. When online: Data syncs to Firestore in real-time
2. When offline: Uses cached localStorage copy
3. When connection restored: Firestore sync resumes automatically

The stores now follow this pattern:
```javascript
export function saveFlashcards(cards, meta = {}) {
  // 1. Always save to localStorage (offline support)
  localStorage.setItem(KEYS.CARDS, JSON.stringify(payload));
  
  // 2. Also sync to Firestore if logged in
  if (auth.currentUser?.uid) {
    saveFlashcardsToFirestore(auth.currentUser.uid, cards, meta)
      .catch(err => console.warn("Firestore sync failed"));
  }
}
```

---

## Testing Real-Time Sync

1. **Open on Device A (Laptop)**
   - Create a flashcard
   - See it appear in dashboard

2. **Open on Device B (Phone)**
   - Login with same account
   - Flashcard appears immediately ✅

3. **Modify on Device B**
   - Mark flashcard as reviewed
   - Device A updates automatically ✅

4. **Test Offline Sync**
   - Device A goes offline
   - Make changes locally
   - Comes back online
   - Changes sync to Firestore ✅

---

## Files Modified/Created

### Created:
- `lib/firebaseStore.js` - Firestore operations with real-time listeners
- `app/hooks/useRealtimeData.js` - Custom hooks for real-time data

### Updated:
- `app/hooks/useUserStats.js` - Fixed auth state management
- `lib/flashcardStore.js` - Added Firestore sync
- `lib/quizStore.js` - Added Firestore sync
- `lib/segmentStore.js` - Added Firestore sync

---

## Next Steps

1. **Update Dashboard Components** to use the new hooks
2. **Update API Routes** to save directly to Firestore
3. **Test on Multiple Devices** to verify real-time sync
4. **Monitor Firestore Usage** to optimize read/write operations

---

## Troubleshooting

### Data not syncing?
- Check Firestore security rules allow user data reads/writes
- Verify user is logged in (`auth.currentUser?.uid` returns value)
- Check browser console for errors

### Real-time updates not appearing?
- Ensure component is using `useRealtimeFlashcards()` hook (not `loadFlashcards()`)
- Check that useEffect cleanup is removing listeners properly

### localStorage still showing old data?
- Clear browser cache/localStorage: `localStorage.clear()`
- Firestore is source of truth; localStorage is just a cache
