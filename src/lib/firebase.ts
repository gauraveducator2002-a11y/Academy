import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-7566563207-df572",
  "appId": "1:10205623058:web:98b730ff5cf8a7e35739cb",
  "storageBucket": "studio-7566563207-df572.firebasestorage.app",
  "apiKey": "AIzaSyB9w7cjvUuQsVpSLG9-TUAcFUcIqO-9kfs",
  "authDomain": "studio-7566563207-df572.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "10205623058"
};

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);


export const createFirebaseUser = async (email, password) => {
    // We need a secondary app to create users without signing the admin out.
    const secondaryAppName = `user-creation-app-${Date.now()}`;
    let secondaryApp;
    
    try {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Error creating user with secondary app:", error);
        return { success: false, error: error };
    } finally {
        if (secondaryApp) {
            await deleteApp(secondaryApp);
        }
    }
};
