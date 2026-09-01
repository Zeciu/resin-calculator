import { LengthUnitInput } from "./LengthUnitInput.jsx";
import { useCalculatorDisplayUnits } from "./useCalculatorDisplayUnits.js";
import {
  calculateProjectCostEstimate,
  formatCostAmount,
  formatCostPerDisplayUnit,
  resolveResinCostQuantityLiters,
  sanitizeCostInputValue,
  storeCanonicalCostPerLiterFromDisplay,
} from "./projectCostEstimate.js";

function CostRow({ label, children }) {
  return (
    <div className="project-cost-estimate__row">
      <div className="project-cost-estimate__label">{label}</div>
      <div className="project-cost-estimate__value">{children}</div>
    </div>
  );
}

export default function ProjectCostEstimate({
  ui,
  calculatedVolumeLiters,
  inputs,
  onInputsChange,
  open,
  onOpenChange,
  readOnly = false,
}) {
  const displayUnits = useCalculatorDisplayUnits();
  const volumeLabel = displayUnits.volumeLabel;
  const costPerUnitLabel = ui.cost.resinCostPerLiter(volumeLabel);
  const formattedCalculatedVolume = displayUnits.formatVolume(calculatedVolumeLiters);
  const displayedQuantity = inputs.resinCostQuantityFollowsCalculated
    ? formattedCalculatedVolume
    : inputs.resinCostQuantityInput === ""
      ? ""
      : displayUnits.formatVolume(inputs.resinCostQuantityInput);
  const resinQuantityLiters = resolveResinCostQuantityLiters({
    calculatedVolumeLiters,
    resinCostQuantityInput: inputs.resinCostQuantityInput,
    resinCostQuantityFollowsCalculated: inputs.resinCostQuantityFollowsCalculated,
  });
  const totals = calculateProjectCostEstimate({
    resinQuantityLiters,
    resinCostPerLiter: inputs.resinCostPerLiterInput,
    woodCost: inputs.woodCostInput,
    otherProjectCosts: inputs.otherProjectCostsInput,
    laborHours: inputs.laborHoursInput,
    laborHourlyRate: inputs.laborHourlyRateInput,
    desiredMarkupPercent: inputs.desiredMarkupPercentInput,
  });

  const updateField = (field, value) => {
    onInputsChange({
      ...inputs,
      [field]: sanitizeCostInputValue(value),
    });
  };

  const handleQuantityChange = (value) => {
    onInputsChange({
      ...inputs,
      resinCostQuantityFollowsCalculated: false,
      resinCostQuantityInput: displayUnits.storeVolumeInput(sanitizeCostInputValue(value)),
    });
  };

  const handleCostPerUnitChange = (value) => {
    onInputsChange({
      ...inputs,
      resinCostPerLiterInput: storeCanonicalCostPerLiterFromDisplay(value, displayUnits.volumeUnit),
    });
  };

  return (
    <details
      className="detailed-breakdown project-cost-estimate"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary>{ui.cost.sectionTitle}</summary>
      <div className="project-cost-estimate__layout">
        <div className="project-cost-estimate__inputs">
          <div className="project-cost-estimate__group">
            <CostRow label={ui.cost.calculatedResinVolume}>
              <span data-testid="cost-calculated-resin-volume" className="project-cost-estimate__readonly">
                {formattedCalculatedVolume ? `${formattedCalculatedVolume} ${volumeLabel}` : "—"}
              </span>
            </CostRow>
            <CostRow label={ui.cost.resinQuantityForCosting}>
              <LengthUnitInput
                unit={volumeLabel}
                min="0"
                step="any"
                value={displayedQuantity}
                disabled={readOnly}
                aria-label={ui.cost.resinQuantityForCosting}
                onChange={(event) => handleQuantityChange(event.target.value)}
              />
            </CostRow>
            <CostRow label={costPerUnitLabel}>
              <input
                type="number"
                min="0"
                step="any"
                value={formatCostPerDisplayUnit(inputs.resinCostPerLiterInput, displayUnits.volumeUnit)}
                disabled={readOnly}
                aria-label={costPerUnitLabel}
                onChange={(event) => handleCostPerUnitChange(event.target.value)}
              />
            </CostRow>
            <CostRow label={ui.cost.resinTotal}>
              <span data-testid="cost-resin-total" className="project-cost-estimate__readonly">
                {formatCostAmount(totals.resinTotal)}
              </span>
            </CostRow>
          </div>
          <div className="project-cost-estimate__group">
            <CostRow label={ui.cost.woodCost}>
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.woodCostInput}
                disabled={readOnly}
                aria-label={ui.cost.woodCost}
                onChange={(event) => updateField("woodCostInput", event.target.value)}
              />
            </CostRow>
          </div>
          <div className="project-cost-estimate__group">
            <CostRow label={ui.cost.otherProjectCosts}>
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.otherProjectCostsInput}
                disabled={readOnly}
                aria-label={ui.cost.otherProjectCosts}
                onChange={(event) => updateField("otherProjectCostsInput", event.target.value)}
              />
            </CostRow>
          </div>
          <div className="project-cost-estimate__group">
            <CostRow label={ui.cost.laborHours}>
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.laborHoursInput}
                disabled={readOnly}
                aria-label={ui.cost.laborHours}
                onChange={(event) => updateField("laborHoursInput", event.target.value)}
              />
            </CostRow>
            <CostRow label={ui.cost.laborHourlyRate}>
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.laborHourlyRateInput}
                disabled={readOnly}
                aria-label={ui.cost.laborHourlyRate}
                onChange={(event) => updateField("laborHourlyRateInput", event.target.value)}
              />
            </CostRow>
            <CostRow label={ui.cost.laborTotal}>
              <span data-testid="cost-labor-total" className="project-cost-estimate__readonly">
                {formatCostAmount(totals.laborTotal)}
              </span>
            </CostRow>
          </div>
        </div>
        <div className="project-cost-estimate__summary">
          <CostRow label={ui.cost.estimatedProjectCost}>
            <span
              data-testid="cost-estimated-project-cost"
              className="project-cost-estimate__readonly project-cost-estimate__project-total"
            >
              {formatCostAmount(totals.estimatedProjectCost)}
            </span>
          </CostRow>
          <CostRow label={ui.cost.desiredMarkup}>
            <LengthUnitInput
              unit={ui.cost.percentUnit}
              min="0"
              step="any"
              value={inputs.desiredMarkupPercentInput}
              disabled={readOnly}
              aria-label={ui.cost.desiredMarkup}
              onChange={(event) => updateField("desiredMarkupPercentInput", event.target.value)}
            />
          </CostRow>
          <CostRow label={ui.cost.suggestedSellingPrice}>
            <span
              data-testid="cost-suggested-selling-price"
              className="project-cost-estimate__readonly project-cost-estimate__selling-price"
            >
              {formatCostAmount(totals.suggestedSellingPrice)}
            </span>
          </CostRow>
        </div>
      </div>
    </details>
  );
}
