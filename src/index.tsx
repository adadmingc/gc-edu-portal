import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { DB } from './db'

// HTML 파일 직접 import (Vite 빌드 시 inline됨)
import indexHtml from '../public/index.html?raw'
import adminHtml from '../public/admin.html?raw'
import adminLoginHtml from '../public/admin-login.html?raw'
import employeeHtml from '../public/employee.html?raw'
import employeeLoginHtml from '../public/employee-login.html?raw'
import guidelineHtml from '../public/guideline.html?raw'
import noticeHtml from '../public/notice.html?raw'

const app = new Hono()

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
app.get('/notice.html', (c) => c.body(noticeHtml, 200, htmlHeaders))

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

// ── API 인증 헬퍼 ──────────────────────────────────────
function getAdminPw(c: any): string {
  return process.env.ADMIN_PW ?? 'hr2026'
}

async function verifyAdmin(c: any): Promise<boolean> {
  const token = c.req.header('X-Admin-Token') || ''
  if (!token) return false
  const row = await DB.prepare(
    `SELECT value FROM settings WHERE key='admin_pw'`
  ).first<{ value: string }>()
  const pw = row?.value ?? 'hr2026'
  return token === pw
}

// ══════════════════════════════════════
// 인증
// ══════════════════════════════════════

// 관리자 로그인
app.post('/api/auth/admin', async (c) => {
  const { password } = await c.req.json()
  const row = await DB.prepare(
    `SELECT value FROM settings WHERE key='admin_pw'`
  ).first<{ value: string }>()
  const pw = row?.value ?? 'hr2026'
  if (password !== pw) return err('비밀번호가 올바르지 않습니다', 401)
  return ok({ type: 'admin' })
})

// 직원 로그인
app.post('/api/auth/employee', async (c) => {
  const { name, empId, password } = await c.req.json()
  const emp = await DB.prepare(
    `SELECT * FROM employees WHERE name=? AND emp_id=?`
  ).bind(name, empId).first<Record<string, unknown>>()
  if (!emp) return err('이름 또는 사번이 올바르지 않습니다', 401)

  // 비밀번호가 설정된 경우 검증
  const storedPw = (emp.emp_password as string) || ''
  if (storedPw) {
    if (!password) return err('비밀번호를 입력해 주세요', 401)
    if (password !== storedPw) return err('비밀번호가 올바르지 않습니다', 401)
  }

  // 응답에서 비밀번호 제거
const empRecord = emp as Record<string, unknown>
  delete empRecord['emp_password']
  delete empRecord['password']
  const empSafe = empRecord
  return ok({ type: 'employee', emp: empSafe, requiresPw: !!storedPw })
})


// 직원 비밀번호 설정/초기화 (관리자)
app.put('/api/employees/:empId/password', async (c) => {
  const empId = c.req.param('empId')
  const { password } = await c.req.json()
  await DB.prepare(
    `UPDATE employees SET emp_password=? WHERE emp_id=?`
  ).bind(password ?? '', empId).run()
  return ok(null)
})

// 직원 비밀번호 설정 여부 조회 (관리자)
app.get('/api/employees/:empId/password-status', async (c) => {
  const empId = c.req.param('empId')
  const row = await DB.prepare(
    `SELECT emp_password FROM employees WHERE emp_id=?`
  ).bind(empId).first<{ emp_password: string }>()
  return ok({ hasPassword: !!(row?.emp_password) })
})

// 비밀번호 변경
app.post('/api/auth/change-pw', async (c) => {
  const { current, next } = await c.req.json()
  const row = await DB.prepare(
    `SELECT value FROM settings WHERE key='admin_pw'`
  ).first<{ value: string }>()
  const pw = row?.value ?? 'hr2026'
  if (current !== pw) return err('현재 비밀번호가 올바르지 않습니다', 401)
const details: string[] = []
  if (draft.category)    details.push('📂 카테고리: ' + draft.category)
  if (draft.target)      details.push('👤 교육 대상: ' + draft.target)
  if (draft.cost)        details.push('💰 비용: ' + draft.cost)
  if (draft.period)      details.push('📅 기간/일정: ' + draft.period)
  if (draft.source_site) details.push('🌐 출처: ' + draft.source_site)
  if (draft.source_url)  details.push('🔗 링크: ' + draft.source_url)
  const fullContent = draft.content + (details.length ? '\n\n' + details.join('\n') : '')
  await DB.prepare(
    `INSERT INTO edu_notices (title, content, author, created_at) VALUES (?, ?, ?, datetime('now','localtime'))`
  ).bind(draft.title, fullContent, 'AI 교육탐색').run()
  return ok(null)
})

// ══════════════════════════════════════
// 직원 CRUD
// ══════════════════════════════════════

// 전체 목록
app.get('/api/employees', async (c) => {
  const { results } = await DB.prepare(
    `SELECT id, name, emp_id, dept, rank, join_date, created_at, department, position, email FROM employees ORDER BY created_at DESC`
  ).all()
  return ok(results)
})

// 추가
app.post('/api/employees', async (c) => {
  if (!await verifyAdmin(c)) return err('관리자 인증이 필요합니다', 401)
  const { name, empId, dept, rank, joinDate } = await c.req.json()
  if (!name || !empId) return err('이름과 사번은 필수입니다')
  try {
    const r = await DB.prepare(
      `INSERT INTO employees(name,emp_id,dept,rank,join_date) VALUES(?,?,?,?,?)`
    ).bind(name, empId, dept ?? '', rank ?? '', joinDate ?? '').run()
    return ok({ id: r.meta.last_row_id })
  } catch {
    return err('이미 존재하는 사번입니다')
  }
})

