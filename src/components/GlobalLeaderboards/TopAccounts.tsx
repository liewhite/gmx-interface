import { useState } from "react";
import { BigNumber } from "ethers";
import classnames from "classnames";
import { t } from "@lingui/macro";
import { formatUsd } from "lib/numbers";
import { useDebounce } from "lib/useDebounce";
import Pagination from "components/Pagination/Pagination";
import { PerfPeriod } from "domain/synthetics/leaderboards";
import TableFilterSearch from "components/TableFilterSearch";
import Table from "components/Table";
import Tab from "components/Tab/Tab";
import { useLeaderboardContext } from "./Context";

export default function TopAccounts() {
  const perPage = 15;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const term = useDebounce(search, 300);
  const { topAccounts, period, setPeriod } = useLeaderboardContext();
  const filteredStats = topAccounts.data.filter(a => a.account.indexOf(term.toLowerCase()) >= 0);
  const firstItemIndex = (page - 1) * perPage;
  const displayedStats = filteredStats.slice(firstItemIndex, page * perPage).map(s => ({
    id: s.id,
    account: {
      value: s.account,
      linkTo: `/actions/v2/${s.account}`,
      target: "_blank"
    },
    absPnl: {
      value: formatUsd(s.absPnl),
      className: classnames(
        s.absPnl.isNegative() ? "negative" : "positive",
        "top-accounts-pnl-abs"
      ),
    },
    relPnl: {
      value: formatUsd(s.relPnl.mul(BigNumber.from(100))),
      className: classnames(
        s.relPnl.isNegative() ? "negative" : "positive",
        "top-accounts-pnl-rel"
      )
    },
    sizeLev: [{
      value: formatUsd(s.size),
      className: "top-accounts-size"
    }, {
      value: formatUsd(s.leverage),
      className: "top-accounts-leverage"
    }],
    perf: {
      value: `${ s.wins.toNumber() }/${ s.losses.toNumber() }`,
      className: "text-right",
    }
  }));

  const pageCount = Math.ceil(filteredStats.length / perPage);
  const handleSearchInput = ({ target }) => setSearch(target.value);
  const titles = {
    account: { title: "Address" },
    absPnl: { title: "P&L ($)" },
    relPnl: { title: "P&L (%)" },
    sizeLev: { title: "Size (Lev)" },
    perf: { title: "Win/Loss", className: "text-right" },
  };

  return (
    <div>
      <div className="leaderboard-header">
        <TableFilterSearch label={t`Address`} value={search} onInput={handleSearchInput}/>
        <Tab
          className="Exchange-swap-order-type-tabs"
          type="inline"
          option={ period }
          onChange={ setPeriod }
          options={[/* PerfPeriod.DAY, PerfPeriod.WEEK, PerfPeriod.MONTH, */PerfPeriod.TOTAL]}
          optionLabels={[/*t`24 hours`, t`7 days`, t`1 month`, */t`All time`]}
        />
      </div>
      <Table
        enumerate={ true }
        offset={ firstItemIndex }
        isLoading={ topAccounts.isLoading }
        error={ topAccounts.error }
        content={ displayedStats }
        titles={ titles }
        rowKey={ "id" }
      />
      <Pagination page={ page } pageCount={ pageCount } onPageChange={ setPage }/>
    </div>
  );
}
