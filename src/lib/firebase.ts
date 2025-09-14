import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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

export const createFirebaseUser = async (email, password) => {
    // We need a secondary app to create users without signing the admin out
    const secondaryAppName = 'user-creation-app';
    let secondaryApp;
    try {
        secondaryApp = getApp(secondaryAppName);
    } catch (e) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }
    
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        // User created successfully
        
        // Clean up the secondary app instance to avoid memory leaks
        deleteApp(secondaryApp);

        return { success: true, user: userCredential.user };
    } catch (error) {
        // Clean up the secondary app instance in case of error
        deleteApp(secondaryApp);
        return { success: false, error: error };
    }
};
