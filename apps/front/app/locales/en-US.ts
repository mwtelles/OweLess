export default {
    common: {
        appName: 'OweLess',
        save: 'Save',
        cancel: 'Cancel',
        back: 'Back',
        open: 'Open',
        close: 'Close',
        loading: 'Loading...',
        noData: 'No data',
        actions: 'Actions',
        edit: 'Edit',
        title: 'Title',
        create: 'Create',
        saveCreate: 'Create',
        monthsShort: 'mo',
    },
    errors: {
        failedLoadDebts: 'Failed to load debts',
        failedCreateDebt: 'Failed to create debt',
        failedLoadInstallments: 'Failed to load installments',
        failedRegisterPayment: 'Failed to register payment',
        failedLoadSummary: 'Failed to load data'
    },
    validation: {
        title: 'Validation',
        requiredFields: 'Fill required fields.',
        amountRequired: 'Amount is required.',
    },
    nav: {
        dashboard: 'Dashboard',
        debts: 'Debts',
        payments: 'Payments',
        profile: 'Profile',
        logout: 'Logout',
        settings: 'Settings',
    },
    settings: {
        language: 'Language',
        currency: 'Currency',
    },
    profile: {
        myAccount: 'My Account',
    },
    auth: {
        noAccount: 'Don\'t have an account?',
        login: 'Login',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        logout: 'Logout',
        forgotPassword: 'Forgot password',
        createAccount: 'Create Account',
        creating: 'Creating account...',
        alreadyHaveAccount: 'Already have an account?'
    },
    debts: {
        title: 'Debts',
        newDebt: 'New Debt',
        principal: 'Principal',
        rateType: 'Rate type',
        nominalYear: 'Nominal rate (year)',
        nominalMonth: 'Nominal rate (month)',
        spread: 'Spread (indexed)',
        amortization: 'Amortization',
        termMonths: 'Term (months)',
        paymentDay: 'Payment day',
        startDate: 'Start date',
        graceMonths: 'Grace (months)',
        monthlyFees: 'Monthly fees',
        createDebt: 'Create Debt',
        installments: 'Installments',
        summary: 'Summary',
        single: 'Debt',
        created: 'Debt created',
        rateTypeFixedYear: 'Fixed (year)',
        rateTypeFixedMonth: 'Fixed (month)',
        rateTypeIndexed: 'Indexed',
        examples: {
            nominalYear: 'e.g., 0.145 = 14.5%/year',
            nominalMonth: 'e.g., 0.012 = 1.2%/month',
            spread: 'e.g., 0.03 = +3% over index'
        },
        termLabel: 'Term: {months} {unit}',
        nominalRate: 'Nominal rate',
        types: {
            loan: 'Loan',
            financing: 'Financing',
            student: 'Student',
            credit_card: 'Credit card',
            other: 'Other'
        }
    },
    summary: {
        totalExpected: 'Total Expected',
        totalPaid: 'Total Paid',
        remainingPrincipal: 'Remaining Principal',
        overdueCount: 'Overdue Count',
        nextDue: 'Next Due',
        snapshot: 'Snapshot',
        goPay: 'Go pay',
        title: 'Summary',
        titleDebt: 'Debt Summary',
        ofExpected: '{pct} of expected',
        chart: {
            remainingPrincipal: 'Remaining Principal',
            expectedCum: 'Expected (cum.)',
            paidCum: 'Paid (cum.)',
            interest: 'Interest',
            principal: 'Principal',
            remainingTitle: 'Remaining Principal over time',
            cumTitle: 'Cumulative Expected vs Paid',
            ipTitle: 'Interest vs Principal (first 24)'
        }
    },
    payments: {
        single: 'Payment',
        pay: 'Pay',
        register: 'Register',
        registered: 'Payment registered',
        registerPayment: 'Register Payment',
        amount: 'Amount',
        paidAt: 'Paid at',
        extraAmort: 'Extra amortization (reduce principal)'
    },
    dashboard: {
        title: 'Dashboard',
        paidBreakdown: 'Paid Breakdown',
        remainingByDebt: 'Remaining by Debt (Top 10)',
        expectedVsPaid: 'Expected vs Paid by Debt (Top 10)',
        upcomingDues: 'Upcoming dues'
    },
    status: {
        pending: 'Pending',
        paid: 'Paid',
        overdue: 'Overdue',
        partially_paid: 'Partially paid'
    },
    installments: {
        title: 'Installments',
        due: 'Due',
        expected: 'Expected',
        paid: 'Paid',
        status: 'Status',
        remainingAfter: 'Remain after'
    },
}
