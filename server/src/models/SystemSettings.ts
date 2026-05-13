import mongoose from 'mongoose'

interface ISystemSettings {
  key: 'global'
  trendingRefreshMinutes: number
}

const schema = new mongoose.Schema<ISystemSettings>(
  {
    key: { type: String, default: 'global', unique: true, immutable: true },
    trendingRefreshMinutes: { type: Number, default: 1, min: 1, max: 1440 },
  },
  { timestamps: true },
)

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', schema)
