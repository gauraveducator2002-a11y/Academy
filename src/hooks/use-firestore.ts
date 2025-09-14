'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc as deleteFirestoreDoc,
  Timestamp,
  updateDoc,
  addDoc,
  query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const parseFirestoreData = (data: any): any => {
  if (!data) return data;
  if (data instanceof Timestamp) return data.toDate();
  if (Array.isArray(data)) return data.map(parseFirestoreData);
  if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = parseFirestoreData(data[key]);
    }
    return newData;
  }
  return data;
};

const serializeForFirestore = (data: any): any => {
    if (data === undefined) return null; // Firestore doesn't like 'undefined'
    if (data === null) return null;
    if (data instanceof Date) return Timestamp.fromDate(data);
    if (Array.isArray(data)) return data.map(serializeForFirestore);
    if (typeof data === 'object' && data.constructor === Object) {
      const newData: { [key:string]: any } = {};
      for (const key in data) {
        if (data[key] !== undefined) {
          newData[key] = serializeForFirestore(data[key]);
        }
      }
      return newData;
    }
    return data;
  };

export function useFirestoreCollection<T extends {id: string}>(
  collectionName: string,
  schema: z.ZodType<T[]>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: any[] = [];
        querySnapshot.forEach((doc) => {
          items.push(parseFirestoreData({ id: doc.id, ...doc.data() }));
        });
        try {
          if (items.length > 0 && 'timestamp' in items[0] && items[0].timestamp instanceof Date) {
            items.sort((a, b) => (b as any).timestamp.getTime() - (a as any).timestamp.getTime());
          }
          const validatedData = schema.parse(items);
          setData(validatedData);
        } catch (error) {
          console.error(`Zod validation failed for ${collectionName}:`, error);
          setData([]); // Set to empty array on validation failure
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(`Error fetching ${collectionName}: `, error);
        setLoading(false);
        setData([]); // Also set to empty on fetch error
      }
    );

    return () => unsubscribe();
  }, [collectionName, schema]);

  const addItem = useCallback(async (item: Omit<T, 'id'>) => {
    const docRef = await addDoc(collection(db, collectionName), serializeForFirestore(item));
    return { ...item, id: docRef.id } as T;
  }, [collectionName]);

  const updateItem = useCallback(async (id: string, item: Partial<Omit<T, 'id'>>) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, serializeForFirestore(item));
  }, [collectionName]);

  const deleteItem = useCallback(async (id: string) => {
    await deleteFirestoreDoc(doc(db, collectionName, id));
  }, [collectionName]);

  return { data, loading, addItem, updateItem, deleteItem };
}


export function useFirestoreDocument<T>(
  collectionName: string,
  docId: string | undefined,
  schema: z.ZodType<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const docRef = doc(db, collectionName, docId);
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
            setData(null);
          }
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching ${collectionName}/${docId}: `, error);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId, schema]);
  
  const updateData = useCallback(async (newData: Partial<T>) => {
    if (!docId) return;
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, serializeForFirestore(newData), { merge: true });
  }, [collectionName, docId]);

  const deleteDocFunc = useCallback(async () => {
    if (!docId) return;
    const docRef = doc(db, collectionName, docId);
    await deleteFirestoreDoc(docRef);
  }, [collectionName, docId]);


  return { data, loading, updateData, deleteDoc: deleteDocFunc };
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
