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
  ShieldCheck,
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
  LayoutGrid,
  List,
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
type ViewMode = 'grid' | 'list'

interface LostFoundItem {
  id: string
  type: 'lost' | 'found'
  category: string
  title: string
  description: string
  location: string
  handoffNote?: string
  structuredLocation?: {
    custodian: string
    building: string
    floor: string
    specific_area: string
    status: 'static' | 'custodial'
  }
  date: string
  contactInfo: string
  isResolved: boolean
  resolvedBy?: string
  imageUrl: string | null
  resolutionImageUrl?: string | null
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
  Clothing: '\uD83D\uDC55',
  Keys: '\uD83D\uDD11',
  Bags: '\uD83C\uDF92',
  Books: '\uD83D\uDCD3',
  Other: '\uD83D\uDCE6',
}

const categoryExamples: Record<string, string> = {
  Electronics: 'Phone, AirBuds, Laptop, Charger',
  Documents: 'ID Card, Wallet, CNIC, File',
  Accessories: 'Glasses, Watch, Ring, Keychain',
  Clothing: 'Jacket, Hoodie, Cap, Sweater',
  Keys: 'Car keys, Room keys',
  Bags: 'Backpack, Laptop bag, Pouch',
  Books: 'Textbook, Notebook, Register',
  Other: 'Water bottle, Lunch box, Umbrella',
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
  viewMode = 'list',
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
  viewMode?: 'grid' | 'list'
}) {
  const isLost = item.type === 'lost'
  const expired = isExpired(item.createdAt)
  const archived = isArchived(item.createdAt)
  const expiringSoon = isExpiringSoon(item.createdAt)
  const isNew = isNewItem(item.createdAt)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const zone = getZoneForLocation(item.location)

  // Reporter names placeholders (since they aren't in the DB schema yet)
  const reporters = ['Jane D.', 'Ali R.', 'Sara K.', 'Hamza A.', 'Zoe M.', 'Usman T.']
  const reporterName = reporters[item.id.charCodeAt(0) % reporters.length]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: item.isResolved ? 0.6 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 group relative overflow-hidden bg-[var(--color-bg-raised)] border border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] hover:shadow-lg ${viewMode === 'grid' ? 'flex flex-col h-full' : 'flex items-center gap-4'}`}
      onClick={onClick}
    >
      {/* Type indicator vertical bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: isLost ? 'var(--accent-ee)' : 'var(--accent-af)' }}
      />

      {/* Thumbnail */}
      <div
        className={`shrink-0 rounded-xl overflow-hidden shadow-sm relative ${viewMode === 'grid' ? 'w-full aspect-[4/3] mb-3' : 'w-24 h-24 md:w-32 md:h-32'}`}
        style={{ backgroundColor: 'var(--color-bg-subtle)' }}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-3xl"
            style={{
              background: categoryPlaceholders[item.category]?.gradient || categoryPlaceholders.Other.gradient,
            }}
          >
            {categoryPlaceholders[item.category]?.emoji || categoryPlaceholders.Other.emoji}
          </div>
        )}
        
        {/* Mobile quick badges over image */}
        <div className="absolute top-2 left-2 flex gap-1">
           <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider text-white shadow-sm ${isLost ? 'bg-[var(--accent-ee)]' : 'bg-[var(--accent-af)]'}`}>
            {item.type}
          </span>
        </div>

        {/* Bookmark button */}
        {onToggleBookmark && (
          <button
            onMouseDown={(e) => { e.stopPropagation(); onToggleBookmark(e, item.id) }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isBookmarked ? (
              <BookmarkCheck width={14} height={14} className="text-[var(--accent-lf)]" />
            ) : (
              <Bookmark width={14} height={14} className="text-[var(--color-text-tertiary)]" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-body text-[16px] md:text-lg font-bold truncate tracking-tight text-[var(--color-text-primary)]">
              {item.title}
            </h3>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider hidden md:inline-block ${isLost ? 'bg-[var(--accent-ee)]/10 text-[var(--accent-ee)]' : 'bg-[var(--accent-af)]/10 text-[var(--accent-af)]'}`}>
              {item.type}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] shrink-0">
            {timeAgo(item.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[var(--color-text-secondary)] text-[11px] font-medium">
          <span className="flex items-center gap-1">
            <MapPin width={12} height={12} className="text-[var(--color-text-tertiary)]" />
            {item.location}
          </span>
          <span className="flex items-center gap-1">
            <Package width={12} height={12} className="text-[var(--color-text-tertiary)]" />
            {item.category}
          </span>
        </div>

        <p className={`text-xs text-[var(--color-text-secondary)] mt-1 ${descExpanded ? '' : 'line-clamp-1'}`}>
          {item.description}
        </p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center border border-[var(--color-border)]">
              <User width={10} height={10} className="text-[var(--color-text-tertiary)]" />
            </div>
            <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{reporterName}</span>
          </div>
          
          <div className="flex items-center gap-2">
             {isUrgent && !item.isResolved && (
                <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-[var(--accent-ee)] bg-[var(--accent-ee)]/10 px-1.5 py-0.5 rounded-md animate-pulse">
                  Urgent
                </span>
              )}
              {reward && (
                <span className="text-[10px] font-bold text-[var(--accent-lf)]">💰 {reward}</span>
              )}
              <ChevronRight width={14} height={14} className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
  const [handoffNote, setHandoffNote] = useState('')
  const [processingLocation, setProcessingLocation] = useState(false)
  const [structuredLocation, setStructuredLocation] = useState<LostFoundItem['structuredLocation']>(undefined)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [contactInfo, setContactInfo] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [isUrgent, setUrgent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const { toast } = useToast()

  const getStep = () => {
    if (!type) return 1
    if (!category) return 2
    if (!title.trim() || !description.trim() || (type === 'lost' && !location.trim()) || (type === 'found' && !handoffNote.trim()) || !date) return 3
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
    if (type === 'found' && !handoffNote.trim()) e.handoffNote = 'Please tell us where the item is now'
    if (type === 'lost' && !location.trim()) e.location = 'Location is required'
    if (!date) e.date = 'Date is required'
    if (contactInfo.trim().length < 3) e.contactInfo = 'Contact info is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    let finalLocation = location.trim()
    let finalStructured = structuredLocation

    // If it's a found item, process the handoff note with AI
    if (type === 'found' && handoffNote.trim()) {
      setProcessingLocation(true)
      try {
        const res = await fetch('/api/lost-found/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: handoffNote }),
        })
        const data = await res.json()
        if (data.structured) {
          finalStructured = data.structured
          // Construct a human-readable location string from AI results
          const s = data.structured
          finalLocation = `${s.custodian !== 'None' ? s.custodian : ''} ${s.building !== 'None' ? `at ${s.building}` : ''} ${s.specific_area !== 'None' ? `(${s.specific_area})` : ''}`.trim() || 'Campus'
        }
      } catch (err) {
        console.error('AI processing failed:', err)
        finalLocation = 'Campus (Handed over)'
      } finally {
        setProcessingLocation(false)
      }
    }

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
        location: finalLocation,
        handoffNote: handoffNote.trim() || undefined,
        structuredLocation: finalStructured,
        date: new Date(date).toISOString(),
        contactInfo: contactInfo.trim(),
        imageUrl: finalImageUrl,
      })
      
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.filter((c) => c !== 'All').map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-xl p-3 text-left transition-all duration-150 hover:scale-[1.02] flex flex-col gap-1 ${category === cat ? 'category-btn-selected' : 'category-btn-unselected'}`}
              style={{
                border: `1.5px solid ${category === cat ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                backgroundColor: category === cat ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                boxShadow: category === cat ? '0 4px 12px -2px var(--accent-lf-bg)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{categoryIcons[cat]}</span>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: category === cat ? 'var(--accent-lf)' : 'var(--color-text-primary)' }}>
                  {cat}
                </span>
              </div>
              <p className="text-[8px] leading-tight opacity-60 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                {categoryExamples[cat]}
              </p>
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

      {/* Location / Handoff Note */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          {type === 'lost' ? 'Where was it lost?' : 'Where is the item now?'}
        </label>
        {type === 'lost' ? (
          <>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Cafeteria, Library, LRC, C303 etc"
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
          </>
        ) : (
          <div className="space-y-1">
            <textarea
              value={handoffNote}
              onChange={(e) => setHandoffNote(e.target.value)}
              placeholder="e.g., I gave it to the guard at the back gate, or Left it at the EE office counter"
              rows={2}
              className={inputCls + ' resize-none'}
              style={inputStyle}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] opacity-70" style={{ color: 'var(--color-text-tertiary)' }}>
                Write in natural language. AI will extract structured location.
              </p>
              {processingLocation && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--accent-lf)] animate-pulse">
                  <Loader2 width={10} height={10} className="animate-spin" />
                  AI Processing...
                </div>
              )}
            </div>
            {errors.handoffNote && <p className="text-xs mt-1" style={{ color: 'var(--accent-ee)' }}>{errors.handoffNote}</p>}
          </div>
        )}
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
          placeholder="e.g., i23xxxx@isb.nu.edu.pk or +92 xxx-xxxxxxx"
          className={inputCls}
          style={inputStyle}
        />
        {errors.contactInfo && <p className="text-xs mt-1" style={{ color: 'var(--accent-ee)' }}>{errors.contactInfo}</p>}
      </div>

      {/* Image Upload (with Camera) */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
          Image / Snapshot <span style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:bg-black/5" style={{ color: 'var(--color-text-secondary)' }}>
            <Camera width={14} height={14} />
            Take a Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]) }}
              className="hidden"
            />
          </label>
          <label className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:bg-black/5" style={{ color: 'var(--color-text-secondary)' }}>
            <Search width={14} height={14} />
            Browse Gallery
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]) }}
              className="hidden"
            />
          </label>
        </div>
        {imageFile && (
          <p className="text-[9px] mt-2 font-bold text-[var(--accent-lf)] flex items-center gap-1">
            <CheckCircle2 width={10} height={10} />
            Selected: {imageFile.name.slice(0, 20)}...
          </p>
        )}
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
  onResolve: (id: string, resolutionImageUrl?: string) => void
  isBookmarked?: boolean
  onToggleBookmark?: (id: string) => void
  similarItems?: LostFoundItem[]
  onNavigateItem?: (item: LostFoundItem) => void
}) {
  const isLost = item.type === 'lost'
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not-helpful' | null>(null)
  const [claims, setClaims] = useState<{ id: string; claimer_id: string; created_at: string }[]>([])
  const [claiming, setClaiming] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationImage, setVerificationImage] = useState<File | null>(null)
  const [verificationResult, setVerificationResult] = useState<{ match: boolean; confidence: number; reasoning?: string } | null>(null)
  const [showVerifyFlow, setShowVerifyFlow] = useState(false)
  const [comments, setComments] = useState(getComments(item.id))
  const [commentText, setCommentText] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const { toast } = useToast()
  const itemIdShort = item.id.slice(-8).toUpperCase()
  
  const myId = typeof window !== 'undefined' ? (localStorage.getItem('lf-user-id') || 'anon-' + Math.random().toString(36).slice(2, 9)) : ''
  const isClaimant = claims.some(c => c.claimer_id === myId)
  const isReporter = typeof window !== 'undefined' && getMyReportedItems().includes(item.id)

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch(`/api/lost-found/${item.id}`)
      const data = await res.json()
      // In the real app, data.item.claims would be populated via Supabase join
      if (data.item?.claims) setClaims(data.item.claims)
    } catch (err) { console.error('Failed to fetch claims:', err) }
  }, [item.id])

  useEffect(() => {
    fetchClaims()
    if (typeof window !== 'undefined') {
      const counts = JSON.parse(localStorage.getItem('lf-view-counts') || '{}')
      setViewCount(counts[item.id] || 0)
      if (!localStorage.getItem('lf-user-id')) localStorage.setItem('lf-user-id', myId)
      const feedback = getFeedback()
      setFeedbackGiven(feedback[item.id] as 'helpful' | 'not-helpful' | null)
    }
  }, [item.id, fetchClaims, myId])

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const res = await fetch(`/api/lost-found/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimerId: myId, action: 'claim' }),
      })
      if (res.ok) {
        toast({ title: 'Collection Scheduled!', description: 'You are now marked as a claimant. Please pick up the item and verify possession.' })
        fetchClaims()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to register claim.', variant: 'destructive' })
    } finally {
      setClaiming(false)
    }
  }

  const handleVerifyAndResolve = async () => {
    if (!verificationImage) return
    setVerifying(true)
    try {
      // 1. Compress and prepare image
      const compressionOptions = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true }
      const compressed = await imageCompression(verificationImage, compressionOptions)
      const base64 = await fileToBase64(compressed)

      // 2. Call AI Verify API
      const verifyRes = await fetch('/api/lost-found/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          originalImageUrl: item.imageUrl, 
          resolutionImageBase64: base64 
        }),
      })
      
      const result = await verifyRes.json()
      setVerificationResult(result)

      if (result.match && result.confidence > 80) {
        // 3. Upload resolution image to storage
        const fileExt = compressed.name.split('.').pop()
        const fileName = `resolved-${item.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('lost_found_images').upload(fileName, compressed)
        if (uploadError) throw new Error('Upload failed')
        const { data: { publicUrl } } = supabase.storage.from('lost_found_images').getPublicUrl(fileName)

        toast({ title: 'Verification Success!', description: 'AI confirmed possession. Marking as resolved.' })
        onResolve(item.id, publicUrl)
        setShowVerifyFlow(false)
      } else {
        toast({ title: 'Verification Failed', description: result.reasoning || 'Item does not match original report.', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'Verification process failed.', variant: 'destructive' })
    } finally {
      setVerifying(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = error => reject(error)
    })
  }

  const handleShare = async () => {
    const text = `🔍 [${item.type.toUpperCase()}] ${item.title}\n📍 ${item.location}\n📅 ${formatDate(item.date)}\n📝 ${item.description}\n📞 Contact: ${item.contactInfo}\n\nReported on FAST Isb Lost & Found`
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
        className="rounded-xl p-4 space-y-4 print-area"
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

        {/* AI Structured Location */}
        {item.handoffNote && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-2" style={{ color: 'var(--accent-lf)' }}>
              AI Location Handoff Note
            </label>
            <p className="text-xs italic mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              &quot;{item.handoffNote}&quot;
            </p>
            {item.structuredLocation && (
              <div className="flex flex-wrap gap-2">
                {item.structuredLocation.custodian !== 'None' && (
                  <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-af-bg)] text-[var(--accent-af)] border border-[var(--accent-af)]/20">
                    Custodian: {item.structuredLocation.custodian}
                  </span>
                )}
                {item.structuredLocation.building !== 'None' && (
                  <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-ee-bg)] text-[var(--accent-ee)] border border-[var(--accent-ee)]/20">
                    Building: {item.structuredLocation.building}
                  </span>
                )}
                {item.structuredLocation.specific_area !== 'None' && (
                  <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
                    Area: {item.structuredLocation.specific_area}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]">
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
      </div>

      {/* Action buttons */}
      {!item.isResolved && (
        <div className="space-y-4 no-print">
          <div className="flex flex-wrap gap-2">
            {/* Primary Action: Claim/Verify for Found items */}
            {item.type === 'found' && (
              <>
                {!isClaimant ? (
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl"
                    style={{ backgroundColor: 'var(--accent-lf)', color: 'white' }}
                  >
                    {claiming ? <Loader2 className="animate-spin" width={14} height={14} /> : <Handshake width={14} height={14} />}
                    Schedule Collection (Claim)
                    {claims.length > 0 && (
                      <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-md text-[9px]">
                        {claims.length}
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowVerifyFlow(true)}
                    className="flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl btn-shimmer"
                    style={{ backgroundColor: '#16a34a', color: 'white' }}
                  >
                    <CheckCircle2 width={14} height={14} />
                    Verify & Mark as Resolved
                  </button>
                )}
              </>
            )}

            {/* Reporter's resolve button */}
            {isReporter && (
              <button
                onClick={() => setResolveDialogOpen(true)}
                className="flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] border-2"
                style={{ borderColor: '#16a34a', color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.05)' }}
              >
                <ShieldCheck width={14} height={14} />
                Admin Resolve
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 rounded-lg py-3 text-[10px] font-bold uppercase tracking-[0.1em] transition-all border border-[var(--color-border)] bg-[var(--color-bg-subtle)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Share
            </button>
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(item.id)}
                className="flex-1 rounded-lg py-3 text-[10px] font-bold uppercase tracking-[0.1em] transition-all border"
                style={{
                  borderColor: isBookmarked ? 'var(--accent-lf)' : 'var(--color-border)',
                  backgroundColor: isBookmarked ? 'var(--accent-lf-bg)' : 'var(--color-bg-subtle)',
                  color: isBookmarked ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
                }}
              >
                {isBookmarked ? 'Saved' : 'Save'}
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 rounded-lg py-3 border border-[var(--color-border)] bg-[var(--color-bg-subtle)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Printer width={14} height={14} />
            </button>
          </div>

          {/* Vision Verification Flow */}
          <AnimatePresence>
            {showVerifyFlow && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl p-5 space-y-4 border-2 border-dashed"
                style={{ borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.02)' }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: '#16a34a' }}>
                    Final Verification
                  </h4>
                  <button onClick={() => setShowVerifyFlow(false)}>
                    <X width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                  To mark this as resolved, please upload a photo of the item in your possession. Our AI will verify it matches the original report.
                </p>
                
                {!verificationImage ? (
                  <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed transition-colors cursor-pointer hover:bg-black/5" style={{ borderColor: 'var(--color-border)' }}>
                    <Camera width={24} height={24} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span className="text-[10px] font-bold mt-2" style={{ color: 'var(--color-text-tertiary)' }}>Click to take/upload photo</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setVerificationImage(e.target.files?.[0] || null)} />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden h-32 border border-[var(--color-border)]">
                    <img src={URL.createObjectURL(verificationImage)} className="w-full h-full object-cover" alt="Verification" />
                    <button onClick={() => setVerificationImage(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center">
                      <X width={12} height={12} />
                    </button>
                  </div>
                )}

                <button
                  onClick={handleVerifyAndResolve}
                  disabled={!verificationImage || verifying}
                  className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
                  style={{ backgroundColor: '#16a34a', color: 'white' }}
                >
                  {verifying ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" width={14} height={14} />
                      AI Verifying...
                    </div>
                  ) : 'Verify & Resolve'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

      {/* Claims Section (Queue) */}
      {claims.length > 0 && (
        <div className="no-print pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 mb-3">
            <Handshake width={12} height={12} style={{ color: '#16a34a' }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#16a34a' }}>
              Pending Collection Queue ({claims.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {claims.map((claim, idx) => (
              <div
                key={claim.id}
                className="rounded-lg px-3 py-2 flex items-center gap-2 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
              >
                <div className="w-5 h-5 rounded-full bg-[#16a34a]/10 flex items-center justify-center text-[10px] font-bold text-[#16a34a]">
                  {idx + 1}
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Claimant {claim.claimer_id.slice(-4).toUpperCase()}
                </span>
                <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  &middot; {timeAgo(claim.created_at)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] mt-3 opacity-70" style={{ color: 'var(--color-text-tertiary)' }}>
            Multiple students are attempting to collect this item. If you have received it, use the &quot;Verify & Resolve&quot; button above.
          </p>
        </div>
      )}

      {/* Comments Section */}
      <div className="no-print pt-4 border-t border-[var(--color-border)]">
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

  const btnStyle = (active: boolean) => ({
    backgroundColor: active ? 'var(--accent-lf-bg)' : 'transparent',
    color: active ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
    fontWeight: active ? '700' : '500',
  })

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--accent-lf)]/20"
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
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="hover:scale-110 transition-transform">
              <X width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-2.5">
        <label className="font-mono text-[9px] uppercase tracking-[0.12em] flex items-center gap-2 text-[var(--color-text-tertiary)]">
          <ArrowUpDown width={10} height={10} />
          Sort By
        </label>
        <div className="relative group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] appearance-none cursor-pointer outline-none transition-all duration-200 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] focus:ring-2 focus:ring-[var(--accent-lf)]/20"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
        </div>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('type')}
          className="flex items-center justify-between w-full group"
        >
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] flex items-center gap-2 text-[var(--color-text-tertiary)] cursor-pointer group-hover:text-[var(--color-text-primary)] transition-colors">
            <Filter width={10} height={10} />
            Type
          </label>
          <ChevronDown
            width={12}
            height={12}
            className={`transition-transform duration-300 text-[var(--color-text-tertiary)] ${collapsedSections.type ? '' : 'rotate-180'}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {!collapsedSections.type && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 py-1">
                {(['all', 'lost', 'found'] as const).map((t) => {
                  const active = typeFilter === t
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className="rounded-lg px-3 py-2 text-[10px] uppercase tracking-[0.06em] transition-all duration-150 text-left hover:translate-x-1"
                      style={btnStyle(active)}
                    >
                      {t === 'all' ? 'All Items' : t === 'lost' ? 'Lost' : 'Found'}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('dateRange')}
          className="flex items-center justify-between w-full group"
        >
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] flex items-center gap-2 text-[var(--color-text-tertiary)] cursor-pointer group-hover:text-[var(--color-text-primary)] transition-colors">
            <Calendar width={10} height={10} />
            Date Range
          </label>
          <ChevronDown
            width={12}
            height={12}
            className={`transition-transform duration-300 text-[var(--color-text-tertiary)] ${collapsedSections.dateRange ? '' : 'rotate-180'}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {!collapsedSections.dateRange && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 py-1">
                {dateRangeOptions.map((opt) => {
                  const active = dateRange === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setDateRange(opt.value)}
                      className="rounded-lg px-3 py-2 text-[10px] uppercase tracking-[0.06em] transition-all duration-150 text-left hover:translate-x-1"
                      style={btnStyle(active)}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full group"
        >
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] flex items-center gap-2 text-[var(--color-text-tertiary)] cursor-pointer group-hover:text-[var(--color-text-primary)] transition-colors">
            <Tag width={10} height={10} />
            Category
          </label>
          <ChevronDown
            width={12}
            height={12}
            className={`transition-transform duration-300 text-[var(--color-text-tertiary)] ${collapsedSections.category ? '' : 'rotate-180'}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {!collapsedSections.category && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 py-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const active = categoryFilter === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className="rounded-lg px-3 py-2 text-[10px] uppercase tracking-[0.06em] transition-all duration-150 text-left hover:translate-x-1 flex items-center gap-2"
                      style={btnStyle(active)}
                    >
                      <span>{categoryIcons[cat] || '📦'}</span>
                      <span className="truncate">{cat}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-4 space-y-3">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="w-full rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-200 flex items-center justify-center gap-2 hover:bg-[var(--accent-ee-bg)] hover:text-[var(--accent-ee)] border border-transparent hover:border-[var(--accent-ee)]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <X width={12} height={12} />
            Reset Filters
          </button>
        )}
        
        <button
          onClick={onShareSummary}
          className="w-full rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-200 flex items-center justify-center gap-2 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] active:scale-[0.98]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <Share2 width={12} height={12} />
          Share Results
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
  const commonItems = ['ID Cards', 'Bags', 'Water Bottles', 'Keys', 'Phones', 'Wallets', 'Chargers']

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center py-16 gap-5 bg-[var(--color-bg-raised)]/30 rounded-3xl border border-dashed border-[var(--color-border)]">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="relative"
        >
          <SearchX width={64} height={64} style={{ color: 'var(--color-text-tertiary)' }} strokeWidth={1} />
        </motion.div>
        <div className="text-center space-y-1">
          <p className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            No matching items found
          </p>
          <p className="text-xs max-w-[280px] mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
            Try broadening your search or adjusting the filters to see more results.
          </p>
        </div>
        <button
          onClick={() => { window.location.reload() }}
          className="text-[10px] font-bold uppercase tracking-widest hover:underline"
          style={{ color: 'var(--accent-lf)' }}
        >
          Reset all filters
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-16 gap-8 bg-[var(--color-bg-raised)] rounded-[2.5rem] border border-[var(--color-border)] shadow-sm overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--accent-af)]/5 blur-[100px] -z-10 rounded-full" />
        
        {/* Backpack Illustration */}
        <div className="relative">
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 1, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <div className="w-40 h-48 bg-gradient-to-br from-amber-600/20 to-amber-700/10 rounded-3xl border-2 border-amber-600/20 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-16 bg-amber-600/5 border-b border-amber-600/10" />
               <div className="w-16 h-1.5 bg-amber-600/30 rounded-full mb-10 mt-4" />
               <div className="w-24 h-24 bg-amber-600/5 rounded-2xl border border-amber-600/10 flex items-center justify-center">
                  <Package width={32} height={32} className="text-amber-600/20" />
               </div>
            </div>
            {/* keys and water bottle simulation */}
            <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-[var(--color-bg-raised)] rounded-full flex items-center justify-center shadow-lg border border-[var(--color-border)] rotate-12">
              <Tag width={24} height={24} className="text-amber-500" />
            </div>
            <div className="absolute top-12 -left-4 w-10 h-24 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center justify-center -rotate-6">
               <div className="w-6 h-2 bg-blue-500/20 rounded-t-sm absolute top-0" />
            </div>
          </motion.div>
        </div>

        <div className="text-center space-y-2 px-6">
          <h3 className="font-body text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            No active reports right now
          </h3>
          <p className="text-sm font-bold flex items-center justify-center gap-1.5" style={{ color: 'var(--accent-af)' }}>
            That&apos;s a good sign! 🎉
          </p>
          <p className="text-[13px] max-w-[360px] mx-auto text-[var(--color-text-secondary)] leading-relaxed">
            Be the first to report a lost or found item and help someone get it back.
          </p>
        </div>

        {/* Benefits contained box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-6">
          {[
            { icon: Zap, label: 'Report in seconds', desc: 'Add details & photos', color: 'var(--accent-lf)' },
            { icon: Handshake, label: 'Help your peers', desc: 'Reunite belongings', color: 'var(--accent-se)' },
            { icon: Heart, label: 'Make campus better', desc: 'Stronger community', color: 'var(--accent-af)' },
          ].map((benefit) => (
            <div key={benefit.label} className="bg-[var(--color-bg-subtle)]/50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-[var(--color-border)] transition-all hover:bg-[var(--color-bg-subtle)]">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center border border-[var(--color-border)] shadow-sm">
                <benefit.icon width={18} height={18} style={{ color: benefit.color }} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>{benefit.label}</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] font-medium">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-5 pt-4">
          <button
            onClick={onReport}
            className="rounded-xl py-3.5 px-10 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 flex items-center gap-2 hover:scale-[1.05] active:scale-[0.98] shadow-md hover:shadow-xl btn-shimmer"
            style={{
              backgroundColor: 'var(--accent-lf)',
              color: 'white',
            }}
          >
            <Plus width={18} height={18} strokeWidth={3} />
            Report an Item
          </button>
          <button className="text-[11px] font-bold text-[var(--color-text-tertiary)] flex items-center gap-1.5 hover:text-[var(--color-text-primary)] transition-colors group">
            Or browse previously found items <ChevronRight width={14} height={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Commonly Lost Items Section - Separate Card */}
      <div className="rounded-[1.5rem] p-6 bg-[var(--color-bg-raised)] border border-[var(--color-border)] shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] font-black mb-4 text-[var(--color-text-tertiary)]">
          Commonly Lost Items
        </p>
        <div className="flex flex-wrap gap-2">
          {commonItems.map((chip) => (
            <span
              key={chip}
              className="px-4 py-2 rounded-xl text-[10px] font-bold border border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-raised)] hover:border-[var(--color-text-tertiary)] transition-all cursor-default"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
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
      label: 'ACTIVE ITEMS',
      value: totalActive,
      accent: 'var(--accent-lf)',
      trend: 0,
    },
    {
      label: 'LOST THIS WEEK',
      value: lostThisWeek,
      accent: 'var(--accent-ee)',
      trend: lostTrend,
    },
    {
      label: 'FOUND THIS WEEK',
      value: foundThisWeek,
      accent: 'var(--accent-af)',
      trend: foundTrend,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          return (
            <div
              key={stat.label}
              className="rounded-2xl p-6 flex flex-col items-center justify-center gap-1 relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${stat.accent}, transparent 92%)`, 
                border: `1px solid color-mix(in srgb, ${stat.accent}, transparent 75%)`,
                boxShadow: `0 4px 12px -2px color-mix(in srgb, ${stat.accent}, transparent 94%), 0 2px 4px -1px color-mix(in srgb, ${stat.accent}, transparent 96%)`
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black tracking-tighter" style={{ color: stat.accent }}>
                  <AnimatedCounter target={stat.value} />
                </span>
                <span className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.15em] mt-1 text-center">
                  {stat.label}
                </span>
              </div>
              
              <div className="mt-2">
                {stat.trend !== 0 ? (
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 border border-[var(--color-border)]"
                  >
                    <span 
                      className="text-[10px] font-bold flex items-center gap-0.5"
                      style={{ color: stat.trend > 0 && stat.label.includes('LOST') ? 'var(--accent-ee)' : 'var(--accent-af)' }}
                    >
                      {stat.trend > 0 ? <ArrowUp width={10} height={10} /> : <ArrowDown width={10} height={10} />}
                      {Math.abs(stat.trend)}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Change</span>
                  </div>
                ) : (
                  <span className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest opacity-60">No change</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Activity Breakdown Split Bar */}
      {totalActive > 0 && (
        <div
          className="rounded-2xl p-4 border border-[var(--color-border)] bg-[var(--color-bg-raised)]/50"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] font-bold text-[var(--color-text-tertiary)]">
              Live Activity Breakdown
            </span>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-ee)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>{lostPct}% Lost</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-af)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>{foundPct}% Found</span>
              </div>
            </div>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden flex bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
            <div className="h-full transition-all duration-1000" style={{ width: `${lostPct}%`, backgroundColor: 'var(--accent-ee)' }} />
            <div className="h-full transition-all duration-1000" style={{ width: `${foundPct}%`, backgroundColor: 'var(--accent-af)' }} />
          </div>
        </div>
      )}
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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
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

  const handleResolve = async (id: string, resolutionImageUrl?: string) => {
    try {
      const res = await fetch(`/api/lost-found/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isResolved: true,
          resolvedBy: typeof window !== 'undefined' ? localStorage.getItem('lf-user-id') : undefined,
          resolutionImageUrl
        }),
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
            <motion.div 
              layout
              className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
            >
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
                    viewMode={viewMode}
                  />
                  {focusedItemIndex === idx && (
                    <div className="kb-focused-tooltip">Press Enter to view</div>
                  )}
                </div>
              ))}
            </motion.div>
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
    <div className="flex flex-col flex-1 min-h-0 max-w-5xl mx-auto w-full">
      {subView === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Section title & description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2"
                style={{ color: 'var(--accent-lf)' }}
              >
                Lost & Found
              </p>
              <h2
                className="font-body text-2xl md:text-3xl font-bold leading-tight mb-2 tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Reunite students with their belongings
              </h2>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
                Report items you&apos;ve lost or found on campus. Help fellow students recover their belongings quickly.
              </p>
            </div>
            {/* Top Right Primary CTA */}
            <button
              onClick={() => { onSubViewChange('report'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="shrink-0 rounded-xl py-3 px-6 text-xs font-bold uppercase tracking-[0.1em] transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.05] active:scale-[0.98] cta-pulse-btn shadow-md hover:shadow-lg"
              style={{
                backgroundColor: 'var(--accent-lf)',
                color: 'white',
              }}
            >
              <Plus width={16} height={16} strokeWidth={3} />
              Report an Item
            </button>
          </div>

          {/* Quick Stats Dashboard */}
          {!loading && <StatsDashboard items={items} />}

          <SectionDivider />

          {/* Search, Sort & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--accent-lf)]/20"
              style={{
                backgroundColor: 'var(--color-bg-raised)',
                border: '1.5px solid var(--color-border)',
              }}
            >
              <Search width={16} height={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lost or found items..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="hover:scale-110 transition-transform">
                  <X width={16} height={16} style={{ color: 'var(--color-text-tertiary)' }} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden relative rounded-xl px-4 py-3 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
              style={{
                backgroundColor: showFilters ? 'var(--accent-lf-bg)' : 'var(--color-bg-raised)',
                border: `1.5px solid ${showFilters ? 'var(--accent-lf)' : 'var(--color-border)'}`,
                color: showFilters ? 'var(--accent-lf)' : 'var(--color-text-secondary)',
              }}
            >
              <Filter width={14} height={14} />
              Filters
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    {activeItems.length} Active Items
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-medium">Browsing all items</span>
                </div>
                <div className="flex items-center gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-lg border border-[var(--color-border)]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[var(--color-bg-raised)] text-[var(--accent-lf)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                    title="Grid View"
                  >
                    <LayoutGrid width={14} height={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--color-bg-raised)] text-[var(--accent-lf)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                    title="List View"
                  >
                    <List width={14} height={14} />
                  </button>
                </div>
              </div>
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
        className="flex flex-col flex-1 px-5 pt-4 pb-4 max-w-5xl mx-auto w-full"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <LostFoundView
          onBack={handleBack}
          subView={subView}
          onSubViewChange={setSubView}
          autoSelectItemId={searchSelectedItemId}
        />
        <div className="mt-12">
          <Footer onQuickLink={(action) => {
            if (action === 'report') {
              setSubView('report')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else if (action === 'browse-found' || action === 'browse-lost') {
              setSubView('list')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }} />
        </div>
        
        {/* Bottom padding for scroll-past nav bar */}
        <div className="h-[120px] shrink-0" />
      </div>
    </div>
  )
}

