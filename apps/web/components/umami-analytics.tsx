import Script from "next/script";

export function UmamiAnalytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

  if (!websiteId || !scriptUrl) {
    return null;
  }

  return (
    <Script
      defer
      src={scriptUrl}
      data-website-id={websiteId}
      data-host-url={process.env.NEXT_PUBLIC_UMAMI_HOST_URL}
      strategy="afterInteractive"
    />
  );
}
