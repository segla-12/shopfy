export const safetyNoticeEventName = "shopfy:safety-notice";
export const safetyNoticeAcceptedKey = "shopfy_wholesale_warning_accepted";

export type SafetyNoticeDetail = {
  redirectUrl?: string;
};

export function showSafetyNotice(redirectUrl?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.sessionStorage.getItem(safetyNoticeAcceptedKey) === "true") {
    if (redirectUrl) {
      window.location.assign(redirectUrl);
    }

    return;
  }

  window.dispatchEvent(
    new CustomEvent<SafetyNoticeDetail>(safetyNoticeEventName, {
      detail: { redirectUrl },
    }),
  );
}
