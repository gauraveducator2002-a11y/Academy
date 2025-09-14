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
    // Re-initializing and then deleting the app can cause issues with the primary app's connection.
    // A safer pattern is to get or create the secondary app and leave it for the session.
    const secondaryAppName = 'user-creation-app';
    let secondaryApp;
    
    if (getApps().some(app => app.name === secondaryAppName)) {
        secondaryApp = getApp(secondaryAppName);
    } else {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }
    
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        // User created successfully. Do NOT delete the secondary app as it can interfere
        // with the main app's connection and cause "client is offline" errors.
        return { success: true, user: userCredential.user };
    } catch (error) {
        // Log the error but don't delete the app.
        console.error("Error creating user with secondary app:", error);
        return { success: false, error: error };
    }
};