// 수정
app.put('/api/employees/:empId', async (c) => {
  const empId = c.req.param('empId')
  const { name, dept, rank, joinDate } = await c.req.json()
  await DB.prepare(
    `UPDATE employees SET name=?,dept=?,rank=?,join_date=? WHERE emp_id=?`
  ).bind(name, dept ?? '', rank ?? '', joinDate ?? '', empId).run()
  return ok(null)
})

// 삭제
app.delete('/api/employees/:empId', async (c) => {
  const empId = c.req.param('empId')
  await DB.prepare(`DELETE FROM employees WHERE emp_id=?`).bind(empId).run()
  await DB.prepare(`DELETE FROM training WHERE emp_id=?`).bind(empId).run()
  return ok(null)
})

// ══════════════════════════════════════
// 이수 현황 CRUD
// ══════════════════════════════════════

// 전체 이수 현황
app.get('/api/training', async (c) => {
  const { results } = await DB.prepare(
    `SELECT * FROM training`
  ).all()
  return ok(results)
})

// 직원별 이수 현황
app.get('/api/training/:empId', async (c) => {
  const empId = c.req.param('empId')
  const { results } = await DB.prepare(
    `SELECT * FROM training WHERE emp_id=?`
  ).bind(empId).all()
  return ok(results)
})

// 이수증 제출
app.post('/api/training/:empId/:catId/submit', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { fileName, fileData, trainHours } = await c.req.json()
  const now = new Date().toISOString()
  await DB.prepare(`
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

// 완료 체크 (파일 없이)
app.post('/api/training/:empId/:catId/check', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { trainHours } = await c.req.json().catch(() => ({ trainHours: '' }))
  const now = new Date().toISOString()
  await DB.prepare(`
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

// 승인 / 반려
app.post('/api/training/:empId/:catId/review', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { approved } = await c.req.json()
  const now = new Date().toISOString()
  const col = approved ? 'approved_at' : 'rejected_at'
  await DB.prepare(`
    UPDATE training SET approved=?, ${col}=?, supplement_requested=0
    WHERE emp_id=? AND cat_id=?
  `).bind(approved ? 1 : 0, now, empId, catId).run()
  return ok(null)
})

// 보완 요청
app.post('/api/training/:empId/:catId/supplement', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { reason } = await c.req.json()
  const now = new Date().toISOString()
  await DB.prepare(`
    UPDATE training SET supplement_requested=1, supplement_reason=?, supplement_at=?, approved=NULL
    WHERE emp_id=? AND cat_id=?
  `).bind(reason ?? '', now, empId, catId).run()
  return ok(null)
})

// ══════════════════════════════════════
// 교육 방침 자료
// ══════════════════════════════════════

app.get('/api/guideline', async (c) => {
  const { results } = await DB.prepare(
    `SELECT * FROM guideline_links ORDER BY cat_id, sort_order`
  ).all()
  return ok(results)
})

app.post('/api/guideline', async (c) => {
  const { catId, emoji, name, url, linkDesc, type, videoName, videoData, sortOrder } = await c.req.json()
  const r = await DB.prepare(`
    INSERT INTO guideline_links(cat_id,emoji,name,url,link_desc,type,video_name,video_data,sort_order)
    VALUES(?,?,?,?,?,?,?,?,?)
  `).bind(catId, emoji ?? '', name, url ?? '', linkDesc ?? '', type ?? 'link', videoName ?? '', videoData ?? '', sortOrder ?? 0).run()
  return ok({ id: r.meta.last_row_id })
})

app.put('/api/guideline/:id', async (c) => {
  const id = c.req.param('id')
  const { emoji, name, url, linkDesc, type, videoName, videoData } = await c.req.json()
  await DB.prepare(`
    UPDATE guideline_links SET emoji=?,name=?,url=?,link_desc=?,type=?,video_name=?,video_data=? WHERE id=?
  `).bind(emoji ?? '', name, url ?? '', linkDesc ?? '', type ?? 'link', videoName ?? '', videoData ?? '', id).run()
  return ok(null)
})

app.delete('/api/guideline/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM guideline_links WHERE id=?`).bind(id).run()
  return ok(null)
})

// ══════════════════════════════════════
// 교육 지침 / 결과보고서 양식 (edu_docs)
// ══════════════════════════════════════

// 목록 조회
app.get('/api/edu-docs', async (c) => {
  const { results } = await DB.prepare(
    `SELECT id,cat_id,doc_type,title,file_name,created_at FROM edu_docs ORDER BY cat_id,doc_type,created_at DESC`
  ).all()
  return ok(results)
})

// 분야별 조회
app.get('/api/edu-docs/:catId', async (c) => {
  const catId = c.req.param('catId')
  const { results } = await DB.prepare(
    `SELECT id,cat_id,doc_type,title,file_name,created_at FROM edu_docs WHERE cat_id=? ORDER BY doc_type,created_at DESC`
  ).bind(catId).all()
  return ok(results)
})

// 파일 다운로드 (file_data 포함)
app.get('/api/edu-docs/:catId/:id/download', async (c) => {
  const id = c.req.param('id')
  const row = await DB.prepare(
    `SELECT file_name, file_data FROM edu_docs WHERE id=?`
  ).bind(id).first<{ file_name: string; file_data: string }>()
  if (!row?.file_data) return err('파일을 찾을 수 없습니다', 404)
  return ok({ fileName: row.file_name, fileData: row.file_data })
})

