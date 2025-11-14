type Vital = {
  name: string;
  value: number;
  rating: string;
  id: string;
  label: string;
  pathname: string;
  ts: number;
};

type GlobalT = typeof globalThis & { __vitals?: Vital[] };
const g = global as GlobalT;
if (!g.__vitals) g.__vitals = [];

export function addVital(v: Vital) {
  const arr = g.__vitals!;
  arr.push(v);
  if (arr.length > 200) arr.splice(0, arr.length - 200);
}

export function getVitals() {
  return (g.__vitals || []).slice(-200).reverse();
}

