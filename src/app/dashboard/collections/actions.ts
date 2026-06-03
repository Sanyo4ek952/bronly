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

function buildCollectionsPath(collectionId?: string, state?: Record<string, string>) {
  const params = new URLSearchParams();

  if (collectionId) {
    params.set("collection", collectionId);
  }

  if (state) {
    for (const [key, value] of Object.entries(state)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();

  return query ? `/dashboard/collections?${query}` : "/dashboard/collections";
}

function revalidateOwnerCollectionPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collections");
}

export async function createOwnerCollectionAction(formData: FormData) {
  const result = await createCollection({
    role: "owner",
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(undefined, { error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths();
  redirect(buildCollectionsPath(result.collectionId, { success: "created" }));
}

export async function renameOwnerCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await renameCollection({
    role: "owner",
    collectionId,
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "saved" }));
}

export async function archiveOwnerCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await archiveCollection({
    role: "owner",
    collectionId,
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "archived" }));
}

export async function addOwnerPropertyToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await addPropertyToCollection({
    role: "owner",
    collectionId,
    propertyId: getString(formData, "propertyId"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "item-added" }));
}

export async function addOwnerRoomToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await addRoomToCollection({
    role: "owner",
    collectionId,
    roomId: getString(formData, "roomId"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "item-added" }));
}

export async function removeOwnerCollectionItemAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await removeCollectionItem({
    role: "owner",
    collectionId,
    itemId: getString(formData, "itemId"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateOwnerCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "item-removed" }));
}
