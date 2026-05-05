"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

function toRaw(value: string): string {
  let cleaned = value.replace(/[^\d,]/g, "");
  const firstComma = cleaned.indexOf(",");
  if (firstComma !== -1) {
    cleaned =
      cleaned.slice(0, firstComma + 1) +
      cleaned.slice(firstComma + 1).replace(/,/g, "");
  }
  return cleaned;
}

function toDisplay(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(",");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInteger =
    integerPart === ""
      ? "0"
      : parseInt(integerPart, 10).toLocaleString("es-AR");

  if (raw.includes(",")) {
    return `${formattedInteger},${decimalPart ?? ""}`;
  }
  return formattedInteger;
}

function getCursorPosition(
  oldRaw: string,
  newRaw: string,
  newDisplay: string,
  oldCursor: number,
  inputValue: string,
): number {
  const prefix = inputValue.slice(0, oldCursor);
  const targetDigits = prefix.replace(/\D/g, "").length;

  if (targetDigits === 0) {
    return 0;
  }

  let digitsSeen = 0;
  for (let i = 0; i < newDisplay.length; i++) {
    if (/\d/.test(newDisplay[i])) {
      digitsSeen++;
    }
    if (digitsSeen === targetDigits) {
      let pos = i + 1;
      const oldCommaCount = (oldRaw.match(/,/g) || []).length;
      const newCommaCount = (newRaw.match(/,/g) || []).length;
      if (newDisplay[pos] === "," && newCommaCount > oldCommaCount) {
        pos++;
      }
      return pos;
    }
  }

  return newDisplay.length;
}

interface PriceInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> {
  value: string;
  onChange: (rawValue: string) => void;
}

export function PriceInput({ value, onChange, ...props }: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(() => toDisplay(value));
  const rawRef = React.useRef(value);

  useEffect(() => {
    if (value !== rawRef.current) {
      rawRef.current = value;
      setDisplayValue(toDisplay(value));
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const currentValue = input.value;
      const cursorPosition = input.selectionStart || 0;

      const oldRaw = rawRef.current;
      const newRaw = toRaw(currentValue);
      const newDisplay = toDisplay(newRaw);

      const newCursor = getCursorPosition(
        oldRaw,
        newRaw,
        newDisplay,
        cursorPosition,
        currentValue,
      );

      rawRef.current = newRaw;
      setDisplayValue(newDisplay);
      onChange(newRaw);

      requestAnimationFrame(() => {
        input.setSelectionRange(newCursor, newCursor);
      });
    },
    [onChange],
  );

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}
