import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../page/AuthProvider';

/**
 * useSubscription - Hook to fetch user subscription details from Firebase
 * Returns: { subscription, loading, error }
 * subscription = { status, plan, paidAt, expiresAt, sessionId, amount }
 */
export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().subscription) {
          const subData = userSnap.data().subscription;
          
          // Convert Firestore Timestamp to Date if needed
          if (subData.expiresAt && typeof subData.expiresAt === 'object' && 'toDate' in subData.expiresAt) {
            subData.expiresAt = subData.expiresAt.toDate();
          }
          if (subData.paidAt && typeof subData.paidAt === 'object' && 'toDate' in subData.paidAt) {
            subData.paidAt = subData.paidAt.toDate();
          }
          if (subData.lastPaymentAt && typeof subData.lastPaymentAt === 'object' && 'toDate' in subData.lastPaymentAt) {
            subData.lastPaymentAt = subData.lastPaymentAt.toDate();
          }

          // Check if subscription is expired
          if (subData.expiresAt && new Date() > new Date(subData.expiresAt)) {
            setSubscription({ ...subData, status: 'expired' });
          } else {
            setSubscription(subData);
          }
        } else {
          setSubscription(null);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err.message);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, authLoading]);

  return { subscription, loading, error };
}

export default useSubscription;
