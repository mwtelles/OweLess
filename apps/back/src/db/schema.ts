import { pgTable, serial, text, integer, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const debts = pgTable('debts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    principal: numeric('principal', { precision: 14, scale: 2 }).notNull(),
    interestRateYear: numeric('interest_rate_year', { precision: 7, scale: 4 }).notNull(), // e.g. 0.1450 for 14.5%
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    isClosed: boolean('is_closed').default(false).notNull()
});

export const installments = pgTable('installments', {
    id: serial('id').primaryKey(),
    debtId: integer('debt_id').notNull().references(() => debts.id),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
