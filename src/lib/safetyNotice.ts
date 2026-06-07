export const safetyNoticeEventName = "shopfy:safety-notice";

export type SafetyNoticeDetail = {
  redirectUrl?: string;
};

export function showSafetyNotice(redirectUrl?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<SafetyNoticeDetail>(safetyNoticeEventName, {
      detail: { redirectUrl },
    }),
  );
}
