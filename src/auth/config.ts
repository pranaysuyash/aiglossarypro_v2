export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
export const isClerkEnabled = Boolean(CLERK_PUBLISHABLE_KEY);
