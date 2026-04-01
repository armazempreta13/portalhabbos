'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface FirebaseContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if profile exists, if not create it
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const newProfile = {
            username: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email,
            avatar: currentUser.photoURL,
            role: 'user',
            xp: 0,
            level: 1,
            streakDays: 0,
            trustScore: 1.0,
            isBanned: false,
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data());
        }
      },
      (error) => {
        console.error("Error fetching profile:", error);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  const prevLevelRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (profile && prevLevelRef.current !== null && profile.level > prevLevelRef.current) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success(`🎉 Parabéns! Você avançou para o Nível ${profile.level}!`, { 
          duration: 6000, 
          style: { background: '#7c3aed', color: '#fff', fontWeight: 'bold' } 
        });
      });
    }
    if (profile) {
      prevLevelRef.current = profile.level;
    }
  }, [profile?.level]);

  return (
    <FirebaseContext.Provider value={{ user, profile, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};