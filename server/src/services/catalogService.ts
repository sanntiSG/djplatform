import { Genre } from '../models/Genre.js'
import { EventType } from '../models/EventType.js'

export async function getGenres() {
  return Genre.find({ isActive: true }).sort({ order: 1 }).lean()
}

export async function getEventTypes() {
  return EventType.find({ isActive: true }).sort({ order: 1 }).lean()
}
