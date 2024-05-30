// date format: d MMM yyyy, H:mm, time should be specifed based on UTC time

import type { JSX } from "react";
import ExternalLink from "components/ExternalLink/ExternalLink";

export type EventData = {
  id: string;
  title: string;
  isActive?: boolean;
  startDate?: string;
  endDate: string;
  bodyText: string | string[] | JSX.Element;
  chains?: number[];
  link?: {
    text: string;
    href: string;
    newTab?: boolean;
  };
};

export const homeEventsData: EventData[] = [];

export const appEventsData: EventData[] = [
  {
    id: "all-incentives-launch",
    title: "Incentives are live",
    isActive: true,
    endDate: "27 Mar 2024, 00:00",
    bodyText: [
      `Arbitrum STIP incentives are live for:`,
      "",
      "• Arbitrum GM Pools Liquidity.",
      "• Arbitrum GMX V2 Trading.",
    ],
    link: {
      text: "Read more.",
      href: "https://gmxio.notion.site/GMX-S-T-I-P-Incentives-Distribution-1a5ab9ca432b4f1798ff8810ce51fec3",
      newTab: true,
    },
  },
  {
    id: "incentives-launch",
    title: "Incentives are live",
    isActive: true,
    endDate: "31 Oct 2024, 12:00",
    bodyText: "Arbitrum STIP incentives are live for Arbitrum GM pools and GLP to GM migrations.",
    link: {
      text: "Read more",
      href: "https://gmxio.notion.site/GMX-S-T-I-P-Incentives-Distribution-1a5ab9ca432b4f1798ff8810ce51fec3",
      newTab: true,
    },
  },
  {
    id: "binance-wallet-campaign",
    title: "Binance Web3 Wallet Trading Campaign is Live",
    isActive: true,
    endDate: "09 Apr 2024, 23:59",
    bodyText: ["Complete any or all of the six GMX campaign tasks and qualify for rewards!"],
    link: {
      text: "Check your tasks and their completion status",
      href: "https://www.binance.com/en/activity/mission/gmx-airdrop",
      newTab: true,
    },
  },
  {
    id: "btc-eth-single-token-markets",
    title: "New BTC/USD and ETH/USD single token GM pools",
    isActive: true,
    endDate: "2 May 2024, 23:59",
    bodyText: [
      "Use only BTC or ETH to provide liquidity to BTC/USD or ETH/USD. Now, you can buy GM without being exposed to stablecoins.",
    ],
    link: {
      text: "View GM pools",
      href: "/#/pools",
    },
  },
  {
    id: "delegate-voting-power",
    title: "Delegate your GMX Voting Power",
    isActive: true,
    endDate: "6 Jun 2024, 23:59",
    bodyText: (
      <>
        <ExternalLink href="https://www.tally.xyz/gov/gmx">The GMX DAO is now live on Tally</ExternalLink>. Please{" "}
        <ExternalLink href="https://www.tally.xyz/gov/gmx/my-voting-power">delegate your voting power</ExternalLink>{" "}
        before staking or claiming GMX rewards.
      </>
    ),
  },
  {
    id: "max-leverage-100x",
    title: "Leverage increased to 100x",
    isActive: true,
    endDate: "14 Jun 2024, 0:00",
    bodyText: "Trade BTC/USD and ETH/USD with up to 100x leverage on Arbitrum.",
    link: {
      text: "Read more",
      href: "https://snapshot.org/#/gmx.eth/proposal/0x70f1477cee26a04c8dc1606b2cc157b7d4811c63057e56c1259eefe200165145",
      newTab: true,
    },
  },
];
