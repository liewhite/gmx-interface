import Pagination from "components/Pagination/Pagination";
import Table from "components/Table/Table";
import TableFilterSearch from "components/TableFilterSearch/TableFilterSearch";
import { useDebounce } from "lib/useDebounce";
import { useState } from "react";
import { useLeaderboardContext } from "./Context";
import { t } from "@lingui/macro";
import { formatAmount, formatUsd } from "lib/numbers";
import classnames from "classnames";
import { TableCell, TableHeader } from "components/Table/types";
import { USD_DECIMALS, importImage } from "lib/legacy";
import AddressView from "components/AddressView/AddressView";
import { TopPositionsRow, formatDelta } from "domain/synthetics/leaderboards";
import Tooltip from "components/Tooltip/Tooltip";
import { getPriceDecimals } from "config/tokens";
import { BigNumber } from "ethers";
import { MarketInfo } from "domain/synthetics/markets";

const formatPriceDecimals = (x: BigNumber, market: MarketInfo, chainId: number) => formatAmount(
  x,
  USD_DECIMALS,
  getPriceDecimals(chainId, market.indexToken.symbol),
  true,
).replace(/^(-?)/, "$1$$") || ""

const parseRow = (chainId: number) => (p: TopPositionsRow): { [key in keyof TopPositionsRow]?: TableCell } => ({
  key: p.key,
  rank: p.rank + 1,
  account: {
    value: "",
    render: (_, breakpoint) => (
      p.account && (
        <AddressView
          address={ p.account }
          ensName={ p.ensName }
          avatarUrl={ p.avatarUrl }
          breakpoint={ breakpoint }
          size={ 24 }
        />
      )
    ),
  },
  unrealizedPnl: {
    value: (p.unrealizedPnl && formatDelta(p.unrealizedPnl, { signed: true, prefix: "$" })) || "",
    className: classnames(
      p.unrealizedPnl.isNegative() ? "negative" : "positive",
      "leaderboard-pnl-abs"
    ),
  },
  market: {
    value: "",
    render: () => {
      const { symbol } = p.market.indexToken;
      const { name } = p.market;

      return (
        <div className="leaderboard-position">
          <img src={ importImage(`ic_${ symbol.toLocaleLowerCase() }_40.svg`) } alt={ name } width="24"/>
          <span>{ symbol }</span>
          <span className={ p.isLong ? "positive" : "negative" }>{ p.isLong ? t`Long` : t`Short` }</span>
        </div>
      );
    }
  },
  entryPrice: {
    value: formatPriceDecimals(p.entryPrice, p.market, chainId),
  },
  size: { value: formatUsd(p.size) || "" },
  liqPrice: {
    value: "",
    render: () => (
      <Tooltip
        handle={ p.liqPrice ? formatPriceDecimals(p.liqPrice, p.market, chainId) : "" }
        position="center-top"
        renderContent={
          () => (
            <div>
              <p>
                { `${t`Mark Price`}: ${formatPriceDecimals(p.markPrice, p.market, chainId)}` }
              </p>
              <p>
                {
                  !(p.liqPriceDelta && p.liqPriceDeltaRel) ? "" : (
                    `${ t`Price change to Liq.` }: ${
                      formatPriceDecimals(p.liqPriceDelta, p.market, chainId)
                    } (${
                      formatAmount(p.liqPriceDeltaRel, USD_DECIMALS, 2, true)
                    }%)`
                  )
                }
              </p>
            </div>
          )
        }
      />
    ),
  },
});

export default function TopPositions() {
  const perPage = 15;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const term = useDebounce(search, 300);
  const { chainId, topPositions, topPositionsHeaderClick } = useLeaderboardContext();
  const { isLoading, error } = topPositions;
  const filteredStats = topPositions.data.filter(a => (
    a.account.toLowerCase().indexOf(term.toLowerCase()) >= 0
  ));
  const indexFrom = (page - 1) * perPage;
  const rows = filteredStats.slice(indexFrom, indexFrom + perPage).map(parseRow(chainId));
  const pageCount = Math.ceil(filteredStats.length / perPage);
  const handleSearchInput = (value: string) => setSearch(value.trim());

  const titles: { [k in keyof TopPositionsRow]?: TableHeader } = {
    rank: { title: t`Rank` },
    account: { title: t`Address` },
    unrealizedPnl: {
      title: t`PnL ($)`,
      tooltip: t`Total Unrealized Profit.`,
      onClick: topPositionsHeaderClick("unrealizedPnl"),
    },
    market: { title: t`Position` },
    entryPrice: { title: t`Entry` },
    size: {
      title: t`Size`,
      onClick: topPositionsHeaderClick("size"),
    },
    liqPrice: { title: t`Liq. Price` },
  };

  return (
    <div>
      <div className="leaderboard-header">
        <TableFilterSearch label={t`Search Address`} value={search} onInput={handleSearchInput}/>
      </div>
      <Table isLoading={isLoading} error={error} content={rows} titles={titles} rowKey={"key"}/>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage}/>
    </div>
  );
}
