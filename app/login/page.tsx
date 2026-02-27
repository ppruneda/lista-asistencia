"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

      try {
              await signIn(email, password);
              // Usar window.location.href en lugar de router.push para forzar
          // una navegación completa que incluya la cookie de sesión
          window.location.href = "/profesor";
      } catch (err: unknown) {
              const message =
                        err instanceof Error ? err.message : "Error desconocido";
              if (message.includes("invalid-credential") || message.includes("wrong-password") || message.includes("user-not-found")) {
                        setError("Correo o contraseña incorrectos");
              } else if (message.includes("too-many-requests")) {
                        setError("Demasiados intentos. Espera unos minutos.");
              } else {
                        setError("Error al iniciar sesión. Intenta de nuevo.");
              }
      } finally {
              setLoading(false);
      }
  }

  return (
        <main className="min-h-screen flex items-center justify-center bg-cream px-4">
              <div className="w-full max-w-sm">
                      <div className="bg-white rounded-xl shadow-lg p-8">
                                <h1 className="text-2xl font-bold text-navy text-center mb-1">
                                            Acceso Profesor
                                </h1>h1>
                                <p className="text-sm text-gray-500 text-center mb-6">
                                            Sistema de Asistencia — Sucesiones
                                </p>p>
                      
                                <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                          <label
                                                                            htmlFor="email"
                                                                            className="block text-sm font-medium text-navy mb-1"
                                                                          >
                                                                          Correo electrónico
                                                          </label>label>
                                                          <input
                                                                            id="email"
                                                                            type="email"
                                                                            value={email}
                                                                            onChange={(e) => setEmail(e.target.value)}
                                                                            required
                                                                            autoComplete="email"
                                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none text-navy"
                                                                            placeholder="profesor@unam.mx"
                                                                          />
                                            </div>div>
                                
                                            <div>
                                                          <label
                                                                            htmlFor="password"
                                                                            className="block text-sm font-medium text-navy mb-1"
                                                                          >
                                                                          Contraseña
                                                          </label>label>
                                                          <input
                                                                            id="password"
                                                                            type="password"
                                                                            value={password}
                                                                            onChange={(e) => setPassword(e.target.value)}
                                                                            required
                                                                            autoComplete="current-password"
                                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none text-navy"
                                                                            placeholder="••••••••"
                                                                          />
                                            </div>div>
                                
                                  {error && (
                        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                          {error}
                        </div>div>
                                            )}
                                
                                            <button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="w-full py-3 bg-navy text-cream font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                          >
                                              {loading ? "Entrando..." : "Entrar"}
                                            </button>button>
                                </form>form>
                      </div>div>
              
                      <div className="text-center mt-4">
                                <Link
                                              href="/"
                                              className="text-sm text-gray-500 hover:text-navy transition-colors"
                                            >
                                            ← Volver al inicio
                                </Link>Link>
                      </div>div>
              </div>div>
        </main>main>
      );
}</main>
