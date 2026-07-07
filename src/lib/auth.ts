import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

export function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign in cancelled.';
    case 'auth/cancelled-popup-request':
      return 'Sign in cancelled.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

async function syncGoogleProfile(user: User) {
  if (user.displayName?.trim()) {
    await api.updateProfile({ name: user.displayName.trim() });
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await api.verify();
  return cred.user;
}

export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await api.updateProfile({ name: name.trim() });
  await api.verify();
  return cred.user;
}

export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  await syncGoogleProfile(cred.user);
  await api.verify();
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
