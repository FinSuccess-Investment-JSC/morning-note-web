// scripts/quotes.ts
import fs from "node:fs";
import path from "node:path";

// lib/parsers.ts
function parseYahoo(json, a, now = Date.now()) {
  const result = json.chart?.result?.[0], m = result?.meta;
  const price = Number(m?.regularMarketPrice), time = Number(m?.regularMarketTime) * 1e3;
  if (!m || !Number.isFinite(price) || price <= 0 || !time || time > now + 6e4) throw new Error("Kh\xF4ng c\xF3 gi\xE1 ho\u1EB7c th\u1EDDi \u0111i\u1EC3m h\u1EE3p l\u1EC7");
  let percent = Number.isFinite(m.regularMarketChangePercent) ? m.regularMarketChangePercent : Number.isFinite(m.fulldayChangePercent) ? m.fulldayChangePercent : null;
  let change = Number.isFinite(m.fulldayChange) ? m.fulldayChange : Number.isFinite(m.regularMarketChange) ? m.regularMarketChange : null;
  if (change === null && percent !== null && percent > -100) change = price - price / (1 + percent / 100);
  if (change === null) {
    const previous = m.previousClose ?? m.chartPreviousClose;
    if (previous > 0 && json.chart?.result?.[0]?.meta?.range === "1d") {
      change = price - previous;
      percent = change / previous * 100;
    }
  }
  const regular = m.currentTradingPeriod?.regular;
  const session = regular && now >= regular.start * 1e3 && now <= regular.end * 1e3 ? "Trong gi\u1EDD giao d\u1ECBch" : "Ngo\xE0i gi\u1EDD giao d\u1ECBch";
  const explicit = Number(m.exchangeDataDelayedBy);
  const label = session === "Ngo\xE0i gi\u1EDD giao d\u1ECBch" ? "Phi\xEAn g\u1EA7n nh\u1EA5t" : explicit > 0 ? `Tr\u1EC5 ${explicit} ph\xFAt` : "\u0110\u1ED9 tr\u1EC5 ch\u01B0a x\xE1c nh\u1EADn";
  return { id: a.id, price, change, percent, time, fetched: now, source: "Yahoo Finance", url: "https://finance.yahoo.com/quote/" + encodeURIComponent(a.symbol) + "/", label, basis: "So phi\xEAn tr\u01B0\u1EDBc", session, detail: (a.kind === "H\u1EE3p \u0111\u1ED3ng t\u01B0\u01A1ng lai" ? "H\u1EE3p \u0111\u1ED3ng t\u01B0\u01A1ng lai g\u1EA7n nh\u1EA5t do Yahoo t\u1ED5ng h\u1EE3p; c\xF3 th\u1EC3 chuy\u1EC3n k\u1EF3. " : "") + "\u0110\u1ED3ng b\u1ED9 t\u1ED1i \u0111a m\u1ED7i 2 ph\xFAt; th\u1EDDi \u0111i\u1EC3m hi\u1EC3n th\u1ECB l\xE0 th\u1EDDi \u0111i\u1EC3m ngu\u1ED3n ghi nh\u1EADn." };
}