// 업로드 (추가)
app.post('/api/edu-docs', async (c) => {
  const { catId, docType, title, fileName, fileData } = await c.req.json()
  if (!catId || !docType || !title) return err('필수 항목이 누락되었습니다')
  const r = await DB.prepare(
    `INSERT INTO edu_docs(cat_id,doc_type,title,file_name,file_data) VALUES(?,?,?,?,?)`
  ).bind(catId, docType, title, fileName ?? '', fileData ?? '').run()
  return ok({ id: r.meta.last_row_id })
})

// 삭제
app.delete('/api/edu-docs/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM edu_docs WHERE id=?`).bind(id).run()
  return ok(null)
})

// ══════════════════════════════════════
// 이수증 다중 제출 API
// ══════════════════════════════════════

// 직원별 제출 이력 조회
app.get('/api/submissions/:empId', async (c) => {
  const empId = c.req.param('empId')
  const { results } = await DB.prepare(
    `SELECT * FROM training_submissions WHERE emp_id=? ORDER BY cat_id, created_at DESC`
  ).bind(empId).all()
  return ok(results)
})

// 전체 제출 이력 조회 (관리자)
app.get('/api/submissions', async (c) => {
  const { results } = await DB.prepare(
    `SELECT * FROM training_submissions ORDER BY created_at DESC`
  ).all()
  return ok(results)
})

// 새 이수증 제출
app.post('/api/submissions/:empId/:catId', async (c) => {
  const empId = c.req.param('empId')
  const catId = c.req.param('catId')
  const { period, fileName, fileData, trainHours, note } = await c.req.json()
  const now = new Date().toISOString()
  const r = await DB.prepare(`
    INSERT INTO training_submissions(emp_id,cat_id,period,submitted_at,file_name,file_data,train_hours,note)
    VALUES(?,?,?,?,?,?,?,?)
  `).bind(empId, catId, period??'', now, fileName??'', fileData??'', trainHours??'', note??'').run()
  return ok({ id: r.meta.last_row_id })
})


// 제출 파일 개별 조회 (직원용)
app.get('/api/submissions/file/:id', async (c) => {
  const id = c.req.param('id')
  const row = await DB.prepare(
    `SELECT file_name, file_data FROM training_submissions WHERE id=?`
  ).bind(id).first<{ file_name: string; file_data: string }>()
  if (!row?.file_data) return err('파일을 찾을 수 없습니다', 404)
  return ok({ fileName: row.file_name, fileData: row.file_data })
})

// 제출 이력 삭제
app.delete('/api/submissions/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM training_submissions WHERE id=?`).bind(id).run()
  return ok(null)
})

// 제출 승인/반려 (관리자)
app.put('/api/submissions/:id/review', async (c) => {
  const id = c.req.param('id')
  const { approved } = await c.req.json()
  const now = new Date().toISOString()
  const col = approved ? 'approved_at' : 'rejected_at'
  await DB.prepare(`
    UPDATE training_submissions SET approved=?, ${col}=?, supplement_requested=0 WHERE id=?
  `).bind(approved ? 1 : 0, now, id).run()
  return ok(null)
})

// 보완 요청 (관리자)
app.put('/api/submissions/:id/supplement', async (c) => {
  const id = c.req.param('id')
  const { reason } = await c.req.json()
  const now = new Date().toISOString()
  await DB.prepare(`
    UPDATE training_submissions SET supplement_requested=1, supplement_reason=?, supplement_at=?, approved=NULL WHERE id=?
  `).bind(reason??'', now, id).run()
  return ok(null)
})

// ══════════════════════════════════════
// 공통 교육결과 보고서 양식 API
// ══════════════════════════════════════

// 양식 조회 (활성화된 것)
app.get('/api/report-templates', async (c) => {
  const { results } = await DB.prepare(
    `SELECT id,title,description,file_name,is_active,created_at FROM report_templates ORDER BY created_at DESC`
  ).all()
  return ok(results)
})

// 양식 파일 다운로드
app.get('/api/report-templates/:id/download', async (c) => {
  const id = c.req.param('id')
  const row = await DB.prepare(
    `SELECT file_name, file_data FROM report_templates WHERE id=?`
  ).bind(id).first<{ file_name: string; file_data: string }>()
  if (!row?.file_data) return err('파일을 찾을 수 없습니다', 404)
  return ok({ fileName: row.file_name, fileData: row.file_data })
})

// 양식 추가/수정 (관리자)
app.post('/api/report-templates', async (c) => {
  const { title, description, fileName, fileData } = await c.req.json()
  const r = await DB.prepare(
    `INSERT INTO report_templates(title,description,file_name,file_data) VALUES(?,?,?,?)`
  ).bind(title??'교육결과 보고서 양식', description??'', fileName??'', fileData??'').run()
  return ok({ id: r.meta.last_row_id })
})

// 설명만 수정
app.put('/api/report-templates/:id', async (c) => {
  const id = c.req.param('id')
  const { title, description } = await c.req.json()
  await DB.prepare(
    `UPDATE report_templates SET title=?, description=? WHERE id=?`
  ).bind(title??'', description??'', id).run()
  return ok(null)
})

// 양식 삭제
app.delete('/api/report-templates/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM report_templates WHERE id=?`).bind(id).run()
  return ok(null)
})
app.get('/api/export/training', async (c) => {
  const { results: emps } = await DB.prepare(
    `SELECT * FROM employees ORDER BY dept, name`
  ).all()
  const { results: training } = await DB.prepare(
    `SELECT * FROM training`
  ).all()
  return ok({ employees: emps, training })
})

