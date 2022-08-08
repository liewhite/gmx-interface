import { formatAmount, USD_DECIMALS } from "../../Helpers";

export default function TooltipCard({
  title,
  total,
  avax,
  arbitrum,
  showDollar = true,
  decimalsForConversion = USD_DECIMALS,
}) {
  return (
    <>
      <p className="Tooltip-row">
        <span className="label">{title} on Arbitrum:</span>
        <span className="amount">
          {showDollar && "$"}
          {formatAmount(arbitrum, decimalsForConversion, 0, true)}
        </span>
      </p>
      <p className="Tooltip-row">
        <span className="label">{title} on Avalanche:</span>
        <span className="amount">
          {showDollar && "$"}
          {formatAmount(avax, decimalsForConversion, 0, true)}
        </span>
      </p>
      <div className="Tooltip-divider" />
      <p className="Tooltip-row">
        <span className="label">Total:</span>
        <span className="amount">
          {showDollar && "$"}
          {formatAmount(total, decimalsForConversion, 0, true)}
        </span>
      </p>
    </>
  );
}

export function TooltipCardRow({ label, amount, showDollar = true, values }) {
  function renderValue() {
    if (values && Array.isArray(values)) {
      return (
        <ul className="Tooltip-row-values">
          {values.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      );
    }
    return (
      <span className="amount">
        {showDollar && "$"}
        {amount}
      </span>
    );
  }
  return (
    <div className="Tooltip-row">
      <span className="label">{label}:</span>
      {renderValue()}
    </div>
  );
}
