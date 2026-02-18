"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import type { StudentReport } from "@/types";

interface TablaAsistenciaProps {
  reports: StudentReport[];
}

type SortKey = "name" | "percentage" | "status";

export default function TablaAsistencia({ reports }: TablaAsistenciaProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === "name");
    }
  }

  const sorted = [...reports].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sortBy === "percentage") {
      cmp = a.percentage - b.percentage;
    } else if (sortBy === "status") {
      const order = { critical: 0, risk: 1, ok: 2 };
      cmp = order[a.status] - order[b.status];
    }
    return sortAsc ? cmp : -cmp;
  });

  function SortHeader({ label, sortKey }: { label: string; sortKey: SortKey }) {
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className="px-4 py-3 text-sm font-medium text-navy cursor-pointer hover:bg-navy/10 select-none"
      >
        {label} {sortBy === sortKey ? (sortAsc ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-left">
              <SortHeader label="Alumno" sortKey="name" />
              <th className="px-4 py-3 text-sm font-medium text-navy">Cuenta</th>
              <th className="px-4 py-3 text-sm font-medium text-navy">Asist.</th>
              <th className="px-4 py-3 text-sm font-medium text-navy">Parc.</th>
              <th className="px-4 py-3 text-sm font-medium text-navy">Faltas</th>
              <SortHeader label="%" sortKey="percentage" />
              <th className="px-4 py-3 text-sm font-medium text-navy">Faltas rest.</th>
              <SortHeader label="Estado" sortKey="status" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.cuenta}
                onClick={() => router.push(`/profesor/reportes/${r.cuenta}`)}
                className={`border-t border-gray-100 cursor-pointer transition-colors ${
                  r.status === "critical"
                    ? "bg-red-50/50 hover:bg-red-50"
                    : r.status === "risk"
                    ? "bg-yellow-50/50 hover:bg-yellow-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{r.cuenta}</td>
                <td className="px-4 py-3 text-green-700">{r.attended}</td>
                <td className="px-4 py-3 text-yellow-600">{r.partial}</td>
                <td className="px-4 py-3 text-red-600">{r.missed}</td>
                <td className="px-4 py-3 font-bold">
                  <span
                    className={
                      r.percentage >= 80
                        ? "text-green-700"
                        : r.percentage >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }
                  >
                    {r.percentage}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.remainingAbsences}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
