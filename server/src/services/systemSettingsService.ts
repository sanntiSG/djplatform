import { SystemSettings } from '../models/SystemSettings.js'

export async function getSettings() {
  const doc = await SystemSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', trendingRefreshMinutes: 1 } },
    { upsert: true, new: true },
  ).lean()
  return doc!
}

export async function updateSettings(patch: { trendingRefreshMinutes?: number }) {
  const doc = await SystemSettings.findOneAndUpdate(
    { key: 'global' },
    { $set: patch },
    { upsert: true, new: true },
  ).lean()
  return doc!
}
