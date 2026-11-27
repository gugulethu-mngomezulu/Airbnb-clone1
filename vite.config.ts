// The project tool configuration uses CommonJS.
// Vite plugins are ESM, so load them through dynamic imports.
export default async () => {
  const [{ default: react }, { default: tailwindcss }] = await Promise.all([
    import('@vitejs/plugin-react'),
    import('@tailwindcss/vite'),
  ])
  const proxy = {
    '/api/ai-search': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    '/api': { target: 'http://127.0.0.1:8011', changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api/, '') },
  }
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy, port: 5180 },
    preview: { proxy, strictPort: true },
  }
}
