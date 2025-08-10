DO $$ BEGIN
 CREATE TYPE "public"."amortization_system" AS ENUM('PRICE', 'SAC');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."debt_type" AS ENUM('loan', 'financing', 'student', 'credit_card', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."installment_status" AS ENUM('pending', 'paid', 'overdue', 'partially_paid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."rate_type" AS ENUM('fixed_nominal_year', 'fixed_nominal_month', 'indexed_variable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"debt_id" integer NOT NULL,
	"installment_id" integer,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"interest_portion" numeric(16, 2) DEFAULT '0' NOT NULL,
	"principal_portion" numeric(16, 2) DEFAULT '0' NOT NULL,
	"fees_portion" numeric(16, 2) DEFAULT '0' NOT NULL,
	"penalty_portion" numeric(16, 2) DEFAULT '0' NOT NULL,
	"is_extra_amortization" boolean DEFAULT false NOT NULL,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "debts" ALTER COLUMN "principal" SET DATA TYPE numeric(16, 2);--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "type" "debt_type" DEFAULT 'loan' NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "rate_type" "rate_type" DEFAULT 'fixed_nominal_year' NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "nominal_rate" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "spread_rate" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "amortization_system" "amortization_system" DEFAULT 'PRICE' NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "term_months" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "payment_day" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "grace_months" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "monthly_fees" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "expected_interest" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "expected_principal" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "expected_fees" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "expected_total" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "paid_interest" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "paid_principal" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "paid_fees" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "paid_total" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "remaining_principal_after" numeric(16, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "status" "installment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_installment_id_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."installments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "debts" DROP COLUMN IF EXISTS "interest_rate_year";--> statement-breakpoint
ALTER TABLE "installments" DROP COLUMN IF EXISTS "amount";--> statement-breakpoint
ALTER TABLE "installments" DROP COLUMN IF EXISTS "paid_at";