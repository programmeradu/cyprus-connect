import { pgTable, serial, text, real, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const sustainabilityMetrics = pgTable('sustainability_metrics', {
  id: serial('id').primaryKey(),
  metricType: text('metric_type').notNull(),
  value: real('value').notNull(),
  unit: text('unit').notNull(),
  trend: text('trend').notNull(),
  trendValue: real('trend_value').notNull(),
  color: text('color').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const emissionsHistory = pgTable('emissions_history', {
  id: serial('id').primaryKey(),
  month: text('month').notNull(),
  value: real('value').notNull(),
  emissions: real('emissions').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const greenActions = pgTable('green_actions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  impact: text('impact').notNull(),
  credits: integer('credits').notNull(),
  orderIndex: integer('order_index').notNull(),
});

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  greenCredits: integer('green_credits').notNull().default(0),
  leaderboardRank: integer('leaderboard_rank').notNull(),
  completedActionIds: text('completed_action_ids').notNull().default('[]'),
  updatedAt: timestamp('updated_at').notNull(),
});

export const leaderboard = pgTable('leaderboard', {
  id: serial('id').primaryKey(),
  companyName: text('company_name').notNull(),
  credits: integer('credits').notNull(),
  rank: integer('rank').notNull(),
  isDemoUser: boolean('is_demo_user').notNull().default(false),
});

// CONSOLIDATED USER TABLE - Merged better-auth + custom fields
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  // Custom business fields from old "users" table
  companyName: text('company_name'),
  companyIndustry: text('company_industry'),
  teamSize: text('team_size'),
  sustainabilityGoals: text('sustainability_goals'),
  totalCredits: integer('total_credits').notNull().default(0),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  // Location and currency preferences
  preferredCurrency: text('preferred_currency'),
  countryCode: text('country_code'),
  timezone: text('timezone'),
  energyZone: text('energy_zone'),
  // Autumn subscription sync fields
  autumnCustomerId: text('autumn_customer_id'),
  autumnPlan: text('autumn_plan').notNull().default('free'),
  aiCreditsBalance: integer('ai_credits_balance').notNull().default(50),
  lastAutumnSync: timestamp('last_autumn_sync'),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const emissions = pgTable('emissions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  electricity: real('electricity').notNull(),
  gas: real('gas').notNull(),
  water: real('water').notNull(),
  waste: real('waste').notNull(),
  transport: real('transport').notNull(),
  totalCo2e: real('total_co2e').notNull(),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  createdAt: text('created_at').notNull(),
});

export const actions = pgTable('actions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  impact: text('impact').notNull(),
  difficulty: text('difficulty').notNull(),
  points: integer('points').notNull(),
  iconName: text('icon_name').notNull(),
  isCustom: boolean('is_custom').notNull().default(false),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
});

export const userActions = pgTable('user_actions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  actionId: integer('action_id').notNull().references(() => actions.id),
  completedAt: text('completed_at').notNull(),
  notes: text('notes'),
});