// 직원 본인 비밀번호 변경
app.post('/api/employees/:empId/change-pw', async (c) => {
  const empId = c.req.param('empId')
  const { currentPw, newPw } = await c.req.json()
  const emp = await DB.prepare(
    `SELECT emp_password FROM employees WHERE emp_id=?`
  ).bind(empId).first<{ emp_password: string }>()
  if (!emp) return err('직원을 찾을 수 없습니다', 404)
  const stored = emp.emp_password || ''
  // 현재 비밀번호가 설정된 경우 검증
  if (stored && stored !== currentPw) return err('현재 비밀번호가 올바르지 않습니다', 401)
  if (!newPw || newPw.length < 4) return err('비밀번호는 4자리 이상이어야 합니다')
  await DB.prepare(
    `UPDATE employees SET emp_password=? WHERE emp_id=?`
  ).bind(newPw, empId).run()
  return ok(null)
})

// ══════════════════════════════════════
// 직원별 교육 배정 API
// ══════════════════════════════════════

// 직원 교육 배정 조회
app.get('/api/assignments/:empId', async (c) => {
  const empId = c.req.param('empId')
  const { results } = await DB.prepare(
    `SELECT cat_id FROM emp_cat_assignments WHERE emp_id=?`
  ).bind(empId).all()
  return ok((results as any[]).map(r => r.cat_id))
})

// 전체 배정 조회 (관리자)
app.get('/api/assignments', async (c) => {
  const { results } = await DB.prepare(
    `SELECT emp_id, cat_id FROM emp_cat_assignments`
  ).all()
  return ok(results)
})

// 직원 교육 배정 저장 (전체 교체)
app.put('/api/assignments/:empId', async (c) => {
  const empId = c.req.param('empId')
  const { catIds } = await c.req.json()
  await DB.prepare(
    `DELETE FROM emp_cat_assignments WHERE emp_id=?`
  ).bind(empId).run()
  for (const catId of (catIds || [])) {
    await DB.prepare(
      `INSERT OR IGNORE INTO emp_cat_assignments(emp_id,cat_id) VALUES(?,?)`
    ).bind(empId, catId).run()
  }
  return ok(null)
})


// ══════════════════════════════════════
// 부관리자 API
// ══════════════════════════════════════

// 부관리자 로그인
app.post('/api/auth/sub-admin', async (c) => {
  const { username, password } = await c.req.json()
  const row = await DB.prepare(
    `SELECT * FROM sub_admins WHERE username=?`
  ).bind(username).first<{ id: number; username: string; password: string; name: string; cat_ids: string }>()
  if (!row || row.password !== password) return err('아이디 또는 비밀번호가 올바르지 않습니다', 401)
  const catIds = JSON.parse(row.cat_ids || '[]')
  return ok({ type: 'sub_admin', name: row.name, username: row.username, catIds })
})

// 부관리자 목록 조회 (전체 관리자)
app.get('/api/sub-admins', async (c) => {
  const { results } = await DB.prepare(
    `SELECT id, username, name, cat_ids, created_at FROM sub_admins`
  ).all()
  return ok(results)
})

// 부관리자 추가
app.post('/api/sub-admins', async (c) => {
  const { username, password, name, catIds } = await c.req.json()
  if (!username || !password) return err('아이디와 비밀번호는 필수입니다')
  try {
    await DB.prepare(
      `INSERT INTO sub_admins(username,password,name,cat_ids) VALUES(?,?,?,?)`
    ).bind(username, password, name??'', JSON.stringify(catIds??[])).run()
    return ok(null)
  } catch { return err('이미 존재하는 아이디입니다') }
})

// 부관리자 수정
app.put('/api/sub-admins/:id', async (c) => {
  const id = c.req.param('id')
  const { password, name, catIds } = await c.req.json()
  if (password && password !== '__keep__') {
    await DB.prepare(
      `UPDATE sub_admins SET password=?,name=?,cat_ids=? WHERE id=?`
    ).bind(password, name??'', JSON.stringify(catIds??[]), id).run()
  } else {
    await DB.prepare(
      `UPDATE sub_admins SET name=?,cat_ids=? WHERE id=?`
    ).bind(name??'', JSON.stringify(catIds??[]), id).run()
  }
  return ok(null)
})

// 부관리자 삭제
app.delete('/api/sub-admins/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM sub_admins WHERE id=?`).bind(id).run()
  return ok(null)
})


// ══════════════════════════════════════
// 교육 공지 게시판 API
// ══════════════════════════════════════

