"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Middleware handles redirect in most cases
    // This is a fallback if middleware doesn't catch it
    router.replace("/dashboard");
  }, [router]);

  // Minimal UI - user should rarely see this as middleware handles redirect
  return null;
}
