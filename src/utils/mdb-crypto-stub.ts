/**
 * Stands in for `create-hash` and `browserify-aes`, which mdb-reader only needs for password-protected
 * Access files. Their real code depends on Node's `stream` module and fails to load in the browser.
 * The eSSL database is not encrypted, so these are never called; if one ever is, say why clearly.
 * Wired up through `resolve.alias` in vite.config.ts.
 */
const unsupported = () => {
  throw new Error("Password-protected Access databases are not supported")
}

const stub: any = Object.assign(unsupported, {
  createDecipheriv: unsupported,
  createCipheriv: unsupported,
})

export default stub
