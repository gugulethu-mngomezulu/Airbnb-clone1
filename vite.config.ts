// The project tool configuration uses CommonJS.
// Vite plugins are ESM, so load them through dynamic imports.
export default async () => {
  const [{ default: react }, { default: tailwindcss }] = await Promise.all([
    import('@vitejs/plugin-react'),
    import('@tailwindcss/vite'),
  ])
  const proxy = { '/api/ai-search': { target: 'http://127.0.0.1:8787', changeOrigin: true } }
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy, strictPort: true },
  }
}
