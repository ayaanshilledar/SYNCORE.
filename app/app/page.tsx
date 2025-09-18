import { log } from "console";
import Image from "next/image";
import { Appbar } from "./components/Appbar";

export default function Home() {
  return (
      <main className="m-4 p-4">
        <Appbar />
      </main>
  );
}
