import Head from "next/head";
import TerminalAnimation from "@/components/TerminalAnimation";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
const SITE_NAME = "Into The Void";
const EVENT_DATE = "January 17th";
const EVENT_LOCATION = "STU202";
const DESCRIPTION = "A gathering in space and transition. Music, art, games, people. Into The Void - January 17th at STU202. Join us for transformation, together.";
const FEATURED_IMAGE = SITE_URL ? `${SITE_URL}/into-the-void.png` : "/into-the-void.png";

export default function Home() {
  const pageTitle = `${SITE_NAME} - ${EVENT_DATE}`;
  const fullDescription = DESCRIPTION;

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={fullDescription} />
        <meta name="keywords" content="into the void, event, detroit, STU202, gathering, music, art, games, january 17th, transformation" />
        <meta name="author" content="Into The Void" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={fullDescription} />
        <meta property="og:image" content={FEATURED_IMAGE} />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="600" />
        <meta property="og:image:alt" content="Into The Void - A celestial gathering in space and transition" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={SITE_URL} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={fullDescription} />
        <meta name="twitter:image" content={FEATURED_IMAGE} />
        <meta name="twitter:image:alt" content="Into The Void - A celestial gathering in space and transition" />
        
        {/* Event-specific metadata */}
        <meta name="event:start_time" content="2025-01-17T17:00:00-05:00" />
        <meta name="event:location" content={EVENT_LOCATION} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Canonical URL */}
        {SITE_URL && <link rel="canonical" href={SITE_URL} />}
      </Head>
      <TerminalAnimation />
    </>
  );
}
