import {
    pgTable, serial, text, integer, timestamp, numeric, boolean, pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const debtTypeEnum = pgEnum('debt_type', ['loan', 'financing', 'student', 'credit_card', 'other']);
export const amortEnum = pgEnum('amortization_system', ['PRICE', 'SAC']);
export const rateTypeEnum = pgEnum('rate_type', ['fixed_nominal_year', 'fixed_nominal_month', 'indexed_variable']);
export const instStatus = pgEnum('installment_status', ['pending', 'paid', 'overdue', 'partially_paid']);

export const debts = pgTable('debts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    type: debtTypeEnum('type').default('loan').notNull(),
    principal: numeric('principal', { precision: 16, scale: 2 }).notNull(),
    rateType: rateTypeEnum('rate_type').default('fixed_nominal_year').notNull(),
    nominalRate: numeric('nominal_rate', { precision: 9, scale: 6 }),
    spreadRate: numeric('spread_rate', { precision: 9, scale: 6 }),
    amortizationSystem: amortEnum('amortization_system').default('PRICE').notNull(),
    termMonths: integer('term_months'),
    paymentDay: integer('payment_day'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    graceMonths: integer('grace_months').default(0).notNull(),
    monthlyFees: numeric('monthly_fees', { precision: 12, scale: 2 }).default('0').notNull(),
    isClosed: boolean('is_closed').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const installments = pgTable('installments', {
    id: serial('id').primaryKey(),
    debtId: integer('debt_id')
        .notNull()
        .references(() => debts.id, { onDelete: 'cascade' }),
    number: integer('number').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    expectedInterest: numeric('expected_interest', { precision: 16, scale: 2 }).default('0').notNull(),
    expectedPrincipal: numeric('expected_principal', { precision: 16, scale: 2 }).default('0').notNull(),
    expectedFees: numeric('expected_fees', { precision: 16, scale: 2 }).default('0').notNull(),
    expectedTotal: numeric('expected_total', { precision: 16, scale: 2 }).default('0').notNull(),
    paidInterest: numeric('paid_interest', { precision: 16, scale: 2 }).default('0').notNull(),
    paidPrincipal: numeric('paid_principal', { precision: 16, scale: 2 }).default('0').notNull(),
    paidFees: numeric('paid_fees', { precision: 16, scale: 2 }).default('0').notNull(),
    paidTotal: numeric('paid_total', { precision: 16, scale: 2 }).default('0').notNull(),
    remainingPrincipalAfter: numeric('remaining_principal_after', { precision: 16, scale: 2 }).default('0').notNull(),
    status: instStatus('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const paymentEvents = pgTable('payment_events', {
    id: serial('id').primaryKey(),
    debtId: integer('debt_id')
        .notNull()
        .references(() => debts.id, { onDelete: 'cascade' }),
    installmentId: integer('installment_id')
        .references(() => installments.id, { onDelete: 'cascade' }),
    paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
    amount: numeric('amount', { precision: 16, scale: 2 }).notNull(),
    interestPortion: numeric('interest_portion', { precision: 16, scale: 2 }).default('0').notNull(),
    principalPortion: numeric('principal_portion', { precision: 16, scale: 2 }).default('0').notNull(),
    feesPortion: numeric('fees_portion', { precision: 16, scale: 2 }).default('0').notNull(),
    penaltyPortion: numeric('penalty_portion', { precision: 16, scale: 2 }).default('0').notNull(),
    isExtraAmortization: boolean('is_extra_amortization').default(false).notNull(),
    note: text('note')
});