// 목록 조회 (파일 제외, 페이징)
app.get('/api/notices', async (c) => {
  const limit  = parseInt(c.req.query('limit')  || '5')
  const offset = parseInt(c.req.query('offset') || '0')
  const { results } = await DB.prepare(`
    SELECT n.id, n.title, n.author, n.is_pinned, n.view_count, n.created_at,
           COUNT(f.id) as file_count
    FROM edu_notices n
    LEFT JOIN edu_notice_files f ON f.notice_id = n.id
    GROUP BY n.id
    ORDER BY n.is_pinned DESC, n.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all()
  const total = await DB.prepare(
    `SELECT COUNT(*) as cnt FROM edu_notices`
  ).first<{ cnt: number }>()
  return ok({ items: results, total: total?.cnt ?? 0 })
})

// 단건 조회 (내용 + 파일 목록, 조회수 증가)
app.get('/api/notices/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(
    `UPDATE edu_notices SET view_count = view_count + 1 WHERE id=?`
  ).bind(id).run()
  const notice = await DB.prepare(
    `SELECT * FROM edu_notices WHERE id=?`
  ).bind(id).first()
  if (!notice) return err('공지를 찾을 수 없습니다', 404)
  const { results: files } = await DB.prepare(
    `SELECT id, file_name, file_size, created_at FROM edu_notice_files WHERE notice_id=?`
  ).bind(id).all()
  return ok({ notice, files })
})

// 파일 다운로드
app.get('/api/notices/:id/files/:fileId', async (c) => {
  const fileId = c.req.param('fileId')
  const row = await DB.prepare(
    `SELECT file_name, file_data FROM edu_notice_files WHERE id=?`
  ).bind(fileId).first<{ file_name: string; file_data: string }>()
  if (!row) return err('파일을 찾을 수 없습니다', 404)
  return ok({ fileName: row.file_name, fileData: row.file_data })
})

// 공지 작성 (관리자)
app.post('/api/notices', async (c) => {
  const { title, content, author, isPinned, files } = await c.req.json()
  if (!title) return err('제목은 필수입니다')
  const now = new Date().toISOString()
  const r = await DB.prepare(`
    INSERT INTO edu_notices(title,content,author,is_pinned,created_at,updated_at)
    VALUES(?,?,?,?,?,?)
  `).bind(title, content??'', author??'', isPinned?1:0, now, now).run()
  const noticeId = r.meta.last_row_id
  // 첨부파일 저장
  for (const f of (files||[])) {
    await DB.prepare(`
      INSERT INTO edu_notice_files(notice_id,file_name,file_data,file_size)
      VALUES(?,?,?,?)
    `).bind(noticeId, f.fileName, f.fileData, f.fileSize??0).run()
  }
  return ok({ id: noticeId })
})

// 공지 수정 (관리자)
app.put('/api/notices/:id', async (c) => {
  const id  = c.req.param('id')
  const { title, content, author, isPinned } = await c.req.json()
  const now = new Date().toISOString()
  await DB.prepare(`
    UPDATE edu_notices SET title=?,content=?,author=?,is_pinned=?,updated_at=? WHERE id=?
  `).bind(title, content??'', author??'', isPinned?1:0, now, id).run()
  return ok(null)
})

// 공지 파일 추가 (관리자)
app.post('/api/notices/:id/files', async (c) => {
  const noticeId = c.req.param('id')
  const { fileName, fileData, fileSize } = await c.req.json()
  await DB.prepare(`
    INSERT INTO edu_notice_files(notice_id,file_name,file_data,file_size) VALUES(?,?,?,?)
  `).bind(noticeId, fileName, fileData, fileSize??0).run()
  return ok(null)
})

// 공지 파일 삭제 (관리자)
app.delete('/api/notices/:id/files/:fileId', async (c) => {
  const fileId = c.req.param('fileId')
  await DB.prepare(`DELETE FROM edu_notice_files WHERE id=?`).bind(fileId).run()
  return ok(null)
})

// 공지 삭제 (관리자)
app.delete('/api/notices/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM edu_notice_files WHERE notice_id=?`).bind(id).run()
  await DB.prepare(`DELETE FROM edu_notices WHERE id=?`).bind(id).run()
  return ok(null)
})


// ══════════════════════════════════════
// DB 용량 및 파일 관리 API
// ══════════════════════════════════════

// DB 용량 조회
app.get('/api/storage/stats', async (c) => {
  // 이수증 파일 총 용량 (Base64 문자열 길이 기준)
  const subFiles = await DB.prepare(`
    SELECT COUNT(*) as cnt,
           SUM(LENGTH(file_data)) as total_bytes,
           SUM(CASE WHEN file_data IS NOT NULL AND file_data != '' THEN 1 ELSE 0 END) as with_file
    FROM training_submissions
  `).first<{ cnt: number; total_bytes: number; with_file: number }>()

  const noticeFiles = await DB.prepare(`
    SELECT COUNT(*) as cnt, SUM(LENGTH(file_data)) as total_bytes
    FROM edu_notice_files
  `).first<{ cnt: number; total_bytes: number }>()

  const eduDocs = await DB.prepare(`
    SELECT COUNT(*) as cnt, SUM(LENGTH(file_data)) as total_bytes
    FROM edu_docs
  `).first<{ cnt: number; total_bytes: number }>()

  const guideVideos = await DB.prepare(`
    SELECT COUNT(*) as cnt, SUM(LENGTH(video_data)) as total_bytes
    FROM guideline_links WHERE video_data IS NOT NULL AND video_data != ''
  `).first<{ cnt: number; total_bytes: number }>()

  const reportTpls = await DB.prepare(`
    SELECT COUNT(*) as cnt, SUM(LENGTH(file_data)) as total_bytes
    FROM report_templates
  `).first<{ cnt: number; total_bytes: number }>()

  return ok({
    submissions: {
      count: subFiles?.cnt ?? 0,
      withFile: subFiles?.with_file ?? 0,
      bytes: subFiles?.total_bytes ?? 0
    },
    noticeFiles: { count: noticeFiles?.cnt ?? 0, bytes: noticeFiles?.total_bytes ?? 0 },
    eduDocs:     { count: eduDocs?.cnt ?? 0,     bytes: eduDocs?.total_bytes ?? 0 },
    guideVideos: { count: guideVideos?.cnt ?? 0,  bytes: guideVideos?.total_bytes ?? 0 },
    reportTpls:  { count: reportTpls?.cnt ?? 0,   bytes: reportTpls?.total_bytes ?? 0 },
    limitBytes: 500 * 1024 * 1024  // 500MB
  })
})