// lib/catalog.ts
var groups = [
  { id: "us", name: "Ch\u1EE9ng kho\xE1n M\u1EF9", eyebrow: "WALL STREET" },
  { id: "asia", name: "Ch\u1EE9ng kho\xE1n ch\xE2u \xC1", eyebrow: "ASIA PACIFIC" },
  { id: "commodity", name: "H\xE0ng h\xF3a", eyebrow: "COMMODITIES" },
  { id: "crypto", name: "Ti\u1EC1n \u0111i\u1EC7n t\u1EED", eyebrow: "DIGITAL ASSETS" }
];
var asset = (id, name, symbol, group, unit = "\u0110i\u1EC3m", precision = 2, provider = "yahoo", kind = "Ch\u1EC9 s\u1ED1") => ({ id, name, symbol, group, unit, precision, provider, kind });
var assets = [
  asset("dji", "Dow Jones", "^DJI", "us"),
  asset("spx", "S&P 500", "^GSPC", "us"),
  asset("ixic", "Nasdaq Composite", "^IXIC", "us"),
  asset("nya", "NYSE Composite", "^NYA", "us"),
  asset("ndx", "Nasdaq 100", "^NDX", "us"),
  asset("n225", "Nikkei 225", "^N225", "asia"),
  asset("hsi", "Hang Seng", "^HSI", "asia"),
  asset("ssec", "Shanghai Composite", "000001.SS", "asia"),
  asset("kospi", "KOSPI", "^KS11", "asia"),
  asset("asx", "S&P/ASX 200", "^AXJO", "asia"),
  asset("wti", "D\u1EA7u th\xF4 WTI", "CL=F", "commodity", "USD/th\xF9ng", 2, "yahoo", "H\u1EE3p \u0111\u1ED3ng t\u01B0\u01A1ng lai"),
  asset("brent", "D\u1EA7u Brent", "BZ=F", "commodity", "USD/th\xF9ng", 2, "yahoo", "H\u1EE3p \u0111\u1ED3ng t\u01B0\u01A1ng lai"),
  asset("gas", "Kh\xED t\u1EF1 nhi\xEAn", "NG=F", "commodity", "USD/MMBtu", 3, "yahoo", "H\u1EE3p \u0111\u1ED3ng t\u01B0\u01A1ng lai"),
  asset("gold", "V\xE0ng XAU/USD", "XAU", "commodity", "USD/oz", 2, "investing", "Giao ngay"),
  asset("steel", "Steel HRC FOB China", "LME:HC1!", "commodity", "USD/t\u1EA5n", 2, "tradingview", "H\u1EE3p \u0111\u1ED3ng t\u01B0\u01A1ng lai"),
  asset("btc", "BTC/USD", "bitcoin", "crypto", "USD", 2, "coingecko", "Bi\u1EBFn \u0111\u1ED9ng 24h"),
  asset("eth", "ETH/USD", "ethereum", "crypto", "USD", 2, "coingecko", "Bi\u1EBFn \u0111\u1ED9ng 24h"),
  asset("sol", "SOL/USD", "solana", "crypto", "USD", 3, "coingecko", "Bi\u1EBFn \u0111\u1ED9ng 24h"),
  asset("bnb", "BNB/USD", "binancecoin", "crypto", "USD", 2, "coingecko", "Bi\u1EBFn \u0111\u1ED9ng 24h"),
  asset("link", "LINK/USD", "chainlink", "crypto", "USD", 3, "coingecko", "Bi\u1EBFn \u0111\u1ED9ng 24h")
];
var source = (id, name, domain, path2, mode = "rss", interval = 300) => ({ id, name, domain, url: "https://" + domain + path2, mode, interval, enabled: true });
var sources = [
  source("tbtc", "Th\u1EDDi b\xE1o T\xE0i ch\xEDnh Vi\u1EC7t Nam", "thoibaotaichinhvietnam.vn", "/rss_feed/"),
  source("baodautu", "B\xE1o \u0110\u1EA7u t\u01B0", "baodautu.vn", "/", "html", 600),
  source("tnck", "B\xE1o \u0110\u1EA7u t\u01B0 Ch\u1EE9ng kho\xE1n", "tinnhanhchungkhoan.vn", "/", "html", 600),
  source("tbn", "Th\u1EDDi b\xE1o Ng\xE2n h\xE0ng", "thoibaonganhang.vn", "/rss_feed/"),
  source("vneconomy", "VnEconomy", "vneconomy.vn", "/tin-moi.rss"),
  source("dddn", "Di\u1EC5n \u0111\xE0n Doanh nghi\u1EC7p", "diendandoanhnghiep.vn", "/", "html", 600),
  source("ktdt", "Kinh t\u1EBF & \u0110\xF4 th\u1ECB", "kinhtedothi.vn", "/", "html", 900),
  source("ncdt", "Nh\u1ECBp c\u1EA7u \u0110\u1EA7u t\u01B0", "nhipcaudautu.vn", "/", "html", 600),
  source("ktdb", "Kinh t\u1EBF v\xE0 D\u1EF1 b\xE1o", "kinhtevadubao.vn", "/", "html", 900),
  source("vnexpress", "VnExpress \xB7 Kinh doanh", "vnexpress.net", "/rss/kinh-doanh.rss"),
  source("tuoitre", "Tu\u1ED5i Tr\u1EBB \xB7 Kinh t\u1EBF", "tuoitre.vn", "/kinh-doanh.rss"),
  source("thanhnien", "Thanh Ni\xEAn \xB7 Kinh t\u1EBF", "thanhnien.vn", "/rss/kinh-te.rss"),
  source("vietnamnet", "VietNamNet \xB7 Kinh doanh", "vietnamnet.vn", "/kinh-doanh.rss"),
  source("cafef", "CafeF", "cafef.vn", "/home.rss"),
  source("vietnambiz", "VietnamBiz", "vietnambiz.vn", "/tin-moi-nhat.rss"),
  source("vietstock", "Vietstock", "vietstock.vn", "/chu-de/1-2/moi-cap-nhat.htm", "html", 600)
];
function configuredAssets(settings) {
  return settings.assets || assets;
}
var defaultSettings = { title: "MARKET NOTE", subtitle: "B\u1EA2N TIN TH\u1ECA TR\u01AF\u1EDCNG", hiddenAssets: [], groupOrder: groups.map((g) => g.id), sources };

