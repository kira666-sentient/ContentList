import 'dotenv/config';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Get this URL from your Vercel Dashboard once you deploy!
// Example: https://contentlist-yourname.vercel.app
const VERCEL_URL = process.argv[2]; 

if (!TELEGRAM_TOKEN) {
  console.error("❌ Error: Missing TELEGRAM_BOT_TOKEN in .env file");
  process.exit(1);
}

if (!VERCEL_URL) {
  console.error("❌ Error: Please provide your Vercel URL as an argument.");
  console.log("Usage: node scripts/register-webhook.js https://your-vercel-project.vercel.app");
  process.exit(1);
}

const webhookUrl = `${VERCEL_URL.replace(/\/$/, '')}/api/bot`;

console.log(`Setting Telegram Webhook to: ${webhookUrl}`);

async function setWebhook() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${webhookUrl}`);
    const data = await res.json();
    
    if (data.ok) {
      console.log("✅ Webhook successfully registered!");
    } else {
      console.error("❌ Failed to register webhook:");
      console.error(data);
    }
  } catch (err) {
    console.error("❌ Fetch Error:", err);
  }
}

setWebhook();