// 기간별 이수증 파일 목록 조회 (다운로드 전 미리보기)
app.get('/api/storage/submissions-files', async (c) => {
  const from = c.req.query('from') || ''
  const to   = c.req.query('to')   || ''
  const catId = c.req.query('catId') || ''

  let query = `
    SELECT s.id, s.emp_id, s.cat_id, s.period, s.submitted_at,
           s.file_name, s.approved,
           LENGTH(s.file_data) as file_size,
           e.name as emp_name, e.dept
    FROM training_submissions s
    LEFT JOIN employees e ON e.emp_id = s.emp_id
    WHERE s.file_data IS NOT NULL AND s.file_data != ''
  `
  const params: string[] = []

  if (from) { query += ` AND s.submitted_at >= ?`; params.push(from) }
  if (to)   { query += ` AND s.submitted_at <= ?`; params.push(to + 'T23:59:59') }
  if (catId){ query += ` AND s.cat_id = ?`;        params.push(catId) }

  query += ` ORDER BY s.submitted_at DESC`

  const stmt = DB.prepare(query)
  const { results } = await stmt.bind(...params).all()
  return ok(results)
})

// 기간별 이수증 파일 데이터 조회 (ZIP 생성용 — file_data 포함)
app.get('/api/storage/submissions-files/download', async (c) => {
  const from  = c.req.query('from')  || ''
  const to    = c.req.query('to')    || ''
  const catId = c.req.query('catId') || ''
  const ids   = c.req.query('ids')   || ''  // 콤마구분 ID 목록

  let query = `
    SELECT s.id, s.emp_id, s.cat_id, s.period, s.submitted_at,
           s.file_name, s.file_data, s.approved,
           e.name as emp_name, e.dept
    FROM training_submissions s
    LEFT JOIN employees e ON e.emp_id = s.emp_id
    WHERE s.file_data IS NOT NULL AND s.file_data != ''
  `
  const params: string[] = []

  if (ids) {
    const idList = ids.split(',').map(s=>s.trim()).filter(Boolean)
    if (idList.length) {
      query += ` AND s.id IN (${idList.map(()=>'?').join(',')})`
      params.push(...idList)
    }
  } else {
    if (from)  { query += ` AND s.submitted_at >= ?`;             params.push(from) }
    if (to)    { query += ` AND s.submitted_at <= ?`;             params.push(to + 'T23:59:59') }
    if (catId) { query += ` AND s.cat_id = ?`;                    params.push(catId) }
  }

  const { results } = await DB.prepare(query).bind(...params).all()
  return ok(results)
})

// 파일 삭제 (file_data만 지우고 이력 보존)
app.post('/api/storage/clear-files', async (c) => {
  const { ids } = await c.req.json()  // 삭제할 submission id 배열
  if (!ids || !ids.length) return err('삭제할 항목이 없습니다')

  let cleared = 0
  for (const id of ids) {
    await DB.prepare(
      `UPDATE training_submissions SET file_data='', file_name=file_name||' (삭제됨)' WHERE id=?`
    ).bind(id).run()
    cleared++
  }
  return ok({ cleared })
})

// ══════════════════════════════════════
// 헬스체크
// ══════════════════════════════════════
app.get('/api/health', (c) => c.json({ ok: true, service: '지씨 교육 포털', time: new Date().toISOString() }))
// ═══════════════════════════════════════════════════════════
// 온보딩 API — src/index.tsx 맨 아래 app.fire() 바로 위에 추가
// ═══════════════════════════════════════════════════════════

// ── 체크리스트 항목 목록 (전체, 관리자용) ────────────────
app.get('/api/onboarding/checklist-items', async (c) => {
  const admin = c.req.query('all')
  const { results } = await DB.prepare(
    admin
      ? `SELECT * FROM onboarding_checklist_items ORDER BY sort_order`
      : `SELECT * FROM onboarding_checklist_items WHERE is_active=1 ORDER BY sort_order`
  ).all()
  return ok(results)
})

// ── 체크리스트 항목 추가 ──────────────────────────────────
app.post('/api/onboarding/checklist-items', async (c) => {
  const { group_name, item_name, sort_order } = await c.req.json()
  if (!group_name || !item_name) return err('그룹명과 항목명은 필수입니다')
  const r = await DB.prepare(
    `INSERT INTO onboarding_checklist_items (group_name, item_name, sort_order) VALUES (?, ?, ?)`
  ).bind(group_name, item_name, sort_order || 0).run()
  return ok({ id: r.meta.last_row_id })
})

// ── 체크리스트 항목 수정 ──────────────────────────────────
app.put('/api/onboarding/checklist-items/:id', async (c) => {
  const id = c.req.param('id')
  const { group_name, item_name, sort_order } = await c.req.json()
  await DB.prepare(
    `UPDATE onboarding_checklist_items SET group_name=?, item_name=?, sort_order=? WHERE id=?`
  ).bind(group_name, item_name, sort_order || 0, id).run()
  return ok({ updated: true })
})

// ── 체크리스트 항목 활성/비활성 토글 ─────────────────────
app.put('/api/onboarding/checklist-items/:id/toggle', async (c) => {
  const id = c.req.param('id')
  const { is_active } = await c.req.json()
  await DB.prepare(
    `UPDATE onboarding_checklist_items SET is_active=? WHERE id=?`
  ).bind(is_active, id).run()
  return ok({ updated: true })
})

