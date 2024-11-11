import { Trans, t } from "@lingui/macro";
import { ReactNode, forwardRef, useImperativeHandle, useRef } from "react";
import type { TooltipProps } from "recharts";
import { useViewBox, useYAxisWithFiniteDomainOrRandom } from "recharts/es6/context/chartLayoutContext";

import { getFeeItem } from "domain/synthetics/fees/utils";
import { formatPercentage, formatUsd, formatUsdPrice } from "lib/numbers";
import { getPositiveOrNegativeClass } from "lib/utils";
import type { DataPoint } from "./DepthChart";

import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";

import "./DepthChartTooltip.css";

const LEFT_OPAQUE_TOOLTIP = (
  <Trans>
    Execution prices for increasing shorts and
    <br />
    decreasing longs.
  </Trans>
);

const RIGHT_OPAQUE_TOOLTIP = (
  <Trans>
    Execution prices for increasing longs and
    <br />
    decreasing shorts.
  </Trans>
);

const LEFT_OPAQUE_NO_PRICE_IMPACT_TOOLTIP = (
  <Trans>
    There is no price impact. There is a single
    <br />
    execution price for increasing shorts or
    <br />
    decreasing longs for this size.
  </Trans>
);

const RIGHT_OPAQUE_NO_PRICE_IMPACT_TOOLTIP = (
  <Trans>
    There is no price impact. There is a single
    <br />
    execution price for increasing longs or
    <br />
    decreasing shorts for this size.
  </Trans>
);

export type ChartTooltipHandle = {
  setMouseRelativePosition: (x: number | undefined, y: number | undefined) => void;
};

export const ChartTooltip = forwardRef<
  ChartTooltipHandle,
  TooltipProps<number | string, string> & { leftMin: bigint; rightMin: bigint; isZeroPriceImpact: boolean }
