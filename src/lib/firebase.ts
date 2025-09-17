import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-3178617184-5b71f",
  "appId": "1:256812077095:web:7990145b2b3874315f6990",
  "storageBucket": "studio-3178617184-5b71f.appspot.com",
  "apiKey": "AIzaSyAndd0ARLFx2Q5QrIdr6ITGHiltAogvbt4",
  "authDomain": "studio-3178617184-5b71f.firebaseapp.com",
  "messagingSenderId": "256812077095"
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
