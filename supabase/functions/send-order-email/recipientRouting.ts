export interface EmailRoutingResult {
  deliveryEmail: string;
  routedToTestInbox: boolean;
}

export function resolveEmailRouting(
  customerEmail: string,
  testRecipientOverride: string | undefined,
): EmailRoutingResult {
  const trimmedOverride = testRecipientOverride?.trim();
  if (trimmedOverride) {
    return {
      deliveryEmail: trimmedOverride,
      routedToTestInbox: true,
    };
  }

  return {
    deliveryEmail: customerEmail,
    routedToTestInbox: false,
  };
}
