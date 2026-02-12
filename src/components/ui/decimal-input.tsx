import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  parse?: (value: string) => number;
}

export function DecimalInput({
  value,
  onChange,
  format,
  parse,
  className,
  ...props
}: DecimalInputProps) {
  // Default format/parse if not provided
  const defaultFormat = (val: number) => val.toString().replace(".", ",");
  const defaultParse = (val: string) => {
    if (!val) return 0;
    const normalized = val.replace(",", ".").trim();
    if (normalized === "" || normalized === "-") return 0;
    return parseFloat(normalized) || 0;
  };

  const formatFn = format || defaultFormat;
  const parseFn = parse || defaultParse;

  const [displayValue, setDisplayValue] = useState(formatFn(value));

  // Sync display value when external value changes
  useEffect(() => {
    // Only update if the parsed display value is different from the new value
    // This prevents cursor jumping or overwriting while typing 
    // (though precise cursor management is harder, simple inequality check helps)
    const currentParsed = parseFn(displayValue);
    if (currentParsed !== value) {
        setDisplayValue(formatFn(value));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Check if it's a valid partial number (allow empty, minus sign, trailing comma)
    // We always trigger onChange with the parsed value, but the parent 
    // should know that 0 might mean "inprogress input"
    const parsed = parseFn(inputValue);
    // Call parent onChange
    onChange(parsed);
  }, [onChange, parseFn]);

  const handleBlur = useCallback(() => {
     // On blur, force format to normalized state
     const parsed = parseFn(displayValue);
     setDisplayValue(formatFn(parsed));
     // Ensure parent has the final parsed value (idempotent usually)
     onChange(parsed);
  }, [displayValue, formatFn, onChange, parseFn]);

  return (
    <Input
      {...props}
      type="text" // Must be text to allow commas
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}
