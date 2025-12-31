import Head from "next/head";
import TerminalAnimation from "@/components/TerminalAnimation";

export default function Home() {
  return (
    <>
      <Head>
        <title>Into The Void - January 17th</title>
        <meta name="description" content="Into The Void event intro animation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TerminalAnimation />
    </>
  );
}
