(function(global){
  function round(n, places=4){
    const p = 10 ** places;
    return Math.round((Number(n) + Number.EPSILON) * p) / p;
  }

  function normalizeDirection(direction){
    const d = String(direction || '').toUpperCase();
    if(d === 'LONG' || d === 'BULLISH') return 'LONG';
    if(d === 'SHORT' || d === 'BEARISH') return 'SHORT';
    throw new Error('direction must be LONG/BULLISH or SHORT/BEARISH');
  }

  function createPaperPosition({
    id,
    symbol,
    direction,
    quantity = 1,
    entryPrice,
    entryTime,
    setup = null,
    timeframe = null,
    trigger = null,
    target = null,
    stop = null,
    notes = null
  }){
    const dir = normalizeDirection(direction);
    const qty = Number(quantity);
    const entry = Number(entryPrice);
    if(!symbol) throw new Error('symbol is required');
    if(!(qty > 0)) throw new Error('quantity must be > 0');
    if(!(entry > 0)) throw new Error('entryPrice must be > 0');

    return {
      id: id || `paper-${Date.now()}`,
      symbol: String(symbol).toUpperCase(),
      direction: dir,
      quantity: qty,
      entryPrice: entry,
      entryTime: entryTime || new Date().toISOString(),
      setup,
      timeframe,
      trigger,
      target,
      stop,
      notes,
      status: 'OPEN',
      currentPrice: entry,
      lastMarkedAt: entryTime || null,
      bestPrice: entry,
      worstPrice: entry,
      exitPrice: null,
      exitTime: null
    };
  }

  function markPaperPosition(position, currentPrice, markedAt){
    if(!position || position.status !== 'OPEN') return position;
    const px = Number(currentPrice);
    if(!(px > 0)) throw new Error('currentPrice must be > 0');
    const p = {...position, currentPrice:px, lastMarkedAt:markedAt || new Date().toISOString()};
    if(p.direction === 'LONG'){
      p.bestPrice = Math.max(Number(p.bestPrice), px);
      p.worstPrice = Math.min(Number(p.worstPrice), px);
    } else {
      p.bestPrice = Math.min(Number(p.bestPrice), px);
      p.worstPrice = Math.max(Number(p.worstPrice), px);
    }
    return p;
  }

  function paperPositionMetrics(position){
    const mark = Number(position.status === 'CLOSED' ? position.exitPrice : position.currentPrice);
    const entry = Number(position.entryPrice);
    const qty = Number(position.quantity);
    const perShare = position.direction === 'LONG' ? mark - entry : entry - mark;
    const pnl = perShare * qty;
    const returnPct = (perShare / entry) * 100;
    const riskPerShare = position.stop == null ? null : Math.abs(entry - Number(position.stop));
    const rMultiple = riskPerShare && riskPerShare > 0 ? perShare / riskPerShare : null;
    const mfePerShare = position.direction === 'LONG'
      ? Number(position.bestPrice) - entry
      : entry - Number(position.bestPrice);
    const maePerShare = position.direction === 'LONG'
      ? Number(position.worstPrice) - entry
      : entry - Number(position.worstPrice);

    return {
      markPrice: round(mark),
      perShare: round(perShare),
      pnl: round(pnl),
      returnPct: round(returnPct),
      rMultiple: rMultiple == null ? null : round(rMultiple),
      mfePerShare: round(mfePerShare),
      maePerShare: round(maePerShare),
      mfe: round(mfePerShare * qty),
      mae: round(maePerShare * qty)
    };
  }

  function closePaperPosition(position, exitPrice, exitTime){
    if(!position || position.status !== 'OPEN') return position;
    const marked = markPaperPosition(position, exitPrice, exitTime);
    return {
      ...marked,
      status:'CLOSED',
      exitPrice:Number(exitPrice),
      exitTime:exitTime || new Date().toISOString()
    };
  }

  const api = {createPaperPosition, markPaperPosition, paperPositionMetrics, closePaperPosition};
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  if(global) global.PaperPosition = api;
})(typeof window !== 'undefined' ? window : globalThis);