>(({ active, payload, leftMin, rightMin, isZeroPriceImpact, coordinate, ...rest }, ref) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const viewBox = useViewBox() as {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  const yAxis = useYAxisWithFiniteDomainOrRandom() as {
    domain: [number, number];
    niceTicks: number[];
  };

  const domainSpan = yAxis.niceTicks.at(-1)! - yAxis.niceTicks.at(0)!;

  // if (!active || !payload || !payload.length) {
  //   return null;
  // }

  let stats: DataPoint | undefined = payload?.[0]?.payload as DataPoint | undefined;
  let size = stats?.sizeBigInt;
  let sizeY = 0;

  let isOpaqueCloser = true;
  let isLeft = false;

  if (isZeroPriceImpact && stats) {
    // const dataPoint = payload[0].payload as DataPoint;

    isLeft = stats.leftTransparentSize !== null || stats.leftOpaqueSize !== null;

    const transparentSize: number | null = isLeft ? stats.leftTransparentSize : stats.rightTransparentSize;
    const transparentSizeBigInt: bigint | null = isLeft
      ? stats.leftTransparentSizeBigInt
      : stats.rightTransparentSizeBigInt;

    const opaqueSize: number | null = isLeft ? stats.leftOpaqueSize : stats.rightOpaqueSize;
    const opaqueSizeBigInt = isLeft ? stats.leftOpaqueSizeBigInt : stats.rightOpaqueSizeBigInt;

    if (transparentSize === null && opaqueSize !== null) {
      size = opaqueSizeBigInt!;
    } else if (transparentSize !== null && opaqueSize === null) {
      size = transparentSizeBigInt!;
    } else if (transparentSize !== null && opaqueSize !== null) {
      const transparentFloatY = viewBox.height - (transparentSize! / domainSpan) * viewBox.height;
      const opaqueFloatY = viewBox.height - (opaqueSize! / domainSpan) * viewBox.height;

      const distanceToTransparent = Math.abs((coordinate?.y ?? 0) - viewBox.y - transparentFloatY);
      const distanceToOpaque = Math.abs((coordinate?.y ?? 0) - viewBox.y - opaqueFloatY);

      isOpaqueCloser = distanceToOpaque < distanceToTransparent;

      size = isOpaqueCloser ? opaqueSizeBigInt! : transparentSizeBigInt!;
      sizeY = isOpaqueCloser ? opaqueFloatY : transparentFloatY;
    }
  } else if (stats) {
    sizeY = viewBox.y + viewBox.height - (stats.size / domainSpan) * viewBox.height;
  }

  useImperativeHandle(ref, () => ({
    setMouseRelativePosition: (x: number | undefined, y: number | undefined) => {
      if (!tooltipRef.current || x === undefined || y === undefined) {
        return;
      }

      // when small put the tooltip either fully on top or fully on bottom
      const isSmall = viewBox.width < 360;

      const offset = 16;

      const tooltipWidth = tooltipRef.current.clientWidth;
      const tooltipHeight = tooltipRef.current.clientHeight;

      const isLeft = x < viewBox.width / 2;
      const isTop = y < viewBox.height / 2;

      const tooltipX = isLeft ? x + offset : x - tooltipWidth - offset;
      let tooltipY;
      if (isSmall) {
        tooltipY = isTop ? viewBox.height + viewBox.y - tooltipHeight : viewBox.y;
      } else {
        tooltipY = isTop ? y + offset : y - tooltipHeight - offset;
      }

      const boundedTooltipX = Math.max(0, Math.min(tooltipX, viewBox.width + viewBox.x - tooltipWidth));
      const boundedTooltipY = Math.max(0, Math.min(tooltipY, viewBox.height + viewBox.y - tooltipHeight));

      tooltipRef.current.style.transform = `translate(${boundedTooltipX}px, ${boundedTooltipY}px)`;
    },
  }));

  if (!stats) {
    return null;
  }

  const priceImpactFeeItem = getFeeItem(stats.priceImpactBigInt, stats.sizeBigInt);

  let tooltip: ReactNode;

  if (isZeroPriceImpact && isLeft && isOpaqueCloser) {
    tooltip = LEFT_OPAQUE_NO_PRICE_IMPACT_TOOLTIP;
  } else if (isZeroPriceImpact && isLeft && !isOpaqueCloser) {
    tooltip = (
      <Trans>
        No liquidity is available for increasing shorts for
        <br />
        this size. Max short size: {formatUsd(stats.leftOpaqueSizeBigInt!)}
        <br />
        <br />
        There is no price impact. There is a single
        <br />
        execution price for decreasing longs for
        <br />
        this size.
      </Trans>
    );
  } else if (isZeroPriceImpact && !isLeft && isOpaqueCloser) {
    tooltip = RIGHT_OPAQUE_NO_PRICE_IMPACT_TOOLTIP;
  } else if (isZeroPriceImpact && !isLeft && !isOpaqueCloser) {
    tooltip = (
      <Trans>
        No liquidity is available for increasing longs for
        <br />
        this size. Max long size: {formatUsd(stats.rightOpaqueSizeBigInt!)}
        <br />
        <br />
        There is no price impact. There is a single
        <br />
        execution price for decreasing shorts for
        <br />
        this size.
      </Trans>
    );
  } else if (stats.leftOpaqueSize !== null) {
    tooltip = LEFT_OPAQUE_TOOLTIP;
  } else if (stats.rightOpaqueSize !== null) {
    tooltip = RIGHT_OPAQUE_TOOLTIP;
  } else if (stats.leftTransparentSize !== null) {
    tooltip = (
      <Trans>
        No liquidity is available for increasing shorts for
        <br />
        this size. Max short size: {formatUsd(leftMin)}
        <br />
        <br />
        Execution prices for decreasing longs.
      </Trans>
    );
  } else if (stats.rightTransparentSize !== null) {
    tooltip = (
      <Trans>
        No liquidity is available for increasing longs for
        <br />
        this size. Max long size: {formatUsd(rightMin)}
        <br />
        <br />
        Execution prices for decreasing shorts.
      </Trans>
    );
  }

  return (
    <div
      ref={tooltipRef}
      className="DepthChartTooltip body-large z-50 rounded-4 p-8 text-14 transition-transform duration-100 ease-linear"
    >
      <p className="mb-8">{tooltip}</p>
      <StatsTooltipRow
        label={t`Execution Price`}
        value={formatUsdPrice(stats.executionPriceBigInt)}
        showDollar={false}
      />
      <StatsTooltipRow label={t`Total size`} value={formatUsd(size)} showDollar={false} />
      <StatsTooltipRow
        label={t`Price Impact`}
        textClassName={getPositiveOrNegativeClass(stats.priceImpactBigInt)}
        value={
          <>
            {formatUsd(stats.priceImpactBigInt)} ({formatPercentage(priceImpactFeeItem?.bps, { signed: true })})
          </>
        }
        showDollar={false}
      />
    </div>
  );
});