export const creditsHistory = pgTable('credits_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  actionId: integer('action_id').references(() => actions.id),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  fileUrl: text('file_url').notNull(),
  uploadSource: text('upload_source').notNull(),
  processingStatus: text('processing_status').notNull().default('pending'),
  ocrText: text('ocr_text'),
  parsedData: text('parsed_data'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const integrations = pgTable('integrations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  integrationType: text('integration_type').notNull(),
  providerName: text('provider_name').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: text('token_expires_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastSyncAt: text('last_sync_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => new Date(),
  ),
});

export const dashboardMetrics = pgTable('dashboard_metrics', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  metricType: text('metric_type').notNull(),
  currentValue: real('current_value').notNull(),
  previousValue: real('previous_value').notNull(),
  trendPercentage: real('trend_percentage').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const historicalEmissions = pgTable('historical_emissions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  electricityKwh: real('electricity_kwh').notNull(),
  gasM3: real('gas_m3').notNull(),
  waterLiters: real('water_liters').notNull(),
  wasteKg: real('waste_kg').notNull(),
  transportKm: real('transport_km').notNull(),
  totalCo2e: real('total_co2e').notNull(),
  renewablePercentage: real('renewable_percentage').notNull(),
  efficiencyScore: real('efficiency_score').notNull(),
  wasteDiversionRate: real('waste_diversion_rate').notNull(),
  createdAt: text('created_at').notNull(),
});

export const sustainabilityGoalsProgress = pgTable('sustainability_goals_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  goalType: text('goal_type').notNull(),
  targetValue: real('target_value').notNull(),
  currentValue: real('current_value').notNull(),
  targetYear: integer('target_year').notNull(),
  progressPercentage: real('progress_percentage').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const industryComparisons = pgTable('industry_comparisons', {
  id: serial('id').primaryKey(),
  industry: text('industry').notNull(),
  metricType: text('metric_type').notNull(),
  averageValue: real('average_value').notNull(),
  topQuartileValue: real('top_quartile_value').notNull(),
  bottomQuartileValue: real('bottom_quartile_value').notNull(),
  unit: text('unit').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  metadata: text('metadata'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  emissionAlerts: boolean('emission_alerts').notNull().default(true),
  goalAlerts: boolean('goal_alerts').notNull().default(true),
  leaderboardAlerts: boolean('leaderboard_alerts').notNull().default(false),
  actionAlerts: boolean('action_alerts').notNull().default(true),
  insightAlerts: boolean('insight_alerts').notNull().default(true),
  complianceAlerts: boolean('compliance_alerts').notNull().default(true),
  systemAlerts: boolean('system_alerts').notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const mediaGenerations = pgTable('media_generations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // "image" or "video"
  url: text('url').notNull(),
  prompt: text('prompt').notNull(),
  enhancedPrompt: text('enhanced_prompt'),
  model: text('model'), // "imagen-4.0-generate-001" or "gemini-2.5-flash-image"
  modelReason: text('model_reason'),
  contextType: text('context_type'), // "company_data", "progress", "insights", "recommendations", "custom"
  aspectRatio: text('aspect_ratio'), // e.g., "16:9", "1:1"
  edited: boolean('edited').notNull().default(false),
  editParameters: text('edit_parameters'), // JSON string
  saved: boolean('saved').notNull().default(false), // For Library feature
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  industry: text('industry'),
  difficultyLevel: text('difficulty_level').notNull(),
  estimatedHours: real('estimated_hours'),
  prerequisites: text('prerequisites'),
  learningObjectives: text('learning_objectives'),
  createdBy: text('created_by').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  tags: text('tags'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const courseModules = pgTable('course_modules', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  estimatedMinutes: integer('estimated_minutes'),
  createdAt: text('created_at').notNull(),
});

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  contentType: text('content_type').notNull(),
  contentJson: text('content_json'),
  videoUrl: text('video_url'),
  isRequired: boolean('is_required').notNull().default(true),
  estimatedMinutes: integer('estimated_minutes'),
  createdAt: text('created_at').notNull(),
});

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  questionsJson: text('questions_json').notNull(),
  passingScore: integer('passing_score').notNull(),
  maxAttempts: integer('max_attempts').notNull().default(3),
  createdAt: text('created_at').notNull(),
});

export const lmsUserProgress = pgTable('lms_user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: text('enrolled_at').notNull(),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  currentModuleId: integer('current_module_id'),
  currentLessonId: integer('current_lesson_id'),
  progressPercentage: real('progress_percentage').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userLessonCompletions = pgTable('user_lesson_completions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completedAt: text('completed_at').notNull(),
  timeSpent: integer('time_spent'),
  score: integer('score'),
  passed: boolean('passed'),
});

export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  issuedAt: text('issued_at').notNull(),
  certificateUrl: text('certificate_url'),
  verificationCode: text('verification_code').notNull().unique(),
});

// ============================================
// CARBON OFFSET MARKETPLACE TABLES
// ============================================

