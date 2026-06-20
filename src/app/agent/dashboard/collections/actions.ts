"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAgentSubscriptionMutationAllowed } from "@/app/agent/dashboard/subscription-guard";
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
  return appendState("/agent/dashboard/collections", state);
}

function buildCollectionCreatePath(state?: Record<string, string>) {
  return appendState("/agent/dashboard/collections/new", state);
}

function buildCollectionDetailPath(collectionId: string, state?: Record<string, string>) {
  return appendState(`/agent/dashboard/collections/${collectionId}`, state);
}

function revalidateAgentCollectionPaths(collectionId?: string, collectionSlug?: string) {
  revalidatePath("/agent/dashboard");
  revalidatePath("/agent/dashboard/collections");

  if (collectionId) {
    revalidatePath(`/agent/dashboard/collections/${collectionId}`);
  }

  if (collectionSlug) {
    revalidatePath(`/c/${collectionSlug}`);
  }
}

export async function createAgentCollectionAction(formData: FormData) {
  await ensureAgentSubscriptionMutationAllowed("/agent/dashboard/collections/new");

  const result = await createCollection({
    role: "agent",
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(buildCollectionCreatePath({ error: result.reason ?? "save_failed" }));
  }

  const collectionId = result.collectionId ?? "";
  const collectionSlug = result.collectionSlug ?? "";

  revalidateAgentCollectionPaths(collectionId, collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "created" }));
}

export async function renameAgentCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  await ensureAgentSubscriptionMutationAllowed(collectionId ? `/agent/dashboard/collections/${collectionId}` : "/agent/dashboard/collections");

  const result = await renameCollection({
    role: "agent",
    collectionId,
    title: getString(formData, "title"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "saved" }));
}

export async function archiveAgentCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  await ensureAgentSubscriptionMutationAllowed(collectionId ? `/agent/dashboard/collections/${collectionId}` : "/agent/dashboard/collections");

  const result = await archiveCollection({
    role: "agent",
    collectionId,
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "archived" }));
}

export async function addAgentPropertyToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  await ensureAgentSubscriptionMutationAllowed(collectionId ? `/agent/dashboard/collections/${collectionId}` : "/agent/dashboard/collections");

  const result = await addPropertyToCollection({
    role: "agent",
    collectionId,
    propertyId: getString(formData, "propertyId"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "item-added" }));
}

export async function addAgentRoomToCollectionAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  await ensureAgentSubscriptionMutationAllowed(collectionId ? `/agent/dashboard/collections/${collectionId}` : "/agent/dashboard/collections");

  const result = await addRoomToCollection({
    role: "agent",
    collectionId,
    roomId: getString(formData, "roomId"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "item-added" }));
}

export async function removeAgentCollectionItemAction(formData: FormData) {
  const collectionId = getString(formData, "collectionId");
  await ensureAgentSubscriptionMutationAllowed(collectionId ? `/agent/dashboard/collections/${collectionId}` : "/agent/dashboard/collections");

  const result = await removeCollectionItem({
    role: "agent",
    collectionId,
    itemId: getString(formData, "itemId"),
  });

  if (!result.ok) {
    redirect(collectionId ? buildCollectionDetailPath(collectionId, { error: result.reason ?? "save_failed" }) : buildCollectionsListPath({ error: result.reason ?? "save_failed" }));
  }

  revalidateAgentCollectionPaths(collectionId, result.collectionSlug);
  redirect(buildCollectionDetailPath(collectionId, { success: "item-removed" }));
}
