import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  role: text('role'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);

// Backs better-auth's `rateLimit: { storage: 'database' }`.
export const rateLimit = sqliteTable(
  'rateLimit',
  {
    id: text('id').primaryKey(),
    key: text('key'),
    count: integer('count'),
    lastRequest: integer('last_request'),
  },
  (table) => [index('rateLimit_key_idx').on(table.key)]
);

// Contact-form submissions (merged field set: reference inquiry fields +
// the local contact form's fields). B2B inquiries + site contact messages.
export const inquiry = sqliteTable('inquiry', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  country: text('country').notNull().default(''),
  email: text('email').notNull(),
  whatsapp: text('whatsapp').notNull().default(''),
  businessType: text('business_type').notNull().default('other'), // InquiryBusinessType
  quantity: text('quantity').notNull().default('unsure'), // InquiryQuantity
  requirements: text('requirements').notNull().default(''),
  subject: text('subject').notNull().default(''),
  message: text('message').notNull().default(''),
  address: text('address').notNull().default(''),
  zip: text('zip').notNull().default(''),
  tel: text('tel').notNull().default(''),
  logoKey: text('logo_key'),
  status: text('status').notNull().default('new'), // InquiryStatus
  locale: text('locale').notNull().default('en'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  // Structured inquiry metadata (migration 0004). Optional so the worker can
  // keep writing if the migration has not been applied yet.
  submissionKey: text('submission_key'),
  buyerType: text('buyer_type'),
  productType: text('product_type'),
  productInterest: text('product_interest'),
  sourceUrl: text('source_url'),
  referrer: text('referrer'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  emailStatus: text('email_status'),
  emailError: text('email_error'),
  emailSentAt: integer('email_sent_at'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export type Inquiry = typeof inquiry.$inferSelect;
export type InquiryStatus = 'new' | 'contacted' | 'quoted' | 'closed';
export const INQUIRY_STATUSES: InquiryStatus[] = ['new', 'contacted', 'quoted', 'closed'];

// News posts (English-only canonical content; per-language chrome is applied
// by the news-worker when rendering /news and /{lang}/news routes).
export const newPost = sqliteTable(
  'news',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    body: text('body').notNull().default(''),
    image: text('image'),
    category: text('category'),
    tags: text('tags').notNull().default('[]'),
    author: text('author'),
    publishDate: integer('publish_date', { mode: 'timestamp_ms' }).notNull(),
    updateDate: integer('update_date', { mode: 'timestamp_ms' }),
    draft: integer('draft', { mode: 'boolean' }).notNull().default(false),
    metadataTitle: text('metadata_title'),
    metadataDescription: text('metadata_description'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('news_category_idx').on(table.category)]
);

export type News = typeof newPost.$inferSelect;
