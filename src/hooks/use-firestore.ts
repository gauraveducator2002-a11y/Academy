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
      const newData: { [key: string]: any } = {};
      for (const key in data) {
        newData[key] = serializeForFirestore(data[key]);
      }
      return newData;
    }
    return data;
  };

export function useFirestoreCollection<T extends {id: string}>(
  collectionName: string,
  initialData: T[],
  schema: z.ZodType<T[]>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(`Error fetching ${collectionName}: `, error);
        setLoading(false);
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

  // Listener for a specific document (if docId is not 'dummy')
  useEffect(() => {
    if (docId === 'dummy') {
        setLoading(false);
        return;
    }
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
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching ${collectionName}/${docId}: `, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId, schema]);
  
  const updateData = useCallback(async (newData: Partial<T>) => {
    if (docId === 'dummy') return; // Don't update if it's a dummy/singleton doc hook
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, serializeForFirestore(newData), { merge: true });
  }, [collectionName, docId]);
  
  const getDoc = useCallback(async (id: string) => {
    const specificDocRef = doc(db, collectionName, id);
    const docSnap = await getDoc(specificDocRef);
    if (docSnap.exists()) {
        try {
            const parsed = parseFirestoreData(docSnap.data());
            return schema.parse(parsed) as T;
        } catch (error) {
            console.error(`Zod validation on getDoc for ${collectionName}/${id} failed:`, error);
            return null;
        }
    }
    return null;
  }, [collectionName, schema]);
  
  const deleteDoc = useCallback(async (id: string) => {
    const specificDocRef = doc(db, collectionName, id);
    await deleteDoc(specificDocRef);
  }, [collectionName]);

  const upsert = useCallback(async (id: string, newData: any) => {
    const specificDocRef = doc(db, collectionName, id);
    await setDoc(specificDocRef, serializeForFirestore(newData), { merge: true });
  }, [collectionName]);


  return { data, loading, updateData, getDoc, deleteDoc, upsert };
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
