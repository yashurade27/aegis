use wasm_bindgen::prelude::*;
use std::collections::HashMap;

use crate::types::*;
use crate::margin::*;
use crate::pnl::*;
use crate::matching::*;
use crate::funding::*;
use crate::insurance::*;

fn from_js<T: serde::de::DeserializeOwned>(js: JsValue) -> Result<T, JsValue> {
    serde_wasm_bindgen::from_value(js).map_err(|e| JsValue::from_str(&e.to_string()))
}

fn to_js<T: serde::Serialize>(v: &T) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(v).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen(js_name = requiredInitialMargin)]
pub fn js_required_initial_margin(notional: f64, leverage: f64) -> Result<f64, JsValue> {
    required_initial_margin(notional, leverage).map_err(JsValue::from_str)
}

#[wasm_bindgen(js_name = liquidationPrice)]
pub fn js_liquidation_price(entry_price: f64, side: JsValue, maint_bps: f64, leverage: f64) -> Result<f64, JsValue> {
    let side_enum: Side = from_js(side)?;
    liquidation_price(entry_price, side_enum, Some(maint_bps), Some(leverage)).map_err(JsValue::from_str)
}

#[wasm_bindgen(js_name = marginHealth)]
pub fn js_margin_health(collateral: f64, pnl: f64, notional: f64) -> f64 {
    margin_health(collateral, pnl, notional)
}

#[wasm_bindgen(js_name = calculateUnrealizedPnl)]
pub fn js_calculate_unrealized_pnl(position: JsValue, mark_price: f64) -> Result<f64, JsValue> {
    let pos: Position = from_js(position)?;
    Ok(calculate_unrealized_pnl(&pos, mark_price))
}

#[wasm_bindgen(js_name = computeFundingRate)]
pub fn js_compute_funding_rate(mark_price: f64, index_price: f64) -> Result<f64, JsValue> {
    compute_funding_rate(mark_price, index_price).map_err(JsValue::from_str)
}

#[wasm_bindgen(js_name = settlePnl)]
pub fn js_settle_pnl(position: JsValue, exit_price: f64, account: JsValue) -> Result<JsValue, JsValue> {
    // In TS, settlePnl mutates account. We must return the mutated account back to JS.
    let pos: Position = from_js(position)?;
    let mut acc: TraderAccount = from_js(account)?;
    
    let realized_pnl = settle_pnl(&pos, exit_price, &mut acc);
    
    to_js(&serde_json::json!({ "realizedPnl": realized_pnl, "account": acc }))
}

#[wasm_bindgen(js_name = applyFunding)]
pub fn js_apply_funding(position: JsValue, funding_rate: f64) -> Result<JsValue, JsValue> {
    let mut pos: Position = from_js(position)?;
    let payment = apply_funding(&mut pos, funding_rate);
    
    to_js(&serde_json::json!({ "payment": payment, "position": pos }))
}

#[wasm_bindgen(js_name = totalUnrealizedPnl)]
pub fn js_total_unrealized_pnl(account: JsValue, mark_prices_js: JsValue) -> Result<f64, JsValue> {
    let acc: TraderAccount = from_js(account)?;
    let mark_prices: HashMap<String, f64> = from_js(mark_prices_js).unwrap_or_default();
    Ok(total_unrealized_pnl(&acc, &mark_prices))
}

#[wasm_bindgen(js_name = canWithdraw)]
pub fn js_can_withdraw(account: JsValue, amount: f64, mark_prices_js: JsValue) -> Result<bool, JsValue> {
    let acc: TraderAccount = from_js(account)?;
    let mark_prices: HashMap<String, f64> = from_js(mark_prices_js).unwrap_or_default();
    Ok(can_withdraw(&acc, amount, &mark_prices))
}

#[wasm_bindgen(js_name = routeFeeToInsurance)]
pub fn js_route_fee_to_insurance(fill_js: JsValue, insurance_cut_bps: u32, fund_js: JsValue) -> Result<JsValue, JsValue> {
    let fill: Fill = from_js(fill_js)?;
    let mut fund: InsuranceFund = from_js(fund_js)?;
    
    let routed = route_fee_to_insurance(&fill, insurance_cut_bps, &mut fund);
    to_js(&serde_json::json!({ "routed": routed, "fund": fund }))
}

#[wasm_bindgen(js_name = createInsuranceFund)]
pub fn js_create_insurance_fund() -> Result<JsValue, JsValue> {
    to_js(&create_insurance_fund())
}

#[wasm_bindgen(js_name = createMarket)]
pub fn js_create_market(address: String, base_asset: String, quote_asset: String, fee_bps: u32, insurance_cut: u32) -> Result<JsValue, JsValue> {
    to_js(&create_market(&address, &base_asset, &quote_asset, Some(fee_bps), Some(insurance_cut)))
}

#[wasm_bindgen(js_name = matchOrder)]
pub fn js_match_order(market_js: JsValue, order_js: JsValue) -> Result<JsValue, JsValue> {
    let mut market: Market = from_js(market_js)?;
    let order: Order = from_js(order_js)?;
    
    let fills = match_order(&mut market, order).map_err(JsValue::from_str)?;
    to_js(&serde_json::json!({ "fills": fills, "market": market }))
}

#[wasm_bindgen(js_name = cancelOrder)]
pub fn js_cancel_order(market_js: JsValue, order_id: u64, side_js: JsValue) -> Result<JsValue, JsValue> {
    let mut market: Market = from_js(market_js)?;
    let side: Side = from_js(side_js)?;
    let removed = cancel_order(&mut market, order_id, side);
    to_js(&serde_json::json!({ "removed": removed, "market": market }))
}

#[wasm_bindgen(js_name = insertOrderIntoBook)]
pub fn js_insert_order_into_book(market_js: JsValue, order_js: JsValue) -> Result<JsValue, JsValue> {
    let mut market: Market = from_js(market_js)?;
    let order: Order = from_js(order_js)?;
    insert_order_into_book(&mut market, order);
    to_js(&market)
}
