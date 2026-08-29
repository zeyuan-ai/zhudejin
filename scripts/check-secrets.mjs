import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const files = execFileSync('git', ['-c', 'core.quotepath=false', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const forbidden = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^<\s][^\s]+/,
  /SUPABASE_SECRET_KEYS\s*=\s*[^<\s][^\s]+/,
  /AMAP_WEB_SERVICE_KEY\s*=\s*[^<\s][^\s]+/,
  /BAIDU_WEB_SERVICE_KEY\s*=\s*[^<\s][^\s]+/,
  /sb_secret_[A-Za-z0-9_-]{20,}/,
]
const violations = []
for (const file of files) {
  if (/\.(png|jpg|jpeg|gif|ico|woff2?|lock)$/i.test(file)) continue
  const content = readFileSync(file, 'utf8')
  if (forbidden.some((pattern) => pattern.test(content))) violations.push(file)
}
if (violations.length) { console.error(`检测到疑似密钥：${violations.join(', ')}`); process.exit(1) }
console.log(`密钥检查通过，共检查 ${files.length} 个受 Git 管理的文件。`)
