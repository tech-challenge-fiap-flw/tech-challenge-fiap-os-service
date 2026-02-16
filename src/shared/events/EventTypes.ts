export const EventTypes = {
  // OS Service events (publicado)
  OS_CREATED: 'os.created',
  OS_ACCEPTED: 'os.accepted',
  OS_BUDGET_APPROVED: 'os.budget-approved',
  OS_BUDGET_REJECTED: 'os.budget-rejected',
  OS_STATUS_CHANGED: 'os.status-changed',

  // Billing Service events (consumidos pelo OS Service)
  BILLING_BUDGET_CREATED: 'billing.budget-created',
  BILLING_STOCK_REVERSED: 'billing.stock-reversed',
  BILLING_PAYMENT_CONFIRMED: 'billing.payment-confirmed',
  BILLING_PAYMENT_FAILED: 'billing.payment-failed',

  // Execution Service events (consumidos pelo OS Service)
  EXECUTION_REPAIR_STARTED: 'execution.repair-started',
  EXECUTION_REPAIR_FINISHED: 'execution.repair-finished',
  EXECUTION_DELIVERED: 'execution.delivered',
  EXECUTION_FAILED: 'execution.failed',
} as const;
