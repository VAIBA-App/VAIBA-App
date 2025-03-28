import { 
  pgTable, 
  text, 
  serial, 
  timestamp, 
  integer,
  json,
  boolean,
  pgEnum,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Enums
export const callStatusEnum = pgEnum('call_status', ['positive', 'negative', 'neutral']);
export const customerTypeEnum = pgEnum('customer_type', ['lead', 'customer', 'prospect']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'editor', 'user']);

// Profile table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lastName: text("last_name"),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  origin: text("origin").notNull(),
  location: text("location").notNull(),
  education: text("education").notNull(),
  position: text("position").notNull(),
  company: text("company").notNull(),
  languages: text("languages").array().notNull(),
  imageUrl: text("image_url"),
  voiceId: text("voice_id"),
  voiceSettings: json("voice_settings").$type<{
    stability: number;
    similarityBoost: number;
    style: number;
    speed: number;
  }>(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  address: text("address"),
  type: customerTypeEnum("type").default('prospect'),
  notes: text("notes"),
  status: callStatusEnum("status").default('neutral'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  dialog: json("dialog").$type<{
    customerText: string;
    gptResponse: string;
  }[]>(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Calls table
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  duration: integer("duration").notNull(),
  status: callStatusEnum("status").notNull(),
  transcript: text("transcript"),
  audioUrl: text("audio_url"),
  sentiment: json("sentiment").$type<{
    rating: number;
    confidence: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  isAutomated: boolean("is_automated").default(false),
});

// New auth-related tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified"),
  name: text("name"),
  image: text("image"),
  password: text("password"),
  role: userRoleEnum("role").default('user'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  accessToken: text("access_token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Schema types
export type Customer = typeof customers.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type InsertCall = typeof calls.$inferInsert;
export type InsertConversation = typeof conversations.$inferInsert;
export type InsertUser = typeof users.$inferInsert;
export type InsertAccount = typeof accounts.$inferInsert;
export type InsertSession = typeof sessions.$inferInsert;
export type InsertVerificationToken = typeof verificationTokens.$inferInsert;


// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers);
export const insertCallSchema = createInsertSchema(calls);
export const insertConversationSchema = createInsertSchema(conversations);
export const insertUserSchema = createInsertSchema(users);
export const insertAccountSchema = createInsertSchema(accounts);
export const insertSessionSchema = createInsertSchema(sessions);
export const insertVerificationTokenSchema = createInsertSchema(verificationTokens);

// Select schemas
export const selectCustomerSchema = createSelectSchema(customers);
export const selectCallSchema = createSelectSchema(calls);
export const selectConversationSchema = createSelectSchema(conversations);
export const selectUserSchema = createSelectSchema(users);
export const selectAccountSchema = createSelectSchema(accounts);
export const selectSessionSchema = createSelectSchema(sessions);
export const selectVerificationTokenSchema = createSelectSchema(verificationTokens);

// Business Information table
export const Business_Information = pgTable("Business_Information", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  online_service: boolean("online_service").default(false),
  local_service: boolean("local_service").default(false),
  online_product: boolean("online_product").default(false),
  local_product: boolean("local_product").default(false),
  street: varchar("street", { length: 255 }),
  zip_code: varchar("zip_code", { length: 20 }),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 255 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  vat_id: varchar("vat_id", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Business Information types and schemas
export type BusinessInformation = typeof Business_Information.$inferSelect;
export type InsertBusinessInformation = typeof Business_Information.$inferInsert;

export const insertBusinessInformationSchema = createInsertSchema(Business_Information);
export const selectBusinessInformationSchema = createSelectSchema(Business_Information);

// Assets table - using text for binary data storage
export const Assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  data: text("data").notNull(),  // Store base64 encoded data as text
  mime_type: varchar("mime_type", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Website Designs table
export const WebsiteDesigns = pgTable("website_designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  designDescription: text("design_description").notNull(),
  generatedCode: text("generated_code"),
  previewUrl: text("preview_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Assets types and schemas
export type Asset = typeof Assets.$inferSelect;
export type InsertAsset = typeof Assets.$inferInsert;

export const insertAssetSchema = createInsertSchema(Assets);
export const selectAssetSchema = createSelectSchema(Assets);

// Website Designs types and schemas
export type WebsiteDesign = typeof WebsiteDesigns.$inferSelect;
export type InsertWebsiteDesign = typeof WebsiteDesigns.$inferInsert;

export const insertWebsiteDesignSchema = createInsertSchema(WebsiteDesigns);
export const selectWebsiteDesignSchema = createSelectSchema(WebsiteDesigns);