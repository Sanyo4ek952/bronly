"use server";

import {
  createOwnerProperty as createOwnerPropertyAction,
  createOwnerRoom as createOwnerRoomAction,
  createRoomBusyRange as createRoomBusyRangeAction,
  createRoomSeasonalPrice as createRoomSeasonalPriceAction,
  deleteOwnerProperty as deleteOwnerPropertyAction,
  deleteOwnerRoom as deleteOwnerRoomAction,
  deleteRoomBusyRange as deleteRoomBusyRangeAction,
  deleteRoomSeasonalPrice as deleteRoomSeasonalPriceAction,
  updateOwnerProperty as updateOwnerPropertyAction,
  updateOwnerRoom as updateOwnerRoomAction,
  updateRoomBusyRange as updateRoomBusyRangeAction,
  updateRoomSeasonalPrice as updateRoomSeasonalPriceAction,
} from "@/features/property/owner-mutations";

export async function createOwnerProperty(formData: FormData) {
  return createOwnerPropertyAction(formData);
}

export async function updateOwnerProperty(formData: FormData) {
  return updateOwnerPropertyAction(formData);
}

export async function deleteOwnerProperty(formData: FormData) {
  return deleteOwnerPropertyAction(formData);
}

export async function createOwnerRoom(formData: FormData) {
  return createOwnerRoomAction(formData);
}

export async function updateOwnerRoom(formData: FormData) {
  return updateOwnerRoomAction(formData);
}

export async function deleteOwnerRoom(formData: FormData) {
  return deleteOwnerRoomAction(formData);
}

export async function createRoomSeasonalPrice(formData: FormData) {
  return createRoomSeasonalPriceAction(formData);
}

export async function updateRoomSeasonalPrice(formData: FormData) {
  return updateRoomSeasonalPriceAction(formData);
}

export async function deleteRoomSeasonalPrice(formData: FormData) {
  return deleteRoomSeasonalPriceAction(formData);
}

export async function createRoomBusyRange(formData: FormData) {
  return createRoomBusyRangeAction(formData);
}

export async function updateRoomBusyRange(formData: FormData) {
  return updateRoomBusyRangeAction(formData);
}

export async function deleteRoomBusyRange(formData: FormData) {
  return deleteRoomBusyRangeAction(formData);
}
