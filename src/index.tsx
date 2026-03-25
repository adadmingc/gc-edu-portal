import { Hono } from 'hono'
import { cors } from 'hono/cors'

// HTML 파일 직접 import (Vite 빌드 시 inline됨)
import indexHtml from '../public/index.html?raw'
import adminHtml from '../public/admin.html?raw'
import adminLoginHtml from '../public/admin-login.html?raw'
import employeeHtml from '../public/employee.html?raw'
import employeeLoginHtml from '../public/employee-login.html?raw'
import guidelineHtml from '../public/guideline.html?raw'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ══════════════════════════════════════
// HTML 페이지 라우트
// ══════════════════════════════════════
const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }

app.get('/', (c) => c.body(indexHtml, 200, htmlHeaders))
app.get('/index.html', (c) => c.body(indexHtml, 200, htmlHeaders))
app.get('/admin.html', (c) => c.body(adminHtml, 200, htmlHeaders))
app.get('/admin-login.html', (c) => c.body(adminLoginHtml, 200, htmlHeaders))
app.get('/employee.html', (c) => c.body(employeeHtml, 200, htmlHeaders))
app.get('/employee-login.html', (c) => c.body(employeeLoginHtml, 200, htmlHeaders))
app.get('/guideline.html', (c) => c.body(guidelineHtml, 200, htmlHeaders))

// favicon
app.get('/favicon.ico', (c) => c.redirect('/static/favicon.svg', 301))
app.get('/favicon.svg', (c) => c.redirect('/static/favicon.svg', 301))

// ══════════════════════════════════════
// 유틸
// ══════════════════════════════════════
function ok(data: unknown) {
  return Response.json({ ok: true, data })
}
function err(msg: string, status = 400) {
  return Response.json({ ok: false, error: msg }, { status })
}

// ══════════════════════════════════════
// 인증
// ══════════════════════════════════════

app.post('/api/auth/admin', async (c) => {
  const { password } = await c.req.json()
  const row = await c.env.DB.prepare(
    `SELECT value FROM settings WHERE key='admin_pw'`
  ).first<{ value: string }>()
  const pw = row?.value ?? 'hr2026'
  if (password !== pw) return err('비밀번호가 올바르지 않습니다', 401)
  return ok({ type: 'admin' })
})

app.post('/api/auth/employee', async (c) => {
  const { name, empId } = await c.req.json()
  const emp = await c.env.DB.prepare(
    `SELECT * FROM employees WHERE name=? AND emp_id=?`
  ).bind(name, empId).first()
  if (!emp) return err('이름 또는 사번이 올바르지 않습니다', 401)
  return ok({ type: 'employee', emp })
})

app.post('/api/auth/change-pw', async (c) => {
  const { current, next } = await c.req.json()
  const row = await c.env.DB.prepare(
    `SELECT value FROM settings WHERE key='admin_pw'`
  ).first<{ value: string }>()
  const pw = row?.value ?? 'hr2026'
  if (current !== pw) return err('현재 비밀번호가 올바르지 않습니다', 401)
  await c.env.DB.prepare(
    `INSERT INTO settings(key,value) VALUES('admin_pw',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  ).bind(next).run()
  return ok(null)
})

// ══════════════════════════════════════
// 직원 CRUD
// ══════════════════════════════════════

app.get('/api/employees', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM employees ORDER BY created_at DESC`
  ).all()
  return ok(results)
})

app.post('/api/employees', async (c) => {
  const { name, empId, dept, rank, joinDate } = await c.req.json()
  if (!name || !empId) return err('이름과 사번은 필수입니다')
  try {
    const r = await c.env.DB.prepare(
      `INSERT INTO employees(name,emp_id,dept,rank,join_date) VALUES(?,?,?,?,?)`
    ).bind(name, empId, dept ?? '', rank ?? '', joinDate ?? '').run()
    return ok({ id: r.meta.last_row_id })
  } catch {
    return err('이미 존재하는 사번입니다')
  }
})

