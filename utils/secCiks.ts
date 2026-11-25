// Ticker -> SEC CIK for common US listings. Each entry was checked against
// data.sec.gov companyfacts (entityName matches the company). Used first so the
// server does not depend on www.sec.gov, which can refuse requests from hosts.
export const SEC_CIKS: Record<string, string> = {
  AAPL: '0000320193', // Apple Inc.
  MSFT: '0000789019', // Microsoft Corp
  GOOGL: '0001652044', // Alphabet Inc.
  META: '0001326801', // Meta Platforms, Inc.
  AMZN: '0001018724', // Amazon.com, Inc.
  NVDA: '0001045810', // NVIDIA Corp
  TSLA: '0001318605', // Tesla, Inc.
  NFLX: '0001065280', // Netflix, Inc.
  ADBE: '0000796343', // Adobe Inc.
  CRM: '0001108524', // Salesforce, Inc.
  INTC: '0000050863', // Intel Corporation
  DUOL: '0001562088', // Duolingo, Inc.
  KO: '0000021344', // Coca-Cola Co
  JPM: '0000019617', // JPMorgan Chase & Co
  WMT: '0000104169', // Walmart Inc.
  XOM: '0000034088', // Exxon Mobil Corporation
  JNJ: '0000200406', // Johnson & Johnson
  PG: '0000080424', // Procter & Gamble Co
  CAT: '0000018230', // Caterpillar Inc
}
