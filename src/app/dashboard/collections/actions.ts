"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addPropertyToCollection,
  addRoomToCollection,
  archiveCollection,
  createCollection,
  removeCollectionItem,
  renameCollection,
} from "@/entities/collection";
import { getString } from "@/shared/lib/form-data";

function appendState(basePath: string, state?: Record<string, string>) {
  const params = new URLSearchParams();

  if (state) {
    for (const [key, value] of Object.entries(state)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

function buildCollectionsListPath(state?: Record<string, string>) {
  return appendState("/dashboard/collections", state);
}

function buildCollectionCreatePath(state?: Record<string, string>) {
  return appendState("/dashboard/collections/new", state);
}

function buildCollectionDetailPath(collectionId: string, state?: Record<string, string>) {
  return appendState(`/dashboard/collections/${collectionId}`, state);
}

function revalidateOwnerCollectionPaths(collectionId?: string, collectionSlug?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collections");

  if (collectionId) {
    revalidatePath(`/dashboard/collections/${collectionId}`);
  }

  if (collectionSlug) {
    revalidatePath(`/c/${collectionSlug}`);
  }
}

export async function createOwnerCollectionAction(formData: FormData) {
  const result = await createCollection({
    role: "owner",
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(buildCollectionCreatePath({ error: result.reason ?? "save_failed" }));
  }

  const collectionId = result.collectionId ?? "";
  const collectionSlug = result.collectionSlug ?? "";

  revalidateOwnerCollectionPaths(collectionId, collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "created" }));
}

export async function renameOwnerCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await renameCollection({
    role: "owner",
    collectionId,
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "saved" }));
}

export async function archiveOwnerCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await archiveCollection({
    role: "owner",
    collectionId,
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "archived" }));
}

export async function addOwnerPropertyToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await addPropertyToCollection({
    role: "owner",
    collectionId,
    propertyId: getString(formData, "propertyId"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "item-added" }));
}

export async function addOwnerRoomToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await addRoomToCollection({
    role: "owner",
    collectionId,
    roomId: getString(formData, "roomId"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "item-added" }));
}

export async function removeOwnerCollectionItemAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await removeCollectionItem({
    role: "owner",
    collectionId,
    itemId: getString(formData, "itemId"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "item-removed" }));
}
