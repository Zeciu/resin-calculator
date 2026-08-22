import { forwardRef } from "react";

/**
 * Numeric length field with a persistent, non-editable unit suffix.
 * The input value stays numeric; the suffix is visual-only.
 */
export const LengthUnitInput = forwardRef(function LengthUnitInput(
  { unit, className = "", ...inputProps },
  ref,
) {
  return (
    <span className={["length-unit-input", className].filter(Boolean).join(" ")}>
      <input {...inputProps} ref={ref} type="number" className="length-unit-input__value" />
      <span className="length-unit-input__suffix" data-testid="length-unit-suffix" aria-hidden="true">
        {unit}
      </span>
    </span>
  );
});
