import mongoose from 'mongoose'

interface ISystemSettings {
  key: 'global'
  trendingRefreshMinutes: number
  collabsFeedTtlHours: number
}

const schema = new mongoose.Schema<ISystemSettings>(
  {
    key: { type: String, default: 'global', unique: true, immutable: true },
    trendingRefreshMinutes: { type: Number, default: 1, min: 1, max: 1440 },
    collabsFeedTtlHours: { type: Number, default: 8, min: 1, max: 168 },
  },
  { timestamps: true },
)

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', schema)