// ── 온보딩 직원 목록 (관리자) ────────────────────────────
app.get('/api/onboarding/employees', async (c) => {
  const { results } = await DB.prepare(`
    SELECT
      oe.id, oe.emp_id, oe.hire_date, oe.probation_end,
      oe.emp_type, oe.status, oe.converted_at, oe.notes,
      e.name,
      COALESCE(e.department, e.dept, '') AS department,
      COALESCE(e.position, e.rank, '') AS position,
      COUNT(op.id)                                          AS total_items,
      SUM(CASE WHEN op.is_done=1 THEN 1 ELSE 0 END)        AS done_items,
      CAST(julianday(oe.probation_end) - julianday('now') AS INTEGER) AS dday
    FROM onboarding_employees oe
    JOIN employees e ON e.emp_id = oe.emp_id
    LEFT JOIN onboarding_progress op ON op.onboarding_id = oe.id
    WHERE oe.status = 'active'
    GROUP BY oe.id
    ORDER BY oe.hire_date DESC
  `).all()
  return ok(results)
})

// ── 온보딩 직원 1명 상세 + 진행 상황 ────────────────────
app.get('/api/onboarding/employees/:id', async (c) => {
  const id = c.req.param('id')
  const emp = await DB.prepare(`
    SELECT oe.*, e.name, e.department, e.position, e.email
    FROM onboarding_employees oe
    JOIN employees e ON e.emp_id = oe.emp_id
    WHERE oe.id = ?
  `).bind(id).first()
  if (!emp) return err('온보딩 직원을 찾을 수 없습니다', 404)

  const { results: progress } = await DB.prepare(`
    SELECT op.*, ci.group_name, ci.item_name, ci.sort_order
    FROM onboarding_progress op
    JOIN onboarding_checklist_items ci ON ci.id = op.item_id
    WHERE op.onboarding_id = ?
    ORDER BY ci.sort_order
  `).bind(id).all()

  return ok({ ...emp, progress })
})

