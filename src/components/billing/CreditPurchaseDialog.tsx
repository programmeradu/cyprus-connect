"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { CREDIT_PACKAGES, CYPRUS_VAT_RATE } from "@/lib/stripe/config";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/hooks/useCurrencyFormatter";


interface CreditPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreditPurchaseDialog = ({ open, onOpenChange }: CreditPurchaseDialogProps) => {
  const t = useTranslations("creditPurchase");
  const locale = useLocale();
  const isEur = locale === 'el';
  const currency = isEur ? 'EUR' : 'USD';
  const [loading, setLoading] = useState<string | null>(null);


  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(packageId);
      const token = localStorage.getItem('bearer_token');

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'credits',
          packageId,
          currency,
          locale,
        }),
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("checkoutFailed"));
      }


      const { url } = await response.json();
      
      // Handle iframe compatibility
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
      } else {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Credit purchase error:', error);
      toast.error(error.message || t("failed"));

    } finally {
      setLoading(null);
    }
  };

  const packages = [
    {
      key: 'small',
      ...CREDIT_PACKAGES.small,
      icon: SmallPackageIcon,
    },
    {
      key: 'medium',
      ...CREDIT_PACKAGES.medium,
      icon: MediumPackageIcon,
      popular: true,
    },
    {
      key: 'large',
      ...CREDIT_PACKAGES.large,
      icon: LargePackageIcon,
      bestValue: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{t("title")}</DialogTitle>
          <DialogDescription className="text-xs">
            {t("description")}
          </DialogDescription>
        </DialogHeader>


        <div className="grid md:grid-cols-3 gap-3 mt-3">
          {packages.map((pkg, index) => {
            const Icon = pkg.icon;
            const isPopular = 'popular' in pkg && Boolean((pkg as any).popular);
            const isBestValue = 'bestValue' in pkg && Boolean((pkg as any).bestValue);
            const discount = 'discount' in pkg ? (pkg as any).discount : null;

            return (
              <motion.div
                key={pkg.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                      {t("popular")}
                    </div>
                  </div>
                )}
                {isBestValue && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                      {t("bestValue")}
                    </div>
                  </div>
                )}


                <PremiumCard className={`h-full p-3 ${isPopular || isBestValue ? 'ring-1 ring-primary/30' : ''}`}>
                  {/* Icon */}
                  <div className="mb-2.5 flex justify-center">
                    <div className="w-8 h-8 text-foreground/40">
                      <Icon />
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="mb-1.5 text-center">
                    <div className="text-lg font-bold">{pkg.credits.toLocaleString(locale)}</div>
                    <div className="text-[10px] text-muted-foreground">{t("credits")}</div>
                  </div>

                  {/* Price */}
                  <div className="mb-2.5 text-center">
                    <div className="text-base font-bold">${pkg.price}</div>
                    {discount && (
                      <div className="text-[10px] text-primary font-medium">
                        {t("save", { pct: discount })}
                      </div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <PremiumButton
                    className="w-full text-[10px] h-7"
                    size="sm"
                    onClick={() => handlePurchase(pkg.key)}
                    disabled={loading === pkg.key}
                  >
                    {loading === pkg.key ? t("processing") : t("purchase")}
                  </PremiumButton>

                  {/* Price per credit */}
                  <div className="mt-1.5 text-center text-[9px] text-muted-foreground">
                    {t("perCredit", { price: (pkg.price / pkg.credits).toFixed(3) })}
                  </div>
                </PremiumCard>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-2 text-center text-[10px] text-muted-foreground">
          {t("footer")}
        </div>

      </DialogContent>
    </Dialog>
  );
};

// Custom Transparent SVG Icons
const SmallPackageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.rect
      x="6"
      y="6"
      width="12"
      height="12"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      rx="1.5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
    <motion.path
      d="M6 10 L18 10 M12 6 L12 18"
      strokeWidth="1.5"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    />
  </svg>
);

const MediumPackageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.rect
      x="5"
      y="5"
      width="14"
      height="14"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      rx="2"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
    <motion.circle
      cx="12"
      cy="12"
      r="3"
      strokeWidth="1.5"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    />
    {[0, 90, 180, 270].map((angle, i) => (
      <motion.circle
        key={i}
        cx={12 + 5 * Math.cos((angle * Math.PI) / 180)}
        cy={12 + 5 * Math.sin((angle * Math.PI) / 180)}
        r="0.8"
        fill="currentColor"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 + i * 0.05 }}
      />
    ))}
  </svg>
);

const LargePackageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.circle
      cx="12"
      cy="12"
      r="7"
      strokeWidth="1.5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
    <motion.path
      d="M12 7 L14.5 10 L18 12 L14.5 14 L12 17 L9.5 14 L6 12 L9.5 10 Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    />
    <motion.circle
      cx="12"
      cy="12"
      r="8.5"
      strokeWidth="1"
      strokeDasharray="2 2"
      opacity="0.3"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "12px 12px" }}
    />
  </svg>
);