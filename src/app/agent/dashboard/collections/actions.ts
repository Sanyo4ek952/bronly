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

  return query ? `/agent/dashboard/collections?${query}` : "/agent/dashboard/collections";
}

function revalidateAgentCollectionPaths() {
  revalidatePath("/agent/dashboard");
  revalidatePath("/agent/dashboard/collections");
}

export async function createAgentCollectionAction(formData: FormData) {
  const result = await createCollection({
    role: "agent",
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(undefined, { error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths();
  redirect(buildCollectionsPath(result.collectionId, { success: "created" }));
}

export async function renameAgentCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await renameCollection({
    role: "agent",
    collectionId,
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "saved" }));
}

export async function archiveAgentCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await archiveCollection({
    role: "agent",
    collectionId,
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "archived" }));
}

export async function addAgentPropertyToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await addPropertyToCollection({
    role: "agent",
    collectionId,
    propertyId: getString(formData, "propertyId"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "item-added" }));
}

export async function addAgentRoomToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await addRoomToCollection({
    role: "agent",
    collectionId,
    roomId: getString(formData, "roomId"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "item-added" }));
}

export async function removeAgentCollectionItemAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  const result = await removeCollectionItem({
    role: "agent",
    collectionId,
    itemId: getString(formData, "itemId"),
  });

  if (!result.ok) {
    redirect(buildCollectionsPath(collectionId, { error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths();
  redirect(buildCollectionsPath(collectionId, { success: "item-removed" }));
}
