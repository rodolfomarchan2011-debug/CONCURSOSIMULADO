import type { Metadata } from "next";
import { TreinoClient } from "./TreinoClient";

export const metadata: Metadata = { title: "Treino por matéria" };

export default function TreinoPage() {
  return <TreinoClient />;
}
