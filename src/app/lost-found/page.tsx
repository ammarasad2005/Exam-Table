'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  SlidersHorizontal,
  FileText,
  MapPin,
  User,
  Clock,
  Calendar,
  Search,
  Plus,
  ArrowLeft,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Eye,
  Package,
  Sparkles,
  ChevronDown,
  HomeIcon,
  Share2,
  ArrowUpDown,
  Heart,
  Command,
  AlertTriangle,
  BookmarkCheck,
  Bookmark,
  Copy,
  TrendingUp,
  MoreHorizontal,
  Printer,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Zap,
  PartyPopper,
  ChevronLeft,
  ChevronRightIcon,
  Loader2,
  ArrowUp,
  ArrowDown,
  Moon,
  Sun,
  Tag,
  Camera,
  Bell,
  Send,
  Handshake,
  SearchX,
  Archive,
  Activity,
  Building2,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { useToast } from '@/hooks/use-toast'

export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ─── Types ──────────────────────────────────────────────────────────────────

type View = 'home' | 'lost-found'
type SubView = 'list' | 'detail' | 'report'
type DateRange = 'all' | 'today' | 'week' | 'month'

interface LostFoundItem {
  id: string
  type: 'lost' | 'found'
  category: string
  title: string
  description: string
  location: string
  date: string
  contactInfo: string
  isResolved: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

// ─── Feature Card Data ──────────────────────────────────────────────────────

const features = [
  {
    id: 'timetable',
    label: 'Timetable',
    accent: 'cs',
    icon: CalendarDays,
    desc: 'Your full weekly class schedule — every course, room, and timing — instantly.',
    external: true,
  },
  {
    id: 'optimizer',
    label: 'Optimizer',
    accent: 'cy',
    icon: SlidersHorizontal,
    desc: 'Find clash-free combinations of your preferred sections and classes.',
    external: true,
  },
  {
    id: 'exams',
    label: 'Exams',
    accent: 'ee',
    icon: FileText,
    desc: 'Every exam date and time for your batch and department.',
    external: true,
  },
  {
    id: 'rooms',
    label: 'Rooms',
    accent: 'ds',
    icon: MapPin,
    desc: 'Find empty classrooms and labs across campus for any day and time slot.',
    external: true,
  },
  {
    id: 'faculty',
    label: 'Faculty',
    accent: 'se',
    icon: User,
    desc: 'Find emails, office numbers, and other details for all faculty members.',
    external: true,
  },
  {
    id: 'semester',
    label: 'Schedule',
    accent: 'af',
    icon: Clock,
    desc: 'Full academic calendar — key dates, holidays, sessionals, and finals.',
    external: true,
  },
  {
    id: 'events',
    label: 'Events',
    accent: 'ba',
    icon: Calendar,
    desc: 'Student-relevant events, seminars, drives, and activities in one monthly view.',
    external: true,
  },
  {
    id: 'lost-found',
    label: 'Lost & Found',
    accent: 'lf',
    icon: Search,
    desc: 'Report lost items or browse found belongings — reunite students with their stuff.',
    external: false,
  },
]

const categories = [
  'All',
  'Electronics',
  'Documents',
  'Accessories',
  'Clothing',
  'Keys',
  'Bags',
  'Books',
  'Other',
]

const categoryIcons: Record<string, string> = {
  Electronics: '\uD83D\uDCBB',
  Documents: '\uD83D\uDCC4',
  Accessories: '\u231B',
  Clothing: '\uD83D\uDC54',
  Keys: '\uD83D\uDD11',
  Bags: '\uD83C\uDF92',
  Books: '\uD83D\uDCDA',
  Other: '\uD83D\uDCE6',
}

const categoryPlaceholders: Record<string, { gradient: string; emoji: string }> = {
  Electronics: { gradient: 'linear-gradient(135deg, #1E40AF, #3B82F6)', emoji: '\uD83D\uDCBB' },
  Documents: { gradient: 'linear-gradient(135deg, #92400E, #F59E0B)', emoji: '\uD83D\uDCC4' },
  Accessories: { gradient: 'linear-gradient(135deg, #5B21B6, #8B5CF6)', emoji: '\u231B' },
  Clothing: { gradient: 'linear-gradient(135deg, #9D174D, #EC4899)', emoji: '\uD83D\uDC54' },
  Keys: { gradient: 'linear-gradient(135deg, #92400E, #FBBF24)', emoji: '\uD83D\uDD11' },
  Bags: { gradient: 'linear-gradient(135deg, #065F46, #34D399)', emoji: '\uD83C\uDF92' },
  Books: { gradient: 'linear-gradient(135deg, #115E59, #2DD4BF)', emoji: '\uD83D\uDCDA' },
  Other: { gradient: 'linear-gradient(135deg, #374151, #9CA3AF)', emoji: '\uD83D\uDCE6' },
}

const categoryAccentColors: Record<string, string> = {
  Electronics: '#2563EB',
  Documents: '#D97706',
  Accessories: '#7C3AED',
  Clothing: '#EC4899',
  Keys: '#F59E0B',
  Bags: '#059669',
  Books: '#0D9488',
  Other: '#6B7280',
}

const campusLocations = [
  'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105',
  'Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205',
  'Room 301', 'Room 302', 'Room 303', 'Room 304', 'Room 310',
  'Cafeteria', 'Library 1st Floor', 'Library 2nd Floor',
  'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4',
  'Auditorium', 'Parking Lot A', 'Parking Lot B',
  'Sports Ground', 'Main Lobby',
  'CS Department', 'EE Department', 'Admin Block',
]

// Location zone mapping for campus map tags
const locationZoneMap: Record<string, string> = {
  'Room 101': 'Academic Block', 'Room 102': 'Academic Block', 'Room 103': 'Academic Block',
  'Room 104': 'Academic Block', 'Room 105': 'Academic Block',
  'Room 201': 'Academic Block', 'Room 202': 'Academic Block', 'Room 203': 'Academic Block',
  'Room 204': 'Academic Block', 'Room 205': 'Academic Block',
  'Room 301': 'Academic Block', 'Room 302': 'Academic Block', 'Room 303': 'Academic Block',
  'Room 304': 'Academic Block', 'Room 310': 'Academic Block',
  'Lab 1': 'Academic Block', 'Lab 2': 'Academic Block', 'Lab 3': 'Academic Block', 'Lab 4': 'Academic Block',
  'CS Department': 'Academic Block', 'EE Department': 'Academic Block', 'Admin Block': 'Academic Block',
  'Library 1st Floor': 'Library', 'Library 2nd Floor': 'Library',
  'Cafeteria': 'Cafeteria',
  'Sports Ground': 'Sports Area',
  'Parking Lot A': 'Parking', 'Parking Lot B': 'Parking',
  'Auditorium': 'Academic Block', 'Main Lobby': 'Academic Block',
}

const zoneColors: Record<string, { bg: string; text: string; border: string }> = {
  'Academic Block': { bg: 'rgba(13, 148, 136, 0.1)', text: '#0D9488', border: 'rgba(13, 148, 136, 0.3)' },
  'Library': { bg: 'rgba(124, 58, 237, 0.1)', text: '#7C3AED', border: 'rgba(124, 58, 237, 0.3)' },
  'Cafeteria': { bg: 'rgba(217, 119, 6, 0.1)', text: '#D97706', border: 'rgba(217, 119, 6, 0.3)' },
  'Sports Area': { bg: 'rgba(5, 150, 105, 0.1)', text: '#059669', border: 'rgba(5, 150, 105, 0.3)' },
  'Parking': { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563EB', border: 'rgba(37, 99, 235, 0.3)' },
}

const darkZoneColors: Record<string, { bg: string; text: string; border: string }> = {
  'Academic Block': { bg: 'rgba(45, 212, 191, 0.18)', text: '#2DD4BF', border: 'rgba(45, 212, 191, 0.3)' },
  'Library': { bg: 'rgba(167, 139, 250, 0.18)', text: '#A78BFA', border: 'rgba(167, 139, 250, 0.3)' },
  'Cafeteria': { bg: 'rgba(251, 191, 36, 0.18)', text: '#FBBF24', border: 'rgba(251, 191, 36, 0.3)' },
  'Sports Area': { bg: 'rgba(52, 211, 153, 0.18)', text: '#34D399', border: 'rgba(52, 211, 153, 0.3)' },
  'Parking': { bg: 'rgba(96, 165, 250, 0.18)', text: '#60A5FA', border: 'rgba(96, 165, 250, 0.3)' },
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'recently-lost', label: 'Recently Lost' },
  { value: 'recently-found', label: 'Recently Found' },
] as const

type SortOption = (typeof sortOptions)[number]['value']

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

// ─── localStorage helpers ───────────────────────────────────────────────────

function getMyReportedItems(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('lf-my-reports') || '[]')
  } catch {
    return []
  }
}

function addMyReportedItem(id: string) {
  if (typeof window === 'undefined') return
  try {
    const existing = getMyReportedItems()
    if (!existing.includes(id)) {
      localStorage.setItem('lf-my-reports', JSON.stringify([...existing, id]))
    }
  } catch { /* ignore */ }
}

function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('lf-recently-viewed') || '[]')
  } catch {
    return []
  }
}

function addRecentlyViewed(id: string) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentlyViewed().filter((eid) => eid !== id)
    localStorage.setItem('lf-recently-viewed', JSON.stringify([id, ...existing].slice(0, 3)))
  } catch { /* ignore */ }
}

function getBookmarkedItems(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('lf-bookmarks') || '[]')
  } catch {
    return []
  }
}

function addBookmark(id: string) {
  if (typeof window === 'undefined') return
  try {
    const existing = getBookmarkedItems()
    if (!existing.includes(id)) {
      localStorage.setItem('lf-bookmarks', JSON.stringify([...existing, id]))
    }
  } catch { /* ignore */ }
}

function removeBookmark(id: string) {
  if (typeof window === 'undefined') return
  try {
    const existing = getBookmarkedItems()
    localStorage.setItem('lf-bookmarks', JSON.stringify(existing.filter((bid) => bid !== id)))
  } catch { /* ignore */ }
}

function getLastVisit(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem('lf-last-visit')
    return v ? parseInt(v, 10) : null
  } catch {
    return null
  }
}

function setLastVisit(ts: number) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('lf-last-visit', ts.toString())
  } catch { /* ignore */ }
}

// View counter helpers
function getViewCount(id: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const counts = JSON.parse(localStorage.getItem('lf-view-counts') || '{}')
    return counts[id] || 0
  } catch {
    return 0
  }
}

function incrementViewCount(id: string) {
  if (typeof window === 'undefined') return
  try {
    const counts = JSON.parse(localStorage.getItem('lf-view-counts') || '{}')
    counts[id] = (counts[id] || 0) + 1
    localStorage.setItem('lf-view-counts', JSON.stringify(counts))
  } catch { /* ignore */ }
}

// Urgent items helpers
function getUrgentItems(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('lf-urgent-items') || '[]')
  } catch {
    return []
  }
}

function setUrgentItem(id: string, urgent: boolean) {
  if (typeof window === 'undefined') return
  try {
    const existing = getUrgentItems()
    if (urgent && !existing.includes(id)) {
      localStorage.setItem('lf-urgent-items', JSON.stringify([...existing, id]))
    } else if (!urgent) {
      localStorage.setItem('lf-urgent-items', JSON.stringify(existing.filter((uid) => uid !== id)))
    }
  } catch { /* ignore */ }
}

// Feedback helpers
function getFeedback(): Record<string, 'helpful' | 'not-helpful'> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('lf-feedback') || '{}')
  } catch {
    return {}
  }
}

function setFeedback(id: string, feedback: 'helpful' | 'not-helpful') {
  if (typeof window === 'undefined') return
  try {
    const existing = getFeedback()
    existing[id] = feedback
    localStorage.setItem('lf-feedback', JSON.stringify(existing))
  } catch { /* ignore */ }
}

// Onboarding check
function isOnboarded(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem('lf-onboarded') === 'true'
  } catch {
    return true
  }
}

function setOnboarded() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('lf-onboarded', 'true')
  } catch { /* ignore */ }
}

// Claims helpers
function getClaims(itemId: string): { description: string; contact: string; timestamp: number }[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(`lf-item-claims-${itemId}`) || '[]')
  } catch {
    return []
  }
}

function addClaim(itemId: string, claim: { description: string; contact: string; timestamp: number }) {
  if (typeof window === 'undefined') return
  try {
    const existing = getClaims(itemId)
    existing.push(claim)
    localStorage.setItem(`lf-item-claims-${itemId}`, JSON.stringify(existing))
  } catch { /* ignore */ }
}

// Comments helpers
function getComments(itemId: string): { text: string; timestamp: number }[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(`lf-item-comments-${itemId}`) || '[]')
  } catch {
    return []
  }
}

function addComment(itemId: string, text: string) {
  if (typeof window === 'undefined') return
  try {
    const existing = getComments(itemId)
    existing.push({ text, timestamp: Date.now() })
    localStorage.setItem(`lf-item-comments-${itemId}`, JSON.stringify(existing))
  } catch { /* ignore */ }
}

// Reward helpers
function getReward(itemId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(`lf-item-reward-${itemId}`)
  } catch {
    return null
  }
}

function setReward(itemId: string, reward: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`lf-item-reward-${itemId}`, reward)
  } catch { /* ignore */ }
}

// Activity feed helpers
interface ActivityItem {
  id: string
  text: string
  emoji: string
  timestamp: number
  type: 'new' | 'resolved' | 'urgent'
}

function getActivityFeed(): ActivityItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('lf-activity-feed') || '[]')
  } catch {
    return []
  }
}

function addActivity(activity: Omit<ActivityItem, 'id'>) {
  if (typeof window === 'undefined') return
  try {
    const existing = getActivityFeed()
    const newActivity = { ...activity, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
    existing.unshift(newActivity)
    // Keep only last 20 activities
    localStorage.setItem('lf-activity-feed', JSON.stringify(existing.slice(0, 20)))
  } catch { /* ignore */ }
}

function generateActivitiesFromItems(items: LostFoundItem[]) {
  if (typeof window === 'undefined' || items.length === 0) return
  try {
    const existing = getActivityFeed()
    const existingIds = new Set(existing.map((a) => a.id))
    const now = Date.now()

    items.filter((i) => !i.isResolved).slice(0, 5).forEach((item) => {
      const actId = `act-item-${item.id}`
      if (!existingIds.has(actId)) {
        const age = now - new Date(item.createdAt).getTime()
        if (age < 7 * 24 * 60 * 60 * 1000) { // Only recent items (< 7 days)
          addActivity({
            text: `${item.type === 'lost' ? 'Lost' : 'Found'}: ${item.title}`,
            emoji: item.type === 'lost' ? '📱' : '🔍',
            timestamp: new Date(item.createdAt).getTime(),
            type: 'new',
            id: actId,
          } as ActivityItem & { id: string })
        }
      }
    })

    const resolved = items.filter((i) => i.isResolved).slice(0, 3)
    resolved.forEach((item) => {
      const actId = `act-resolved-${item.id}`
      if (!existingIds.has(actId)) {
        addActivity({
          text: `Reunited: ${item.title}`,
          emoji: '✅',
          timestamp: new Date(item.updatedAt).getTime(),
          type: 'resolved',
          id: actId,
        } as ActivityItem & { id: string })
      }
    })
  } catch { /* ignore */ }
}

// Notification helpers
interface NotificationItem {
  id: string
  text: string
  timestamp: number
  read: boolean
  type: 'new_item' | 'resolved' | 'claim' | 'urgent'
}

function getNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('lf-notifications') || '[]')
  } catch {
    return []
  }
}

function addNotification(notification: Omit<NotificationItem, 'id'>) {
  if (typeof window === 'undefined') return
  try {
    const existing = getNotifications()
    const newNotif = { ...notification, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
    existing.unshift(newNotif)
    // Keep only last 30 notifications
    localStorage.setItem('lf-notifications', JSON.stringify(existing.slice(0, 30)))
  } catch { /* ignore */ }
}

function markNotificationsRead() {
  if (typeof window === 'undefined') return
  try {
    const existing = getNotifications()
    existing.forEach((n) => { n.read = true })
    localStorage.setItem('lf-notifications', JSON.stringify(existing))
  } catch { /* ignore */ }
}

function getUnreadNotificationCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    return getNotifications().filter((n) => !n.read).length
  } catch {
    return 0
  }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isExpired(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return diff > 30 * 24 * 60 * 60 * 1000
}

