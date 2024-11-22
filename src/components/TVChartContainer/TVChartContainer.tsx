import Loader from "components/Common/Loader";
import { TV_SAVE_LOAD_CHARTS_KEY } from "config/localStorage";
import { isChartAvailableForToken } from "config/tokens";
import { SUPPORTED_RESOLUTIONS_V1, SUPPORTED_RESOLUTIONS_V2 } from "config/tradingview";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { useOracleKeeperFetcher } from "domain/synthetics/tokens/useOracleKeeperFetcher";
import { TokenPrices } from "domain/tokens";
import { DataFeed } from "domain/tradingview/DataFeed";
import { getObjectKeyFromValue, getSymbolName } from "domain/tradingview/utils";
import { useTradePageVersion } from "lib/useTradePageVersion";
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage, useMedia, usePrevious } from "react-use";
import type {
  ChartData,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  IPositionLineAdapter,
  ResolutionString,
} from "../../charting_library";
import { SaveLoadAdapter } from "./SaveLoadAdapter";
import { defaultChartProps, disabledFeaturesOnMobile } from "./constants";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { selectSetIsCandlesLoaded } from "context/SyntheticsStateContext/selectors/globalSelectors";

export type ChartLine = {
  price: number;
  title: string;
};

type Props = {
  chainId: number;
  chartLines: ChartLine[];
  period: string;
  setPeriod: (period: string) => void;
  chartToken:
    | ({
        symbol: string;
      } & TokenPrices)
    | { symbol: string };
  supportedResolutions: typeof SUPPORTED_RESOLUTIONS_V1 | typeof SUPPORTED_RESOLUTIONS_V2;
  visualMultiplier?: number;
};

