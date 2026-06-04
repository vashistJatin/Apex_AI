import axios from 'axios'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendTelegram(message: string): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) return false
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    }, { timeout: 5000 })
    return true
  } catch (err) {
    console.error('[Telegram] Failed to send:', err)
    return false
  }
}

export async function sendSignalAlert(signal: {
  symbol: string; type: string; entry: number
  sl: number; tp: number[]; confidence: number; reasoning: string
}): Promise<void> {
  const emoji = signal.type === 'BUY' ? '🟢' : signal.type === 'SELL' ? '🔴' : '🟡'
  const msg = `
${emoji} <b>APEX AI SIGNAL — ${signal.symbol}</b>

📊 <b>Signal:</b> ${signal.type}
💰 <b>Entry:</b> $${signal.entry.toLocaleString()}
🛑 <b>Stop Loss:</b> $${signal.sl.toLocaleString()}
🎯 <b>Take Profit:</b>
  TP1: $${signal.tp[0]?.toLocaleString()}
  TP2: $${signal.tp[1]?.toLocaleString()}
  TP3: $${signal.tp[2]?.toLocaleString()}
📈 <b>Confidence:</b> ${signal.confidence}%

🤖 <b>AI Analysis:</b>
${signal.reasoning}

⚠️ <i>Always use proper risk management. This is not financial advice.</i>
  `.trim()
  await sendTelegram(msg)
}

export async function sendTradeAlert(trade: {
  symbol: string; side: string; qty: number
  price: number; mode: string
}): Promise<void> {
  const emoji = trade.side === 'BUY' ? '📈' : '📉'
  const msg = `
${emoji} <b>TRADE EXECUTED — ${trade.mode}</b>

Pair: ${trade.symbol}
Side: ${trade.side}
Quantity: ${trade.qty}
Price: $${trade.price.toLocaleString()}
Total: $${(trade.qty * trade.price).toLocaleString()}
  `.trim()
  await sendTelegram(msg)
}

export async function sendRiskAlert(message: string): Promise<void> {
  await sendTelegram(`⚠️ <b>RISK ALERT</b>\n\n${message}`)
}
