"use client";


import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type PaymentGateway = "stripe" | "paystack";

interface PaymentGatewaySelectorProps {
  value: PaymentGateway;
  onChange: (gateway: PaymentGateway) => void;
  className?: string;
  hidePaystack?: boolean;
}

export function PaymentGatewaySelector({ value, onChange, className, hidePaystack }: PaymentGatewaySelectorProps) {
  // useTranslations is safe here — component only renders inside NextIntlClientProvider
  const t = useTranslations("pricing");

  return (
    <div className={cn("flex items-center gap-2 p-1 bg-muted rounded-lg", className)}>
      <GatewayOption
        gateway="stripe"
        label={t("gatewayStripe")}
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
            <path d="M13.54 8h-3.08c-.37 0-.67.3-.67.67v6.66c0 .37.3.67.67.67h3.08c.37 0 .67-.3.67-.67V8.67c0-.37-.3-.67-.67-.67z" fill="currentColor"/>
          </svg>
        }
        selected={value === "stripe"}
        onClick={() => onChange("stripe")}
      />
      {!hidePaystack && (
        <GatewayOption
          gateway="paystack"
          label={t("gatewayPaystack")}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 7h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" fill="currentColor"/>
            </svg>
          }
          selected={value === "paystack"}
          onClick={() => onChange("paystack")}
        />
      )}
    </div>
  );
}

interface GatewayOptionProps {
  gateway: PaymentGateway;
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

function GatewayOption({ label, icon, selected, onClick }: GatewayOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        selected ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {selected && (
        <motion.div
          layoutId="gateway-indicator"
          className="absolute inset-0 bg-primary rounded-md"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}
