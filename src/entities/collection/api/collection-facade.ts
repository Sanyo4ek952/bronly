import { getCollectionsForRole, getCollectionDetailData, getCollectionListData } from "./collection-queries";

export async function getOwnerCollections() {
  return getCollectionsForRole("owner");
}

export async function getAgentCollections() {
  return getCollectionsForRole("agent");
}

export { getCollectionListData, getCollectionDetailData };
