import Link from "next/link";
import { PRODUCTS } from "@/contract/products";

export default function Home() {
  const products = Object.values(PRODUCTS).filter((p) => p.repo === "EvolveHack/factory-apps");
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Factory apps</h1>
      <p className="mt-2 text-neutral-500">Demo products that customers change by calling Phone-a-factory.</p>
      <ul className="mt-8 space-y-6">
        {products.map((p) => (
          <li key={p.id}>
            <p className="text-xl font-semibold">{p.name}</p>
            <p className="text-neutral-500">{p.what}</p>
            <p className="mt-1 flex gap-4">
              {p.customers.map((c) => (
                <Link key={c.id} href={c.path} className="underline">
                  {c.name}
                </Link>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
