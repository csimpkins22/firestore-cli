import { Firestore, type CollectionReference, type DocumentData, type DocumentSnapshot, type Query } from "@google-cloud/firestore";

import type { ParsedOrderBy, ParsedWhere } from "../cli/options.js";
import { FirestoreCommandError } from "./errors.js";
import type { DeepDocument, FirestoreProfile, SerializedDocument } from "./types.js";

export function createFirestoreClient(profile: FirestoreProfile): Firestore {
  if (profile.mode === "emulator") {
    const [servicePath, portRaw] = profile.emulatorHost.split(":");
    const port = Number.parseInt(portRaw ?? "8080", 10);

    return new Firestore({
      databaseId: profile.databaseId,
      port,
      projectId: profile.projectId,
      servicePath,
      ssl: false,
    });
  }

  return new Firestore({
    databaseId: profile.databaseId,
    keyFilename: profile.credentialsPath,
    projectId: profile.projectId,
  });
}

export function applyQueryOptions(
  baseQuery: Query<DocumentData>,
  where: ParsedWhere[],
  orderBy: ParsedOrderBy[],
  limit?: number,
  offset?: number,
  select?: string[],
): Query<DocumentData> {
  let query = baseQuery;

  for (const clause of where) {
    query = query.where(clause.field, clause.operator, clause.value);
  }

  for (const clause of orderBy) {
    query = query.orderBy(clause.field, clause.direction);
  }

  if (typeof offset === "number") {
    query = query.offset(offset);
  }

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  if (select && select.length > 0) {
    query = query.select(...select);
  }

  return query;
}

export async function listCollections(
  firestore: Firestore,
  documentPath?: string,
): Promise<Array<{ id: string; path: string }>> {
  const collections = documentPath
    ? await firestore.doc(documentPath).listCollections()
    : await firestore.listCollections();

  return collections
    .map((collection) => ({
      id: collection.id,
      path: collection.path,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

export async function getDocument(
  firestore: Firestore,
  documentPath: string,
): Promise<SerializedDocument> {
  const snapshot = await firestore.doc(documentPath).get();
  if (!snapshot.exists) {
    throw new FirestoreCommandError(`Document "${documentPath}" was not found.`);
  }

  return serializeDocument(snapshot);
}

export async function runQuery(
  firestore: Firestore,
  collectionPath: string,
  where: ParsedWhere[],
  orderBy: ParsedOrderBy[],
  limit?: number,
  offset?: number,
  select?: string[],
): Promise<SerializedDocument[]> {
  const query = applyQueryOptions(
    firestore.collection(collectionPath),
    where,
    orderBy,
    limit,
    offset,
    select,
  );

  const snapshot = await query.get();
  return snapshot.docs.map(serializeDocument);
}

export async function runCollectionGroupQuery(
  firestore: Firestore,
  collectionId: string,
  where: ParsedWhere[],
  orderBy: ParsedOrderBy[],
  limit?: number,
  offset?: number,
  select?: string[],
): Promise<SerializedDocument[]> {
  const query = applyQueryOptions(
    firestore.collectionGroup(collectionId),
    where,
    orderBy,
    limit,
    offset,
    select,
  );

  const snapshot = await query.get();
  return snapshot.docs.map(serializeDocument);
}

export async function getDocumentDeep(
  firestore: Firestore,
  documentPath: string,
): Promise<DeepDocument> {
  const snapshot = await firestore.doc(documentPath).get();
  if (!snapshot.exists) {
    throw new FirestoreCommandError(`Document "${documentPath}" was not found.`);
  }

  const collections = await firestore.doc(documentPath).listCollections();
  const subcollections: Record<string, DeepDocument[]> = {};

  await Promise.all(
    collections.map(async (collectionRef) => {
      const docsSnapshot = await collectionRef.get();
      if (docsSnapshot.docs.length === 0) return;

      const deepDocs = await Promise.all(
        docsSnapshot.docs.map((doc) => getDocumentDeep(firestore, doc.ref.path)),
      );
      subcollections[collectionRef.id] = deepDocs;
    }),
  );

  return { ...serializeDocument(snapshot), subcollections };
}

export async function setDocument(
  firestore: Firestore,
  documentPath: string,
  data: Record<string, unknown>,
  merge?: boolean,
): Promise<void> {
  await firestore.doc(documentPath).set(data, merge ? { merge: true } : {});
}

export async function createDocument(
  firestore: Firestore,
  documentPath: string,
  data: Record<string, unknown>,
): Promise<void> {
  await firestore.doc(documentPath).create(data);
}

export async function updateDocument(
  firestore: Firestore,
  documentPath: string,
  data: Record<string, unknown>,
): Promise<void> {
  await firestore.doc(documentPath).update(data);
}

export async function deleteDocument(
  firestore: Firestore,
  documentPath: string,
): Promise<void> {
  await firestore.doc(documentPath).delete();
}

export function serializeDocument(snapshot: DocumentSnapshot<DocumentData>): SerializedDocument {
  return {
    createTime: snapshot.createTime?.toDate().toISOString(),
    data: serializeValue(snapshot.data() ?? {}) as Record<string, unknown>,
    id: snapshot.id,
    path: snapshot.ref.path,
    updateTime: snapshot.updateTime?.toDate().toISOString(),
  };
}

export function serializeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    const constructorName = value.constructor?.name;

    if (constructorName === "Timestamp" && typeof (value as { toDate?: () => Date }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }

    if (
      constructorName === "GeoPoint" &&
      "latitude" in (value as Record<string, unknown>) &&
      "longitude" in (value as Record<string, unknown>)
    ) {
      return {
        latitude: (value as { latitude: number }).latitude,
        longitude: (value as { longitude: number }).longitude,
      };
    }

    if (constructorName === "DocumentReference" && "path" in (value as Record<string, unknown>)) {
      return {
        path: (value as { path: string }).path,
      };
    }

    if (Buffer.isBuffer(value)) {
      return value.toString("base64");
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        serializeValue(nestedValue),
      ]),
    );
  }

  return value;
}
