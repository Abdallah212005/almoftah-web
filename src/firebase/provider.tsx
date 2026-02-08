
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { AppUser, AdminUser } from '@/lib/definitions';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Fixed Bootstrap Admin Email
const BOOTSTRAP_ADMIN_EMAIL = 'abdallah@almoftah.com';

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          setUserAuthState(prev => ({ ...prev, isUserLoading: true }));
          try {
            const uid = firebaseUser.uid;
            const email = firebaseUser.email;

            // 1. Bootstrap Super Admin if it's the specific email
            if (email === BOOTSTRAP_ADMIN_EMAIL) {
              const superAdminData: AdminUser = {
                id: uid,
                username: 'abdallah amr',
                email: email,
                role: 'superadmin',
                tasks: ['Manage Team Members', 'Oversee Listings'],
                visible: true,
              };
              // Ensure the profile exists in Firestore
              await setDoc(doc(firestore, 'admin_users', uid), superAdminData, { merge: true });
              await setDoc(doc(firestore, 'roles_admin', uid), { active: true }, { merge: true });
              
              setUserAuthState({ user: { ...superAdminData, uid } as AppUser, isUserLoading: false, userError: null });
              return;
            }

            // 2. Check for active admin profile
            const adminByUidRef = doc(firestore, 'admin_users', uid);
            const adminByUidDoc = await getDoc(adminByUidRef);

            if (adminByUidDoc.exists()) {
              setUserAuthState({ user: { ...adminByUidDoc.data(), uid } as AppUser, isUserLoading: false, userError: null });
              return;
            }

            // 3. Regular Customers
            const userRef = doc(firestore, 'users', uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              setUserAuthState({ user: { ...userDoc.data(), uid } as AppUser, isUserLoading: false, userError: null });
              return;
            }

            // 4. Default for new users
            setUserAuthState({ 
              user: { uid, email: email || '', role: 'user', username: firebaseUser.displayName || 'New User' } as AppUser, 
              isUserLoading: false, 
              userError: null 
            });

          } catch (error) {
            console.error("Auth Bootstrap Error:", error);
            setUserAuthState({ user: null, isUserLoading: false, userError: error as Error });
          }
        } else {
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase services not initialized.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { user: context.user, isUserLoading: context.isUserLoading, userError: context.userError };
};
