"use client"

let pyodidePromise: Promise<any> | null = null

export async function loadPyodideRuntime() {
  if (pyodidePromise) {
    return pyodidePromise
  }

  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Pyodide can only be loaded in the browser.")
      }

      if (!(window as any).loadPyodide) {
        await new Promise<void>((scriptResolve, scriptReject) => {
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"
          script.async = true
          script.onload = () => scriptResolve()
          script.onerror = () => scriptReject(new Error("Failed to load Pyodide."))
          document.body.appendChild(script)
        })
      }

      const pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
      })

      resolve(pyodide)
    } catch (error) {
      reject(error)
    }
  })

  return pyodidePromise
}
