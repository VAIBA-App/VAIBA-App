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
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Enums
export const callStatusEnum = pgEnum('call_status', ['positive', 'negative', 'neutral']);
export const customerTypeEnum = pgEnum('customer_type', ['lead', 'customer', 'prospect']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'editor', 'user']);

// Profile table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  origin: text("origin").notNull(),
  location: text("location").notNull(),
  education: text("education").notNull(),
  position: text("position").notNull(),
  company: text("company").notNull(),
  languages: text("languages").array().notNull(),
  imageUrl: text("image_url"),
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

// Users table
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

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  calls: many(calls),
  conversations: many(conversations),
}));

export const callsRelations = relations(calls, ({ one }) => ({
  customer: one(customers, {
    fields: [calls.customerId],
    references: [customers.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  customer: one(customers, {
    fields: [conversations.customerId],
    references: [customers.id],
  }),
}));

// Rest of the types and schemas
export type Customer = typeof customers.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type InsertCall = typeof calls.$inferInsert;
export type InsertConversation = typeof conversations.$inferInsert;
export type InsertUser = typeof users.$inferInsert;

// Additional schemas
export const insertCustomerSchema = createInsertSchema(customers);
export const insertCallSchema = createInsertSchema(calls);
export const insertConversationSchema = createInsertSchema(conversations);
export const insertUserSchema = createInsertSchema(users);

export const selectCustomerSchema = createSelectSchema(customers);
export const selectCallSchema = createSelectSchema(calls);
export const selectConversationSchema = createSelectSchema(conversations);
export const selectUserSchema = createSelectSchema(users);