export default function TVChartContainer({
  chartToken,
  chainId,
  chartLines,
  period,
  setPeriod,
  supportedResolutions,
  visualMultiplier,
}: Props) {
  const { shouldShowPositionLines } = useSettings();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [chartDataLoading, setChartDataLoading] = useState(true);
  const [tvCharts, setTvCharts] = useLocalStorage<ChartData[] | undefined>(TV_SAVE_LOAD_CHARTS_KEY, []);
  const setIsCandlesLoaded = useSelector(selectSetIsCandlesLoaded);

  const [tradePageVersion] = useTradePageVersion();

  const oracleKeeperFetcher = useOracleKeeperFetcher(chainId);

  const [datafeed, setDatafeed] = useState<DataFeed | null>(null);

  useEffect(() => {
    const newDatafeed = new DataFeed(chainId, oracleKeeperFetcher, tradePageVersion);
    newDatafeed.addEventListener("candlesLoad.success", () => {
      setIsCandlesLoaded(true);
    });
    setDatafeed((prev) => {
      if (prev) {
        prev.destroy();
      }
      return newDatafeed;
    });
  }, [chainId, oracleKeeperFetcher, setIsCandlesLoaded, tradePageVersion]);

  const isMobile = useMedia("(max-width: 550px)");
  const symbolRef = useRef(chartToken.symbol);

  const drawLineOnChart = useCallback(
    (title: string, price: number) => {
      if (chartReady && tvWidgetRef.current?.activeChart?.().dataReady()) {
        const chart = tvWidgetRef.current.activeChart();
        const positionLine = chart.createPositionLine({ disableUndo: true });

        return positionLine
          .setText(title)
          .setPrice(price)
          .setQuantity("")
          .setLineStyle(1)
          .setLineLength(1)
          .setBodyFont(`normal 12pt "Relative", sans-serif`)
          .setBodyTextColor("#fff")
          .setLineColor("#3a3e5e")
          .setBodyBackgroundColor("#3a3e5e")
          .setBodyBorderColor("#3a3e5e");
      }
    },
    [chartReady]
  );

  useEffect(
    function updateLines() {
      const lines: (IPositionLineAdapter | undefined)[] = [];
      if (shouldShowPositionLines) {
        chartLines.forEach((order) => {
          lines.push(drawLineOnChart(order.title, order.price));
        });
      }
      return () => {
        lines.forEach((line) => line?.remove());
      };
    },
    [chartLines, shouldShowPositionLines, drawLineOnChart]
  );

  useEffect(() => {
    if (
      chartReady &&
      tvWidgetRef.current &&
      chartToken.symbol &&
      isChartAvailableForToken(chainId, chartToken.symbol)
    ) {
      tvWidgetRef.current.setSymbol(
        getSymbolName(chartToken.symbol, visualMultiplier),
        tvWidgetRef.current.activeChart().resolution(),
        () => null
      );
    }
  }, [chainId, chartReady, chartToken.symbol, visualMultiplier]);

  useLayoutEffect(() => {
    if (symbolRef.current) {
      datafeed?.prefetchBars(symbolRef.current);
    }
  }, [datafeed]);

  useEffect(() => {
    if (!datafeed) return;

    const widgetOptions: ChartingLibraryWidgetOptions = {
      debug: false,
      symbol: symbolRef.current && getSymbolName(symbolRef.current, visualMultiplier), // Using ref to avoid unnecessary re-renders on symbol change and still have access to the latest symbol
      datafeed,
      theme: defaultChartProps.theme,
      container: chartContainerRef.current!,
      library_path: defaultChartProps.library_path,
      locale: defaultChartProps.locale,
      loading_screen: defaultChartProps.loading_screen,
      enabled_features: defaultChartProps.enabled_features,
      disabled_features: isMobile
        ? defaultChartProps.disabled_features.concat(disabledFeaturesOnMobile)
        : defaultChartProps.disabled_features,
      client_id: defaultChartProps.client_id,
      user_id: defaultChartProps.user_id,
      fullscreen: defaultChartProps.fullscreen,
      autosize: defaultChartProps.autosize,
      custom_css_url: defaultChartProps.custom_css_url,
      overrides: defaultChartProps.overrides,
      interval: getObjectKeyFromValue(period, supportedResolutions) as ResolutionString,
      favorites: { ...defaultChartProps.favorites, intervals: Object.keys(supportedResolutions) as ResolutionString[] },
      custom_formatters: defaultChartProps.custom_formatters,
      load_last_chart: true,
      save_load_adapter: new SaveLoadAdapter(tvCharts, setTvCharts, tradePageVersion),
    };
    tvWidgetRef.current = new window.TradingView.widget(widgetOptions);

    // tvWidgetRef.current.activeChart().dataReady()
    tvWidgetRef.current!.onChartReady(function () {
      setChartReady(true);
      tvWidgetRef.current!.applyOverrides({
        "paneProperties.background": "#16182e",
        "paneProperties.backgroundType": "solid",
      });
      tvWidgetRef.current
        ?.activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval) => {
          if (supportedResolutions[interval]) {
            const period = supportedResolutions[interval];
            setPeriod(period);
          }
        });

      tvWidgetRef.current?.subscribe("onAutoSaveNeeded", () => {
        tvWidgetRef.current?.saveChartToServer(undefined, undefined, {
          chartName: `gmx-chart-v${tradePageVersion}`,
        });
      });

      tvWidgetRef.current?.activeChart().dataReady(() => {
        setChartDataLoading(false);
      });
    });

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
        setChartReady(false);
        setChartDataLoading(true);
      }
    };
    // We don't want to re-initialize the chart when the symbol changes. This will make the chart flicker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, datafeed]);

  const style = useMemo<CSSProperties>(
    () => ({ visibility: !chartDataLoading ? "visible" : "hidden" }),
    [chartDataLoading]
  );

  return (
    <div className="ExchangeChart-error">
      {chartDataLoading && <Loader />}
      <div style={style} ref={chartContainerRef} className="TVChartContainer ExchangeChart-bottom-content" />
    </div>
  );
}
