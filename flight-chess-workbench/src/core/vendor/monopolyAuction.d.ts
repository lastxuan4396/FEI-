export interface AuctionEntry {kind:'start'|'bid'|'pass';playerId:number|null;amount:number}
export interface EstateAuction {lot:number;activeBidderOrder:number[];activeBidderIndex:number;passedPlayerIds:number[];highestBid:number;highestBidderId:number|null;startPrice:number;minIncrement:number;ledger:AuctionEntry[]}
export function minimumBidFor(auction:EstateAuction):number;
export function bidBlockedReason(auction:EstateAuction,bidderCash:number,amount:number):string|null;
export function appendAuctionEntry(auction:EstateAuction,entry:AuctionEntry):AuctionEntry[];
export function openingLedgerEntry(startPrice:number):AuctionEntry;
export function nextActiveBidderIndex(auction:EstateAuction):number;
