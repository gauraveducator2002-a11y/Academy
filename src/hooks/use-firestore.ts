'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const parseFirestoreData = (data: any) => {
  if (!data) return data;
  if (data instanceof Timestamp) return data.toDate();
  if (Array.isArray(data)) return data.map(parseFirestoreData);
  if (typeof data === 'object') {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = parseFirestoreData(data[key]);
    }
    return newData;
  }
  return data;
};

const serializeForFirestore = (data: any) => {
    if (!data) return data;
    if (data instanceof Date) return Timestamp.fromDate(data);
    if (Array.isArray(data)) return data.map(serializeForFirestore);
    if (typeof data === 'object' && data.constructor === Object) {
      const newData: { [key: string]: any } = {};
      for (const key in data) {
        newData[key] = serializeForFirestore(data[key]);
      }
      return newData;
    }
    return data;
  };

export function useFirestoreCollection<T>(
  collectionName: string,
  initialData: T[],
  schema: z.ZodType<T[]>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          const item = parseFirestoreData({ id: doc.id, ...doc.data() });
          items.push(item);
        });

        try {
          // Sort by timestamp if available for consistent ordering
          if (items.length > 0 && 'timestamp' in items[0] && items[0].timestamp instanceof Date) {
            items.sort((a, b) => (b as any).timestamp.getTime() - (a as any).timestamp.getTime());
          }
          const validatedData = schema.parse(items);
          setData(validatedData);
        } catch (error) {
          console.error(`Zod validation failed for ${collectionName}:`, error);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching ${collectionName}: `, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, schema]);
  
  const addItem = useCallback(async (item: Omit<T, 'id'>) => {
    const docRef = doc(collection(db, collectionName));
    const newItem = { ...item, id: docRef.id };
    await setDoc(docRef, serializeForFirestore(item));
    return newItem;
  }, [collectionName]);

  const updateItem = useCallback(async (id: string, item: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, serializeForFirestore(item));
  }, [collectionName]);

  const deleteItem = useCallback(async (id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  }, [collectionName]);

  return { data, loading, addItem, updateItem, deleteItem };
}


export function useFirestoreDocument<T>(
  collectionName: string,
  docId: string,
  initialData: T,
  schema: z.ZodType<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);

  const docRef = doc(db, collectionName, docId);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const item = parseFirestoreData(docSnap.data());
           try {
            const validatedData = schema.parse(item);
            setData(validatedData);
          } catch (error) {
            console.error(`Zod validation failed for ${collectionName}/${docId}:`, error);
          }
        } else if (docId !== 'default') {
             setDoc(docRef, serializeForFirestore(initialData));
        }
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching ${collectionName}/${docId}: `, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId, initialData, schema, docRef]);
  
  const updateData = useCallback(async (id: string, newData: any) => {
    const specificDocRef = doc(db, collectionName, id);
    await setDoc(specificDocRef, serializeForFirestore(newData), { merge: true });
  }, [collectionName]);
  
  const getDoc = useCallback(async (id: string) => {
    const specificDocRef = doc(db, collectionName, id);
    const docSnap = await getDoc(specificDocRef);
    if (docSnap.exists()) {
        return parseFirestoreData(docSnap.data()) as T;
    }
    return null;
  }, [collectionName]);
  
  const deleteDoc = useCallback(async (id: string) => {
    const specificDocRef = doc(db, collectionName, id);
    await deleteDoc(specificDocRef);
  }, [collectionName]);

  // Special handling for the 'default' document case
  const updateDefaultData = useCallback(async (newData: T) => {
    await setDoc(docRef, serializeForFirestore(newData));
  }, [docRef]);

  return { data, loading, updateData: docId === 'default' ? updateDefaultData : updateData, getDoc, deleteDoc: deleteDoc };
}

// Hook for theme which still uses localStorage
export const useTheme = (defaultValue: 'light' | 'dark', key: string) => {
    const [value, setValue] = useState(defaultValue);
  
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stickyValue = window.localStorage.getItem(key);
                if (stickyValue !== null) {
                    setValue(JSON.parse(stickyValue));
                } else {
                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                    setValue(mediaQuery.matches ? 'dark' : 'light');
                }
            } catch (error) {
                console.error(`Error reading localStorage key "${key}":`, error);
            }
        }
    }, [key]);
  
    useEffect(() => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }
    }, [key, value]);
  
    return [value, setValue] as const;
};