app.post('/api/employees/bulk', async (c) => {
  const { employees } = await c.req.json()
  if (!Array.isArray(employees)) return err('잘못된 형식입니다')
  let added = 0, updated = 0
  for (const e of employees) {
    if (!e.name || !e.empId) continue
    const existing = await c.env.DB.prepare(
      `SELECT id FROM employees WHERE emp_id=?`
    ).bind(e.empId).first()
    if (existing) {
      await c.env.DB.prepare(
        `UPDATE employees SET name=?,dept=?,rank=?,join_date=? WHERE emp_id=?`
      ).bind(e.name, e.dept??'', e.rank??'', e.joinDate??'', e.empId).run()
      updated++
    } else {
      await c.env.DB.prepare(
        `INSERT INTO employees(name,emp_id,dept,rank,join_date) VALUES(?,?,?,?,?)`
      ).bind(e.name, e.empId, e.dept??'', e.rank??'', e.joinDate??'').run()
      added++
    }
  }
  return ok({ added, updated })
})

app.put('/api/employees/:empId', async (c) => {
  const empId = c.req.param('empId')
  const { name, dept, rank, joinDate } = await c.req.json()
  await c.env.DB.prepare(
    `UPDATE employees SET name=?,dept=?,rank=?,join_date=? WHERE emp_id=?`
  ).bind(name, dept ?? '', rank ?? '', joinDate ?? '', empId).run()
  return ok(null)
})

app.delete('/api/employees/:empId', async (c) => {
  const empId = c.req.param('empId')
  await c.env.DB.prepare(`DELETE FROM employees WHERE emp_id=?`).bind(empId).run()
  await c.env.DB.prepare(`DELETE FROM training WHERE emp_id=?`).bind(empId).run()
  return ok(null)
})

// ══════════════════════════════════════
// 이수 현황 CRUD
// ══════════════════════════════════════

app.get('/api/training', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM training`
  ).all()
  return ok(results)
})

app.get('/api/training/:empId', async (c) => {
  const empId = c.req.param('empId')
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM training WHERE emp_id=?`
  ).bind(empId).all()
  return ok(results)
})

app.post('/api/training/:empId/:catId/submit', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { fileName, fileData, trainHours } = await c.req.json()
  const now = new Date().toISOString()
  await c.env.DB.prepare(`
    INSERT INTO training(emp_id,cat_id,submitted,submitted_at,file_name,file_data,approved,supplement_requested,train_hours)
    VALUES(?,?,1,?,?,?,NULL,0,?)
    ON CONFLICT(emp_id,cat_id) DO UPDATE SET
      submitted=1, submitted_at=excluded.submitted_at,
      file_name=excluded.file_name, file_data=excluded.file_data,
      approved=NULL, supplement_requested=0,
      supplement_reason='', supplement_at='',
      train_hours=excluded.train_hours
  `).bind(empId, catId, now, fileName ?? '', fileData ?? '', trainHours ?? '').run()
  return ok(null)
})

app.post('/api/training/:empId/:catId/check', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { trainHours } = await c.req.json().catch(() => ({ trainHours: '' }))
  const now = new Date().toISOString()
  await c.env.DB.prepare(`
    INSERT INTO training(emp_id,cat_id,submitted,submitted_at,file_name,file_data,approved,supplement_requested,train_hours)
    VALUES(?,?,1,?,'',NULL,NULL,0,?)
    ON CONFLICT(emp_id,cat_id) DO UPDATE SET
      submitted=1, submitted_at=excluded.submitted_at,
      file_name='', file_data=NULL, approved=NULL, supplement_requested=0,
      supplement_reason='', supplement_at='',
      train_hours=excluded.train_hours
  `).bind(empId, catId, now, trainHours ?? '').run()
  return ok(null)
})

app.post('/api/training/:empId/:catId/review', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { approved } = await c.req.json()
  const now = new Date().toISOString()
  const col = approved ? 'approved_at' : 'rejected_at'
  await c.env.DB.prepare(`
    UPDATE training SET approved=?, ${col}=?, supplement_requested=0
    WHERE emp_id=? AND cat_id=?
  `).bind(approved ? 1 : 0, now, empId, catId).run()
  return ok(null)
})

