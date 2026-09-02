import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const domains = sqliteTable('domains', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  hostname: text('hostname').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const emails = sqliteTable('emails', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  fromAddr: text('from_addr').notNull(),
  toAddr: text('to_addr').notNull(),
  subject: text('subject'),
  textBody: text('text_body'),
  htmlBody: text('html_body'),
  r2Key: text('r2_key'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  direction: text('direction', { enum: ['inbound', 'outbound'] }).notNull().default('inbound'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