function isArchived(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return diff > 60 * 24 * 60 * 60 * 1000
}

function isNewItem(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return diff < 60 * 60 * 1000 // Less than 1 hour
}

function isExpiringSoon(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = diff / (24 * 60 * 60 * 1000)
  return days >= 25 && days <= 30
}

function getZoneForLocation(location: string): string | null {
  // Direct match
  if (locationZoneMap[location]) return locationZoneMap[location]
  // Partial match
  for (const [loc, zone] of Object.entries(locationZoneMap)) {
    if (location.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(location.toLowerCase())) {
      return zone
    }
  }
  return null
}

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
}

function isInRange(dateStr: string, range: DateRange): boolean {
  if (range === 'all') return true
  const d = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (range) {
    case 'today':
      return d >= startOfToday
    case 'week': {
      const weekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    }
    case 'month': {
      const monthAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)
      return d >= monthAgo
    }
    default:
      return true
  }
}

function sortItems(items: LostFoundItem[], sortBy: SortOption, urgentIds?: string[]): LostFoundItem[] {
  const sorted = [...items]
  // Sort urgent items to top first
  if (urgentIds && urgentIds.length > 0) {
    sorted.sort((a, b) => {
      const aUrgent = urgentIds.includes(a.id) ? 0 : 1
      const bUrgent = urgentIds.includes(b.id) ? 0 : 1
      return aUrgent - bUrgent
    })
  }
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        // Urgent first, then by date
        if (urgentIds && urgentIds.length > 0) {
          const aUrgent = urgentIds.includes(a.id) ? 0 : 1
          const bUrgent = urgentIds.includes(b.id) ? 0 : 1
          if (aUrgent !== bUrgent) return aUrgent - bUrgent
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    case 'oldest':
      return sorted.sort((a, b) => {
        if (urgentIds && urgentIds.length > 0) {
          const aUrgent = urgentIds.includes(a.id) ? 0 : 1
          const bUrgent = urgentIds.includes(b.id) ? 0 : 1
          if (aUrgent !== bUrgent) return aUrgent - bUrgent
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
    case 'recently-lost':
      return sorted
        .filter((i) => i.type === 'lost')
        .sort((a, b) => {
          if (urgentIds && urgentIds.length > 0) {
            const aUrgent = urgentIds.includes(a.id) ? 0 : 1
            const bUrgent = urgentIds.includes(b.id) ? 0 : 1
            if (aUrgent !== bUrgent) return aUrgent - bUrgent
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    case 'recently-found':
      return sorted
        .filter((i) => i.type === 'found')
        .sort((a, b) => {
          if (urgentIds && urgentIds.length > 0) {
            const aUrgent = urgentIds.includes(a.id) ? 0 : 1
            const bUrgent = urgentIds.includes(b.id) ? 0 : 1
            if (aUrgent !== bUrgent) return aUrgent - bUrgent
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    default:
      return sorted
  }
}

// ─── Component: Footer (shared) ─────────────────────────────────────────────

function Footer({ onQuickLink }: { onQuickLink?: (action: string) => void }) {
  return (
    <footer
      className="mt-auto pt-8 pb-5 no-print"
      style={{ borderTop: '2px solid var(--color-border)' }}
    >
      {/* Quick Links */}
      {onQuickLink && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => onQuickLink('report')}
            className="text-[10px] font-semibold uppercase tracking-[0.06em] hover:underline transition-colors"
            style={{ color: 'var(--accent-lf)' }}
          >
            Report Item
          </button>
          <span style={{ color: 'var(--color-border)' }}>·</span>
          <button
            onClick={() => onQuickLink('browse-found')}
            className="text-[10px] font-semibold uppercase tracking-[0.06em] hover:underline transition-colors"
            style={{ color: 'var(--accent-af)' }}
          >
            Browse Found
          </button>
          <span style={{ color: 'var(--color-border)' }}>·</span>
          <button
            onClick={() => onQuickLink('browse-lost')}
            className="text-[10px] font-semibold uppercase tracking-[0.06em] hover:underline transition-colors"
            style={{ color: 'var(--accent-ee)' }}
          >
            Browse Lost
          </button>
        </div>
      )}
      <p
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-center mb-1"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        FAST NUCES &middot; Islamabad Campus &middot; Spring 2026
      </p>
      <p
        className="font-mono text-[11px] uppercase tracking-[0.08em] text-center flex items-center justify-center gap-1.5"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Made with &middot;
        <Heart width={12} height={12} style={{ color: 'var(--accent-ee)' }} fill="currentColor" />
        &middot; by FAST students
      </p>
      <p
        className="font-mono text-[9px] uppercase tracking-[0.06em] text-center mt-1"
        style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
      >
        Lost &amp; Found v2.1
      </p>
      {/* Keyboard shortcuts help */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <span className="font-mono text-[9px] flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
          <kbd className="rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', fontSize: '8px' }}>↑↓</kbd>
          Navigate
        </span>
        <span className="font-mono text-[9px] flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
          <kbd className="rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', fontSize: '8px' }}>↵</kbd>
          Open
        </span>
        <span className="font-mono text-[9px] flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
          <kbd className="rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', fontSize: '8px' }}>⌘K</kbd>
          Search
        </span>
        <span className="font-mono text-[9px] flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
          <kbd className="rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', fontSize: '8px' }}>Esc</kbd>
          Back
        </span>
      </div>
    </footer>
  )
}

// ─── Component: AnimatedCounter ──────────────────────────────────────────────

function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + diff * eased))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
    prevTarget.current = target
    return () => { prevTarget.current = target }
  }, [target, duration])

  return <span>{count}</span>
}

// ─── Component: SkeletonCard ────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-start gap-3 pl-2">
        <div className="w-10 h-10 rounded-lg shrink-0 skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-4 w-12 rounded skeleton-shimmer" />
            <div className="h-4 w-16 rounded skeleton-shimmer" />
          </div>
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
          <div className="flex gap-3">
            <div className="h-3 w-20 rounded skeleton-shimmer" />
            <div className="h-3 w-14 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Component: SectionDivider ──────────────────────────────────────────────

function SectionDivider({ color }: { color?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
      <svg width="24" height="8" viewBox="0 0 24 8" fill="none">
        <path
          d="M0 4C4 0 8 8 12 4C16 0 20 8 24 4"
          stroke={color || 'var(--accent-lf)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  )
}

// ─── Component: FeatureCard ─────────────────────────────────────────────────

function FeatureCard({
  feature,
  onClick,
  activeItemCount,
}: {
  feature: (typeof features)[0]
  onClick: () => void
  activeItemCount?: number
}) {
  const Icon = feature.icon
  const accentVar = `var(--accent-${feature.accent})`
  const accentBgVar = `var(--accent-${feature.accent}-bg)`

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="feature-card relative overflow-hidden w-full text-left rounded-2xl bg-[var(--color-bg-raised)] p-4 flex flex-col justify-between transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 group hover:scale-[1.02]"
        style={{
          border: `1.5px solid ${accentVar}`,
          boxShadow: 'var(--shadow-card)',
          aspectRatio: '1/1',
        }}
      >
        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `0 0 20px ${accentVar}33, 0 0 40px ${accentVar}1A`,
          }}
        />
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center relative z-10">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: accentBgVar, color: accentVar }}
          >
            <Icon width={20} height={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span
              className="font-body text-[11px] font-bold uppercase tracking-[0.12em] leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {feature.label}
            </span>
          </div>
        </div>
        {/* Hover hint for Lost & Found */}
        {!feature.external && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity z-10">
            <ChevronRight width={14} height={14} style={{ color: accentVar }} />
          </div>
        )}
        {/* Desktop hover tooltip */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 hidden md:block"
          style={{ whiteSpace: 'nowrap' }}
        >
          <div
            className="rounded-md px-2.5 py-1.5 text-[10px] font-body leading-snug shadow-lg"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              border: `1px solid ${accentVar}`,
              color: 'var(--color-text-secondary)',
            }}
          >
            {feature.desc}
          </div>
          <div
            className="w-2 h-2 rotate-45 mx-auto -mt-1"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderRight: `1px solid ${accentVar}`,
              borderBottom: `1px solid ${accentVar}`,
            }}
          />
        </div>
      </button>
      {/* Active item count badge for Lost & Found */}
      {feature.id === 'lost-found' && activeItemCount !== undefined && activeItemCount > 0 && (
        <div
          className="absolute -top-2 -right-2 z-10 min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 text-[10px] font-bold text-white shadow-md"
          style={{ backgroundColor: 'var(--accent-lf)' }}
        >
          {activeItemCount}
        </div>
      )}
    </div>
  )
}

// ─── Component: OnboardingBanner ──────────────────────────────────────────────

function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  const [currentTip, setCurrentTip] = useState(0)
  const tips = [
    { icon: Camera, text: 'Add photos for faster recovery', emoji: '📸' },
    { icon: Bell, text: 'Mark urgent items for visibility', emoji: '🔔' },
    { icon: MessageCircle, text: 'Share on WhatsApp for wider reach', emoji: '📱' },
  ]

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1)
    }
  }

  const handlePrev = () => {
    if (currentTip > 0) {
      setCurrentTip(currentTip - 1)
    }
  }

  const TipIcon = tips[currentTip].icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="onboarding-banner rounded-xl p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xl shrink-0">{'\uD83D\uDC4B'}</span>
        <div className="flex-1">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Welcome to Lost & Found!
          </p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            Report lost items or help return found belongings to fellow students.
          </p>
        </div>
      </div>
      {/* Tips carousel */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={handlePrev}
          disabled={currentTip === 0}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
          style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
        >
          <ChevronLeft width={12} height={12} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-base shrink-0">{tips[currentTip].emoji}</span>
            <TipIcon width={14} height={14} style={{ color: 'var(--accent-lf)' }} className="shrink-0" />
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {tips[currentTip].text}
            </span>
          </motion.div>
        </AnimatePresence>
        <button
          onClick={handleNext}
          disabled={currentTip === tips.length - 1}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
          style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
        >
          <ChevronRight width={12} height={12} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {tips.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentTip(idx)}
            className={`onboarding-dot ${idx === currentTip ? 'active' : ''}`}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] transition-all hover:scale-[1.05] active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--accent-lf)',
            color: 'white',
          }}
        >
          Got it!
        </button>
      </div>
    </motion.div>
  )
}

// ─── Component: ItemCard ────────────────────────────────────────────────────