app.post('/api/training/:empId/:catId/supplement', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { reason } = await c.req.json()
  const now = new Date().toISOString()
  await c.env.DB.prepare(`
    UPDATE training SET supplement_requested=1, supplement_reason=?, supplement_at=?, approved=NULL
    WHERE emp_id=? AND cat_id=?
  `).bind(reason ?? '', now, empId, catId).run()
  return ok(null)
})

// ══════════════════════════════════════
// 교육 방침 자료
// ══════════════════════════════════════

app.get('/api/guideline', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM guideline_links ORDER BY cat_id, sort_order`
  ).all()
  return ok(results)
})

app.post('/api/guideline', async (c) => {
  const { catId, emoji, name, url, linkDesc, type, videoName, videoData, sortOrder } = await c.req.json()
  const r = await c.env.DB.prepare(`
    INSERT INTO guideline_links(cat_id,emoji,name,url,link_desc,type,video_name,video_data,sort_order)
    VALUES(?,?,?,?,?,?,?,?,?)
  `).bind(catId, emoji ?? '', name, url ?? '', linkDesc ?? '', type ?? 'link', videoName ?? '', videoData ?? '', sortOrder ?? 0).run()
  return ok({ id: r.meta.last_row_id })
})

app.put('/api/guideline/:id', async (c) => {
  const id = c.req.param('id')
  const { emoji, name, url, linkDesc, type, videoName, videoData } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE guideline_links SET emoji=?,name=?,url=?,link_desc=?,type=?,video_name=?,video_data=? WHERE id=?
  `).bind(emoji ?? '', name, url ?? '', linkDesc ?? '', type ?? 'link', videoName ?? '', videoData ?? '', id).run()
  return ok(null)
})

app.delete('/api/guideline/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM guideline_links WHERE id=?`).bind(id).run()
  return ok(null)
})

// ══════════════════════════════════════
// 교육 지침 / 결과보고서 양식 (edu_docs)
// ══════════════════════════════════════

app.get('/api/edu-docs', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id,cat_id,doc_type,title,file_name,created_at FROM edu_docs ORDER BY cat_id,doc_type,created_at DESC`
  ).all()
  return ok(results)
})

app.get('/api/edu-docs/:catId', async (c) => {
  const catId = c.req.param('catId')
  const { results } = await c.env.DB.prepare(
    `SELECT id,cat_id,doc_type,title,file_name,created_at FROM edu_docs WHERE cat_id=? ORDER BY doc_type,created_at DESC`
  ).bind(catId).all()
  return ok(results)
})

app.get('/api/edu-docs/:catId/:id/download', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    `SELECT file_name, file_data FROM edu_docs WHERE id=?`
  ).bind(id).first<{ file_name: string; file_data: string }>()
  if (!row?.file_data) return err('파일을 찾을 수 없습니다', 404)
  return ok({ fileName: row.file_name, fileData: row.file_data })
})

app.post('/api/edu-docs', async (c) => {
  const { catId, docType, title, fileName, fileData } = await c.req.json()
  if (!catId || !docType || !title) return err('필수 항목이 누락되었습니다')
  const r = await c.env.DB.prepare(
    `INSERT INTO edu_docs(cat_id,doc_type,title,file_name,file_data) VALUES(?,?,?,?,?)`
  ).bind(catId, docType, title, fileName ?? '', fileData ?? '').run()
  return ok({ id: r.meta.last_row_id })
})

app.delete('/api/edu-docs/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM edu_docs WHERE id=?`).bind(id).run()
  return ok(null)
})

// ══════════════════════════════════════
// 교육결과보고서 엑셀 데이터
// ══════════════════════════════════════

app.get('/api/export/training', async (c) => {
  const { results: emps } = await c.env.DB.prepare(
    `SELECT * FROM employees ORDER BY dept, name`
  ).all()
  const { results: training } = await c.env.DB.prepare(
    `SELECT * FROM training`
  ).all()
  return ok({ employees: emps, training })
})

// ══════════════════════════════════════
// 헬스체크
// ══════════════════════════════════════
app.get('/api/health', (c) => c.json({ ok: true, service: '지씨 교육 포털', time: new Date().toISOString() }))

export default app
