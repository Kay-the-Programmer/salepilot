import { auth } from "./config";
import {
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";

export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Return the full user credential so we can get the ID token
    return result.user;
};
