"use client";

import { useEffect, useRef } from "react";
import { showCreditLimitToast } from "@/lib/creditLimitToast";

export function CreditLimitChecker({ exhausted }: { exhausted: boolean }) {
  const shown = useRef(false);

  useEffect(() => {
    if (exhausted && !shown.current) {
      shown.current = true;
      showCreditLimitToast();
    }
  }, [exhausted]);

  return null;
}