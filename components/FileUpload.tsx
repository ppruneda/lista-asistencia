"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

interface ParsedStudent {
  cuenta: string;
  name: string;
  valid: boolean;
  error?: string;
}

interface FileUploadProps {
  onUpload: (students: { cuenta: string; name: string }[]) => Promise<void>;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [parsed, setParsed] = useState<ParsedStudent[]>([]);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function findColumn(headers: string[], options: string[]): number {
    const lower = headers.map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ""));
    for (const opt of options) {
      const idx = lower.indexOf(opt);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  function processCSV(text: string) {
    const result = Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
    });

    const rows = result.data as string[][];
    if (rows.length < 2) {
      alert("El archivo está vacío o solo tiene encabezados.");
      return;
    }

    const headers = rows[0];
    const cuentaIdx = findColumn(headers, [
      "cuenta", "numcuenta", "numerocuenta", "nocuenta", "num_cuenta", "numero_cuenta",
    ]);
    const nameIdx = findColumn(headers, [
      "nombre", "name", "alumno", "estudiante", "nombrecompleto", "nombre_completo",
    ]);

    if (cuentaIdx === -1 || nameIdx === -1) {
      alert(
        'No se encontraron las columnas requeridas. El archivo debe tener columnas "cuenta" y "nombre".'
      );
      return;
    }

    const students: ParsedStudent[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cuenta = (row[cuentaIdx] || "").trim().replace(/\D/g, "");
      const name = (row[nameIdx] || "").trim();

      let valid = true;
      let error: string | undefined;

      if (!cuenta || cuenta.length < 8 || cuenta.length > 10) {
        valid = false;
        error = "Cuenta inválida (debe tener 8-10 dígitos)";
      } else if (!name || name.length < 3) {
        valid = false;
        error = "Nombre vacío o muy corto";
      }

      students.push({ cuenta, name, valid, error });
    }

    setParsed(students);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setParsed([]);

    if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        processCSV(text);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      alert("Por ahora solo se acepta formato CSV. Puedes exportar tu Excel como CSV desde Archivo → Guardar como → CSV.");
    } else {
      alert("Formato no soportado. Usa un archivo .csv");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleUpload() {
    const validStudents = parsed
      .filter((s) => s.valid)
      .map((s) => ({ cuenta: s.cuenta, name: s.name }));

    if (validStudents.length === 0) {
      alert("No hay alumnos válidos para subir.");
      return;
    }

    setUploading(true);
    try {
      await onUpload(validStudents);
      setParsed([]);
      setFileName("");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir los alumnos.");
    } finally {
      setUploading(false);
    }
  }

  const validCount = parsed.filter((s) => s.valid).length;
  const errorCount = parsed.filter((s) => !s.valid).length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-gold bg-gold/5"
            : "border-gray-300 hover:border-gold hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <p className="text-3xl mb-2">📄</p>
        <p className="text-navy font-medium">
          {fileName || "Arrastra un archivo CSV aquí o haz clic para seleccionar"}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          El archivo debe tener columnas &quot;cuenta&quot; y &quot;nombre&quot;
        </p>
      </div>

      {/* Preview */}
      {parsed.length > 0 && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex gap-4">
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
              ✅ {validCount} válidos
            </div>
            {errorCount > 0 && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
                ❌ {errorCount} con errores
              </div>
            )}
          </div>

          {/* Preview table (first 5) */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy/5">
                    <th className="px-3 py-2 text-left text-navy">Cuenta</th>
                    <th className="px-3 py-2 text-left text-navy">Nombre</th>
                    <th className="px-3 py-2 text-left text-navy">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 10).map((s, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono">{s.cuenta || "—"}</td>
                      <td className="px-3 py-2">{s.name || "—"}</td>
                      <td className="px-3 py-2">
                        {s.valid ? (
                          <span className="text-green-600">✅</span>
                        ) : (
                          <span className="text-red-600 text-xs">{s.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 10 && (
              <p className="text-center text-gray-400 text-xs py-2">
                ...y {parsed.length - 10} más
              </p>
            )}
          </div>

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={uploading || validCount === 0}
            className="w-full py-3 bg-navy text-cream font-bold rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-40"
          >
            {uploading
              ? "Subiendo..."
              : `Subir ${validCount} alumno${validCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
