"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import type React from "react"
import { PremiumCard } from "./ui/PremiumCard"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import Link from "next/link"

type TabType = "carbon" | "report" | "weather" | "media"

interface NewsItem {
  title: string
  link: string
  pubDate: string
  description: string
  imageUrl?: string
}

interface WeatherData {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    apparent_temperature: number
    precipitation: number
    cloud_cover: number
  }
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: number[]
  }
  hourly: {
    temperature_2m: number[]
    time: string[]
  }
}

type ExpandedWidget = "current" | "humidity" | "wind" | "forecast" | "hourly" | "details" | null

// Helper function to parse and format report text
const formatReportText = (text: string) => {
  // Remove all asterisks and hash symbols used for markdown formatting
  let formatted = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '')
  
  // Remove duplicate company info header that AI often generates
  // This removes lines like "Company: StaUniverse", "Industry: Tech", etc.
  const lines = formatted.split('\n')
  const filteredLines: string[] = []
  let skipUntilSection = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip common header patterns
    if (
      line.startsWith('Company:') ||
      line.startsWith('Industry:') ||
      line.startsWith('Period:') ||
      line.startsWith('Location:') ||
      line.startsWith('Number of Employees:') ||
      line.startsWith('Employees:') ||
      line.startsWith('Target Net-Zero Year:') ||
      line.startsWith('Net-Zero Target:') ||
      line === '---' ||
      line === '===' ||
      (line.includes('Sustainability Report') && !line.match(/^\d+\./)) ||
      (line.includes('Summary') && i < 10 && !line.match(/^\d+\./))
    ) {
      skipUntilSection = true
      continue
    }
    
    // Start including content when we hit a numbered section
    if (line.match(/^\d+\.\s+[A-Z]/)) {
      skipUntilSection = false
    }
    
    if (!skipUntilSection) {
      filteredLines.push(lines[i])
    }
  }
  
  formatted = filteredLines.join('\n')
  
  // Split into sections
  const sections = formatted.split(/(?=\d+\.\s+[A-Z])/g)
  
  return sections.map((section, sectionIndex) => {
    if (!section.trim()) return null
    
    // Check if this is a numbered section (e.g., "1. Executive Summary")
    const sectionMatch = section.match(/^(\d+)\.\s+(.+?)(\n|$)/)
    
    if (sectionMatch) {
      const [, number, title, ] = sectionMatch
      const content = section.substring(sectionMatch[0].length).trim()
      
      // Check if content looks like key metrics (contains colons and values)
      const isMetrics = title.toLowerCase().includes('metric') || 
                       title.toLowerCase().includes('kpi') ||
                       (content.match(/:/g) || []).length > 2
      
      return (
        <div key={sectionIndex} className="mb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-sm font-bold">
              {number}
            </span>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          
          {isMetrics ? (
            // Render as table for metrics/KPIs
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <tbody className="divide-y divide-gray-200">
                  {content.split('\n').filter(line => line.trim() && line.includes(':')).map((line, i) => {
                    const colonIndex = line.indexOf(':')
                    if (colonIndex === -1) return null
                    const key = line.substring(0, colonIndex).trim()
                    const value = line.substring(colonIndex + 1).trim()
                    if (!key || !value) return null
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/2">
                          {key.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {value}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Render as formatted paragraphs and lists
            <div className="space-y-3">
              {content.split('\n\n').map((paragraph, pIndex) => {
                // Check if paragraph contains list items
                const lines = paragraph.split('\n').filter(l => l.trim())
                const hasListItems = lines.some(line => /^[-•]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim()))
                
                if (hasListItems) {
                  return (
                    <ul key={pIndex} className="space-y-2 ml-4">
                      {lines.map((line, lIndex) => {
                        const cleanLine = line.trim().replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')
                        if (!cleanLine) return null
                        return (
                          <li key={lIndex} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                            <span className="flex-1">{cleanLine}</span>
                          </li>
                        )
                      })}
                    </ul>
                  )
                } else if (paragraph.trim()) {
                  return (
                    <p key={pIndex} className="text-sm text-gray-700 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  )
                }
                return null
              })}
            </div>
          )}
        </div>
      )
    }
    
    return null
  }).filter(Boolean)
}

// Helper function to format carbon analysis results
const formatCarbonAnalysis = (text: string) => {
  // Remove markdown formatting BUT keep bullet points temporarily for parsing
  let formatted = text.replace(/\*\*/g, '')
  
  // Split into lines but keep track of which are bullet points
  const lines = formatted.split('\n').map(line => line.trimEnd()).filter(line => line.trim())
  const sections: React.ReactElement[] = []
  let currentSection = ''
  let currentLines: string[] = []
  
  // Group lines into sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if this is a section header
    if (
      line.match(/^\d+\.\s+/i) || // Numbered section like "1. Executive Summary"
      (line.toLowerCase().includes('assumption') && line.includes(':')) ||
      (line.toLowerCase().includes('conversion') && line.toLowerCase().includes('factor')) ||
      (line.toLowerCase().includes('breakdown') && line.includes(':')) ||
      (line.toLowerCase().includes('total') && line.toLowerCase().includes('co2')) ||
      (line.toLowerCase().includes('estimated total')) ||
      line === '---'
    ) {
      // Process previous section
      if (currentSection && currentLines.length > 0) {
        const rendered = renderCarbonSection(currentSection, currentLines, sections.length)
        if (rendered) {
          sections.push(rendered)
        }
      }
      // Start new section
      currentSection = line
      currentLines = []
    } else if (line.trim()) {
      currentLines.push(line)
    }
  }
  
  // Process final section
  if (currentSection && currentLines.length > 0) {
    const rendered = renderCarbonSection(currentSection, currentLines, sections.length)
    if (rendered) {
      sections.push(rendered)
    }
  }
  
  return sections.filter(Boolean)
}

// Helper to render individual carbon sections
const renderCarbonSection = (header: string, lines: string[], key: number): React.ReactElement | null => {
  // Skip separators and empty headers
  if (header === '---' || header.trim().length < 3) return null
  
  // Clean header for matching
  const cleanHeader = header.toLowerCase()
  
  // Assumptions/Conversion Factors Section
  if (cleanHeader.includes('assumption') || cleanHeader.includes('conversion') || cleanHeader.includes('factor')) {
    const dataLines = lines.filter(line => {
      const cleaned = line.replace(/^[*\-•]\s*/, '').trim()
      return cleaned.includes(':') && (
        cleaned.toLowerCase().includes('electricity') ||
        cleaned.toLowerCase().includes('transport') ||
        cleaned.toLowerCase().includes('waste') ||
        cleaned.toLowerCase().includes('kg co2e') ||
        cleaned.toLowerCase().includes('kwh') ||
        cleaned.includes('km')
      )
    })
    
    if (dataLines.length === 0) return null
    
    return (
      <div key={key} className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">ℹ️</span>
          CO2e Conversion Factors
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Category</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataLines.map((line, i) => {
                const cleaned = line.replace(/^[*\-•]\s*/, '').trim()
                const colonIndex = cleaned.indexOf(':')
                if (colonIndex === -1) return null
                
                const category = cleaned.substring(0, colonIndex).trim()
                const factor = cleaned.substring(colonIndex + 1).trim()
                
                if (!category || !factor) return null
                
                return (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{category}</td>
                    <td className="px-4 py-3 text-xs text-gray-900">{factor}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  
  // Breakdown Section - More flexible matching
  if (cleanHeader.includes('breakdown') || cleanHeader.includes('by category')) {
    // Look for lines with category names and emissions data
    const dataLines = lines.filter(line => {
      const cleaned = line.replace(/^[*\-•]\s*/, '').trim()
      const lowerLine = cleaned.toLowerCase()
      
      // Must have a category name
      const hasCategory = lowerLine.includes('electricity') || 
                         lowerLine.includes('transport') || 
                         lowerLine.includes('waste') ||
                         lowerLine.includes('energy') ||
                         lowerLine.includes('water') ||
                         lowerLine.includes('gas')
      
      // Must have emissions data
      const hasEmissions = cleaned.includes('kg CO2e') || 
                          cleaned.includes('kg co2e') ||
                          cleaned.includes('tons') || 
                          cleaned.includes('%')
      
      return hasCategory && hasEmissions && cleaned.includes(':')
    })
    
    if (dataLines.length === 0) return null
    
    return (
      <div key={key} className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">📊</span>
          Emissions Breakdown
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-emerald-50 to-green-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Category</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Emissions</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 w-32">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataLines.map((line, i) => {
                const cleaned = line.replace(/^[*\-•]\s*/, '').trim()
                
                // Extract category name (before the colon)
                const colonIndex = cleaned.indexOf(':')
                if (colonIndex === -1) return null
                
                const category = cleaned.substring(0, colonIndex).trim()
                
                // Extract emissions value - try multiple patterns
                let emissions = null
                let unit = 'kg'
                
                // Pattern 1: "= 1165 kg CO2e"
                let match = cleaned.match(/=\s*(\d+\.?\d*)\s*kg\s*CO2e/i)
                if (match) {
                  emissions = match[1]
                  unit = 'kg'
                }
                
                // Pattern 2: "(1.17 tons)"
                if (!emissions) {
                  match = cleaned.match(/\((\d+\.?\d*)\s*tons?\)/i)
                  if (match) {
                    emissions = match[1]
                    unit = 'tons'
                  }
                }
                
                // Pattern 3: Just the number followed by kg or tons
                if (!emissions) {
                  match = cleaned.match(/(\d+\.?\d*)\s*(kg|tons?)\s*CO2e?/i)
                  if (match) {
                    emissions = match[1]
                    unit = match[2].toLowerCase().includes('ton') ? 'tons' : 'kg'
                  }
                }
                
                // Extract percentage
                const percentMatch = cleaned.match(/(\d+)%/)
                const percentage = percentMatch ? parseInt(percentMatch[1]) : null
                
                if (!category) return null
                
                return (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">
                      {category}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 text-right font-semibold">
                      {emissions ? `${emissions} ${unit} CO2e` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {percentage !== null && (
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex-1 max-w-[60px] h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-emerald-700 w-10 text-right">
                            {percentage}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  
  // Cost Savings Section - UPDATED to be currency-agnostic
  if (cleanHeader.includes('cost') || cleanHeader.includes('saving') || cleanHeader.includes('monthly estimate')) {
    // Build a map of categories to savings by looking at all lines
    const categoryData: { [key: string]: { amount: string; currency: string } } = {}
    let currentCategory = ''
    
    for (const line of lines) {
      const cleaned = line.replace(/^[*\-•]\s*/, '').trim()
      const lowerLine = cleaned.toLowerCase()
      
      // Check if this line starts a new category
      const categoryMatch = cleaned.match(/^(Electricity|Transport|Waste|Energy|Water|Gas|Total):/i)
      if (categoryMatch) {
        currentCategory = categoryMatch[1]
        // Extract currency and amount - support multiple currency symbols
        const currencyMatch = cleaned.match(/([£$€¥₹₽¢₱₦₨₩₪₫฿]|[A-Z]{3})\s*(\d+(?:\s*-\s*\d+)?(?:\+)?)|(\d+(?:\s*-\s*\d+)?(?:\+)?)\s*([£$€¥₹₽¢₱₦₨₩₪₫฿]|[A-Z]{3})/)
        if (currencyMatch) {
          const currency = currencyMatch[1] || currencyMatch[4] || ''
          const amount = currencyMatch[2] || currencyMatch[3] || ''
          categoryData[currentCategory] = { amount, currency }
        }
      } else if (currentCategory && (cleaned.includes('$') || cleaned.includes('£') || cleaned.includes('€') || cleaned.includes('¥') || cleaned.match(/[₹₽₱₦₨₩₪₫฿]/))) {
        // Savings might be on next line
        const currencyMatch = cleaned.match(/([£$€¥₹₽¢₱₦₨₩₪₫฿]|[A-Z]{3})\s*(\d+(?:\s*-\s*\d+)?(?:\+)?)|(\d+(?:\s*-\s*\d+)?(?:\+)?)\s*([£$€¥₹₽¢₱₦₨₩₪₫฿]|[A-Z]{3})/)
        if (currencyMatch && !categoryData[currentCategory]) {
          const currency = currencyMatch[1] || currencyMatch[4] || ''
          const amount = currencyMatch[2] || currencyMatch[3] || ''
          categoryData[currentCategory] = { amount, currency }
        }
      }
      
      // Also check for "Total" lines
      if (lowerLine.includes('total') && (cleaned.includes('$') || cleaned.includes('£') || cleaned.includes('€') || cleaned.includes('¥') || cleaned.match(/[₹₽₱₦₨₩₪₫฿]/))) {
        const currencyMatch = cleaned.match(/([£$€¥₹₽¢₱₦₨₩₪₫฿]|[A-Z]{3})\s*(\d+(?:\s*-\s*\d+)?(?:\+)?)|(\d+(?:\s*-\s*\d+)?(?:\+)?)\s*([£$€¥₹₽¢₱₦₨₩₪₫฿]|[A-Z]{3})/)
        if (currencyMatch) {
          const currency = currencyMatch[1] || currencyMatch[4] || ''
          const amount = currencyMatch[2] || currencyMatch[3] || ''
          categoryData['Total'] = { amount, currency }
        }
      }
    }
    
    // Separate total from other categories
    const total = categoryData['Total']
    delete categoryData['Total']
    const categories = Object.keys(categoryData)
    
    if (categories.length === 0 && !total) return null
    
    // Get the most common currency
    const currencies = [...categories.map(k => categoryData[k].currency), total?.currency].filter(Boolean)
    const mainCurrency = currencies.length > 0 ? currencies[0] : ''
    
    return (
      <div key={key} className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">💰</span>
          Potential Cost Savings
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Category</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Monthly Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">
                    {category}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-green-700 text-right">
                    {categoryData[category].currency}{categoryData[category].amount}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              {total && (
                <tr className="bg-gradient-to-r from-green-50 to-emerald-50 font-bold">
                  <td className="px-4 py-3 text-xs text-gray-900">
                    Total Monthly Savings
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700 text-right">
                    {total.currency}{total.amount}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  
  // Actions/Recommendations Section
  const sectionMatch = header.match(/^(\d+)\.\s+(.+?)$/i)
  if (sectionMatch && lines.length > 0) {
    const [, number, title] = sectionMatch
    
    return (
      <div key={key} className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-xs font-bold">
            {number}
          </span>
          <h3 className="text-sm font-bold text-gray-900 pt-0.5">{title}</h3>
        </div>
        
        <div className="ml-10 space-y-2">
          {lines.map((line, i) => {
            const cleanLine = line.replace(/^[*\-•]\s*/, '').trim()
            
            // Check if it has a label (like "Action:", "Why practical:")
            const labelMatch = cleanLine.match(/^(.+?):\s*(.+)$/i)
            if (labelMatch) {
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-emerald-700 min-w-fit">
                    {labelMatch[1]}:
                  </span>
                  <span className="text-xs text-gray-700">{labelMatch[2]}</span>
                </div>
              )
            }
            
            // List item
            if (line.match(/^[*\-•]\s+/)) {
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></span>
                  <span className="text-xs text-gray-700 flex-1">{cleanLine}</span>
                </div>
              )
            }
            
            // Regular paragraph
            return (
              <p key={i} className="text-xs text-gray-700 leading-relaxed">
                {cleanLine}
              </p>
            )
          })}
        </div>
      </div>
    )
  }
  
  return null
}

export const DashboardDemo = () => {
  // Random tab selection on mount
  useEffect(() => {
    const tabs: TabType[] = ["carbon", "report", "weather", "media"]
    const randomTab = tabs[Math.floor(Math.random() * tabs.length)]
    setActiveTab(randomTab)
  }, [])

  const [activeTab, setActiveTab] = useState<TabType>("carbon")
  const [loading, setLoading] = useState(false)
  
  // Carbon Analyzer State
  const [carbonInput, setCarbonInput] = useState({ electricity: "", transport: "", waste: "" })
  const [carbonResult, setCarbonResult] = useState("")
  const [carbonAnalyzing, setCarbonAnalyzing] = useState(false)
  
  // Report Generator State - UPDATED with more fields
  const [reportInput, setReportInput] = useState({ 
    company: "", 
    industry: "", 
    period: "",
    location: "",
    employees: "",
    targetYear: ""
  })
  const [reportResult, setReportResult] = useState("")
  const [reportGenerating, setReportGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // News Feed State
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  
  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [location, setLocation] = useState({ city: "Detecting...", lat: "", lon: "" })
  const [expandedWidget, setExpandedWidget] = useState<ExpandedWidget>(null)
  const [locationError, setLocationError] = useState(false)
  
  // AI Advisor State
  const [advisorQuestion, setAdvisorQuestion] = useState("")
  const [advisorResponse, setAdvisorResponse] = useState("")
  const [advisorStreaming, setAdvisorStreaming] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])

  // Media Studio State
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const [mediaPrompt, setMediaPrompt] = useState("")
  const [mediaAspectRatio, setMediaAspectRatio] = useState("1:1")
  const [generatedMedia, setGeneratedMedia] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null)
  const [useBranding, setUseBranding] = useState(false)
  const [mediaGallery, setMediaGallery] = useState<Array<{url: string, type: "image" | "video", prompt: string}>>([])
  const [activeMediaTab, setActiveMediaTab] = useState<"preview" | "references">("preview")

  // Weather Insights State
  const [humidityInsight, setHumidityInsight] = useState<{type: string, text: string} | null>(null)
  const [windInsight, setWindInsight] = useState<{type: string, text: string} | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  const tabs = [
    { 
      id: "carbon" as TabType, 
      label: "Carbon & News", 
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3c-2.5 2.5-2.5 6.5 0 9s6.5 2.5 9 0" />
          <path d="M3 12c2.5 2.5 6.5 2.5 9 0s2.5-6.5 0-9" />
        </svg>
      )
    },
    { 
      id: "report" as TabType, 
      label: "Report Generator", 
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M8 10h8M8 14h5" strokeLinecap="round" />
          <circle cx="16" cy="8" r="2" fill="currentColor" />
        </svg>
      )
    },
    { 
      id: "weather" as TabType, 
      label: "Climate & AI", 
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      )
    },
    { 
      id: "media" as TabType, 
      label: "Media Studio", 
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
  ]

  // Get user's location when weather tab is active
  useEffect(() => {
    if (activeTab === "weather" && !location.lat) {
      getUserLocation()
    }
  }, [activeTab])

  // Get user's location when carbon tab is active
  useEffect(() => {
    if (activeTab === "carbon" && !location.lat) {
      getUserLocation()
    }
  }, [activeTab])

  // Fetch weather when location is set
  useEffect(() => {
    if (location.lat && location.lon && activeTab === "weather") {
      fetchWeather()
    }
  }, [location.lat, location.lon, activeTab])

  // Generate weather insights when weather data changes
  useEffect(() => {
    if (weather && activeTab === "weather") {
      generateWeatherInsights()
    }
  }, [weather, activeTab])

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(4)
          const lon = position.coords.longitude.toFixed(4)
          
          // Reverse geocode to get city name
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
            const data = await response.json()
            const city = data.address?.city || data.address?.town || data.address?.village || "Your Location"
            setLocation({ city, lat, lon })
          } catch (error) {
            setLocation({ city: "Your Location", lat, lon })
          }
        },
        (error) => {
          console.error("Location error:", error)
          setLocationError(true)
          // Fallback to London
          setLocation({ city: "London", lat: "51.5074", lon: "-0.1278" })
        }
      )
    } else {
      setLocationError(true)
      setLocation({ city: "London", lat: "51.5074", lon: "-0.1278" })
    }
  }

  // Fetch news on mount or when tab changes to carbon (for carbon tab news column)
  useEffect(() => {
    if (activeTab === "carbon" && news.length === 0) {
      fetchNews()
    }
  }, [activeTab])

  const fetchNews = async () => {
    setNewsLoading(true)
    try {
      const response = await fetch('/api/news')
      const data = await response.json()
      setNews(data.items || [])
    } catch (error) {
      console.error("Failed to fetch news:", error)
    } finally {
      setNewsLoading(false)
    }
  }

  const fetchWeather = async () => {
    setWeatherLoading(true)
    try {
      const response = await fetch(`/api/weather?latitude=${location.lat}&longitude=${location.lon}`)
      const data = await response.json()
      setWeather(data)
    } catch (error) {
      console.error("Failed to fetch weather:", error)
    } finally {
      setWeatherLoading(false)
    }
  }

  const generateWeatherInsights = async () => {
    if (!weather) return
    
    setInsightsLoading(true)
    
    try {
      // Generate humidity insight
      const humidityPrompt = `Based on current humidity level of ${weather.current.relative_humidity_2m}% in ${location.city}, provide ONE short sustainability insight, fun-fact, joke, or tip (randomly choose one type). Format as: "[TYPE]: [one-liner]" where TYPE is either "Insight", "Fun-Fact", "Joke", or "Tip". Keep it under 15 words and relevant to business sustainability.`
      
      const humidityResponse = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: humidityPrompt })
      })
      const humidityData = await humidityResponse.json()
      
      // Parse the response to extract type and text
      const humidityText = humidityData.text || ""
      const humidityMatch = humidityText.match(/^(Insight|Fun-Fact|Joke|Tip):\s*(.+)/i)
      
      if (humidityMatch) {
        setHumidityInsight({ type: humidityMatch[1], text: humidityMatch[2].trim() })
      } else {
        setHumidityInsight({ type: "Insight", text: humidityText.split('\n')[0].substring(0, 100) })
      }
      
      // Generate wind insight
      const windPrompt = `Based on current wind speed of ${weather.current.wind_speed_10m} km/h in ${location.city}, provide ONE short sustainability insight, fun-fact, joke, or tip (randomly choose one type). Format as: "[TYPE]: [one-liner]" where TYPE is either "Insight", "Fun-Fact", "Joke", or "Tip". Keep it under 15 words and relevant to business sustainability.`
      
      const windResponse = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: windPrompt })
      })
      const windData = await windResponse.json()
      
      // Parse the response to extract type and text
      const windText = windData.text || ""
      const windMatch = windText.match(/^(Insight|Fun-Fact|Joke|Tip):\s*(.+)/i)
      
      if (windMatch) {
        setWindInsight({ type: windMatch[1], text: windMatch[2].trim() })
      } else {
        setWindInsight({ type: "Tip", text: windText.split('\n')[0].substring(0, 100) })
      }
    } catch (error) {
      console.error("Failed to generate insights:", error)
      // Fallback insights
      setHumidityInsight({ 
        type: "Tip", 
        text: weather.current.relative_humidity_2m > 70 
          ? "High humidity? Optimize HVAC for energy savings!" 
          : "Perfect humidity for natural ventilation strategies."
      })
      setWindInsight({ 
        type: "Insight", 
        text: weather.current.wind_speed_10m > 30 
          ? "Strong winds boost renewable energy potential!" 
          : "Calm day? Focus on passive cooling designs."
      })
    } finally {
      setInsightsLoading(false)
    }
  }

  const analyzeCarbonFootprint = async () => {
    if (!carbonInput.electricity && !carbonInput.transport && !carbonInput.waste) return
    
    setCarbonAnalyzing(true)
    setCarbonResult("")
    
    try {
      // Build location context
      const locationContext = location.city !== "Detecting..." && location.city
        ? `\n\nIMPORTANT CONTEXT: The business is located in ${location.city}. Tailor your analysis to this specific location:
- Use emission factors and energy grid data specific to ${location.city}'s country/region
- Consider local climate conditions and their impact on energy consumption
- Reference local renewable energy availability and incentive programs
- Suggest location-specific sustainability initiatives and suppliers
- Account for regional environmental regulations and standards
- Consider local transportation infrastructure and options\n`
        : ""

      const prompt = `Analyze this SME's monthly carbon footprint data and provide specific, actionable recommendations:
      
- Electricity: ${carbonInput.electricity || "0"} kWh
- Transport: ${carbonInput.transport || "0"} km (company vehicles)
- Waste: ${carbonInput.waste || "0"} kg
${locationContext}
Provide:
1. Estimated total CO2 emissions (in tons) - use location-specific emission factors if location provided
2. Breakdown by category with percentages
3. 3 specific, practical actions to reduce emissions (tailored to the location if provided)
4. Potential cost savings (in local currency if location known)

Keep response concise and practical for SMEs. Format with clear sections.`

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const data = await response.json()
      setCarbonResult(data.text || "Analysis failed")
    } catch (error) {
      setCarbonResult("Failed to analyze. Please try again.")
    } finally {
      setCarbonAnalyzing(false)
    }
  }

  const generateReport = async () => {
    if (!reportInput.company || !reportInput.industry) return
    
    setReportGenerating(true)
    setReportResult("")
    
    try {
      const prompt = `Generate a professional sustainability report summary for:

Company: ${reportInput.company}
Industry: ${reportInput.industry}
Period: ${reportInput.period || "Q1 2024"}
Location: ${reportInput.location || "Not specified"}
Number of Employees: ${reportInput.employees || "Not specified"}
Target Net-Zero Year: ${reportInput.targetYear || "Not specified"}

Include:
1. Executive Summary (2-3 sentences)
2. Key Metrics (3-4 relevant sustainability KPIs for this industry)
3. Progress Highlights (2-3 achievements)
4. Recommended Next Steps (3 actions)
5. Compliance Status (brief regulatory overview)
6. Carbon Reduction Targets

Format professionally for SME stakeholders. Keep concise.`

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const data = await response.json()
      setReportResult(data.text || "Generation failed")
    } catch (error) {
      setReportResult("Failed to generate report. Please try again.")
    } finally {
      setReportGenerating(false)
    }
  }

  const downloadPDF = async () => {
    const reportElement = document.getElementById('report-preview')
    if (!reportElement) return

    try {
      // Capture the report as canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // Calculate dimensions
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${reportInput.company.replace(/\s+/g, '-')}-Sustainability-Report.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
    }
  }

  const askAdvisor = async () => {
    if (!advisorQuestion.trim()) return
    
    // Add user message to chat history
    const userMessage = advisorQuestion.trim()
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setAdvisorQuestion("") // Clear input immediately
    setAdvisorStreaming(true)
    setAdvisorResponse("")
    
    try {
      // Build context with location and chat history
      const locationContext = location.city !== "Detecting..." 
        ? `User is in ${location.city}. Tailor advice to their location and climate.` 
        : ""
      
      const weatherContext = weather 
        ? `Current weather: ${weather.current.temperature_2m}°C, ${getWeatherDescription(weather.current.weather_code)}.` 
        : ""
      
      const conversationHistory = chatHistory.length > 0
        ? `Previous conversation:\n${chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n')}\n\n`
        : ""
      
      // Strategic feature promotion every 3rd message
      const shouldPromoteFeatures = (chatHistory.length + 1) % 3 === 0
      const featurePromotion = shouldPromoteFeatures 
        ? `\n\nIMPORTANT: After answering, naturally mention that with a VerdeIQ account, users get access to: automated sustainability reports, media generation for campaigns, real-time news & sources, carbon tracking dashboards, and AI-powered action plans. Keep it brief (1 sentence) and conversational.`
        : ""
      
      const context = `You are a sustainability advisor for SMEs. ${locationContext} ${weatherContext}
      
${conversationHistory}Provide SHORT, actionable advice (2-3 sentences max). Be conversational and specific to their context. Focus on practical, cost-effective solutions for small businesses.${featurePromotion}`
      
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, context })
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6))
            fullResponse += data.text
            setAdvisorResponse(fullResponse)
          }
        }
      }
      
      // Add AI response to chat history
      setChatHistory(prev => [...prev, { role: 'assistant', content: fullResponse }])
      setAdvisorResponse("") // Clear temp response
    } catch (error) {
      const errorMsg = "Failed to get advice. Please try again."
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMsg }])
      setAdvisorResponse("")
    } finally {
      setAdvisorStreaming(false)
    }
  }

  // Media Studio Functions
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedLogo(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateMedia = async () => {
    if (!mediaPrompt.trim()) return
    
    setIsGenerating(true)
    setGeneratedMedia(null)
    
    try {
      // CRITICAL: ALWAYS inject sustainability theme, even for unrelated prompts
      const sustainabilityKeywords = [
        'sustainability', 'eco-friendly', 'green', 'renewable', 'carbon', 
        'environment', 'climate', 'recycling', 'energy-efficient'
      ]
      
      const hasSustainabilityTheme = sustainabilityKeywords.some(keyword => 
        mediaPrompt.toLowerCase().includes(keyword)
      )
      
      // Force sustainability theme if not present
      const sustainabilityEnhancement = !hasSustainabilityTheme 
        ? " Transform this into a sustainability-focused concept emphasizing eco-friendly practices, green business initiatives, and environmental responsibility." 
        : ""
      
      let enhancedPrompt = `${mediaPrompt}${sustainabilityEnhancement} Professional marketing visual for sustainable SME business, modern clean design, corporate aesthetic, promoting environmental consciousness and green business practices.`
      
      // If branding is enabled and logo is uploaded, use Gemini 2.5 Flash Image directly
      if (useBranding && uploadedLogo && mediaType === "image") {
        // Use Gemini 2.5 Flash Image for native logo integration
        const logoIntegrationPrompt = `Create a professional sustainability marketing visual: ${enhancedPrompt}

CRITICAL INSTRUCTIONS FOR LOGO INTEGRATION:
- Take the company logo from the provided image and incorporate it into the marketing visual
- Use the EXACT logo as provided - do NOT recreate or redesign it
- The logo should be prominently placed and clearly visible
- Integrate the logo naturally into the composition so it looks like professionally branded marketing content
- Match the logo's color palette throughout the design for brand cohesion
- The logo must appear as if it was originally part of the design, not added as an afterthought
- Ensure the final output is a single cohesive image with the logo seamlessly woven into the composition`

        const response = await fetch('/api/gemini/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: uploadedLogo,
            prompt: logoIntegrationPrompt
          })
        })
        
        const data = await response.json()
        
        if (data.generatedImage) {
          setGeneratedMedia(data.generatedImage)
          setMediaGallery(prev => [...prev, { url: data.generatedImage, type: "image", prompt: mediaPrompt }])
          return
        } else {
          throw new Error(data.error || 'Failed to generate image with logo')
        }
      }
      
      // Fallback to regular image/video generation without branding
      if (mediaType === "image") {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            aspectRatio: mediaAspectRatio
          })
        })
        const data = await response.json()
        if (data.url) {
          setGeneratedMedia(data.url)
          // Add to gallery
          setMediaGallery(prev => [...prev, { url: data.url, type: "image", prompt: mediaPrompt }])
        }
      } else {
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            aspectRatio: mediaAspectRatio
          })
        })
        const data = await response.json()
        if (data.url) {
          setGeneratedMedia(data.url)
          // Add to gallery
          setMediaGallery(prev => [...prev, { url: data.url, type: "video", prompt: mediaPrompt }])
        }
      }
    } catch (error) {
      console.error("Media generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const promptTemplates = [
    "Solar panels on business rooftop with green energy theme",
    "Diverse team celebrating sustainability achievement",
    "Recycling and waste reduction infographic for SMEs",
    "Carbon footprint reduction progress chart",
    "Green office environment with plants and natural light",
    "Electric vehicle fleet for business deliveries",
  ]

  const getWeatherIcon = (code: number) => {
    if (code === 0) return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.2" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
      </svg>
    )
    if (code <= 3) return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" opacity="0.5" />
        <path d="M14 16a4 4 0 018 0M14 20h8" strokeLinecap="round" />
      </svg>
    )
    if (code <= 67) return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 13v8M12 11v10M16 9v12" strokeLinecap="round" />
        <path d="M18 5a4 4 0 00-6-2 4 4 0 00-6 2" />
      </svg>
    )
    if (code <= 77) return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 14l2-4M12 12l2-4M16 10l2-4" strokeLinecap="round" />
        <path d="M18 5a4 4 0 00-6-2 4 4 0 00-6 2" />
      </svg>
    )
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 17l2-4M12 15l2-4M16 13l2-4" strokeLinecap="round" />
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.2" />
      </svg>
    )
  }

  const getWeatherDescription = (code: number) => {
    if (code === 0) return "Clear Sky"
    if (code <= 3) return "Partly Cloudy"
    if (code <= 48) return "Foggy"
    if (code <= 67) return "Rainy"
    if (code <= 77) return "Snowy"
    return "Stormy"
  }

  return (
    <div className="relative w-full">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Main Content Area */}
        <div>
          <AnimatePresence mode="wait">
            {activeTab === "carbon" && (
              <motion.div
                key="carbon"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-4"
              >
                {/* Carbon Analyzer Column */}
                <PremiumCard className="p-5">
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3c-2.5 2.5-2.5 6.5 0 9s6.5 2.5 9 0" />
                      <path d="M3 12c2.5 2.5 6.5 2.5 9 0s2.5-6.5 0-9" />
                    </svg>
                    AI Carbon Footprint Analyzer
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs text-muted-foreground flex-1">
                      Get instant AI-powered analysis of your emissions and actionable reduction strategies
                    </p>
                    {location.city !== "Detecting..." && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-primary" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="text-xs font-medium text-primary">{location.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Monthly Electricity (kWh)</label>
                      <input
                        type="number"
                        placeholder="e.g., 5000"
                        value={carbonInput.electricity}
                        onChange={(e) => setCarbonInput({ ...carbonInput, electricity: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Monthly Transport (km)</label>
                      <input
                        type="number"
                        placeholder="e.g., 2000"
                        value={carbonInput.transport}
                        onChange={(e) => setCarbonInput({ ...carbonInput, transport: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Monthly Waste (kg)</label>
                      <input
                        type="number"
                        placeholder="e.g., 500"
                        value={carbonInput.waste}
                        onChange={(e) => setCarbonInput({ ...carbonInput, waste: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={analyzeCarbonFootprint}
                    disabled={carbonAnalyzing}
                    className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {carbonAnalyzing ? "Analyzing..." : "Analyze Carbon Footprint"}
                  </button>

                  {carbonResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 rounded-lg bg-white border border-border shadow-sm max-h-[600px] overflow-y-auto"
                    >
                      <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 border-b border-emerald-200 z-10">
                        <h4 className="text-sm font-bold gradient-text flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 3c-2.5 2.5-2.5 6.5 0 9s6.5 2.5 9 0" />
                            <path d="M3 12c2.5 2.5 6.5 2.5 9 0s2.5-6.5 0-9" />
                          </svg>
                          AI Carbon Footprint Analysis
                        </h4>
                      </div>
                      <div className="p-4">
                        {formatCarbonAnalysis(carbonResult)}
                      </div>
                    </motion.div>
                  )}
                </PremiumCard>

                {/* Sustainability News Column */}
                <PremiumCard className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <path d="M7 8h6M7 12h10M7 16h8" strokeLinecap="round" />
                        </svg>
                        Sustainability News
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Latest environmental updates
                      </p>
                    </div>
                    <button
                      onClick={fetchNews}
                      disabled={newsLoading}
                      className="px-3 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-all"
                    >
                      {newsLoading ? "..." : "↻"}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {newsLoading ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">Loading news...</div>
                    ) : news.length > 0 ? (
                      news.slice(0, 5).map((item, i) => (
                        <motion.a
                          key={i}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-accent border border-transparent hover:border-primary/30 transition-all group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          {/* Thumbnail Image */}
                          {item.imageUrl && (
                            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted">
                              <img 
                                src={item.imageUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  // Hide image if it fails to load
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-primary font-medium">Read more</span>
                              <svg className="w-3 h-3 text-primary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.a>
                      ))
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">No news available</div>
                    )}
                  </div>
                </PremiumCard>
              </motion.div>
            )}

            {activeTab === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PremiumCard className="p-5">
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
                      <circle cx="16" cy="8" r="2" fill="currentColor" />
                    </svg>
                    AI Sustainability Report Generator
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Generate professional sustainability reports instantly with AI
                  </p>

                  {/* 2-Column Grid for 6 fields */}
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Company Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., GreenTech Solutions"
                        value={reportInput.company}
                        onChange={(e) => setReportInput({ ...reportInput, company: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Industry *</label>
                      <input
                        type="text"
                        placeholder="e.g., Manufacturing, Retail, Tech"
                        value={reportInput.industry}
                        onChange={(e) => setReportInput({ ...reportInput, industry: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Reporting Period</label>
                      <input
                        type="text"
                        placeholder="e.g., Q1 2024"
                        value={reportInput.period}
                        onChange={(e) => setReportInput({ ...reportInput, period: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Location</label>
                      <input
                        type="text"
                        placeholder="e.g., London, UK"
                        value={reportInput.location}
                        onChange={(e) => setReportInput({ ...reportInput, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Number of Employees</label>
                      <input
                        type="number"
                        placeholder="e.g., 150"
                        value={reportInput.employees}
                        onChange={(e) => setReportInput({ ...reportInput, employees: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Target Net-Zero Year</label>
                      <input
                        type="number"
                        placeholder="e.g., 2040"
                        value={reportInput.targetYear}
                        onChange={(e) => setReportInput({ ...reportInput, targetYear: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={generateReport}
                      disabled={reportGenerating}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {reportGenerating ? "Generating..." : "Generate Report"}
                    </button>
                    {reportResult && (
                      <button
                        onClick={() => setShowPreview(true)}
                        className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-all"
                      >
                        Preview & Download
                      </button>
                    )}
                  </div>

                  {reportResult && !showPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 p-4 rounded-lg bg-accent/50 border border-border max-h-[500px] overflow-y-auto"
                    >
                      <h4 className="text-sm font-bold mb-3 gradient-text flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M8 10h8M8 14h5" strokeLinecap="round" />
                          <circle cx="16" cy="8" r="2" fill="currentColor" />
                        </svg>
                        Generated Report Preview
                      </h4>
                      <div className="bg-white rounded-lg p-6 text-gray-900">
                        {/* Company Info Header */}
                        <div className="mb-6 pb-4 border-b-2 border-emerald-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="px-3 py-1 bg-emerald-100 rounded-full">
                              <span className="text-emerald-700 font-bold text-xs tracking-wide">SUSTAINABILITY REPORT</span>
                            </div>
                          </div>
                          <h2 className="text-2xl font-black text-gray-900 mb-1">{reportInput.company}</h2>
                          <p className="text-gray-600 text-sm">{reportInput.industry} Industry • {reportInput.period || "Q4 2025"}</p>
                        </div>
                        
                        {/* Formatted Report Content */}
                        <div className="prose prose-sm max-w-none">
                          {formatReportText(reportResult)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </PremiumCard>

                {/* Report Preview Modal */}
                {showPreview && reportResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowPreview(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-background rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
                        <h3 className="text-lg font-bold gradient-text">Sustainability Report Preview</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={downloadPDF}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Download PDF
                          </button>
                          <button
                            onClick={() => setShowPreview(false)}
                            className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-all"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Modal Content - Scrollable */}
                      <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                        {/* Premium Report Design */}
                        <div id="report-preview" className="bg-white p-10 rounded-lg">
                          {/* Report Header */}
                          <div className="mb-10 pb-8 border-b-4 border-gradient-to-r from-emerald-500 via-green-50 to-emerald-600 relative">
                            {/* Decorative corner element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent rounded-bl-full opacity-30"></div>
                            
                            <div className="relative">
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-600" fill="currentColor">
                                      <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z" />
                                    </svg>
                                    <span className="text-emerald-700 font-bold text-sm tracking-wide">SUSTAINABILITY REPORT</span>
                                  </div>
                                  <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{reportInput.company}</h1>
                                  <p className="text-gray-600 text-base">{reportInput.industry} Industry</p>
                                </div>
                                <div className="text-right bg-gradient-to-br from-emerald-50 to-green-50 px-6 py-4 rounded-xl border-2 border-emerald-200">
                                  <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Reporting Period</div>
                                  <div className="text-2xl font-bold text-emerald-700">{reportInput.period || "Q4 2025"}</div>
                                </div>
                              </div>

                              {/* Company Info Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-xl border-2 border-emerald-200 relative overflow-hidden group hover:shadow-lg transition-shadow">
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                  <div className="relative">
                                    <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Industry</div>
                                    <div className="text-lg font-bold text-gray-900">{reportInput.industry}</div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200 relative overflow-hidden group hover:shadow-lg transition-shadow">
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                  <div className="relative">
                                    <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Location</div>
                                    <div className="text-lg font-bold text-gray-900">{reportInput.location || "Global"}</div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 relative overflow-hidden group hover:shadow-lg transition-shadow">
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                  <div className="relative">
                                    <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Employees</div>
                                    <div className="text-lg font-bold text-gray-900">{reportInput.employees || "N/A"}</div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-200 relative overflow-hidden group hover:shadow-lg transition-shadow">
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                  <div className="relative">
                                    <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Net-Zero Target</div>
                                    <div className="text-lg font-bold text-gray-900">{reportInput.targetYear || "2050"}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Report Content - Formatted */}
                          <div className="prose prose-sm max-w-none">
                            {formatReportText(reportResult)}
                          </div>

                          {/* Report Footer */}
                          <div className="mt-12 pt-8 border-t-2 border-gray-200">
                            <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 p-6 rounded-xl border border-emerald-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                                        <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-gray-900">VerdeIQ</div>
                                      <div className="text-xs text-gray-600">AI-Powered Sustainability Platform</div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 italic">Empowering SMEs to Lead on Sustainability</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 mb-1">Report Generated</div>
                                  <div className="text-sm font-semibold text-gray-700">
                                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-center mt-6">
                              <p className="text-xs text-gray-400">
                                This report is generated using AI and should be reviewed by qualified professionals.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "weather" && (
              <motion.div
                key="weather"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-4"
              >
                {/* Left Column - Weather Widgets (3 rows) */}
                <div className="space-y-4">
                  {/* Row 1 - Current Weather */}
                  <motion.div
                    onClick={() => setExpandedWidget(expandedWidget === "current" ? null : "current")}
                    className="relative cursor-pointer group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PremiumCard className={`p-4 transition-all ${expandedWidget === "current" ? "ring-2 ring-primary" : ""}`}>
                      {weatherLoading ? (
                        <div className="aspect-square flex items-center justify-center">
                          <div className="text-sm text-muted-foreground">Loading...</div>
                        </div>
                      ) : weather ? (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-bold">Current Weather</h4>
                              <p className="text-xs text-muted-foreground">{location.city}</p>
                            </div>
                            <div className="w-8 h-8">
                              {getWeatherIcon(weather.current.weather_code)}
                            </div>
                          </div>
                          <div className="text-3xl font-bold gradient-text mb-1">
                            {weather.current.temperature_2m}°C
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {getWeatherDescription(weather.current.weather_code)}
                          </p>
                          
                          {expandedWidget === "current" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-border space-y-2"
                            >
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Feels like</span>
                                <span className="font-medium">{weather.current.apparent_temperature}°C</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Cloud cover</span>
                                <span className="font-medium">{weather.current.cloud_cover}%</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Precipitation</span>
                                <span className="font-medium">{weather.current.precipitation} mm</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-square flex items-center justify-center text-sm text-muted-foreground">
                          No data
                        </div>
                      )}
                    </PremiumCard>
                  </motion.div>

                  {/* Row 2 - Two Column Grid (Humidity & Wind) */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      onClick={() => setExpandedWidget(expandedWidget === "humidity" ? null : "humidity")}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PremiumCard className={`p-4 transition-all ${expandedWidget === "humidity" ? "ring-2 ring-primary" : ""}`}>
                        {weather ? (
                          <div className="h-full flex flex-col">
                            <div className="mb-2">
                              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                              </svg>
                            </div>
                            <h4 className="text-xs font-bold mb-1">Humidity</h4>
                            <div className="text-2xl font-bold gradient-text mb-1">
                              {weather.current.relative_humidity_2m}%
                            </div>
                            
                            {/* AI Generated Insight */}
                            <div className="mt-auto pt-2 border-t border-border">
                              {insightsLoading ? (
                                <div className="flex items-center gap-1">
                                  <motion.div
                                    className="w-1 h-1 rounded-full bg-primary/60"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                  />
                                  <motion.div
                                    className="w-1 h-1 rounded-full bg-primary/60"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                  />
                                  <motion.div
                                    className="w-1 h-1 rounded-full bg-primary/60"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                  />
                                </div>
                              ) : humidityInsight ? (
                                <div>
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                                    {humidityInsight.type}:
                                  </span>
                                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                                    {humidityInsight.text}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground">
                                  {weather.current.relative_humidity_2m > 70 ? "High humidity" : weather.current.relative_humidity_2m > 40 ? "Comfortable" : "Low humidity"}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                            No data
                          </div>
                        )}
                      </PremiumCard>
                    </motion.div>

                    <motion.div
                      onClick={() => setExpandedWidget(expandedWidget === "wind" ? null : "wind")}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PremiumCard className={`p-4 transition-all ${expandedWidget === "wind" ? "ring-2 ring-primary" : ""}`}>
                        {weather ? (
                          <div className="h-full flex flex-col">
                            <div className="mb-2">
                              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" strokeLinecap="round" />
                              </svg>
                            </div>
                            <h4 className="text-xs font-bold mb-1">Wind</h4>
                            <div className="text-2xl font-bold gradient-text">
                              {weather.current.wind_speed_10m}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">km/h</p>
                            
                            {/* AI Generated Insight */}
                            <div className="mt-auto pt-2 border-t border-border">
                              {insightsLoading ? (
                                <div className="flex items-center gap-1">
                                  <motion.div
                                    className="w-1 h-1 rounded-full bg-primary/60"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                  />
                                  <motion.div
                                    className="w-1 h-1 rounded-full bg-primary/60"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                  />
                                  <motion.div
                                    className="w-1 h-1 rounded-full bg-primary/60"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                  />
                                </div>
                              ) : windInsight ? (
                                <div>
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                                    {windInsight.type}:
                                  </span>
                                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                                    {windInsight.text}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground">
                                  {weather.current.wind_speed_10m > 30 ? "Strong winds" : weather.current.wind_speed_10m > 15 ? "Moderate" : "Light breeze"}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                            No data
                          </div>
                        )}
                      </PremiumCard>
                    </motion.div>
                  </div>

                  {/* Row 3 - 7-Day Forecast */}
                  <motion.div
                    onClick={() => setExpandedWidget(expandedWidget === "forecast" ? null : "forecast")}
                    className="cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PremiumCard className={`p-4 transition-all ${expandedWidget === "forecast" ? "ring-2 ring-primary" : ""}`}>
                      {weather ? (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold">7-Day Forecast</h4>
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                              <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </div>
                          
                          <div className="space-y-2">
                            {weather.daily.temperature_2m_max.slice(0, expandedWidget === "forecast" ? 7 : 3).map((max, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="font-medium w-12">Day {i + 1}</span>
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-muted-foreground">{weather.daily.temperature_2m_min[i]}°</span>
                                  <div className="flex-1 h-1.5 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full" />
                                  <span className="font-medium">{max}°</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {!expandedWidget && (
                            <p className="text-xs text-primary text-center mt-3">Click to see more →</p>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-sm text-muted-foreground">No forecast data</div>
                      )}
                    </PremiumCard>
                  </motion.div>
                </div>

                {/* Right Column - AI Advisor */}
                <div>
                  <PremiumCard className="p-5 h-full flex flex-col max-h-[600px]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                            <circle cx="9" cy="10" r="1" fill="currentColor" />
                            <circle cx="15" cy="10" r="1" fill="currentColor" />
                            <path d="M9 15h6" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">AI Advisor</h3>
                          <p className="text-xs text-muted-foreground">
                            Sustainable Advice for your business in {location.city !== "Detecting..." ? location.city : "Your Town"}
                          </p>
                        </div>
                      </div>
                      {chatHistory.length > 0 && (
                        <button
                          onClick={() => setChatHistory([])}
                          className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs transition-all"
                          title="Clear conversation"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
                      {chatHistory.length === 0 && !advisorStreaming && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center h-full text-center px-4"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16h6" strokeLinecap="round" />
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          </div>
                          <p className="text-xs font-medium mb-1">Ask me anything!</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Get tailored sustainability advice for your business and location
                          </p>
                        </motion.div>
                      )}

                      {chatHistory.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-br-sm' 
                              : 'bg-muted rounded-bl-sm'
                          }`}>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                      {/* Streaming Response */}
                      {advisorStreaming && advisorResponse && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-muted rounded-bl-sm">
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">
                              {advisorResponse}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Typing Indicator */}
                      {advisorStreaming && !advisorResponse && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted rounded-bl-sm">
                            <div className="flex items-center gap-1">
                              <motion.div
                                className="w-2 h-2 rounded-full bg-primary/60"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                              />
                              <motion.div
                                className="w-2 h-2 rounded-full bg-primary/60"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.div
                                className="w-2 h-2 rounded-full bg-primary/60"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask about sustainability..."
                        value={advisorQuestion}
                        onChange={(e) => setAdvisorQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            askAdvisor()
                          }
                        }}
                        disabled={advisorStreaming}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      />
                      <button
                        onClick={askAdvisor}
                        disabled={advisorStreaming || !advisorQuestion.trim()}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </PremiumCard>
                </div>
              </motion.div>
            )}

            {activeTab === "media" && (
              <motion.div
                key="media"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6"
                >
                  {/* Left Column - Controls */}
                  <div className="space-y-4">
                  <PremiumCard className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    {/* Header */}
                    <div className="mb-6">
                      <h4 className="text-base font-bold gradient-text mb-1">Media Studio</h4>
                      <p className="text-xs text-muted-foreground">
                        AI-Powered Creative Generation
                      </p>
                    </div>

                    {/* Media Type Selection */}
                    <div className="mb-5">
                      <label className="text-xs font-bold mb-2 block uppercase tracking-wide">Content Type</label>
                      <div className="grid grid-cols-2 gap-1">
                        <motion.button
                          onClick={() => setMediaType("image")}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative px-1.5 py-0.5 rounded-md text-xs font-semibold transition-all overflow-hidden ${
                            mediaType === "image"
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[9px]">Image</span>
                          </div>
                          {mediaType === "image" && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                        </motion.button>
                        
                        <motion.button
                          onClick={() => setMediaType("video")}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative px-1.5 py-0.5 rounded-md text-xs font-semibold transition-all overflow-hidden ${
                            mediaType === "video"
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            <span className="text-[9px]">Video</span>
                          </div>
                          {mediaType === "video" && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Custom Prompt */}
                    <div className="mb-4">
                      <label className="text-xs font-bold mb-2 block uppercase tracking-wide">Your Vision</label>
                      <textarea
                        placeholder="Describe your campaign visual... (sustainability theme will be added automatically)"
                        value={mediaPrompt}
                        onChange={(e) => setMediaPrompt(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary bg-background text-xs min-h-[90px] resize-none transition-colors"
                      />
                    </div>

                    {/* Aspect Ratio */}
                    <div className="mb-5">
                      <label className="text-xs font-bold mb-2 block uppercase tracking-wide">Platform Format</label>
                      <div className="grid grid-cols-3 gap-0.5">
                        {[
                          { ratio: "1:1", label: "Square", icon: "▢" },
                          { ratio: "16:9", label: "Landscape", icon: "▭" },
                          { ratio: "9:16", label: "Story", icon: "▯" },
                        ].map((option) => (
                          <motion.button
                            key={option.ratio}
                            onClick={() => setMediaAspectRatio(option.ratio)}
                            whileHover={{ scale: 1.005, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-1.5 py-0.5 rounded-md text-center transition-all ${
                              mediaAspectRatio === option.ratio
                                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs">{option.icon}</span>
                              <div className="text-[9px] font-semibold">{option.label}</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Branding */}
                    <div className="mb-5 p-2 rounded-lg bg-accent/30 border border-accent/50">
                      <label className="text-[9px] font-bold mb-2 block uppercase tracking-wide flex items-center gap-1">
                        <svg viewBox="0 0 24 24" className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M9 9h6v6H9z" />
                        </svg>
                        Brand Integration
                      </label>
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-media"
                      />
                      
                      {!uploadedLogo ? (
                        <label
                          htmlFor="logo-upload-media"
                          className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-background cursor-pointer transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-[9px] font-medium text-muted-foreground">Upload Your Logo</span>
                        </label>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-background border border-border">
                            <img src={uploadedLogo} alt="Logo" className="w-7 h-7 object-contain rounded" />
                            <div className="flex-1">
                              <p className="text-[9px] font-medium">Logo uploaded</p>
                              <p className="text-[9px] text-muted-foreground">Ready to apply</p>
                            </div>
                            <button
                              onClick={() => setUploadedLogo(null)}
                              className="p-0.5 rounded-lg hover:bg-muted transition-colors"
                            >
                              <svg viewBox="0 0 24 24" className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                          
                          <label className="flex items-center gap-1 p-1 rounded-lg bg-background border border-border cursor-pointer hover:border-primary/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={useBranding}
                              onChange={(e) => setUseBranding(e.target.checked)}
                              className="rounded w-2.5 h-2.5"
                            />
                            <span className="text-[9px] font-medium">Apply logo to generated media</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Generate Button */}
                    <motion.button
                      onClick={generateMedia}
                      disabled={isGenerating || !mediaPrompt.trim()}
                      whileHover={!isGenerating && mediaPrompt.trim() ? { scale: 1.01 } : {}}
                      whileTap={!isGenerating && mediaPrompt.trim() ? { scale: 0.98 } : {}}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground font-bold text-[9px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1">
                        {isGenerating ? (
                          <>
                            <motion.svg 
                              viewBox="0 0 24 24" 
                              className="w-2.5 h-2.5" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                            </motion.svg>
                            Generating {mediaType}...
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Generate {mediaType === "image" ? "Image" : "Video"}
                          </>
                        )}
                      </span>
                      
                      {!isGenerating && mediaPrompt.trim() && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                    </motion.button>
                  </PremiumCard>
                </div>

                {/* Right Column - Preview & References (70%) */}
                <div className="space-y-4">
                  {/* Tab Navigation */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setActiveMediaTab("preview")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeMediaTab === "preview"
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Preview
                      </div>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => setActiveMediaTab("references")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                        activeMediaTab === "references"
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        References
                        {mediaGallery.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                            {mediaGallery.length}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  </div>

                  {/* Content Area */}
                  <AnimatePresence mode="wait">
                    {activeMediaTab === "preview" ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PremiumCard className="p-6 min-h-[500px] flex flex-col items-center justify-center">
                          {generatedMedia ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-full"
                            >
                              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 mb-4">
                                {mediaType === "image" ? (
                                  <img src={generatedMedia} alt="Generated" className="w-full rounded-2xl" />
                                ) : (
                                  <video src={generatedMedia} controls className="w-full rounded-2xl" />
                                )}
                              </div>
                              
                              {/* Actions */}
                              <div className="flex gap-2">
                                <a
                                  href={generatedMedia}
                                  download={`sustainability-${mediaType}-${Date.now()}.${mediaType === "image" ? "jpg" : "mp4"}`}
                                  className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-semibold text-center hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  Download
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedMedia)
                                  }}
                                  className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold transition-all flex items-center gap-2"
                                >
                                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                  </svg>
                                  Copy URL
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="text-center">
                              <motion.div
                                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 mb-4"
                                animate={{ 
                                  scale: [1, 1.05, 1],
                                  rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <svg viewBox="0 0 24 24" className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </motion.div>
                              <h4 className="text-base font-bold mb-2">No Media Generated Yet</h4>
                              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                                Configure your settings in the control panel and generate your first sustainability campaign visual
                              </p>
                              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                                  <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z" />
                                </svg>
                                <span>All content is sustainability-optimized</span>
                              </div>
                            </div>
                          )}
                        </PremiumCard>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="references"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PremiumCard className="p-6 min-h-[500px]">
                          {mediaGallery.length > 0 ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="text-sm font-bold">Your Gallery</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {mediaGallery.length} {mediaGallery.length === 1 ? 'item' : 'items'} generated
                                  </p>
                                </div>
                                <button
                                  onClick={() => setMediaGallery([])}
                                  className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-all"
                                >
                                  Clear All
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 max-h-[550px] overflow-y-auto">
                                {mediaGallery.map((item, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="group relative rounded-xl overflow-hidden bg-muted/30 cursor-pointer"
                                    onClick={() => {
                                      setGeneratedMedia(item.url)
                                      setActiveMediaTab("preview")
                                    }}
                                  >
                                    {item.type === "image" ? (
                                      <img src={item.url} alt={item.prompt} className="w-full aspect-square object-cover" />
                                    ) : (
                                      <video src={item.url} className="w-full aspect-square object-cover" />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <p className="text-xs text-white font-medium line-clamp-2">{item.prompt}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-xs text-white font-medium">
                                            {item.type}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                          <circle cx="12" cy="12" r="3" />
                                        </svg>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                              <motion.div
                                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 mb-4"
                                animate={{ 
                                  scale: [1, 1.05, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <svg viewBox="0 0 24 24" className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="7" height="7" />
                                  <rect x="14" y="3" width="7" height="7" />
                                  <rect x="14" y="14" width="7" height="7" />
                                  <rect x="3" y="14" width="7" height="7" />
                                </svg>
                              </motion.div>
                              <h4 className="text-base font-bold mb-2">No References Yet</h4>
                              <p className="text-sm text-muted-foreground max-w-md">
                                Generated images and videos will appear here as templates and references for your future campaigns
                              </p>
                            </div>
                          )}
                        </PremiumCard>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Templates Showcase */}
                  {activeMediaTab === "preview" && !generatedMedia && (
                    <PremiumCard className="p-5">
                      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Quick Start Templates
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {promptTemplates.slice(0, 4).map((template, i) => (
                          <motion.button
                            key={i}
                            onClick={() => setMediaPrompt(template)}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-3 py-2 rounded-lg bg-muted/50 hover:bg-accent text-xs text-left transition-all border border-transparent hover:border-primary/30 flex items-start gap-2"
                          >
                            <svg viewBox="0 0 24 24" className="w-3 h-3 flex-shrink-0 mt-0.5 text-primary" fill="currentColor">
                              <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z" />
                            </svg>
                            <span className="flex-1">{template}</span>
                          </motion.button>
                        ))}
                      </div>
                    </PremiumCard>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Try All Tools Card - Now Below Main Content */}
        <div className="max-w-md mx-auto">
          <PremiumCard className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 3l1.5 5 5 .5-4 3.5 1 5-3.5-2.5-3.5 2.5 1-5-4-3.5 5-.5z" fill="currentColor" opacity="0.2" />
                  <path d="M12 3l1.5 5 5 .5-4 3.5 1 5-3.5-2.5-3.5 2.5 1-5-4-3.5 5-.5z" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              </div>
              <h4 className="text-sm font-bold mb-2">Try All Tools</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Experience AI-powered sustainability management for your SME
              </p>
              <div className="flex justify-center">
                <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all">
                  Get Started
                </button>
              </div>
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  )
}