"use client";

const GUEST_NAME_KEY = "bkgrit-guest-name";

export function getGuestName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_NAME_KEY);
}

export function setGuestName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_NAME_KEY, name.trim());
}

export function clearGuestName(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_NAME_KEY);
}

export function isGuest(): boolean {
  return !!getGuestName();
}