function ItemCard({
  item,
  onClick,
  onShare,
  isMyItem,
  isBookmarked,
  onToggleBookmark,
  onQuickAction,
  isUrgent,
  viewCount,
  reward,
  onLocationFilter,
}: {
  item: LostFoundItem
  onClick: () => void
  onShare?: (e: React.MouseEvent, item: LostFoundItem) => void
  isMyItem?: boolean
  isBookmarked?: boolean
  onToggleBookmark?: (e: React.MouseEvent, id: string) => void
  onQuickAction?: (action: string, item: LostFoundItem) => void
  isUrgent?: boolean
  viewCount?: number
  reward?: string
  onLocationFilter?: (zone: string) => void
}) {
  const isLost = item.type === 'lost'
  const expired = isExpired(item.createdAt)
  const archived = isArchived(item.createdAt)
  const expiringSoon = isExpiringSoon(item.createdAt)
  const isNew = isNewItem(item.createdAt)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const zone = getZoneForLocation(item.location)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: item.isResolved ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-xl bg-[var(--color-bg-raised)] p-5 cursor-pointer item-card-hover group relative overflow-hidden ${item.isResolved ? 'hover:opacity-75' : ''} ${archived && !item.isResolved ? 'opacity-50' : ''}`}
      style={{
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-border)',
      }}
      onClick={onClick}
    >
      {/* Colored left border indicator - grows on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 rounded-l-xl transition-all duration-200"
        style={{ backgroundColor: isLost ? 'var(--accent-ee)' : 'var(--accent-af)' }}
      />
      {/* Subtle gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl"
        style={{
          background: isLost
            ? 'linear-gradient(135deg, rgba(225,29,72,0.04) 0%, transparent 60%)'
            : 'linear-gradient(135deg, rgba(5,150,105,0.04) 0%, transparent 60%)',
        }}
      />
      {/* Share icon on hover (desktop) */}
      {onShare && !item.isResolved && (
        <button
          onMouseDown={(e) => onShare(e, item)}
          className="hidden md:block absolute top-2 right-8 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity duration-200 z-20 rounded-md p-1"
          style={{ backgroundColor: 'var(--color-bg-subtle)' }}
          title="Share item"
        >
          <Share2 width={12} height={12} style={{ color: 'var(--accent-lf)' }} />
        </button>
      )}
      {/* Bookmark toggle (desktop) */}
      {onToggleBookmark && !item.isResolved && (
        <button
          onMouseDown={(e) => onToggleBookmark(e, item.id)}
          className="hidden md:block absolute top-2 right-2 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity duration-200 z-20 rounded-md p-1"
          style={{ backgroundColor: isBookmarked ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)' }}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark item'}
        >
          {isBookmarked ? (
            <BookmarkCheck width={12} height={12} style={{ color: 'var(--accent-lf)' }} />
          ) : (
            <Bookmark width={12} height={12} style={{ color: 'var(--color-text-tertiary)' }} />
          )}
        </button>
      )}
      {/* Mobile: Quick action menu (3-dot) */}
      {!item.isResolved && onQuickAction && (
        <div className="md:hidden absolute top-2 right-2 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setShowQuickMenu(!showQuickMenu) }}
            className="rounded-md p-1.5 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: 'var(--color-bg-subtle)' }}
          >
            <MoreHorizontal width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
          <AnimatePresence>
            {showQuickMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-8 rounded-lg shadow-lg overflow-hidden z-30 min-w-[120px]"
                style={{
                  backgroundColor: 'var(--color-bg-raised)',
                  border: '1.5px solid var(--color-border)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { onQuickAction('share', item); setShowQuickMenu(false) }}
                  className="w-full px-3 py-2 text-[11px] font-medium text-left flex items-center gap-2 transition-colors hover:opacity-80 active:scale-[0.98]"
                  style={{ color: 'var(--color-text-primary)', backgroundColor: 'transparent' }}
                >
                  <Share2 width={12} height={12} style={{ color: 'var(--accent-lf)' }} />
                  Share
                </button>
                <button
                  onClick={() => { onQuickAction('bookmark', item); setShowQuickMenu(false) }}
                  className="w-full px-3 py-2 text-[11px] font-medium text-left flex items-center gap-2 transition-colors hover:opacity-80 active:scale-[0.98]"
                  style={{ color: 'var(--color-text-primary)', borderTop: '1px solid var(--color-border)', backgroundColor: 'transparent' }}
                >
                  {isBookmarked ? <BookmarkCheck width={12} height={12} style={{ color: 'var(--accent-lf)' }} /> : <Bookmark width={12} height={12} style={{ color: 'var(--color-text-tertiary)' }} />}
                  {isBookmarked ? 'Unsave' : 'Bookmark'}
                </button>
                <button
                  onClick={() => { onQuickAction('detail', item); setShowQuickMenu(false) }}
                  className="w-full px-3 py-2 text-[11px] font-medium text-left flex items-center gap-2 transition-colors hover:opacity-80 active:scale-[0.98]"
                  style={{ color: 'var(--color-text-primary)', borderTop: '1px solid var(--color-border)', backgroundColor: 'transparent' }}
                >
                  <Eye width={12} height={12} style={{ color: 'var(--accent-cs)' }} />
                  View Details
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Always-visible bookmark indicator */}
      {isBookmarked && !item.isResolved && (
        <div className="absolute top-2 right-2 z-10 group-hover:opacity-0 transition-opacity md:block hidden">
          <BookmarkCheck width={14} height={14} style={{ color: 'var(--accent-lf)' }} />
        </div>
      )}
      <div className="flex items-start gap-3 relative z-10 pl-2">
        {/* Image thumbnail or category icon */}
        {item.imageUrl ? (
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              backgroundColor: isLost ? 'var(--accent-ee-bg)' : 'var(--accent-af-bg)',
            }}
          >
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg"
            style={{
              background: categoryPlaceholders[item.category]?.gradient || categoryPlaceholders.Other.gradient,
            }}
          >
            {categoryPlaceholders[item.category]?.emoji || categoryPlaceholders.Other.emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`category-badge ${
                isLost ? 'type-badge-lost' : 'type-badge-found'
              }`}
            >
              {item.type}
            </span>
            <span className="category-badge" style={{
              backgroundColor: 'var(--accent-lf-bg)',
              color: 'var(--accent-lf)',
            }}>
              {item.category}
            </span>
            {item.isResolved && (
              <span className="category-badge resolved-badge flex items-center gap-1">
                <CheckCircle2 width={10} height={10} />
                resolved
              </span>
            )}
            {isMyItem && (
              <span
                className="category-badge flex items-center gap-0.5"
                style={{
                  backgroundColor: 'var(--accent-cs-bg)',
                  color: 'var(--accent-cs)',
                }}
              >
                <BookmarkCheck width={9} height={9} />
                You
              </span>
            )}
            {expiringSoon && !item.isResolved && !expired && (
              <span
                className="category-badge flex items-center gap-0.5"
                style={{
                  backgroundColor: 'rgba(217,119,6,0.1)',
                  color: '#D97706',
                }}
              >
                <AlertTriangle width={9} height={9} />
                ⚠️ Expiring
              </span>
            )}
            {expired && !item.isResolved && !archived && (
              <span
                className="category-badge flex items-center gap-0.5"
                style={{
                  backgroundColor: 'rgba(217,119,6,0.1)',
                  color: '#D97706',
                }}
              >
                <AlertTriangle width={9} height={9} />
                30+ days
              </span>
            )}
            {archived && !item.isResolved && (
              <span
                className="category-badge flex items-center gap-0.5"
                style={{
                  backgroundColor: 'rgba(107,114,128,0.1)',
                  color: '#6B7280',
                }}
              >
                <Archive width={9} height={9} />
                Archived
              </span>
            )}
            {isUrgent && !item.isResolved && (
              <span
                className="category-badge urgent-badge flex items-center gap-0.5"
                style={{
                  backgroundColor: 'rgba(225, 29, 72, 0.12)',
                  color: 'var(--accent-ee)',
                }}
              >
                <Zap width={9} height={9} />
                URGENT
              </span>
            )}
          </div>
          <h3
            className="font-body text-[15px] font-bold truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.title}
          </h3>
          <p
            className={`text-xs mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity ${descExpanded ? '' : 'line-clamp-2'}`}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {item.description}
          </p>
          {!descExpanded && item.description.length > 80 && (
            <button
              onClick={(e) => { e.stopPropagation(); setDescExpanded(true) }}
              className="text-[10px] font-semibold mt-0.5 hover:underline"
              style={{ color: 'var(--accent-lf)' }}
            >
              Read more
            </button>
          )}
          {descExpanded && (
            <button
              onClick={(e) => { e.stopPropagation(); setDescExpanded(false) }}
              className="text-[10px] font-semibold mt-0.5 hover:underline"
              style={{ color: 'var(--accent-lf)' }}
            >
              Show less
            </button>
          )}
          {/* Reward badge */}
          {reward && (
            <span className="category-badge reward-badge flex items-center gap-0.5 mt-1" style={{ fontSize: '9px' }}>
              💰 {reward}
            </span>
          )}
          {/* Bottom separator line */}
          <div className="h-px w-full my-2" style={{ backgroundColor: 'var(--color-border)', opacity: 0.5 }} />
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              <MapPin width={10} height={10} />
              {item.location}
            </span>
            {/* Location zone tag */}
            {zone && onLocationFilter && (
              <button
                onClick={(e) => { e.stopPropagation(); onLocationFilter(zone) }}
                className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md transition-all hover:scale-[1.05]"
                style={{
                  backgroundColor: zoneColors[zone]?.bg,
                  color: zoneColors[zone]?.text,
                  border: `1px solid ${zoneColors[zone]?.border}`,
                }}
                aria-label={`Filter by ${zone}`}
              >
                <Building2 width={8} height={8} />
                {zone}
              </button>
            )}
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              <Clock width={10} height={10} />
              {formatDate(item.date)}
            </span>
            {/* Prominent time-ago with NEW badge */}
            <span
              className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                color: isLost ? 'var(--accent-ee)' : 'var(--accent-af)',
                backgroundColor: isLost ? 'var(--accent-ee-bg)' : 'var(--accent-af-bg)',
              }}
            >
              {isNew && (
                <span className="new-badge-pulse text-[8px] font-bold px-1 py-0 rounded-sm" style={{ backgroundColor: 'var(--accent-ee)', color: 'white' }}>NEW</span>
              )}
              {timeAgo(item.createdAt)}
            </span>
            {/* View count */}
            {viewCount !== undefined && viewCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                <Eye width={10} height={10} />
                {viewCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Component: ResolveDialog ───────────────────────────────────────────────

function ResolveDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemName: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark as Resolved?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark &ldquo;{itemName}&rdquo; as resolved? This action cannot be undone and the item will be moved to the resolved section.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[var(--accent-af)] text-white hover:opacity-90"
          >
            <CheckCircle2 width={14} height={14} className="inline mr-1 -mt-0.5" />
            Mark Resolved
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Component: ReportForm ──────────────────────────────────────────────────

function ReportForm({
  onSubmit,
  onCancel,
  onSuccess,
  items,
  isUrgentProp,
  onUrgentCreated,
  duplicateWarning,
  onCheckDuplicate,
}: {
  onSubmit: (data: Omit<LostFoundItem, 'id' | 'isResolved' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  onSuccess: () => void
  items: LostFoundItem[]
  isUrgentProp?: boolean
  onUrgentCreated?: (id: string, urgent: boolean) => void
  duplicateWarning?: { title: string; timeAgo: string } | null
  onCheckDuplicate?: (category: string, type: string, title: string) => void
}) {
  const [type, setType] = useState<'lost' | 'found'>('lost')
  const [category, setCategory] = useState('Electronics')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [contactInfo, setContactInfo] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [isUrgent, setUrgent] = useState(false)
  const [offerReward, setOfferReward] = useState(false)
  const [rewardAmount, setRewardAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const { toast } = useToast()

  const getStep = () => {
    if (!type) return 1
    if (!category) return 2
    if (!title.trim() || !description.trim() || !location.trim() || !date) return 3
    if (!contactInfo.trim()) return 4
    return 4
  }
  const currentStep = getStep()
  const steps = [
    { num: 1, label: 'Type' },
    { num: 2, label: 'Category' },
    { num: 3, label: 'Details' },
    { num: 4, label: 'Contact' },
  ]

  const validate = () => {
    const e: Record<string, string> = {}
    if (title.trim().length < 3) e.title = 'Title must be at least 3 characters'
    if (description.trim().length < 5) e.description = 'Description must be at least 5 characters'
    if (location.trim().length < 2) e.location = 'Location is required'
    if (!date) e.date = 'Date is required'
    if (contactInfo.trim().length < 3) e.contactInfo = 'Contact info is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      let finalImageUrl = imageUrl.trim() || null

      if (imageFile) {
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        }
        
        let compressedFile = imageFile
        try {
          compressedFile = await imageCompression(imageFile, compressionOptions)
        } catch (error) {
          console.error("Compression failed, uploading original: ", error)
        }

        const fileExt = compressedFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from('lost_found_images')
          .upload(filePath, compressedFile)

        if (uploadError) {
          console.error("Upload error: ", uploadError)
          toast({
            title: 'Image upload failed',
            description: uploadError.message,
            variant: 'destructive',
          })
        } else if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('lost_found_images')
            .getPublicUrl(filePath)
            
          finalImageUrl = publicUrl
        }
      }

      onSubmit({
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        date: new Date(date).toISOString(),
        contactInfo: contactInfo.trim(),
        imageUrl: finalImageUrl,
      })
      // Note: urgent flag is handled by parent via onUrgentCreated
      // Store reward in localStorage after item is created
      if (offerReward && rewardAmount.trim()) {
        try {
          localStorage.setItem('lf-pending-reward', rewardAmount.trim())
        } catch { /* ignore */ }
      }
      setSubmitted(true)
      toast({
        title: 'Item reported!',
        description: `Your ${type} item has been submitted successfully.${isUrgent ? ' Marked as urgent.' : ''}`,
      })
      setTimeout(() => {
        if (onUrgentCreated) onUrgentCreated('', isUrgent)
        onSuccess()
      }, 1200)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-lg px-3 py-2 text-sm font-body outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--accent-lf)]/30 focus:border-[var(--accent-lf)]'
  const inputStyle = {
    backgroundColor: 'var(--color-bg-subtle)',
    border: '1.5px solid var(--color-border)',
    color: 'var(--color-text-primary)',
  }

  // Smart match suggestions
  const matchType = type === 'lost' ? 'found' : 'lost'
  const matchItems = items
    .filter((i) => !i.isResolved && i.type === matchType && i.category === category)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-af-bg)', color: 'var(--accent-af)' }}
        >
          <CheckCircle2 width={32} height={32} />
        </motion.div>
        <h3 className="font-body text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Item Reported!
        </h3>
        <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Your report has been submitted. Fellow students will see it now.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Progress indicator with clickable steps */}
      <div className="flex items-center gap-0 mb-4">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.num
          const isActive = currentStep === step.num
          return (
            <div key={step.num} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => setWizardStep(step.num)}
                className="flex items-center gap-1.5 flex-1"
              >
                <div
                  className={`shrink-0 flex items-center justify-center font-bold transition-all duration-300 ${
                    isActive ? 'w-7 h-7 text-xs' : isCompleted ? 'w-7 h-7 text-xs' : 'w-7 h-7 text-xs'
                  }`}
                  style={{
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'var(--accent-lf)' : isActive ? 'var(--accent-lf)' : 'transparent',
                    color: isCompleted || isActive ? 'white' : 'var(--color-text-tertiary)',
                    border: isCompleted || isActive
                      ? '2px solid var(--accent-lf)'
                      : '2px dashed var(--color-border)',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 width={14} height={14} />
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.06em] hidden sm:inline"
                  style={{ color: isActive || isCompleted ? 'var(--accent-lf)' : 'var(--color-text-tertiary)' }}
                >
                  {step.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className="h-0.5 flex-1 rounded-full overflow-hidden mx-1 progress-line-fill"
                  style={{ backgroundColor: 'var(--color-border)' }}
                >
                  <div
                    className="h-full rounded-full progress-line-fill"
                    style={{
                      width: isCompleted ? '100%' : '0%',
                      backgroundColor: 'var(--accent-lf)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Step Summary */}
      <div
        className="rounded-lg p-2.5 mb-4 flex items-center gap-3 flex-wrap"
        style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-tertiary)' }}>
          Step {wizardStep}:
        </span>
        {type && (
          <span className={`category-badge ${type === 'lost' ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
            {type}
          </span>
        )}
        {category && (
          <span className="category-badge" style={{ fontSize: '9px', padding: '1px 6px', backgroundColor: 'var(--accent-lf-bg)', color: 'var(--accent-lf)' }}>
            {categoryIcons[category]} {category}
          </span>
        )}
        {title.trim() && (
          <span className="text-[10px] truncate max-w-[120px]" style={{ color: 'var(--color-text-secondary)' }}>
            &ldquo;{title.trim()}&rdquo;
          </span>
        )}
        {location.trim() && (
          <span className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>
            <MapPin width={8} height={8} />
            {location.trim()}
          </span>
        )}
      </div>

      {/* Type Toggle */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Report Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('lost')}
            className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 hover:scale-[1.02] ${type === 'lost' ? 'category-btn-selected' : 'category-btn-unselected'}`}
            style={{
              border: `1.5px solid ${type === 'lost' ? 'var(--accent-ee)' : 'var(--color-border)'}`,
              backgroundColor: type === 'lost' ? 'var(--accent-ee-bg)' : 'var(--color-bg-subtle)',
              color: type === 'lost' ? 'var(--accent-ee)' : 'var(--color-text-secondary)',
            }}
          >
            <AlertCircle width={14} height={14} className="inline mr-1 -mt-0.5" />
            I Lost Something
          </button>
          <button
            type="button"
            onClick={() => setType('found')}
            className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 hover:scale-[1.02] ${type === 'found' ? 'category-btn-selected' : 'category-btn-unselected'}`}
            style={{
              border: `1.5px solid ${type === 'found' ? 'var(--accent-af)' : 'var(--color-border)'}`,
              backgroundColor: type === 'found' ? 'var(--accent-af-bg)' : 'var(--color-bg-subtle)',
              color: type === 'found' ? 'var(--accent-af)' : 'var(--color-text-secondary)',
            }}
          >
            <CheckCircle2 width={14} height={14} className="inline mr-1 -mt-0.5" />
            I Found Something
          </button>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {categories.filter((c) => c !== 'All').map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-all duration-150 hover:scale-[1.02] ${category === cat ? 'category-btn-selected' : 'category-btn-unselected'}`}
              style={{
                border: `1.5px solid ${category === cat ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                backgroundColor: category === cat ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                color: category === cat ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
              }}
            >
              {categoryIcons[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (onCheckDuplicate) onCheckDuplicate(category, type, e.target.value)
          }}
          placeholder="e.g., Black USB drive near Lab 4, Student ID card"
          className={inputCls}
          style={inputStyle}
        />
        {errors.title && <p className="text-xs mt-1" style={{ color: 'var(--accent-ee)' }}>{errors.title}</p>}
        {/* Duplicate Detection Warning */}
        {duplicateWarning && (
          <div className="duplicate-warning rounded-lg p-3 flex items-start gap-2 mt-2">
            <AlertTriangle width={14} height={14} className="shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#D97706' }}>
                Similar item already exists
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                &ldquo;{duplicateWarning.title}&rdquo; — Posted {duplicateWarning.timeAgo}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                You can still submit, but please check if this is the same item.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the item — brand, color, size, distinguishing marks, stickers, etc."
          rows={3}
          className={inputCls + ' resize-none'}
          style={inputStyle}
        />
        {errors.description && <p className="text-xs mt-1" style={{ color: 'var(--accent-ee)' }}>{errors.description}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Room 302, Cafeteria, Parking Lot B, Library 2nd Floor"
          list="campus-locations"
          className={inputCls}
          style={inputStyle}
        />
        <datalist id="campus-locations">
          {campusLocations.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
        {errors.location && <p className="text-xs mt-1" style={{ color: 'var(--accent-ee)' }}>{errors.location}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Date {type === 'lost' ? 'Lost' : 'Found'}
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
        {errors.date && <p className="text-xs mt-1" style={{ color: 'var(--accent-ee)' }}>{errors.date}</p>}
      </div>

      {/* Contact Info */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Contact Info
        </label>
        <input
          type="text"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder="e.g., fa22-bcs-123@isb.nu.edu.pk, or your Instagram @handle"
          className={inputCls}
          style={inputStyle}
        />
        {errors.contactInfo && <p className="text-xs mt-1" style={{ color: 'var(--accent-ee)' }}>{errors.contactInfo}</p>}
      </div>

      {/* Image Upload (optional) */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Image <span style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0])
              }
            }}
            className={inputCls}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Urgent toggle */}
      <div
        className="rounded-lg p-3 flex items-center gap-3"
        style={{
          backgroundColor: isUrgent ? 'rgba(225, 29, 72, 0.08)' : 'var(--color-bg-subtle)',
          border: `1.5px solid ${isUrgent ? 'var(--accent-ee)' : 'var(--color-border)'}`,
        }}
      >
        <Zap
          width={16}
          height={16}
          style={{ color: isUrgent ? 'var(--accent-ee)' : 'var(--color-text-tertiary)' }}
        />
        <div className="flex-1">
          <span className="text-xs font-semibold" style={{ color: isUrgent ? 'var(--accent-ee)' : 'var(--color-text-primary)' }}>
            Mark as Urgent
          </span>
          <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
            Urgent items appear at the top of the list with a special badge
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUrgent(!isUrgent)}
          className="shrink-0 relative w-10 h-5 rounded-full transition-colors duration-200"
          style={{
            backgroundColor: isUrgent ? 'var(--accent-ee)' : 'var(--color-bg-subtle)',
            border: `1.5px solid ${isUrgent ? 'var(--accent-ee)' : 'var(--color-border)'}`,
          }}
        >
          <div
            className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
            style={{
              left: isUrgent ? '20px' : '2px',
              backgroundColor: isUrgent ? 'white' : 'var(--color-text-tertiary)',
            }}
          />
        </button>
      </div>

      {/* Reward toggle */}
      <div
        className="rounded-lg p-3 flex items-center gap-3"
        style={{
          backgroundColor: offerReward ? 'rgba(217, 119, 6, 0.08)' : 'var(--color-bg-subtle)',
          border: `1.5px solid ${offerReward ? '#D97706' : 'var(--color-border)'}`,
        }}
      >
        <span className="text-base">💰</span>
        <div className="flex-1">
          <span className="text-xs font-semibold" style={{ color: offerReward ? '#D97706' : 'var(--color-text-primary)' }}>
            Offer a Reward?
          </span>
          <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
            Incentivize people to help find your item
          </p>
          {offerReward && (
            <input
              type="text"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="e.g., Rs. 500"
              className="mt-2 w-full rounded-md px-3 py-1.5 text-xs outline-none transition-all duration-150 focus:ring-2 focus:ring-[#D97706]/30"
              style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1.5px solid rgba(217,119,6,0.3)', color: 'var(--color-text-primary)' }}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setOfferReward(!offerReward)}
          className="shrink-0 relative w-10 h-5 rounded-full transition-colors duration-200"
          style={{
            backgroundColor: offerReward ? '#D97706' : 'var(--color-bg-subtle)',
            border: `1.5px solid ${offerReward ? '#D97706' : 'var(--color-border)'}`,
          }}
        >
          <div
            className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
            style={{
              left: offerReward ? '20px' : '2px',
              backgroundColor: offerReward ? 'white' : 'var(--color-text-tertiary)',
            }}
          />
        </button>
      </div>

      {/* Smart Match Suggestions */}
      {matchItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles width={12} height={12} style={{ color: 'var(--accent-lf)' }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--accent-lf)' }}>
              Might be a match?
            </span>
          </div>
          <div className="space-y-2">
            {matchItems.map((mItem) => (
              <button
                key={mItem.id}
                type="button"
                onClick={() => {
                  // This won't navigate during form, but shows the match info
                  toast({
                    title: mItem.title,
                    description: `${mItem.type.toUpperCase()} at ${mItem.location} — Contact: ${mItem.contactInfo}`,
                  })
                }}
                className="w-full rounded-lg p-3 text-left transition-all duration-150 hover:shadow-md"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{categoryIcons[mItem.category] || '\uD83D\uDCE6'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {mItem.title}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {mItem.location} &middot; {timeAgo(mItem.createdAt)}
                    </p>
                  </div>
                  <span className={`category-badge ${mItem.type === 'lost' ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                    {mItem.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 hover:scale-[1.02]"
          style={{
            border: '1.5px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-subtle)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Cancel
        </button>
        {wizardStep > 1 && (
          <button
            type="button"
            onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
            className="rounded-lg py-2.5 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 hover:scale-[1.02]"
            style={{
              border: '1.5px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-subtle)',
              color: 'var(--color-text-secondary)',
            }}
          >
            ← Prev
          </button>
        )}
        {wizardStep < 4 && (
          <button
            type="button"
            onClick={() => setWizardStep(Math.min(4, wizardStep + 1))}
            className="rounded-lg py-2.5 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 hover:scale-[1.02]"
            style={{
              border: '1.5px solid var(--accent-lf)',
              backgroundColor: 'var(--accent-lf-bg)',
              color: 'var(--accent-lf)',
            }}
          >
            Next →
          </button>
        )}
        {wizardStep === 4 && (
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 disabled:opacity-50 hover:scale-[1.02]"
            style={{
              border: '1.5px solid var(--accent-lf)',
              backgroundColor: 'var(--accent-lf)',
              color: 'white',
            }}
          >
            {submitting ? 'Submitting...' : `Report ${type === 'lost' ? 'Lost' : 'Found'} Item`}
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Component: ItemDetail ──────────────────────────────────────────────────

function ItemDetail({
  item,
  onBack,
  onResolve,
  isBookmarked,
  onToggleBookmark,
  similarItems,
  onNavigateItem,
}: {
  item: LostFoundItem
  onBack: () => void
  onResolve: (id: string) => void
  isBookmarked?: boolean
  onToggleBookmark?: (id: string) => void
  similarItems?: LostFoundItem[]
  onNavigateItem?: (item: LostFoundItem) => void
}) {
  const isLost = item.type === 'lost'
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const initialViewCount = typeof window !== 'undefined' ? getViewCount(item.id) : 0
  const [viewCount, setViewCount] = useState(initialViewCount)
  const initialFeedback = typeof window !== 'undefined' ? getFeedback()[item.id] : null
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not-helpful' | null>(initialFeedback as 'helpful' | 'not-helpful' | null)
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [claimDescription, setClaimDescription] = useState('')
  const [claimContact, setClaimContact] = useState('')
  const [claims, setClaims] = useState(getClaims(item.id))
  const [comments, setComments] = useState(getComments(item.id))
  const [commentText, setCommentText] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const itemReward = getReward(item.id)
  const { toast } = useToast()
  const itemIdShort = item.id.slice(-8).toUpperCase()

  const handleShare = async () => {
    const text = `\u{1F50D} [${item.type.toUpperCase()}] ${item.title}\n\u{1F4CD} ${item.location}\n\u{1F4C5} ${formatDate(item.date)}\n\u{1F4DD} ${item.description}\n\u{1F4DE} Contact: ${item.contactInfo}\n\nReported on FAST Isb Lost & Found`
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Link copied to clipboard!',
        description: 'Item details have been copied for sharing.',
      })
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`🔍 [${item.type.toUpperCase()}] ${item.title}\n📍 ${item.location}\n📅 ${formatDate(item.date)}\n📝 ${item.description}\n📞 Contact: ${item.contactInfo}\n\nReported on FAST Isb Lost & Found`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleCopyContact = async () => {
    try {
      await navigator.clipboard.writeText(item.contactInfo)
      toast({
        title: 'Contact copied!',
        description: item.contactInfo,
      })
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy contact info.',
        variant: 'destructive',
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    setFeedback(item.id, type)
    setFeedbackGiven(type)
    toast({
      title: type === 'helpful' ? 'Thanks for your feedback!' : 'Feedback noted',
      description: type === 'helpful' ? 'Glad this was helpful!' : 'We\'ll work to improve this.',
    })
  }

  const handleClaimSubmit = () => {
    if (!claimDescription.trim() || !claimContact.trim()) {
      toast({ title: 'Missing info', description: 'Please fill in all fields.', variant: 'destructive' })
      return
    }
    addClaim(item.id, { description: claimDescription.trim(), contact: claimContact.trim(), timestamp: Date.now() })
    setClaims(getClaims(item.id))
    setClaimDescription('')
    setClaimContact('')
    setClaimModalOpen(false)
    toast({ title: 'Claim submitted!', description: 'The reporter will see your claim.' })
  }

  const handleCommentSubmit = () => {
    if (!commentText.trim() || commentText.trim().length > 200) return
    addComment(item.id, commentText.trim())
    setComments(getComments(item.id))
    setCommentText('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5 detail-pattern rounded-2xl p-1"
    >
      {/* Colored header bar */}
      <div
        className="rounded-t-xl h-2"
        style={{ backgroundColor: isLost ? 'var(--accent-ee)' : 'var(--accent-af)' }}
      />

      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-mono uppercase tracking-[0.1em] transition-colors hover:opacity-70 no-print"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <ArrowLeft width={12} height={12} />
        Back to list
      </button>

      {/* Header with gradient background strip */}
      <div className="flex items-center gap-3 relative">
        {/* Gradient strip behind icon */}
        <div
          className="absolute -left-3 -top-3 -bottom-3 w-20 rounded-2xl"
          style={{
            background: isLost
              ? 'linear-gradient(135deg, var(--accent-ee-bg) 0%, transparent 80%)'
              : 'linear-gradient(135deg, var(--accent-af-bg) 0%, transparent 80%)',
          }}
        />
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0 relative shadow-md"
          style={{
            backgroundColor: isLost ? 'var(--accent-ee-bg)' : 'var(--accent-af-bg)',
          }}
        >
          {categoryIcons[item.category] || '\uD83D\uDCE6'}
        </div>
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`category-badge ${isLost ? 'type-badge-lost' : 'type-badge-found'}`}>
              {item.type}
            </span>
            <span className="category-badge" style={{
              backgroundColor: 'var(--accent-lf-bg)',
              color: 'var(--accent-lf)',
            }}>
              {item.category}
            </span>
            {item.isResolved && (
              <span className="category-badge resolved-badge flex items-center gap-1">
                <CheckCircle2 width={10} height={10} />
                resolved
              </span>
            )}
            {/* Item ID reference */}
            <span
              className="text-[9px] font-mono tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              #{itemIdShort}
            </span>
          </div>
          <h2
            className="font-body text-lg font-bold leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.title}
          </h2>
          {/* Reported X ago with Clock icon */}
          <div className="flex items-center gap-1 mt-1">
            <Clock width={10} height={10} style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
              Reported {timeAgo(item.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline indicator */}
      <div
        className="rounded-xl p-4 flex items-center gap-3 no-print"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: isLost ? 'var(--accent-ee)' : 'var(--accent-af)' }}
          />
          <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: '100%',
                backgroundColor: isLost ? 'var(--accent-ee)' : 'var(--accent-af)',
                opacity: 0.5,
              }}
            />
          </div>
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--color-border)' }}
          />
        </div>
        <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
          Reported {timeAgo(item.createdAt)}
        </span>
      </div>

      {/* Image */}
      {item.imageUrl ? (
        <div
          className="rounded-xl overflow-hidden print-area cursor-pointer"
          style={{ border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-48 object-cover rounded-xl hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      ) : (
        <div
          className="rounded-xl h-48 flex items-center justify-center print-area"
          style={{
            background: categoryPlaceholders[item.category]?.gradient || categoryPlaceholders.Other.gradient,
            border: '1px solid var(--color-border)',
          }}
        >
          <span className="text-6xl opacity-60">
            {categoryPlaceholders[item.category]?.emoji || categoryPlaceholders.Other.emoji}
          </span>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && item.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] lightbox-overlay flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              <X width={20} height={20} />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              src={item.imageUrl}
              alt={item.title}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details */}
      <div
        className="rounded-xl p-4 space-y-3 print-area"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Description
          </label>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {item.description}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Location
            </label>
            <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
              <span className="mappin-bounce"><MapPin width={12} height={12} style={{ color: 'var(--accent-lf)' }} /></span>
              {item.location}
            </p>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Date {item.type === 'lost' ? 'Lost' : 'Found'}
            </label>
            <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
              <Clock width={12} height={12} style={{ color: 'var(--accent-lf)' }} />
              {formatDate(item.date)}
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Contact Info
            </label>
            <button
              onClick={handleCopyContact}
              className="mb-1 rounded-md p-0.5 transition-colors hover:opacity-70 no-print"
              style={{ color: 'var(--accent-lf)' }}
              title="Copy contact info"
            >
              <Copy width={10} height={10} />
            </button>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--accent-lf)' }}>
            {item.contactInfo}
          </p>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Reported
          </label>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {timeAgo(item.createdAt)} &middot; {formatDate(item.createdAt)}
          </p>
        </div>
        {/* View count */}
        {viewCount > 0 && (
          <div className="flex items-center gap-1">
            <Eye width={10} height={10} style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
              {viewCount} view{viewCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!item.isResolved && (
        <>
          <div className="flex gap-3 no-print">
            {/* Claim button for found items */}
            {item.type === 'found' && (
              <button
                onClick={() => setClaimModalOpen(true)}
                className="flex-1 rounded-lg py-3 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  border: '1.5px solid #16a34a',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  color: '#16a34a',
                }}
              >
                <Handshake width={14} height={14} />
                Claim
                {claims.length > 0 && (
                  <span className="ml-1 min-w-[18px] h-4 rounded-full flex items-center justify-center px-1 text-[8px] font-bold text-white" style={{ backgroundColor: '#16a34a' }}>
                    {claims.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={handleShare}
              className="rounded-lg py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Share2 width={14} height={14} />
              Share
            </button>
            {/* WhatsApp share button */}
            <button
              onClick={handleWhatsAppShare}
              className="rounded-lg py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid #25D366',
                backgroundColor: 'rgba(37, 211, 102, 0.1)',
                color: '#25D366',
              }}
              title="Share on WhatsApp"
            >
              <MessageCircle width={14} height={14} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            {/* Print button */}
            <button
              onClick={handlePrint}
              className="rounded-lg py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Printer width={14} height={14} />
              Print
            </button>
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(item.id)}
                className="rounded-lg py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  border: `1.5px solid ${isBookmarked ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                  backgroundColor: isBookmarked ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                  color: isBookmarked ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
                }}
              >
                {isBookmarked ? <BookmarkCheck width={14} height={14} /> : <Bookmark width={14} height={14} />}
                {isBookmarked ? 'Saved' : 'Save'}
              </button>
            )}
            <button
              onClick={() => setResolveDialogOpen(true)}
              className="flex-1 rounded-lg py-3 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid #16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                color: '#16a34a',
              }}
            >
              <CheckCircle2 width={14} height={14} />
              Resolve
            </button>
          </div>
          <ResolveDialog
            open={resolveDialogOpen}
            onOpenChange={setResolveDialogOpen}
            onConfirm={() => {
              onResolve(item.id)
              setResolveDialogOpen(false)
            }}
            itemName={item.title}
          />
        </>
      )}

      {/* Share button for resolved items */}
      {item.isResolved && (
        <>
          <div className="flex gap-3 no-print">
            <button
              onClick={handleShare}
              className="flex-1 rounded-lg py-3 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid var(--accent-lf)',
                backgroundColor: 'var(--accent-lf-bg)',
                color: 'var(--accent-lf)',
              }}
            >
              <Share2 width={14} height={14} />
              Share
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="rounded-lg py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid #25D366',
                backgroundColor: 'rgba(37, 211, 102, 0.1)',
                color: '#25D366',
              }}
              title="Share on WhatsApp"
            >
              <MessageCircle width={14} height={14} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="rounded-lg py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Printer width={14} height={14} />
              Print
            </button>
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(item.id)}
                className="rounded-lg py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  border: `1.5px solid ${isBookmarked ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                  backgroundColor: isBookmarked ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                  color: isBookmarked ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
                }}
              >
                {isBookmarked ? <BookmarkCheck width={14} height={14} /> : <Bookmark width={14} height={14} />}
                {isBookmarked ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
          {/* Feedback prompt for resolved items */}
          {!feedbackGiven && (
            <div
              className="rounded-xl p-3 no-print flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-raised)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Was this helpful?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback('helpful')}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all hover:scale-[1.05] active:scale-[0.98]"
                  style={{
                    backgroundColor: 'var(--accent-af-bg)',
                    color: 'var(--accent-af)',
                    border: '1px solid var(--accent-af)33',
                  }}
                >
                  <ThumbsUp width={12} height={12} />
                  Helpful
                </button>
                <button
                  onClick={() => handleFeedback('not-helpful')}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all hover:scale-[1.05] active:scale-[0.98]"
                  style={{
                    backgroundColor: 'var(--accent-ee-bg)',
                    color: 'var(--accent-ee)',
                    border: '1px solid var(--accent-ee)33',
                  }}
                >
                  <ThumbsDown width={12} height={12} />
                  Not helpful
                </button>
              </div>
            </div>
          )}
          {feedbackGiven && (
            <div
              className="rounded-xl p-3 no-print flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-bg-raised)',
                border: '1px solid var(--color-border)',
              }}
            >
              {feedbackGiven === 'helpful' ? (
                <ThumbsUp width={14} height={14} style={{ color: 'var(--accent-af)' }} />
              ) : (
                <ThumbsDown width={14} height={14} style={{ color: 'var(--accent-ee)' }} />
              )}
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {feedbackGiven === 'helpful' ? 'You found this helpful' : 'Feedback noted — we\'ll improve'}
              </span>
            </div>
          )}
        </>
      )}

      {/* Similar Items Section */}
      {onNavigateItem && (
        <div className="no-print">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles width={12} height={12} style={{ color: 'var(--accent-lf)' }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--accent-lf)' }}>
              Similar Items
            </span>
          </div>
          {similarItems && similarItems.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {similarItems.map((sItem) => {
                const sIsLost = sItem.type === 'lost'
                return (
                  <button
                    key={sItem.id}
                    onClick={() => onNavigateItem(sItem)}
                    className="shrink-0 rounded-xl p-3 text-left transition-all duration-150 hover:shadow-md active:scale-[0.98] min-w-[160px]"
                    style={{
                      backgroundColor: 'var(--color-bg-raised)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{categoryIcons[sItem.category] || '\uD83D\uDCE6'}</span>
                      <span className={`category-badge ${sIsLost ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                        {sItem.type}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {sItem.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin width={8} height={8} style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-[9px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                        {sItem.location}
                      </span>
                    </div>
                    <span className="text-[9px] mt-1 block" style={{ color: 'var(--color-text-tertiary)' }}>
                      {timeAgo(sItem.createdAt)}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl p-6 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}>
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, var(--color-text-tertiary) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              <div className="relative z-10">
                <SearchX width={32} height={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }} />
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  No similar items found
                </p>
                <p className="text-[11px] mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                  This is the only {item.category} item reported so far
                </p>
                <button
                  onClick={() => onBack()}
                  className="text-[10px] font-semibold hover:underline"
                  style={{ color: 'var(--accent-lf)' }}
                >
                  Be the first to report a similar item →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claims Section */}
      {claims.length > 0 && (
        <div className="no-print">
          <div className="flex items-center gap-1.5 mb-2">
            <Handshake width={12} height={12} style={{ color: '#16a34a' }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#16a34a' }}>
              Claims ({claims.length})
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {claims.map((claim, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{claim.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--accent-lf)' }}>{claim.contact}</span>
                  <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>{timeAgo(new Date(claim.timestamp).toISOString())}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="no-print">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageCircle width={12} height={12} style={{ color: 'var(--accent-cs)' }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--accent-cs)' }}>
            Comments ({comments.length})
          </span>
        </div>
        {/* Comment input */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 200))}
              placeholder="Ask a question about this item..."
              className="w-full rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--accent-lf)]/30 focus:border-[var(--accent-lf)]"
              style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit() }}
              aria-label="Add a comment"
            />
          </div>
          <button
            onClick={handleCommentSubmit}
            disabled={!commentText.trim()}
            className="rounded-xl px-4 py-2.5 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--accent-lf)', color: 'white', border: '1.5px solid var(--accent-lf)' }}
            aria-label="Send comment"
          >
            <Send width={14} height={14} />
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Send</span>
          </button>
        </div>
        {commentText.length > 170 && (
          <p className="text-[9px] mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
            {200 - commentText.length} characters remaining
          </p>
        )}
        {/* Comments list */}
        {comments.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {(showAllComments ? comments : comments.slice(0, 3)).map((comment, idx) => {
              const initials = comment.text.slice(0, 2).toUpperCase()
              return (
                <div key={idx} className="flex gap-2.5">
                  <div
                    className="comment-avatar"
                    style={{ backgroundColor: 'var(--accent-cs-bg)', color: 'var(--accent-cs)' }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{comment.text}</p>
                    <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {timeAgo(new Date(comment.timestamp).toISOString())}
                    </span>
                  </div>
                </div>
              )
            })}
            {comments.length > 3 && !showAllComments && (
              <button
                onClick={() => setShowAllComments(true)}
                className="text-[10px] font-semibold hover:underline"
                style={{ color: 'var(--accent-cs)' }}
              >
                Show all {comments.length} comments
              </button>
            )}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {claimModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={() => setClaimModalOpen(false)}
          >
            <div className="absolute inset-0 claim-modal-backdrop" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl p-5"
              style={{ backgroundColor: 'var(--color-bg-raised)', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-float)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Handshake width={18} height={18} style={{ color: '#16a34a' }} />
                <h3 className="font-body text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Claim This Item
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
                    How can you identify this item?
                  </label>
                  <textarea
                    value={claimDescription}
                    onChange={(e) => setClaimDescription(e.target.value)}
                    placeholder="Describe identifying details only you would know..."
                    rows={3}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none transition-all duration-150 focus:ring-2 focus:ring-[#16a34a]/30"
                    style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
                    Your contact info
                  </label>
                  <input
                    type="text"
                    value={claimContact}
                    onChange={(e) => setClaimContact(e.target.value)}
                    placeholder="Email or phone number"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[#16a34a]/30"
                    style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setClaimModalOpen(false)}
                    className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-all hover:scale-[1.02]"
                    style={{ border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClaimSubmit}
                    className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-all hover:scale-[1.02]"
                    style={{ border: '1.5px solid #16a34a', backgroundColor: '#16a34a', color: 'white' }}
                  >
                    Submit Claim
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward badge display */}
      {itemReward && (
        <div className="rounded-xl p-3 flex items-center gap-2 no-print" style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}>
          <span className="category-badge reward-badge flex items-center gap-1" style={{ fontSize: '10px' }}>
            💰 {itemReward}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>Reward offered</span>
        </div>
      )}

      {/* Print reference */}
      <div className="print-area hidden">
        <div className="print-ref">REF: #{itemIdShort}</div>
      </div>
    </motion.div>
  )
}

// ─── Component: FilterSidebar (Desktop) ─────────────────────────────────────

function FilterSidebar({
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  showMyReports,
  setShowMyReports,
  showBookmarked,
  setShowBookmarked,
  dateRange,
  setDateRange,
  hasFilters,
  onClearFilters,
  onShareSummary,
}: {
  typeFilter: 'all' | 'lost' | 'found'
  setTypeFilter: (t: 'all' | 'lost' | 'found') => void
  categoryFilter: string
  setCategoryFilter: (c: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  sortBy: SortOption
  setSortBy: (s: SortOption) => void
  showMyReports: boolean
  setShowMyReports: (v: boolean) => void
  showBookmarked: boolean
  setShowBookmarked: (v: boolean) => void
  dateRange: DateRange
  setDateRange: (d: DateRange) => void
  hasFilters: boolean
  onClearFilters: () => void
  onShareSummary: () => void
}) {
  // Collapsible section state - default open/closed as specified
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    type: false,       // default open
    dateRange: false,  // default open
    myItems: true,     // default closed
    category: false,   // default open
  })

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-4">
      {/* Search - Always visible */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{
          backgroundColor: 'var(--color-bg-subtle)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <Search width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="flex-1 bg-transparent text-sm outline-none focus:ring-0"
          style={{ color: 'var(--color-text-primary)' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}>
            <X width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
        )}
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="w-full rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] transition-all duration-150 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.98]"
          style={{
            border: '1.5px solid var(--accent-ee)',
            backgroundColor: 'var(--accent-ee-bg)',
            color: 'var(--accent-ee)',
          }}
        >
          <X width={10} height={10} />
          Clear All Filters
        </button>
      )}

      {/* Section divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Sort - Always visible */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
          <ArrowUpDown width={10} height={10} />
          Sort By
        </label>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] appearance-none cursor-pointer outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--accent-lf)]/30"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ArrowUpDown width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-tertiary)' }} />
        </div>
      </div>

      {/* Section divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Type filter - Collapsible (default open) */}
      <div>
        <button
          onClick={() => toggleSection('type')}
          className="flex items-center justify-between w-full"
        >
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
            <Filter width={10} height={10} />
            Type
          </label>
          <ChevronDown
            width={12}
            height={12}
            className={`transition-transform duration-200 ${collapsedSections.type ? '' : 'rotate-180'}`}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </button>
        <AnimatePresence initial={false}>
          {!collapsedSections.type && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 mt-2 px-1">
                {(['all', 'lost', 'found'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className="rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-all duration-150 text-left hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      border: `1.5px solid ${
                        typeFilter === t
                          ? t === 'lost'
                            ? 'var(--accent-ee)'
                            : t === 'found'
                            ? 'var(--accent-af)'
                            : 'var(--accent-lf)'
                          : 'var(--color-border)'
                      }`,
                      backgroundColor:
                        typeFilter === t
                          ? t === 'lost'
                            ? 'var(--accent-ee-bg)'
                            : t === 'found'
                            ? 'var(--accent-af-bg)'
                            : 'var(--accent-lf-bg)'
                          : 'var(--color-bg-subtle)',
                      color:
                        typeFilter === t
                          ? t === 'lost'
                            ? 'var(--accent-ee)'
                            : t === 'found'
                            ? 'var(--accent-af)'
                            : 'var(--accent-lf)'
                          : 'var(--color-text-secondary)',
                    }}
                  >
                    {t === 'all' ? 'All Items' : t === 'lost' ? 'Lost Items' : 'Found Items'}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Date Range filter - Collapsible (default open) */}
      <div>
        <button
          onClick={() => toggleSection('dateRange')}
          className="flex items-center justify-between w-full"
        >
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
            <Calendar width={10} height={10} />
            Date Range
          </label>
          <ChevronDown
            width={12}
            height={12}
            className={`transition-transform duration-200 ${collapsedSections.dateRange ? '' : 'rotate-180'}`}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </button>
        <AnimatePresence initial={false}>
          {!collapsedSections.dateRange && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 mt-2 px-1">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className="rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-all duration-150 text-left hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      border: `1.5px solid ${dateRange === opt.value ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                      backgroundColor: dateRange === opt.value ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                      color: dateRange === opt.value ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* My Reports + Bookmarked - Collapsible (default closed) */}
      <div>
        <button
          onClick={() => toggleSection('myItems')}
          className="flex items-center justify-between w-full"
        >
          <label className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-tertiary)' }}>
            My Items
          </label>
          <ChevronDown
            width={12}
            height={12}
            className={`transition-transform duration-200 ${collapsedSections.myItems ? '' : 'rotate-180'}`}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </button>
        <AnimatePresence initial={false}>
          {!collapsedSections.myItems && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 mt-2 px-1">
                <button
                  onClick={() => setShowMyReports(!showMyReports)}
                  className="w-full rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-all duration-150 text-left flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    border: `1.5px solid ${showMyReports ? 'var(--accent-cs)' : 'var(--color-border)'}`,
                    backgroundColor: showMyReports ? 'var(--accent-cs-bg)' : 'var(--color-bg-subtle)',
                    color: showMyReports ? 'var(--accent-cs)' : 'var(--color-text-secondary)',
                  }}
                >
                  <BookmarkCheck width={12} height={12} />
                  My Reports
                </button>
                <button
                  onClick={() => setShowBookmarked(!showBookmarked)}
                  className="w-full rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-all duration-150 text-left flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    border: `1.5px solid ${showBookmarked ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                    backgroundColor: showBookmarked ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                    color: showBookmarked ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
                  }}
                >
                  <Bookmark width={12} height={12} />
                  Bookmarked
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Category filter - Collapsible (default open) */}
      <div>
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full"
        >
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
            <Tag width={10} height={10} />
            Category
          </label>
          <ChevronDown
            width={12}
            height={12}
            className={`transition-transform duration-200 ${collapsedSections.category ? '' : 'rotate-180'}`}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </button>
        <AnimatePresence initial={false}>
          {!collapsedSections.category && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 mt-2 px-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className="rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-transform duration-150 text-left hover:translate-x-0.5 active:scale-[0.98]"
                    style={{
                      border: `1.5px solid ${
                        categoryFilter === cat ? 'var(--accent-lf)' : 'var(--color-border)'
                      }`,
                      backgroundColor:
                        categoryFilter === cat ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                      color:
                        categoryFilter === cat
                          ? 'var(--accent-lf)'
                          : 'var(--color-text-secondary)',
                    }}
                  >
                    {cat === 'All' ? 'All Categories' : `${categoryIcons[cat] || '\uD83D\uDCE6'} ${cat}`}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Summary */}
      <div className="pt-2">
        <button
          onClick={onShareSummary}
          className="w-full rounded-md px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] transition-all duration-150 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.98]"
          style={{
            border: '1.5px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-subtle)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <Share2 width={10} height={10} />
          Share Summary
        </button>
      </div>
    </div>
  )
}

// ─── Component: EmptyState ──────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  onReport,
}: {
  hasFilters: boolean
  onReport: () => void
}) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl"
        >
          {'\uD83D\uDD0D'}
        </motion.div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          No items match your filters
        </p>
        <p className="text-xs text-center max-w-[250px]" style={{ color: 'var(--color-text-tertiary)' }}>
          Try adjusting your search or filter criteria to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-12 gap-4">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl"
      >
        {'\uD83C\uDF81'}
      </motion.div>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        No items reported yet
      </p>
      <p className="text-xs text-center max-w-[250px]" style={{ color: 'var(--color-text-tertiary)' }}>
        Be the first to help a fellow student! Report a lost or found item on campus.
      </p>
      <button
        onClick={onReport}
        className="rounded-lg py-2.5 px-5 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 flex items-center gap-2 hover:scale-[1.02]"
        style={{
          border: '1.5px solid var(--accent-lf)',
          backgroundColor: 'var(--accent-lf)',
          color: 'white',
        }}
      >
        <Plus width={14} height={14} />
        Be the first to report!
      </button>
    </div>
  )
}

// ─── Component: QuickSearchModal ────────────────────────────────────────────

function QuickSearchModal({
  open,
  onClose,
  items,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  items: LostFoundItem[]
  onSelect: (item: LostFoundItem) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = query.trim()
    ? items.filter((i) =>
        !i.isResolved && (
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.description.toLowerCase().includes(query.toLowerCase()) ||
          i.location.toLowerCase().includes(query.toLowerCase()) ||
          i.category.toLowerCase().includes(query.toLowerCase())
        )
      )
    : items.filter((i) => !i.isResolved).slice(0, 8)

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          border: '1.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-float)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Search width={18} height={18} style={{ color: 'var(--accent-lf)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lost & found items..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <kbd
            className="hidden sm:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-mono"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            ESC
          </kbd>
        </div>
        {/* Results */}
        <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                No items found
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isLost = item.type === 'lost'
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:opacity-80 outline-none focus:bg-[var(--color-bg-subtle)]"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                    style={{
                      backgroundColor: isLost ? 'var(--accent-ee-bg)' : 'var(--accent-af-bg)',
                    }}
                  >
                    {categoryIcons[item.category] || '\uD83D\uDCE6'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </p>
                    <p className="text-[10px] flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      <span className={`category-badge ${isLost ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                        {item.type}
                      </span>
                      {item.location}
                    </p>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                    {timeAgo(item.createdAt)}
                  </span>
                </button>
              )
            })
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
              <kbd className="rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', fontSize: '8px' }}>
                <Command width={8} height={8} className="inline" />
              </kbd>
              <kbd className="rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', fontSize: '8px' }}>
                K
              </kbd>
              to toggle
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Component: StatsDashboard ──────────────────────────────────────────────