// ── 온보딩 직원 등록 ─────────────────────────────────────
app.post('/api/onboarding/employees', async (c) => {
  const { name, emp_id, dept, position, email, hire_date, probation_end: custom_probation_end, emp_type, notes } = await c.req.json()
  if (!name || !emp_id || !hire_date) return err('성명, 사번, 입사일은 필수입니다')

  // 수습 만료일: 직접 입력 값이 있으면 사용, 없으면 입사일 + 3개월 자동 계산
  let probation_end = custom_probation_end
  if (!probation_end) {
    const hd = new Date(hire_date)
    hd.setMonth(hd.getMonth() + 3)
    probation_end = hd.toISOString().slice(0, 10)
  }

  // employees 테이블에 없으면 자동 추가
  const existing = await DB.prepare(
    `SELECT emp_id FROM employees WHERE emp_id = ?`
  ).bind(emp_id).first()

  if (!existing) {
    await DB.prepare(`
      INSERT INTO employees (emp_id, name, department, position, email, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(emp_id, name, dept || '', position || '', email || '', emp_id).run()
  }

  const result = await DB.prepare(`
    INSERT INTO onboarding_employees (emp_id, hire_date, probation_end, emp_type, notes)
    VALUES (?, ?, ?, ?, ?)
  `).bind(emp_id, hire_date, probation_end, emp_type || '정규직', notes || '').run()

  const newId = result.meta.last_row_id

  // 체크리스트 항목 자동 생성
  const { results: items } = await DB.prepare(
    `SELECT id FROM onboarding_checklist_items WHERE is_active=1`
  ).all()

  for (const item of items as any[]) {
    await DB.prepare(`
      INSERT OR IGNORE INTO onboarding_progress (onboarding_id, item_id)
      VALUES (?, ?)
    `).bind(newId, item.id).run()
  }

  return ok({ id: newId, probation_end })
})

// ── 체크 항목 완료/미완료 토글 ───────────────────────────
app.put('/api/onboarding/progress/:onboardingId/:itemId', async (c) => {
  const { onboardingId, itemId } = c.req.param()
  const { is_done, memo } = await c.req.json()
  const done_at = is_done ? new Date().toISOString().slice(0, 10) : null

  await DB.prepare(`
    INSERT INTO onboarding_progress (onboarding_id, item_id, is_done, done_at, memo)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(onboarding_id, item_id) DO UPDATE SET
      is_done = excluded.is_done,
      done_at = excluded.done_at,
      memo    = excluded.memo
  `).bind(onboardingId, itemId, is_done ? 1 : 0, done_at, memo || '').run()

  return ok({ updated: true })
})

// ── 온보딩 직원 정보 수정 ────────────────────────────────
app.put('/api/onboarding/employees/:id', async (c) => {
  const id = c.req.param('id')
  const { hire_date, probation_end, emp_type, notes, welcome_message } = await c.req.json()
  if (!hire_date || !probation_end) return err('입사일과 수습 만료일은 필수입니다')
  await DB.prepare(`
    UPDATE onboarding_employees
    SET hire_date=?, probation_end=?, emp_type=?, notes=?, welcome_message=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(hire_date, probation_end, emp_type || '정규직', notes || '', welcome_message || '', id).run()
  return ok({ updated: true })
})

// ── 수습 전환 처리 ───────────────────────────────────────
app.put('/api/onboarding/employees/:id/convert', async (c) => {
  const id = c.req.param('id')
  const today = new Date().toISOString().slice(0, 10)
  await DB.prepare(`
    UPDATE onboarding_employees
    SET status='converted', converted_at=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(today, id).run()
  return ok({ converted: true, converted_at: today })
})

// ── 수습 D-20 알림 대상 조회 (Apps Script 트리거용) ──────
app.get('/api/onboarding/reminders', async (c) => {
  const { results } = await DB.prepare(`
    SELECT oe.id, oe.emp_id, oe.probation_end, oe.emp_type,
           e.name, e.email,
           CAST(julianday(oe.probation_end) - julianday('now') AS INTEGER) AS dday
    FROM onboarding_employees oe
    JOIN employees e ON e.emp_id = oe.emp_id
    WHERE oe.status = 'active'
      AND CAST(julianday(oe.probation_end) - julianday('now') AS INTEGER) = 20
  `).all()
  return ok(results)
})

// ── 입사 안내자료 목록 ───────────────────────────────────
app.get('/api/onboarding/resources', async (c) => {
  const { results } = await DB.prepare(
    `SELECT id, title, resource_type, file_name, link_url, description, sort_order
     FROM onboarding_resources WHERE is_active=1 ORDER BY sort_order`
  ).all()
  return ok(results)
})

// ── 입사 안내자료 등록 (관리자) ──────────────────────────
app.post('/api/onboarding/resources', async (c) => {
  const { title, resource_type, file_name, file_data, link_url, description, sort_order } = await c.req.json()
  if (!title) return err('제목은 필수입니다')
  await DB.prepare(`
    INSERT INTO onboarding_resources (title, resource_type, file_name, file_data, link_url, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(title, resource_type || 'file', file_name || '', file_data || '', link_url || '', description || '', sort_order || 0).run()
  return ok({ created: true })
})

// ── 입사 안내자료 삭제 (관리자) ──────────────────────────
app.delete('/api/onboarding/resources/:id', async (c) => {
  const id = c.req.param('id')
  await DB.prepare(
    `UPDATE onboarding_resources SET is_active=0 WHERE id=?`
  ).bind(id).run()
  return ok({ deleted: true })
})

// ── 안내자료 파일 다운로드 ────────────────────────────────
app.get('/api/onboarding/resources/:id/download', async (c) => {
  const id = c.req.param('id')
  const row = await DB.prepare(
    `SELECT file_name, file_data FROM onboarding_resources WHERE id=? AND is_active=1`
  ).bind(id).first()
  if (!row) return err('자료를 찾을 수 없습니다', 404)
  return ok({ file_name: (row as any).file_name, file_data: (row as any).file_data })
})

// ── 입사자 개인 메시지 조회 ──────────────────────────────
app.get('/api/onboarding/message/:onboardingId', async (c) => {
  const id = c.req.param('onboardingId')
  const row = await DB.prepare(
    `SELECT message, updated_at FROM onboarding_messages WHERE onboarding_id=?`
  ).bind(id).first()
  return ok({ message: (row as any)?.message || '', updated_at: (row as any)?.updated_at || null })
})

// ── 입사자 개인 메시지 저장/수정 (관리자) ───────────────
app.put('/api/onboarding/message/:onboardingId', async (c) => {
  const id = c.req.param('onboardingId')
  const { message } = await c.req.json()
  await DB.prepare(`
    INSERT INTO onboarding_messages (onboarding_id, message, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(onboarding_id) DO UPDATE SET
      message = excluded.message,
      updated_at = CURRENT_TIMESTAMP
  `).bind(id, message || '').run()
  return ok({ saved: true })
})
// ── AI 교육 탐색 — 검색 설정 조회 ──────────────────────
app.get('/api/edu-search-settings', async (c) => {
  const { results } = await DB.prepare(
    `SELECT key, value FROM edu_search_settings`
  ).all()
  const settings: Record<string, string> = {}
  for (const r of results as any[]) settings[(r as any).key] = (r as any).value
  return ok(settings)
})

app.post('/api/edu-search-settings', async (c) => {
  const body = await c.req.json()
  for (const [key, value] of Object.entries(body)) {
    await DB.prepare(
      `INSERT INTO edu_search_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now','localtime')`
    ).bind(key, value).run()
  }
  return ok({ saved: true })
})

app.get('/api/edu-drafts', async (c) => {
  const { results } = await DB.prepare(
    `SELECT * FROM edu_notice_drafts ORDER BY created_at DESC`
  ).all()
  return ok(results)
})

app.post('/api/edu-drafts', async (c) => {
  const token = c.req.header('X-Cowork-Key') || ''
  const validToken = process.env.COWORK_API_KEY || 'gc-edu-2026'
  if (token !== validToken) return err('인증 실패', 401)
  const body = await c.req.json()
  const items = Array.isArray(body) ? body : [body]
  let inserted = 0
  for (const item of items as any[]) {
    if (!item.title) continue
    const dup = await DB.prepare(
      `SELECT id FROM edu_notice_drafts WHERE title = ? AND created_at > datetime('now','-30 days','localtime')`
    ).bind(item.title).first()
    if (dup) continue
    await DB.prepare(
      `INSERT INTO edu_notice_drafts (title, content, category, source_url, source_site, cost, target, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(item.title||'', item.content||item.summary||'', item.category||'general', item.url||'', item.source_site||'', item.cost||'', item.target||'', item.period||'').run()
    inserted++
  }
  return ok({ inserted })
})

app.post('/api/edu-drafts/:id/publish', async (c) => {
  const id = c.req.param('id')
  const draft = await DB.prepare(
    `SELECT * FROM edu_notice_drafts WHERE id = ?`
  ).bind(id).first() as any
  if (!draft) return err('초안을 찾을 수 없습니다')
  await DB.prepare(
    `INSERT INTO edu_notices (title, content, created_at) VALUES (?, ?, datetime('now','localtime'))`
  ).bind(draft.title, draft.content).run()
  await DB.prepare(
    `UPDATE edu_notice_drafts SET status='published', published_at=datetime('now','localtime') WHERE id=?`
  ).bind(id).run()
  return ok({ published: true })
})

app.delete('/api/edu-drafts/:id', async (c) => {
  await DB.prepare(
    `DELETE FROM edu_notice_drafts WHERE id = ?`
  ).bind(c.req.param('id')).run()
  return ok({ deleted: true })
})

export default app
