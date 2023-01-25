import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Navbar from "../components/navBar";
import { ChakraProvider } from "@chakra-ui/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <>
      <SessionProvider session={session}>
        <ChakraProvider>
          <Navbar />
          <Component {...pageProps} />
        </ChakraProvider>
      </SessionProvider>
    </>
  );
}
