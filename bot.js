/**
 * File: netlify/functions/bot.js
 * 24/7 Telegram Serverless Webhook Bot for Netlify
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8843344496:AAFRh3yjVGam6WjOsRM0dm58E1d_Q5Awigk";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// টেলিগ্রামে মেসেজ ও বাটন পাঠানোর ফাংশন
async function sendTelegramMessage(chatId, text, replyMarkup) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown",
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await res.json();
}

exports.handler = async function (event, context) {
  // ব্রাউজার দিয়ে চেক করলে স্ট্যাটাস দেখাবে
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "active",
        message: "Telegram Bot Webhook is running 24/7 on Netlify Functions"
      }),
    };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, body: "Empty body" };
    }

    const update = JSON.parse(event.body);
    const message = update.message || update.edited_message;

    if (!message || !message.text) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const chatId = message.chat.id;
    const rawText = message.text.trim();
    const cleanText = rawText.toLowerCase();
    const firstName = message.from?.first_name || "বন্ধু";

    // ১. /start কমান্ড হ্যান্ডলার
    if (cleanText === "/start" || cleanText.startsWith("/start ") || cleanText === "start") {
      const welcomeText = 
`👋 *সালাম ও স্বাগতম, ${firstName}!*

আমি আপনার টেলিগ্রাম বট (Node.js 24/7 Serverless Webhook on Netlify)।

✨ *কী করতে পারবেন:*
• আমাকে *"হাই"* বা *"hello"* লিখলে আমি আপনাকে হ্যালো বলব!
• নিচের বাটনগুলোতে চাপ দিয়ে সহজে কথা বলুন।

📌 *কমান্ডসমূহ:*
/start - বট রিস্টার্ট ও পরিচিতি
/status - বটের ২৪/৭ আপটাইম স্ট্যাটাস
/help - সাহায্য নির্দেশিকা

আমাকে এখনই *'হাই'* লিখে টেস্ট করুন! 👇`;

      await sendTelegramMessage(chatId, welcomeText, {
        keyboard: [
          [{ text: "💬 হাই" }, { text: "⚡ /status" }],
          [{ text: "ℹ️ /help" }, { text: "▶️ /start" }],
        ],
        resize_keyboard: true,
      });

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ২. "হাই" বললে "হ্যালো" বলবে
    const greetingWords = ["হাই", "হ্যালো", "সালাম", "hi", "hello", "hey", "hlo", "hy"];
    const isGreeting = greetingWords.some(w => cleanText === w || cleanText.startsWith(w + " "));

    if (isGreeting) {
      const helloReply = 
`হ্যালো! কেমন আছেন? 😊

আমি আপনার ২৪/৭ টেলিগ্রাম বট। আপনি আমাকে "হাই" বলেছেন, তাই আমি আপনাকে হ্যালো বলছি!

আপনাকে কীভাবে সাহায্য করতে পারি বলুন?
বট স্ট্যাটাস দেখতে /status অথবা মেন্যু দেখতে /start চাপুন।`;

      await sendTelegramMessage(chatId, helloReply, {
        keyboard: [
          [{ text: "💬 কেমন আছেন?" }, { text: "⚡ /status" }],
          [{ text: "▶️ /start" }],
        ],
        resize_keyboard: true,
      });

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ৩. /status কমান্ড হ্যান্ডলার
    if (cleanText === "/status" || cleanText === "status" || cleanText === "স্ট্যাটাস") {
      const statusText = 
`⚡ *বট সিস্টেম স্ট্যাটাস:*

🟢 অবস্থা: সক্রিয় (Active 24/7)
🚀 হোস্ট: Netlify Serverless Functions
🔒 কানেকশন: Webhook Connected
⏱️ সময়: ${new Date().toLocaleTimeString()}

বটটি সম্পূর্ণ নিখুঁতভাবে চালু আছে!`;

      await sendTelegramMessage(chatId, statusText);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ৪. /help কমান্ড হ্যান্ডলার
    if (cleanText === "/help" || cleanText === "help" || cleanText === "সাহায্য") {
      const helpText = 
`📖 *সাহায্য গাইড:*

১. /start - শুরু করার নির্দেশিকা
২. হাই / hi - হ্যালো উত্তর পাওয়া যাবে
৩. /status - সিস্টেম লাইভ কি না দেখা যাবে`;

      await sendTelegramMessage(chatId, helpText);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ৫. সাধারণ যেকোনো মেসেজের উত্তর
    const fallbackText = 
`ধন্যবাদ ${firstName}! আমি আপনার বার্তা পেয়েছি:
💬 "${rawText}"

💡 আমাকে *"হাই"* লিখে পাঠালে আমি আপনাকে *"হ্যালো"* বলব!`;

      await sendTelegramMessage(chatId, fallbackText, {
        keyboard: [
          [{ text: "💬 হাই" }, { text: "▶️ /start" }],
          [{ text: "⚡ /status" }],
        ],
        resize_keyboard: true,
      });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Webhook error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};