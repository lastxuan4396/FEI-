/*! Amankori2307/monopoly, MIT, Copyright (c) 2021 Aman kori. Full notice: /arcade/licenses/monopoly-amankori-MIT.txt */
// Adapted from Amankori2307/monopoly (MIT), commit dce7eef4d0d8857d4e12982faf13cf7e00e473cd.
// Copyright (c) 2021 Aman kori. Full notice: licenses/monopoly-amankori-MIT.txt.
// Sources: src/domain/rules/auctionBids.utils.ts and engine/auction.utils.ts.
// Changes: JS types removed, Chinese messages, numeric player IDs, bounded ledger.
export const minimumBidFor=auction=>Math.max(auction.startPrice,auction.highestBid+auction.minIncrement);
export const bidBlockedReason=(auction,bidderCash,amount)=>{
 const minimum=minimumBidFor(auction);
 if(!Number.isSafeInteger(amount))return '请输入整数出价';
 if(amount<minimum)return `至少出价${minimum}金币`;
 if(amount>bidderCash)return '可用金币不足';
 return null;
};
export const appendAuctionEntry=(auction,entry)=>[...auction.ledger.slice(-29),entry];
export const openingLedgerEntry=startPrice=>({kind:'start',playerId:null,amount:startPrice});
export const nextActiveBidderIndex=auction=>{
 const {activeBidderOrder,activeBidderIndex,passedPlayerIds}=auction;
 for(let step=1;step<=activeBidderOrder.length;step++){
  const candidate=(activeBidderIndex+step)%activeBidderOrder.length;
  if(!passedPlayerIds.includes(activeBidderOrder[candidate]))return candidate;
 }
 return activeBidderIndex;
};
