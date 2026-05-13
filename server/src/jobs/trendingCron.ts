import { fetchAndCacheLastFm } from '../services/lastfmService.js'
import { fetchAndCacheRss } from '../services/rssService.js'
import { logger } from '../utils/logger.js'

const TWO_HOURS = 2 * 60 * 60 * 1000
const FOUR_HOURS = 4 * 60 * 60 * 1000

async function runLastFm() {
  try {
    await fetchAndCacheLastFm()
  } catch (err) {
    logger.warn('trendingCron: Last.fm fallido', err)
  }
}

async function runRss() {
  try {
    await fetchAndCacheRss()
  } catch (err) {
    logger.warn('trendingCron: RSS fallido', err)
  }
}

export function startTrendingCron() {
  // Run immediately on startup, then on intervals
  void runLastFm()
  void runRss()

  setInterval(() => void runLastFm(), TWO_HOURS)
  setInterval(() => void runRss(), FOUR_HOURS)

  logger.info('trendingCron: iniciado (Last.fm cada 2h, RSS cada 4h)')
}
