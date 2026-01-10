import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/firebase';

export { auth, googleProvider };

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
    if (!auth) throw new Error("Firebase not configured. Missing API keys.");
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google Sign In Error", error);
        throw error;
    }
};
