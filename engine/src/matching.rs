use crate::types::{Fill, Market, Order, OrderType, Side, TraderAccount, BPS_DENOMINATOR};

pub fn calculate_fee(fill_size: f64, fill_price: f64, fee_bps: u32) -> f64 {
    (fill_size * fill_price * (fee_bps as f64)) / BPS_DENOMINATOR
}

pub fn insert_order_into_book(market: &mut Market, order: Order) {
    let book = match order.side {
        Side::Long => &mut market.bids,
        Side::Short => &mut market.asks,
    };

    let mut insert_idx = book.len();
    for i in 0..book.len() {
        if order.side == Side::Long {
            if order.price > book[i].price || (order.price == book[i].price && order.timestamp < book[i].timestamp) {
                insert_idx = i;
                break;
            }
        } else {
            if order.price < book[i].price || (order.price == book[i].price && order.timestamp < book[i].timestamp) {
                insert_idx = i;
                break;
            }
        }
    }

    book.insert(insert_idx, order);
    update_best_prices(market);
}

pub fn update_best_prices(market: &mut Market) {
    market.best_bid = if market.bids.is_empty() { 0.0 } else { market.bids[0].price };
    market.best_ask = if market.asks.is_empty() { f64::INFINITY } else { market.asks[0].price };
}

pub fn match_order(market: &mut Market, mut taker_order: Order) -> Result<Vec<Fill>, &'static str> {
    let mut fills = Vec::new();

    while taker_order.size > 0.0 {
        let opposite_book = match taker_order.side {
            Side::Long => &mut market.asks,
            Side::Short => &mut market.bids,
        };

        if opposite_book.is_empty() {
            break;
        }

        let best_resting_price = opposite_book[0].price;

        if taker_order.order_type == OrderType::Limit {
            if taker_order.side == Side::Long && taker_order.price < best_resting_price {
                break;
            }
            if taker_order.side == Side::Short && taker_order.price > best_resting_price {
                break;
            }
        }

        let fill_size = taker_order.size.min(opposite_book[0].size);
        let fill_price = best_resting_price;
        let fee = calculate_fee(fill_size, fill_price, market.fee_bps);

        fills.push(Fill {
            maker: opposite_book[0].trader.clone(),
            taker: taker_order.trader.clone(),
            price: fill_price,
            size: fill_size,
            fee,
            side: taker_order.side,
        });

        taker_order.size -= fill_size;
        
        let opposite_book = match taker_order.side {
            Side::Long => &mut market.asks,
            Side::Short => &mut market.bids,
        };
        opposite_book[0].size -= fill_size;

        market.open_interest += fill_size;

        if opposite_book[0].size <= 0.0 {
            opposite_book.remove(0);
        }
    }

    if taker_order.order_type == OrderType::Market && taker_order.size > 0.0 {
        return Err("InsufficientLiquidity");
    }

    if taker_order.order_type == OrderType::Limit && taker_order.size > 0.0 {
        insert_order_into_book(market, taker_order);
    } else {
        update_best_prices(market);
    }

    Ok(fills)
}

pub fn cancel_order(market: &mut Market, order_id: u64, side: Side) -> Option<Order> {
    let book = match side {
        Side::Long => &mut market.bids,
        Side::Short => &mut market.asks,
    };

    if let Some(idx) = book.iter().position(|o| o.id == order_id) {
        let removed = book.remove(idx);
        update_best_prices(market);
        Some(removed)
    } else {
        None
    }
}

pub fn apply_fill_to_positions(
    fill: &Fill,
    maker_account: &mut TraderAccount,
    taker_account: &mut TraderAccount,
) {
    let maker_side = if fill.side == Side::Long { Side::Short } else { Side::Long };

    update_position(taker_account, fill.side, fill.price, fill.size, "market-1");
    update_position(maker_account, maker_side, fill.price, fill.size, "market-1");
}

fn update_position(
    account: &mut TraderAccount,
    side: Side,
    price: f64,
    size: f64,
    market_addr: &str,
) {
    if let Some(existing) = account.positions.iter_mut().find(|p| p.market == market_addr && p.side == side) {
        let total_size = existing.size + size;
        existing.entry_price = (existing.entry_price * existing.size + price * size) / total_size;
        existing.size = total_size;
    } else {
        account.positions.push(crate::types::Position {
            market: market_addr.to_string(),
            side,
            size,
            entry_price: price,
            margin_allocated: 0.0,
            unrealized_pnl: 0.0,
        });
    }
}

pub fn create_market(
    address: &str,
    base_asset: &str,
    quote_asset: &str,
    fee_bps: Option<u32>,
    insurance_fund_cut_bps: Option<u32>,
) -> Market {
    Market {
        address: address.to_string(),
        base_asset: base_asset.to_string(),
        quote_asset: quote_asset.to_string(),
        bids: Vec::new(),
        asks: Vec::new(),
        best_bid: 0.0,
        best_ask: f64::INFINITY,
        open_interest: 0.0,
        mark_price: 0.0,
        index_price: 0.0,
        fee_bps: fee_bps.unwrap_or(10),
        insurance_fund_cut_bps: insurance_fund_cut_bps.unwrap_or(8000),
    }
}