export const offsetProjects = pgTable('offset_projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // forestry, renewable_energy, carbon_capture, ocean_conservation
  location: text('location').notNull(),
  certification: text('certification').notNull(),
  pricePerTon: real('price_per_ton').notNull(),
  totalCapacityTons: real('total_capacity_tons').notNull(),
  availableTons: real('available_tons').notNull(),
  projectStartDate: text('project_start_date').notNull(),
  projectEndDate: text('project_end_date'),
  verificationStatus: text('verification_status').notNull(),
  impactMetrics: text('impact_metrics').notNull(), // JSON
  imageUrl: text('image_url'),
  bannerImage: text('banner_image'), // AI-generated banner based on project details
  isFeatured: boolean('is_featured').notNull().default(false),
  sdgGoals: text('sdg_goals'), // JSON
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const offsetPurchases = pgTable('offset_purchases', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => offsetProjects.id, { onDelete: 'cascade' }),
  tonsPurchased: real('tons_purchased').notNull(),
  pricePaid: real('price_paid').notNull(),
  stripePaymentId: text('stripe_payment_id').notNull(),
  certificateUrl: text('certificate_url'),
  certificateNumber: text('certificate_number').unique(),
  status: text('status').notNull(),
  purchasedAt: text('purchased_at').notNull(),
});

export const userImpactTracking = pgTable('user_impact_tracking', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  totalTonsOffset: real('total_tons_offset').notNull().default(0),
  totalSpent: real('total_spent').notNull().default(0),
  projectsSupported: integer('projects_supported').notNull().default(0),
  firstPurchaseAt: text('first_purchase_at'),
  lastPurchaseAt: text('last_purchase_at'),
  updatedAt: text('updated_at').notNull(),
});

// ============================================
// PAYMENT & SUBSCRIPTION TABLES
// ============================================

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  planId: text('plan_id').notNull().default('free'), // free, pro, enterprise
  status: text('status').notNull().default('active'), // active, canceled, past_due, trialing, incomplete
  currentPeriodStart: text('current_period_start'),
  currentPeriodEnd: text('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  trialEnd: text('trial_end'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const paymentHistory = pgTable('payment_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  stripePaymentId: text('stripe_payment_id').notNull().unique(),
  amount: integer('amount').notNull(), // Amount in cents
  currency: text('currency').notNull().default('usd'),
  status: text('status').notNull(), // succeeded, pending, failed, refunded
  paymentType: text('payment_type').notNull(), // subscription, one_time, credits
  description: text('description').notNull(),
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').notNull(),
});

export const creditPurchases = pgTable('credit_purchases', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  stripePaymentId: text('stripe_payment_id').notNull(),
  creditsPurchased: integer('credits_purchased').notNull(),
  amountPaid: integer('amount_paid').notNull(), // Amount in cents
  currency: text('currency').notNull().default('usd'),
  createdAt: text('created_at').notNull(),
});

// ============================================
// COMPLIANCE MANAGEMENT TABLES
// ============================================

export const complianceRegulations = pgTable('compliance_regulations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  regulationId: text('regulation_id').notNull(), // csrd, cdp, ghg, sec
  name: text('name').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  status: text('status').notNull(), // compliant, action_required, upcoming
  nextDeadline: text('next_deadline').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(), // JSON array
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const complianceDocuments = pgTable('compliance_documents', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  regulationId: text('regulation_id').notNull(),
  title: text('title').notNull(),
  framework: text('framework').notNull(),
  status: text('status').notNull(), // draft, ready, submitted
  content: text('content').notNull(),
  generatedAt: text('generated_at').notNull(),
  dueDate: text('due_date').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const complianceAuditLogs = pgTable('compliance_audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  details: text('details').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
});

export const complianceSettings = pgTable('compliance_settings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  jurisdictions: text('jurisdictions').notNull(), // JSON array
  autoSubmit: boolean('auto_submit').notNull().default(false),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});