function StatsDashboard({ items }: { items: LostFoundItem[] }) {
  const activeItems = items.filter((i) => !i.isResolved)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const lostThisWeek = activeItems.filter((i) => i.type === 'lost' && new Date(i.createdAt) >= weekAgo).length
  const foundThisWeek = activeItems.filter((i) => i.type === 'found' && new Date(i.createdAt) >= weekAgo).length
  const lostLastWeek = activeItems.filter((i) => i.type === 'lost' && new Date(i.createdAt) >= twoWeeksAgo && new Date(i.createdAt) < weekAgo).length
  const foundLastWeek = activeItems.filter((i) => i.type === 'found' && new Date(i.createdAt) >= twoWeeksAgo && new Date(i.createdAt) < weekAgo).length
  const totalActive = activeItems.length

  const lostTrend = lostLastWeek > 0 ? lostThisWeek - lostLastWeek : 0
  const foundTrend = foundLastWeek > 0 ? foundThisWeek - foundLastWeek : 0

  // Percentage breakdown
  const lostCount = activeItems.filter((i) => i.type === 'lost').length
  const foundCount = activeItems.filter((i) => i.type === 'found').length
  const lostPct = totalActive > 0 ? Math.round((lostCount / totalActive) * 100) : 0
  const foundPct = totalActive > 0 ? Math.round((foundCount / totalActive) * 100) : 0

  // Sparkline data: daily counts for last 7 days
  const getSparklineData = (type: 'all' | 'lost' | 'found'): number[] => {
    const data: number[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const count = activeItems.filter((item) => {
        if (type !== 'all' && item.type !== type) return false
        const created = new Date(item.createdAt)
        return created >= dayStart && created < dayEnd
      }).length
      data.push(count)
    }
    return data
  }

  const SparklineChart = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data, 1)
    const w = 80
    const h = 24
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - (v / max) * (h - 4) - 2
      return `${x},${y}`
    }).join(' ')
    return (
      <svg width={w} height={h} className="shrink-0" aria-hidden="true">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * w
          const y = h - (v / max) * (h - 4) - 2
          return v > 0 ? <circle key={i} cx={x} cy={y} r="1.5" fill={color} opacity="0.5" /> : null
        })}
      </svg>
    )
  }

  const stats = [
    {
      label: 'Active Items',
      value: totalActive,
      icon: Package,
      gradient: 'linear-gradient(135deg, var(--accent-lf-bg), transparent)',
      accent: 'var(--accent-lf)',
      trend: 0,
      sparkData: getSparklineData('all'),
    },
    {
      label: 'Lost This Week',
      value: lostThisWeek,
      icon: AlertCircle,
      gradient: 'linear-gradient(135deg, var(--accent-ee-bg), transparent)',
      accent: 'var(--accent-ee)',
      trend: lostTrend,
      sparkData: getSparklineData('lost'),
    },
    {
      label: 'Found This Week',
      value: foundThisWeek,
      icon: Eye,
      gradient: 'linear-gradient(135deg, var(--accent-af-bg), transparent)',
      accent: 'var(--accent-af)',
      trend: foundTrend,
      sparkData: getSparklineData('found'),
    },
  ]

  // Category distribution mini chart
  const categoryCounts: Record<string, number> = {}
  activeItems.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
  })
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const maxCount = topCategories.length > 0 ? topCategories[0][1] : 1

  // Most common category
  const mostCommonCat = topCategories.length > 0 ? topCategories[0] : null

  return (
    <div className="space-y-3">
      {/* Stats header */}
      <p className="stats-header flex items-center gap-1.5">
        <TrendingUp width={10} height={10} />
        Quick Stats
      </p>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const StatIcon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl p-3 flex flex-col items-center gap-1.5 relative stat-card-hover"
              style={{
                background: stat.gradient,
                border: `1.5px solid ${stat.accent}22`,
                boxShadow: `inset 0 1px 0 ${stat.accent}15`,
              }}
            >
              {/* Colored dot indicator */}
              <div
                className="absolute top-2 left-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: stat.accent }}
              />
              <StatIcon width={16} height={16} style={{ color: stat.accent }} />
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold stat-number stat-glow" style={{ color: stat.accent }}>
                  <AnimatedCounter target={stat.value} />
                </span>
                {/* Trend indicator */}
                {stat.trend !== 0 && (
                  <span className="flex items-center text-[9px] font-bold" style={{ color: stat.trend > 0 ? 'var(--accent-ee)' : 'var(--accent-af)' }}>
                    {stat.trend > 0 ? <ArrowUp width={8} height={8} /> : <ArrowDown width={8} height={8} />}
                    {Math.abs(stat.trend)}
                  </span>
                )}
              </div>
              {/* Sparkline mini chart */}
              {stat.sparkData && <SparklineChart data={stat.sparkData} color={stat.accent.includes('lf') ? '#EA580C' : stat.accent.includes('ee') ? '#E11D48' : '#059669'} />}
              <span
                className="font-mono text-[9px] uppercase tracking-[0.08em] text-center leading-tight"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {stat.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Lost/Found Percentage Split Bar */}
      {totalActive > 0 && (
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: 'var(--color-bg-raised)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-tertiary)' }}>
              Lost vs Found
            </span>
            <span className="text-[10px] font-semibold">
              <span style={{ color: 'var(--accent-ee)' }}>{lostPct}% Lost</span>
              <span style={{ color: 'var(--color-text-tertiary)' }}> / </span>
              <span style={{ color: 'var(--accent-af)' }}>{foundPct}% Found</span>
            </span>
          </div>
          <div className="stats-split-bar">
            <div className="stats-split-bar-lost" style={{ width: `${lostPct}%` }} />
            <div className="stats-split-bar-found" style={{ width: `${foundPct}%` }} />
          </div>
          {/* Most common category */}
          {mostCommonCat && (
            <div className="flex items-center gap-1.5 mt-2">
              <Tag width={10} height={10} style={{ color: categoryAccentColors[mostCommonCat[0]] || '#6B7280' }} />
              <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>Most common:</span>
              <span className="text-[10px] font-semibold" style={{ color: categoryAccentColors[mostCommonCat[0]] || 'var(--color-text-primary)' }}>
                {categoryIcons[mostCommonCat[0]] || '📦'} {mostCommonCat[0]} ({mostCommonCat[1]})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Category Distribution Mini Chart */}
      {topCategories.length > 0 && (
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: 'var(--color-bg-raised)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            className="font-mono text-[9px] uppercase tracking-[0.1em] mb-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Category Distribution
          </p>
          <div className="space-y-1.5">
            {topCategories.map(([cat, count]) => {
              const barWidth = Math.max((count / maxCount) * 100, 15)
              const catColor = categoryAccentColors[cat] || '#6B7280'
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-xs shrink-0 w-5 text-center">{categoryIcons[cat] || '\uD83D\uDCE6'}</span>
                  <span className="text-[9px] font-medium shrink-0 w-16 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {cat}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: catColor,
                        opacity: 0.6 + (count / maxCount) * 0.4,
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-bold shrink-0 w-4 text-right" style={{ color: 'var(--color-text-tertiary)' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Divider between stats and item list */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  )
}

// ─── Component: LostFoundView ───────────────────────────────────────────────

function LostFoundView({
  onBack,
  subView,
  onSubViewChange,
  autoSelectItemId,
}: {
  onBack: () => void
  subView: SubView
  onSubViewChange: (sv: SubView) => void
  autoSelectItemId?: string | null
}) {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])
  const [showResolved, setShowResolved] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showMyReports, setShowMyReports] = useState(false)
  const [showBookmarked, setShowBookmarked] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [myReportedIds, setMyReportedIds] = useState<string[]>([])
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [urgentIds, setUrgentIds] = useState<string[]>([])
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [newSinceVisit, setNewSinceVisit] = useState(0)
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1)
  const [selectedQuickActionItem, setSelectedQuickActionItem] = useState<LostFoundItem | null>(null)
  const [smartSearchResults, setSmartSearchResults] = useState<{ suggestions: { id: string; title: string; type: string; category: string; location: string; createdAt: string }[]; alternatives: string[]; aiSuggestion?: string | null; source?: string } | null>(null)
  const [smartSearchLoading, setSmartSearchLoading] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{ title: string; timeAgo: string } | null>(null)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [locationZoneFilter, setLocationZoneFilter] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
  const activeItemsRef = useRef<LostFoundItem[]>([])
  const { toast } = useToast()

  // Compute active items with all filters (moved before useEffect that references it)
  const activeItems = sortItems(
    items.filter((i) => {
      if (i.isResolved) return false
      if (isArchived(i.createdAt)) return false // Archived items go to separate section
      if (showMyReports && !myReportedIds.includes(i.id)) return false
      if (showBookmarked && !bookmarkedIds.includes(i.id)) return false
      if (!isInRange(i.createdAt, dateRange)) return false
      if (locationZoneFilter) {
        const itemZone = getZoneForLocation(i.location)
        if (itemZone !== locationZoneFilter) return false
      }
      // Local search filter for immediate feedback
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
        )
      }
      return true
    }),
    sortBy,
    urgentIds
  )
  activeItemsRef.current = activeItems

  // Archived items (older than 60 days, not resolved)
  const archivedItems = items.filter((i) => !i.isResolved && isArchived(i.createdAt))

  // Keyboard navigation for item list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (subView !== 'list' || loading) return
      // Don't intercept if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'SELECT') return

      const currentItems = activeItemsRef.current
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedItemIndex((prev) => Math.min(prev + 1, currentItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedItemIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && focusedItemIndex >= 0 && focusedItemIndex < currentItems.length) {
        e.preventDefault()
        openDetail(currentItems[focusedItemIndex])
        setFocusedItemIndex(-1)
      } else if (e.key === 'Escape') {
        setFocusedItemIndex(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [subView, loading, focusedItemIndex])

  // Load localStorage on mount
  useEffect(() => {
    setMyReportedIds(getMyReportedItems())
    setRecentlyViewedIds(getRecentlyViewed())
    setBookmarkedIds(getBookmarkedItems())
    setUrgentIds(getUrgentItems())
    // Load view counts
    try {
      const counts = JSON.parse(localStorage.getItem('lf-view-counts') || '{}')
      setViewCounts(counts)
    } catch { /* ignore */ }
    // Check onboarding
    setShowOnboarding(!isOnboarded())
    // Load activity feed
    setActivityFeed(getActivityFeed())

    // Track new items since last visit
    const lastVisit = getLastVisit()
    setLastVisit(Date.now())
    if (lastVisit) {
      // We'll compute newSinceVisit after items load
    }
  }, [])

  // Handle auto-select from search modal
  useEffect(() => {
    if (autoSelectItemId && items.length > 0) {
      const found = items.find((i) => i.id === autoSelectItemId)
      if (found) {
        setSelectedItem(found)
        addRecentlyViewed(found.id)
        setRecentlyViewedIds(getRecentlyViewed())
        onSubViewChange('detail')
      }
    }
  }, [autoSelectItemId, items, onSubViewChange])

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (categoryFilter !== 'All') params.set('category', categoryFilter)
      if (debouncedSearchQuery) params.set('search', debouncedSearchQuery)

      const res = await fetch(`/api/lost-found?${params.toString()}`)
      const data = await res.json()
      const fetchedItems = data.items || []
      setItems(fetchedItems)

      // Generate activities and notifications from items
      generateActivitiesFromItems(fetchedItems)
      setActivityFeed(getActivityFeed())

      // Generate notifications
      const lastVisit = getLastVisit()
      if (lastVisit) {
        const newItems = fetchedItems.filter(
          (i: LostFoundItem) => !i.isResolved && new Date(i.createdAt).getTime() > lastVisit
        )
        newItems.slice(0, 3).forEach((item: LostFoundItem) => {
          addNotification({
            text: `New ${item.type} item: ${item.title}`,
            timestamp: new Date(item.createdAt).getTime(),
            read: false,
            type: 'new_item',
          })
        })
        const resolved = fetchedItems.filter(
          (i: LostFoundItem) => i.isResolved && new Date(i.updatedAt).getTime() > lastVisit
        )
        resolved.slice(0, 2).forEach((item: LostFoundItem) => {
          addNotification({
            text: `Item reunited: ${item.title}`,
            timestamp: new Date(item.updatedAt).getTime(),
            read: false,
            type: 'resolved',
          })
        })
      }

      // Compute new items since last visit
      if (lastVisit) {
        const newCount = fetchedItems.filter(
          (i: LostFoundItem) => !i.isResolved && new Date(i.createdAt).getTime() > lastVisit
        ).length
        setNewSinceVisit(newCount)
      }
    } catch (err) {
      console.error('Failed to fetch items:', err)
      toast({
        title: 'Error',
        description: 'Failed to load items. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [typeFilter, categoryFilter, debouncedSearchQuery, toast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Smart search: when search query changes and no results, call AI endpoint
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSmartSearchResults(null)
      setSmartSearchLoading(false)
      return
    }
    // Only trigger smart search if local filtering yields no results
    const localResults = activeItems.filter((i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (localResults.length > 0) {
      setSmartSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSmartSearchLoading(true)
      try {
        const res = await fetch('/api/smart-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, items: items.filter((i) => !i.isResolved) }),
        })
        const data = await res.json()
        if (data.suggestions && data.suggestions.length > 0) {
          setSmartSearchResults(data)
        } else {
          setSmartSearchResults(null)
        }
      } catch {
        setSmartSearchResults(null)
      } finally {
        setSmartSearchLoading(false)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [searchQuery, activeItems.length, items])

  // Duplicate detection for report form
  const checkDuplicate = useCallback((cat: string, typ: string, ttl: string) => {
    if (!ttl.trim() || ttl.trim().length < 3) {
      setDuplicateWarning(null)
      return
    }
    const titleLower = ttl.toLowerCase().trim()
    const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 2)
    const found = items.find((i) => {
      if (i.isResolved || i.category !== cat || i.type !== typ) return false
      const iTitleLower = i.title.toLowerCase()
      // Check if titles are very similar
      if (iTitleLower === titleLower) return true
      // Check Levenshtein distance for short titles
      if (titleLower.length < 20 && iTitleLower.length < 20) {
        let dist = 0
        const maxLen = Math.max(titleLower.length, iTitleLower.length)
        for (let k = 0; k < Math.min(titleLower.length, iTitleLower.length); k++) {
          if (titleLower[k] !== iTitleLower[k]) dist++
        }
        dist += Math.abs(titleLower.length - iTitleLower.length)
        if (dist <= 5 && maxLen > 0 && dist / maxLen < 0.4) return true
      }
      // Check key word overlap
      const iWords = iTitleLower.split(/\s+/).filter((w) => w.length > 2)
      const overlap = titleWords.filter((w) => iWords.some((iw) => iw.includes(w) || w.includes(iw)))
      if (overlap.length >= 2 && overlap.length / titleWords.length >= 0.6) return true
      return false
    })
    if (found) {
      setDuplicateWarning({ title: found.title, timeAgo: timeAgo(found.createdAt) })
    } else {
      setDuplicateWarning(null)
    }
  }, [items])

  const handleCreateItem = async (data: Omit<LostFoundItem, 'id' | 'isResolved' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.item?.id) {
          addMyReportedItem(result.item.id)
          setMyReportedIds(getMyReportedItems())
          // Check for pending urgent flag
          try {
            const pendingUrgent = localStorage.getItem('lf-pending-urgent') === 'true'
            if (pendingUrgent) {
              setUrgentItem(result.item.id, true)
              setUrgentIds(getUrgentItems())
              localStorage.removeItem('lf-pending-urgent')
            }
            // Check for pending reward
            const pendingReward = localStorage.getItem('lf-pending-reward')
            if (pendingReward) {
              setReward(result.item.id, pendingReward)
              localStorage.removeItem('lf-pending-reward')
            }
          } catch { /* ignore */ }
        }
        onSubViewChange('list')
        fetchItems()
      } else {
        const err = await res.json()
        toast({
          title: 'Error',
          description: err.error || 'Failed to create item',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Failed to create item:', err)
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUrgentCreated = (id: string, urgent: boolean) => {
    if (id) {
      setUrgentItem(id, urgent)
      setUrgentIds(getUrgentItems())
    } else {
      // Item not yet created, store as pending
      localStorage.setItem('lf-pending-urgent', urgent ? 'true' : 'false')
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/lost-found/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true }),
      })
      if (res.ok) {
        if (selectedItem?.id === id) {
          setSelectedItem({ ...selectedItem, isResolved: true })
        }
        fetchItems()
        toast({
          title: 'Item resolved',
          description: 'The item has been marked as resolved.',
        })
      }
    } catch (err) {
      console.error('Failed to resolve item:', err)
      toast({
        title: 'Error',
        description: 'Failed to resolve item. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const openDetail = (item: LostFoundItem) => {
    setSelectedItem(item)
    addRecentlyViewed(item.id)
    incrementViewCount(item.id)
    setRecentlyViewedIds(getRecentlyViewed())
    // Update view counts state
    try {
      const counts = JSON.parse(localStorage.getItem('lf-view-counts') || '{}')
      setViewCounts(counts)
    } catch { /* ignore */ }
    onSubViewChange('detail')
  }

  const handleShareItem = (e: React.MouseEvent, item: LostFoundItem) => {
    e.stopPropagation()
    const text = `\u{1F50D} [${item.type.toUpperCase()}] ${item.title}\n\u{1F4CD} ${item.location}\n\u{1F4C5} ${formatDate(item.date)}\n\u{1F4DD} ${item.description}\n\u{1F4DE} Contact: ${item.contactInfo}\n\nReported on FAST Isb Lost & Found`
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Link copied to clipboard!',
        description: 'Item details have been copied for sharing.',
      })
    }).catch(() => {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      })
    })
  }

  const handleToggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const current = getBookmarkedItems()
    if (current.includes(id)) {
      removeBookmark(id)
    } else {
      addBookmark(id)
    }
    setBookmarkedIds(getBookmarkedItems())
  }

  const handleToggleBookmarkDetail = (id: string) => {
    const current = getBookmarkedItems()
    if (current.includes(id)) {
      removeBookmark(id)
    } else {
      addBookmark(id)
    }
    setBookmarkedIds(getBookmarkedItems())
  }

  const handleClearFilters = () => {
    setTypeFilter('all')
    setCategoryFilter('All')
    setSearchQuery('')
    setShowMyReports(false)
    setShowBookmarked(false)
    setDateRange('all')
    setSortBy('newest')
    setLocationZoneFilter(null)
  }

  // Handle location zone filter
  const handleLocationFilter = (zone: string) => {
    setLocationZoneFilter(locationZoneFilter === zone ? null : zone)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShareSummary = () => {
    const active = items.filter((i) => !i.isResolved)
    const lost = active.filter((i) => i.type === 'lost')
    const found = active.filter((i) => i.type === 'found')
    let text = `FAST Isb Lost & Found Summary\n${active.length} active items (${lost.length} lost, ${found.length} found)\n\n`
    active.forEach((item, idx) => {
      text += `${idx + 1}. [${item.type.toUpperCase()}] ${item.title}\n   Location: ${item.location} | Date: ${formatDate(item.date)}\n`
    })
    text += '\nReported on FAST Isb Lost & Found'
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Summary copied!',
        description: `${active.length} active items copied to clipboard.`,
      })
    }).catch(() => {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy summary.',
        variant: 'destructive',
      })
    })
  }

  // Quick action handler for mobile
  const handleQuickAction = (action: string, item: LostFoundItem) => {
    if (action === 'share') {
      handleShareItem({ stopPropagation: () => {} } as React.MouseEvent, item)
    } else if (action === 'bookmark') {
      handleToggleBookmark({ stopPropagation: () => {} } as React.MouseEvent, item.id)
    } else if (action === 'detail') {
      openDetail(item)
    }
  }

  // Quick action bar item selection for mobile
  const handleQuickActionSelect = (item: LostFoundItem) => {
    setSelectedQuickActionItem(selectedQuickActionItem?.id === item.id ? null : item)
  }

  // Similar items for detail view
  const getSimilarItems = (item: LostFoundItem): LostFoundItem[] => {
    return items
      .filter((i) => !i.isResolved && i.id !== item.id && i.category === item.category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }

  // Navigate to similar item from detail view
  const handleNavigateSimilarItem = (item: LostFoundItem) => {
    setSelectedItem(item)
    addRecentlyViewed(item.id)
    setRecentlyViewedIds(getRecentlyViewed())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // activeItems is computed above (before keyboard useEffect)

  const resolvedItems = items.filter((i) => {
    if (!i.isResolved) return false
    if (showMyReports && !myReportedIds.includes(i.id)) return false
    if (showBookmarked && !bookmarkedIds.includes(i.id)) return false
    if (locationZoneFilter) {
      const itemZone = getZoneForLocation(i.location)
      if (itemZone !== locationZoneFilter) return false
    }
    return true
  })
  const resolvedCount = items.filter((i) => i.isResolved).length

  const hasFilters = searchQuery !== '' || typeFilter !== 'all' || categoryFilter !== 'All' || showMyReports || showBookmarked || dateRange !== 'all' || locationZoneFilter !== null
  const filterCount = [
    searchQuery !== '',
    typeFilter !== 'all',
    categoryFilter !== 'All',
    showMyReports,
    showBookmarked,
    dateRange !== 'all',
    locationZoneFilter !== null,
  ].filter(Boolean).length

  // Recently viewed items
  const recentlyViewedItems = recentlyViewedIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is LostFoundItem => !!i && !i.isResolved)
    .slice(0, 3)

  // Recently added items (for carousel)
  const recentlyAddedItems = [...items]
    .filter((i) => !i.isResolved)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Mobile filter panel
  const MobileFilterPanel = () => (
    <AnimatePresence>
      {showFilters && (
        <>
          {/* Frosted glass backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 filter-backdrop md:hidden"
            onClick={() => setShowFilters(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto custom-scrollbar"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderTop: '2px solid var(--accent-lf)',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
            <div className="space-y-4">
          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] transition-all duration-150 flex items-center justify-center gap-1.5"
              style={{
                border: '1.5px solid var(--accent-ee)',
                backgroundColor: 'var(--accent-ee-bg)',
                color: 'var(--accent-ee)',
              }}
            >
              <X width={10} height={10} />
              Clear All Filters
            </button>
          )}

          {/* Sort */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Sort By
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] appearance-none cursor-pointer outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--accent-lf)]/30"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
          </div>

          {/* Date Range (mobile) */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Date Range
            </label>
            <div className="flex flex-wrap gap-1.5">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className="rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-all duration-150 active:scale-[0.98]"
                  style={{
                    border: `1.5px solid ${dateRange === opt.value ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                    backgroundColor: dateRange === opt.value ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                    color: dateRange === opt.value ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Type
            </label>
            <div className="flex gap-1.5">
              {(['all', 'lost', 'found'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className="rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] transition-all duration-150 active:scale-[0.98]"
                  style={{
                    border: `1.5px solid ${
                      typeFilter === t
                        ? t === 'lost'
                          ? 'var(--accent-ee)'
                          : t === 'found'
                          ? 'var(--accent-af)'
                          : 'var(--accent-lf)'
                        : 'var(--color-border)'
                    }`,
                    backgroundColor:
                      typeFilter === t
                        ? t === 'lost'
                          ? 'var(--accent-ee-bg)'
                          : t === 'found'
                          ? 'var(--accent-af-bg)'
                          : 'var(--accent-lf-bg)'
                        : 'var(--color-bg-subtle)',
                    color:
                      typeFilter === t
                        ? t === 'lost'
                          ? 'var(--accent-ee)'
                          : t === 'found'
                          ? 'var(--accent-af)'
                          : 'var(--accent-lf)'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {t === 'all' ? 'All' : t === 'lost' ? 'Lost' : 'Found'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-transform duration-150 hover:translate-x-0.5 active:scale-[0.98]"
                  style={{
                    border: `1.5px solid ${
                      categoryFilter === cat ? 'var(--accent-lf)' : 'var(--color-border)'
                    }`,
                    backgroundColor:
                      categoryFilter === cat ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                    color:
                      categoryFilter === cat
                        ? 'var(--accent-lf)'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {cat === 'All' ? 'All' : `${categoryIcons[cat] || '\uD83D\uDCE6'} ${cat}`}
                </button>
              ))}
            </div>
          </div>
          {/* My Reports toggle (mobile) */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowMyReports(!showMyReports)}
              className="flex-1 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              style={{
                border: `1.5px solid ${showMyReports ? 'var(--accent-cs)' : 'var(--color-border)'}`,
                backgroundColor: showMyReports ? 'var(--accent-cs-bg)' : 'var(--color-bg-subtle)',
                color: showMyReports ? 'var(--accent-cs)' : 'var(--color-text-secondary)',
              }}
            >
              <BookmarkCheck width={12} height={12} />
              My Reports
            </button>
            <button
              onClick={() => setShowBookmarked(!showBookmarked)}
              className="flex-1 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              style={{
                border: `1.5px solid ${showBookmarked ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                backgroundColor: showBookmarked ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                color: showBookmarked ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
              }}
            >
              <Bookmark width={12} height={12} />
              Bookmarked
            </button>
          </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  const renderItemsList = (isMobile: boolean) => {
    if (loading) {
      return (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )
    }

    return (
      <>
        {/* Onboarding Banner - Enhanced with tips */}
        {showOnboarding && (
          <OnboardingBanner onDismiss={() => { setShowOnboarding(false); setOnboarded() }} />
        )}

        {/* Activity Feed Ticker */}
        {activityFeed.length > 0 && !loading && (
          <div className="rounded-xl p-3 flex items-center gap-3 overflow-hidden" style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}>
            <Activity width={14} height={14} className="shrink-0" style={{ color: 'var(--accent-lf)' }} />
            <div className="flex-1 overflow-hidden relative h-5">
              <AnimatePresence mode="wait">
                {activityFeed.slice(0, 3).map((act, idx) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: idx === 0 ? 1 : 0.4, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, delay: idx * 0.3 }}
                    className="absolute left-0 right-0 flex items-center gap-2 truncate"
                    style={{ top: `${idx * 16}px` }}
                  >
                    <span className="text-xs shrink-0">{act.emoji}</span>
                    <span className="text-[11px] truncate" style={{ color: idx === 0 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                      {act.text}
                    </span>
                    <span className="text-[9px] shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                      {timeAgo(new Date(act.timestamp).toISOString())}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Location Zone Filter Banner */}
        {locationZoneFilter && (
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: zoneColors[locationZoneFilter]?.bg, border: `1.5px solid ${zoneColors[locationZoneFilter]?.border}` }}>
            <Building2 width={14} height={14} style={{ color: zoneColors[locationZoneFilter]?.text }} />
            <span className="text-xs font-semibold" style={{ color: zoneColors[locationZoneFilter]?.text }}>
              Showing items in: {locationZoneFilter}
            </span>
            <button
              onClick={() => setLocationZoneFilter(null)}
              className="ml-auto rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-[1.05]"
              style={{ backgroundColor: 'var(--color-bg-raised)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              Clear
            </button>
          </div>
        )}

        {/* New items since last visit banner */}
        {newSinceVisit > 0 && (
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{
              backgroundColor: 'var(--accent-cy-bg)',
              border: '1.5px solid var(--accent-cy)33',
            }}
          >
            <TrendingUp width={16} height={16} style={{ color: 'var(--accent-cy)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent-cy)' }}>
                {newSinceVisit} new item{newSinceVisit !== 1 ? 's' : ''} since your last visit
              </p>
            </div>
          </div>
        )}

        {/* Success Stories Banner - Enhanced dark mode */}
        {resolvedCount > 0 && (
          <div
            className="rounded-xl p-3 flex items-center gap-3 success-banner-glow"
            style={{
              backgroundColor: 'var(--accent-af-bg)',
              border: '1.5px solid var(--accent-af)33',
              borderLeft: '4px solid var(--accent-af)',
            }}
          >
            <PartyPopper width={20} height={20} className="shrink-0" style={{ color: 'var(--accent-af)' }} />
            <div>
              <p className="text-xs font-semibold success-banner-text">
                {resolvedCount} item{resolvedCount !== 1 ? 's' : ''} reunited!
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                Keep reporting — it works!
              </p>
            </div>
          </div>
        )}

        {/* Recently Added Carousel */}
        {!loading && recentlyAddedItems.length > 0 && !showMyReports && !showBookmarked && (
          <div>
            <p
              className="font-mono text-[9px] uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Sparkles width={10} height={10} />
              Recently Added
            </p>
            <div className="relative carousel-container">
              <div className="flex gap-3 overflow-x-auto carousel-scroll pb-2">
                {recentlyAddedItems.map((item) => {
                  const isLost = item.type === 'lost'
                  const itemReward = getReward(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => openDetail(item)}
                      className="shrink-0 rounded-xl p-3 text-left transition-all duration-150 hover:shadow-md active:scale-[0.98] min-w-[200px]"
                      style={{
                        backgroundColor: 'var(--color-bg-raised)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Mini placeholder image */}
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0"
                          style={{ background: categoryPlaceholders[item.category]?.gradient || categoryPlaceholders.Other.gradient }}
                        >
                          {categoryPlaceholders[item.category]?.emoji || categoryPlaceholders.Other.emoji}
                        </div>
                        <span className={`category-badge ${isLost ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                          {item.type}
                        </span>
                        {itemReward && (
                          <span className="category-badge reward-badge" style={{ fontSize: '7px', padding: '1px 3px' }}>💰</span>
                        )}
                        <span className="text-[8px] font-mono ml-auto shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin width={8} height={8} style={{ color: 'var(--color-text-tertiary)' }} />
                        <span className="text-[9px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                          {item.location}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {/* Desktop arrow buttons */}
              <button
                onClick={() => {
                  const el = document.querySelector('.carousel-scroll')
                  if (el) el.scrollBy({ left: -220, behavior: 'smooth' })
                }}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full items-center justify-center shadow-md z-10 hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-bg-raised)', border: '1.5px solid var(--color-border)' }}
              >
                <ChevronLeft width={14} height={14} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector('.carousel-scroll')
                  if (el) el.scrollBy({ left: 220, behavior: 'smooth' })
                }}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full items-center justify-center shadow-md z-10 hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-bg-raised)', border: '1.5px solid var(--color-border)' }}
              >
                <ChevronRightIcon width={14} height={14} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            <SectionDivider />
          </div>
        )}

        {/* AI Smart Search Results */}
        {smartSearchLoading && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}>
            <Sparkles width={14} height={14} style={{ color: 'var(--accent-lf)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>AI is thinking</span>
            <span className="flex gap-0.5">
              <span className="ai-thinking-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-lf)' }} />
              <span className="ai-thinking-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-lf)' }} />
              <span className="ai-thinking-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-lf)' }} />
            </span>
          </div>
        )}
        {smartSearchResults && !smartSearchLoading && (
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <Sparkles width={12} height={12} style={{ color: 'var(--accent-lf)' }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--accent-lf)' }}>
                No exact matches found. AI suggests:
              </span>
            </div>
            {smartSearchResults.suggestions.slice(0, 3).map((sug) => {
              const sugItem = items.find((i) => i.id === sug.id)
              return sugItem ? (
                <button
                  key={sug.id}
                  onClick={() => openDetail(sugItem)}
                  className="w-full rounded-lg p-3 text-left transition-all duration-150 hover:shadow-md"
                  style={{ backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{categoryIcons[sug.category] || '\uD83D\uDCE6'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {sug.title}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {sug.location} &middot; {timeAgo(sug.createdAt)}
                      </p>
                    </div>
                    <span className={`category-badge ${sug.type === 'lost' ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                      {sug.type}
                    </span>
                  </div>
                </button>
              ) : null
            })}
            {smartSearchResults.alternatives && smartSearchResults.alternatives.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>Try searching:</span>
                {smartSearchResults.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(alt)}
                    className="rounded-md px-2 py-0.5 text-[9px] font-semibold transition-all hover:scale-[1.05]"
                    style={{
                      backgroundColor: 'var(--accent-lf-bg)',
                      color: 'var(--accent-lf)',
                      border: '1px solid var(--accent-lf)33',
                    }}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            )}
            {smartSearchResults.aiSuggestion && (
              <p className="text-[10px] italic" style={{ color: 'var(--color-text-tertiary)' }}>
                💡 {smartSearchResults.aiSuggestion}
              </p>
            )}
          </div>
        )}

        {/* Recently Viewed */}
        {!isMobile && recentlyViewedItems.length > 0 && !showMyReports && !showBookmarked && (
          <div className="mb-4">
            <p
              className="font-mono text-[9px] uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Clock width={10} height={10} />
              Recently Viewed
            </p>
            <div className="flex gap-2">
              {recentlyViewedItems.map((item) => {
                const isLost = item.type === 'lost'
                return (
                  <button
                    key={item.id}
                    onClick={() => openDetail(item)}
                    className="flex-1 rounded-lg p-2.5 text-left transition-all duration-150 hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{categoryIcons[item.category] || '\uD83D\uDCE6'}</span>
                      <span className={`category-badge ${isLost ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </p>
                    <p className="text-[9px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                      {item.location}
                    </p>
                  </button>
                )
              })}
            </div>
            <SectionDivider />
          </div>
        )}

        {activeItems.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onReport={() => onSubViewChange('report')} />
        ) : (
          <AnimatePresence>
            {activeItems.map((item, idx) => (
              <div
                key={item.id}
                className={`relative ${focusedItemIndex === idx ? 'kb-focused-item rounded-xl' : ''}`}
              >
                <ItemCard
                  item={item}
                  onClick={() => openDetail(item)}
                  onShare={handleShareItem}
                  isMyItem={myReportedIds.includes(item.id)}
                  isBookmarked={bookmarkedIds.includes(item.id)}
                  onToggleBookmark={handleToggleBookmark}
                  onQuickAction={handleQuickAction}
                  isUrgent={urgentIds.includes(item.id)}
                  viewCount={viewCounts[item.id] || 0}
                  onLocationFilter={handleLocationFilter}
                />
                {focusedItemIndex === idx && (
                  <div className="kb-focused-tooltip">Press Enter to view</div>
                )}
              </div>
            ))}
          </AnimatePresence>
        )}

        {/* Archived Items Section */}
        {archivedItems.length > 0 && !showMyReports && !showBookmarked && (
          <div className="mt-6">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 mb-3 group"
            >
              <ChevronDown
                width={14}
                height={14}
                className={`transition-transform duration-200 ${showArchived ? 'rotate-180' : ''}`}
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <Archive width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Archived Items ({archivedItems.length}) — older than 60 days
              </span>
            </button>
            <AnimatePresence>
              {showArchived && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  {archivedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={() => openDetail(item)}
                      isMyItem={myReportedIds.includes(item.id)}
                      isBookmarked={bookmarkedIds.includes(item.id)}
                      onToggleBookmark={handleToggleBookmark}
                      onQuickAction={handleQuickAction}
                      isUrgent={urgentIds.includes(item.id)}
                      viewCount={viewCounts[item.id] || 0}
                      onLocationFilter={handleLocationFilter}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Recently Resolved Section */}
        {resolvedItems.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="flex items-center gap-2 mb-3 group"
            >
              <ChevronDown
                width={14}
                height={14}
                className={`transition-transform duration-200 ${showResolved ? 'rotate-180' : ''}`}
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Recently Resolved ({resolvedItems.length})
              </span>
            </button>
            <AnimatePresence>
              {showResolved && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  {resolvedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={() => openDetail(item)}
                      isMyItem={myReportedIds.includes(item.id)}
                      isBookmarked={bookmarkedIds.includes(item.id)}
                      onToggleBookmark={handleToggleBookmark}
                      onQuickAction={handleQuickAction}
                      isUrgent={urgentIds.includes(item.id)}
                      viewCount={viewCounts[item.id] || 0}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {subView === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Section title & description */}
          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2"
              style={{ color: 'var(--accent-lf)' }}
            >
              Lost & Found
            </p>
            <h2
              className="font-body text-xl md:text-2xl font-bold leading-tight mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Reunite students with their belongings
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Report items you&apos;ve lost or found on campus. Help fellow students recover their belongings quickly.
            </p>
            {/* Hero CTA Button */}
            <button
              onClick={() => { onSubViewChange('report'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="mt-4 rounded-xl py-3 px-6 text-xs font-bold uppercase tracking-[0.1em] transition-all duration-150 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cta-pulse-btn"
              style={{
                border: '1.5px solid var(--accent-lf)',
                backgroundColor: 'var(--accent-lf)',
                color: 'white',
              }}
            >
              <Plus width={14} height={14} />
              Report an Item
            </button>
          </div>

          {/* Quick Stats Dashboard */}
          {!loading && <StatsDashboard items={items} />}

          <SectionDivider />

          {/* Mobile: Search, Sort & Filter Bar */}
          <div className="flex gap-2 md:hidden">
            <div
              className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1.5px solid var(--color-border)',
              }}
            >
              <Search width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="flex-1 bg-transparent text-sm outline-none focus:ring-0"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative rounded-lg px-3 py-2 transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: showFilters ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                border: `1.5px solid ${showFilters ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                color: showFilters ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
              }}
            >
              <Filter width={14} height={14} />
              {hasFilters && filterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                  style={{ backgroundColor: 'var(--accent-lf)' }}
                >
                  {filterCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filter Panel */}
          <MobileFilterPanel />

          {/* Report button - desktop shimmer, mobile sticky pill */}
          <button
            onClick={() => onSubViewChange('report')}
            className="hidden md:inline-flex btn-shimmer rounded-xl py-3 px-6 text-xs font-bold uppercase tracking-[0.1em] transition-all duration-150 items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              border: '1.5px solid var(--accent-lf)',
              backgroundColor: 'var(--accent-lf)',
              color: 'white',
            }}
          >
            <Plus width={14} height={14} />
            Report an Item
          </button>

          {/* Mobile: Sticky report pill at bottom */}
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
            <button
              onClick={() => onSubViewChange('report')}
              className="w-full rounded-full py-3 px-6 text-xs font-bold uppercase tracking-[0.1em] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{
                border: '1.5px solid var(--accent-lf)',
                backgroundColor: 'var(--accent-lf)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(234, 88, 12, 0.3)',
              }}
            >
              <Plus width={14} height={14} />
              Report an Item
            </button>
          </div>

          {/* Desktop Layout: Sidebar + Items */}
          <div className="hidden md:flex gap-6">
            {/* Desktop Sidebar */}
            <div className="w-56 shrink-0">
              <div
                className="rounded-xl p-4 sticky top-20"
                style={{
                  backgroundColor: 'var(--color-bg-raised)',
                  border: '1.5px solid var(--color-border)',
                }}
              >
                <FilterSidebar
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  showMyReports={showMyReports}
                  setShowMyReports={setShowMyReports}
                  showBookmarked={showBookmarked}
                  setShowBookmarked={setShowBookmarked}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  hasFilters={hasFilters}
                  onClearFilters={handleClearFilters}
                  onShareSummary={handleShareSummary}
                />
              </div>
            </div>

            {/* Desktop Main Content */}
            <div className="flex-1 min-w-0 space-y-4">
              {renderItemsList(false)}
            </div>
          </div>

          {/* Mobile: Items list */}
          <div className="space-y-4 max-h-[calc(100vh-600px)] overflow-y-auto custom-scrollbar pr-1 pb-20 md:hidden md:pb-0">
            {/* Recently Viewed (mobile) */}
            {recentlyViewedItems.length > 0 && !showMyReports && !showBookmarked && !loading && (
              <div>
                <p
                  className="font-mono text-[9px] uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <Clock width={10} height={10} />
                  Recently Viewed
                </p>
                <div className="flex gap-2">
                  {recentlyViewedItems.map((item) => {
                    const isLost = item.type === 'lost'
                    return (
                      <button
                        key={item.id}
                        onClick={() => openDetail(item)}
                        className="flex-1 rounded-lg p-2.5 text-left transition-all duration-150 hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--color-bg-subtle)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{categoryIcons[item.category] || '\uD83D\uDCE6'}</span>
                          <span className={`category-badge ${isLost ? 'type-badge-lost' : 'type-badge-found'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {item.title}
                        </p>
                        <p className="text-[9px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                          {item.location}
                        </p>
                      </button>
                    )
                  })}
                </div>
                <SectionDivider />
              </div>
            )}
            {loading && items.length === 0 ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : activeItems.length === 0 && resolvedItems.length === 0 && !loading ? (
              <EmptyState hasFilters={hasFilters} onReport={() => onSubViewChange('report')} />
            ) : activeItems.length === 0 && !loading ? (
              <EmptyState hasFilters={hasFilters} onReport={() => onSubViewChange('report')} />
            ) : (
              <AnimatePresence>
                {activeItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`relative ${focusedItemIndex === idx ? 'kb-focused-item rounded-xl' : ''}`}
                  >
                    <ItemCard
                      item={item}
                      onClick={() => openDetail(item)}
                      onShare={handleShareItem}
                      isMyItem={myReportedIds.includes(item.id)}
                      isBookmarked={bookmarkedIds.includes(item.id)}
                      onToggleBookmark={handleToggleBookmark}
                      onQuickAction={handleQuickAction}
                      isUrgent={urgentIds.includes(item.id)}
                      viewCount={viewCounts[item.id] || 0}
                    />
                    {focusedItemIndex === idx && (
                      <div className="kb-focused-tooltip">Press Enter to view</div>
                    )}
                  </div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}

      {/* Detail View */}
      {subView === 'detail' && selectedItem && (
        <ItemDetail
          item={selectedItem}
          onBack={() => { onSubViewChange('list'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          onResolve={handleResolve}
          isBookmarked={bookmarkedIds.includes(selectedItem.id)}
          onToggleBookmark={handleToggleBookmarkDetail}
          similarItems={getSimilarItems(selectedItem)}
          onNavigateItem={handleNavigateSimilarItem}
        />
      )}

      {/* Report Form */}
      {subView === 'report' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="mb-4">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2"
              style={{ color: 'var(--accent-lf)' }}
            >
              Report Item
            </p>
            <h2
              className="font-body text-lg font-bold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Help the community
            </h2>
          </div>
          <ReportForm
            onSubmit={handleCreateItem}
            onCancel={() => { onSubViewChange('list'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onSuccess={() => { onSubViewChange('list'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            items={items}
            onUrgentCreated={handleUrgentCreated}
            duplicateWarning={duplicateWarning}
            onCheckDuplicate={checkDuplicate}
          />
        </motion.div>
      )}

      {/* Mobile Quick Action Bar */}
      <AnimatePresence>
        {selectedQuickActionItem && subView === 'list' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 quick-action-bar"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderTop: '2px solid var(--accent-lf)',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center justify-around py-3 px-2">
              <button
                onClick={() => handleQuickAction('share', selectedQuickActionItem)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-[0.95]"
                style={{ color: 'var(--accent-lf)' }}
              >
                <Share2 width={18} height={18} />
                <span className="text-[9px] font-semibold uppercase">Share</span>
              </button>
              <button
                onClick={() => handleQuickAction('bookmark', selectedQuickActionItem)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-[0.95]"
                style={{ color: bookmarkedIds.includes(selectedQuickActionItem.id) ? 'var(--accent-lf)' : 'var(--color-text-tertiary)' }}
              >
                {bookmarkedIds.includes(selectedQuickActionItem.id) ? <BookmarkCheck width={18} height={18} /> : <Bookmark width={18} height={18} />}
                <span className="text-[9px] font-semibold uppercase">{bookmarkedIds.includes(selectedQuickActionItem.id) ? 'Saved' : 'Save'}</span>
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`🔍 [${selectedQuickActionItem.type.toUpperCase()}] ${selectedQuickActionItem.title}\n📍 ${selectedQuickActionItem.location}\n📞 Contact: ${selectedQuickActionItem.contactInfo}\n\nFAST Isb Lost & Found`)
                  window.open(`https://wa.me/?text=${text}`, '_blank')
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-[0.95]"
                style={{ color: '#25D366' }}
              >
                <MessageCircle width={18} height={18} />
                <span className="text-[9px] font-semibold uppercase">WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  if (!selectedQuickActionItem.isResolved) {
                    setResolveDialogOpen(true)
                  }
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-[0.95]"
                style={{ color: 'var(--accent-af)' }}
              >
                <CheckCircle2 width={18} height={18} />
                <span className="text-[9px] font-semibold uppercase">Resolve</span>
              </button>
              <button
                onClick={() => setSelectedQuickActionItem(null)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-[0.95]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <X width={18} height={18} />
                <span className="text-[9px] font-semibold uppercase">Close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolve Dialog for Quick Action Bar */}
      <ResolveDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        onConfirm={() => {
          if (selectedQuickActionItem) {
            handleResolve(selectedQuickActionItem.id)
            setSelectedQuickActionItem(null)
          }
          setResolveDialogOpen(false)
        }}
        itemName={selectedQuickActionItem?.title || ''}
      />
    </div>
  )
}

// ─── Component: NotificationBell ─────────────────────────────────────────────

function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotifications(getNotifications())
    setUnreadCount(getUnreadNotificationCount())
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showNotifications])

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => {
          setShowNotifications(!showNotifications)
          if (!showNotifications && unreadCount > 0) {
            markNotificationsRead()
            setUnreadCount(0)
            setNotifications(getNotifications())
          }
        }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          backgroundColor: unreadCount > 0 ? 'rgba(234, 88, 12, 0.12)' : 'var(--color-bg-subtle)',
          border: `1.5px solid ${unreadCount > 0 ? 'rgba(234, 88, 12, 0.3)' : 'var(--color-border)'}`,
          color: unreadCount > 0 ? 'var(--accent-lf)' : 'var(--color-text-tertiary)',
        }}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        role="button"
      >
        <Bell width={16} height={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 text-[8px] font-bold text-white urgent-badge"
            style={{ backgroundColor: 'var(--accent-ee)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-72 rounded-xl overflow-hidden z-50 notification-dropdown shadow-lg"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              border: '1.5px solid var(--color-border)',
            }}
            role="region"
            aria-label="Notifications"
          >
            <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-tertiary)' }}>
                Recent Updates
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    try { localStorage.removeItem('lf-notifications') } catch { /* ignore */ }
                    setNotifications([])
                    setUnreadCount(0)
                  }}
                  className="text-[9px] font-semibold hover:underline"
                  style={{ color: 'var(--accent-lf)' }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-6 text-center">
                  <Bell width={20} height={20} className="mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)', opacity: 0.4 }} />
                  <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 8).map((notif) => (
                  <div
                    key={notif.id}
                    className="px-3 py-2.5 flex items-start gap-2 transition-colors"
                    style={{
                      backgroundColor: notif.read ? 'transparent' : 'var(--accent-lf-bg)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span className="text-xs shrink-0 mt-0.5">
                      {notif.type === 'new_item' ? '📱' : notif.type === 'resolved' ? '✅' : notif.type === 'urgent' ? '⚡' : '🙋'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] leading-snug" style={{ color: notif.read ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}>
                        {notif.text}
                      </p>
                      <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {timeAgo(new Date(notif.timestamp).toISOString())}
                      </span>
                    </div>
                    {!notif.read && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--accent-lf)' }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LostFoundPage() {
  const router = useRouter()
  const [subView, setSubView] = useState<SubView>('list')
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchSelectedItemId, setSearchSelectedItemId] = useState<string | null>(null)
  const [newItemCount, setNewItemCount] = useState(0)

  // Fetch active item count for badge + cache items for search + new items tracking
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/lost-found')
        const data = await res.json()
        const items = data.items || []

        // Track new items since last visit
        const lastVisit = getLastVisit()
        if (lastVisit) {
          const newCount = items.filter(
            (i: LostFoundItem) => !i.isResolved && new Date(i.createdAt).getTime() > lastVisit
          ).length
          setNewItemCount(newCount)
        }
      } catch {
        // Silently fail
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchModalOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false)
      }
      // Escape to go back from detail/report
      if (e.key === 'Escape' && !searchModalOpen && subView !== 'list') {
        setSubView('list')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchModalOpen, subView])

  const handleBack = useCallback(() => {
    if (subView !== 'list') {
      setSubView('list')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/')
    }
  }, [subView, router])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
        style={{ backgroundColor: 'var(--accent-lf)', color: 'white' }}
      >
        Skip to content
      </a>

      {/* Animations & custom styles */}
      <style>{`
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .pulse-new-badge {
          animation: pulse-badge 2s ease-in-out infinite;
        }
        @keyframes new-badge-pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .new-badge-pulse {
          animation: new-badge-pulse-anim 1.5s ease-in-out infinite;
        }
      `}</style>

      <Header rightActions={<NotificationBell />}>
        <div className="flex flex-1 items-center gap-2 md:gap-3 w-full max-w-full min-w-0">
          <button
            onClick={handleBack}
            aria-label="Back"
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 shrink-0 -ml-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Search width={18} height={18} className="hidden sm:block text-[var(--color-text-tertiary)] shrink-0" />
            <span className="font-mono text-sm font-medium text-[var(--color-text-primary)] truncate">
              {subView === 'detail' ? 'Item Details' : subView === 'report' ? 'Report Item' : 'Lost & Found'}
            </span>
            {newItemCount > 0 && subView === 'list' && (
              <span
                className="ml-1 min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-1 text-[7px] font-bold text-white shrink-0"
                style={{ backgroundColor: 'var(--accent-ee)' }}
              >
                {newItemCount}
              </span>
            )}
          </div>
        </div>
      </Header>

      <div
        id="main-content"
        className="flex flex-col flex-1 px-5 pt-4 pb-4 max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto w-full"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <LostFoundView
          onBack={handleBack}
          subView={subView}
          onSubViewChange={setSubView}
          autoSelectItemId={searchSelectedItemId}
        />
        <Footer onQuickLink={(action) => {
          if (action === 'report') {
            setSubView('report')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } else if (action === 'browse-found' || action === 'browse-lost') {
            setSubView('list')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }} />
        
        {/* Bottom padding for scroll-past nav bar */}
        <div className="h-[180px] shrink-0" />
      </div>
    </div>
  )
}

