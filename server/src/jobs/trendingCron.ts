import { fetchAndCacheLastFm } from '../services/lastfmService.js'
import { fetchAndCacheRss } from '../services/rssService.js'
import { getSettings } from '../services/systemSettingsService.js'
import { logger } from '../utils/logger.js'

let lastFmTimer: ReturnType<typeof setInterval> | null = null
let rssTimer: ReturnType<typeof setInterval> | null = null

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

function startTimers(minutes: number) {
  if (lastFmTimer) clearInterval(lastFmTimer)
  if (rssTimer) clearInterval(rssTimer)
  const ms = minutes * 60 * 1000
  lastFmTimer = setInterval(() => void runLastFm(), ms)
  rssTimer = setInterval(() => void runRss(), ms)
  logger.info(`trendingCron: activo (cada ${minutes} min)`)
}

export async function startTrendingCron() {
  void runLastFm()
  void runRss()
  try {
    const settings = await getSettings()
    startTimers(settings.trendingRefreshMinutes)
  } catch {
    startTimers(1)
  }
}

export function restartTrendingCron(minutes: number) {
  startTimers(minutes)
}