// lib/live-quotes.ts
var liveAssets = (settings) => configuredAssets(settings).filter((a) => !settings.hiddenAssets.includes(a.id));
var coingeckoUrl = (coins2) => "https://api.coingecko.com/api/v3/simple/price?ids=" + coins2.map((a) => a.symbol).join(",") + "&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true";
function coingeckoQuotes(coins2, j, now = Date.now()) {
  return coins2.map((a) => {
    const c = j[a.symbol];
    if (!c || !Number.isFinite(c.usd) || !c.last_updated_at || c.last_updated_at * 1e3 > now + 6e4) throw new Error("Thi\u1EBFu gi\xE1/th\u1EDDi \u0111i\u1EC3m ti\u1EC1n \u0111i\u1EC7n t\u1EED");
    const percent = Number.isFinite(c.usd_24h_change) ? c.usd_24h_change : null;
    return { id: a.id, price: c.usd, percent, change: percent !== null && percent > -100 ? c.usd - c.usd / (1 + percent / 100) : null, time: c.last_updated_at * 1e3, fetched: now, source: "CoinGecko", url: "https://www.coingecko.com/en/coins/" + a.symbol, label: "G\u1EA7n th\u1EDDi gian th\u1EF1c", basis: "So 24 gi\u1EDD tr\u01B0\u1EDBc" };
  });
}

// scripts/quotes.ts
var [snapshotPath, outPath] = process.argv.slice(2);
var snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
var assets2 = liveAssets(snapshot.settings);
var get = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(1e4), headers: { "User-Agent": "MarketNote/1.0 (personal financial news dashboard)" } });
  if (!r.ok) throw new Error(url + " \u2192 " + r.status);
  return r.json();
};
var quotes = [];
var errors = [];
await Promise.all(assets2.filter((a) => a.provider === "yahoo").map(async (a) => {
  try {
    quotes.push(parseYahoo(await get("https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(a.symbol) + "?interval=1d&range=1d"), a));
  } catch (e) {
    errors.push(a.id + ": " + (e instanceof Error ? e.message : e));
  }
}));
var coins = assets2.filter((a) => a.provider === "coingecko");
if (coins.length) try {
  quotes.push(...coingeckoQuotes(coins, await get(coingeckoUrl(coins))));
} catch (e) {
  errors.push("crypto: " + (e instanceof Error ? e.message : e));
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ fetchedAt: Date.now(), quotes }));
console.log(`${quotes.length} quotes` + (errors.length ? " \xB7 errors: " + errors.join(" | ") : ""));
