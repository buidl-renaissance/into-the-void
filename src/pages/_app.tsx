import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";

// Dynamically import UserProvider with SSR disabled since the SDK is client-side only
const UserProvider = dynamic(
  () => import("@/contexts/UserContext").then((mod) => ({ default: mod.UserProvider })),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  );
}
