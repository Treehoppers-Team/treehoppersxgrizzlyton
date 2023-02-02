import Head from "next/head";
import Form from "@/components/form";
import dynamic from "next/dynamic";

export default function Event() {

  return (
    <>
      <Head>
        <title>Create Event</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div className="flex flex-wrap justify-center m-4">
          <Form />
        </div>
      </main>
    </>
  );
}
