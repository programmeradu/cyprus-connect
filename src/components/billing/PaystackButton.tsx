"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { initializePaystackPayment, PAYSTACK_PUBLIC_KEY } from "@/lib/paystack/client";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface PaystackButtonProps {
  type: "subscription" | "credits";
  planId?: string;
  packageId?: string;
  currency?: "NGN" | "GHS" | "ZAR" | "USD";
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export function PaystackButton({
  type,
  planId,
  packageId,
  currency = "NGN",
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("paystackButton");

  const handlePayment = async () => {
    if (!session?.user) {
      toast.error(t("signInRequired"));
      router.push("/auth");
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      toast.error(t("notConfigured"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, planId, packageId, currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("initFailed"));
      }

      initializePaystackPayment({
        key: PAYSTACK_PUBLIC_KEY,
        email: session.user.email,
        amount: 0,
        ref: data.reference,
        currency,
        onSuccess: async (transaction) => {
          toast.loading(t("verifying"));
          
          try {
            const verifyRes = await fetch(`/api/paystack/verify?reference=${transaction.reference}`);
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.dismiss();
              toast.success(t("success"));
              router.refresh();
              router.push("/app/settings?tab=billing&success=true");
            } else {
              toast.dismiss();
              toast.error(verifyData.message || t("verifyFailed"));
            }
          } catch {
            toast.dismiss();
            toast.error(t("verifyError"));
          }
        },
        onCancel: () => {
          toast.info(t("cancelled"));
        },
      });
    } catch (error) {
      console.error("Paystack error:", error);
      toast.error(error instanceof Error ? error.message : t("failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumButton
      variant={variant}
      size={size}
      className={className}
      onClick={handlePayment}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t("processing")}
        </span>
      ) : (
        children
      )}
    </PremiumButton>
  );
}
