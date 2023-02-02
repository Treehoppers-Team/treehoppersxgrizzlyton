import type { NextPage } from "next";
import dynamic from "next/dynamic";
import router from "next/router";
import { useState } from "react";
import Dashboard from ".";

const App = dynamic(
  () => {
    return import("./Web3Auth");
  },
  { ssr: false }
);

const Home: NextPage = () => {
  const [address, setAddress] = useState<string[]>([]);
  const callback = (address: string[]) => {
    setAddress(address);
  };

  return (
    <>
      { address.length > 0  ? <Dashboard /> : 
      <div className="flex flex-wrap justify-center">
        <App callback={callback} />
      </div>
      
      }
    </>
  );
};

export default Home;
