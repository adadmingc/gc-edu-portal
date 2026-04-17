// ══════════════════════════════════════
// GC 교육 포털 — 공통 API 클라이언트
// localStorage 완전 제거, 모든 데이터는 서버 API로
// ══════════════════════════════════════

const API = {
  async call(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  },
  get: (path) => API.call('GET', path),
  post: (path, body) => API.call('POST', path, body),
  put: (path, body) => API.call('PUT', path, body),
  del: (path) => API.call('DELETE', path),
};

// ── 인증 ──
async function apiAdminLogin(password) {
  return API.post('/api/auth/admin', { password });
}
async function apiEmpLogin(name, empId, password) {
  return API.post('/api/auth/employee', { name, empId, password: password||'' });
}
async function apiSetEmpPassword(empId, password) {
  return API.put(`/api/employees/${empId}/password`, { password });
}
async function apiChangePw(current, next) {
  return API.post('/api/auth/change-pw', { current, next });
}

// ── 직원 ──
async function apiGetEmps() {
  const r = await API.get('/api/employees');
  return r.ok ? r.data : [];
}
async function apiAddEmp(emp) {
  return API.post('/api/employees', emp);
}
async function apiUpdateEmp(empId, emp) {
  return API.put(`/api/employees/${empId}`, emp);
}
async function apiDeleteEmp(empId) {
  return API.del(`/api/employees/${empId}`);
}

// ── 이수 현황 ──
async function apiGetTraining() {
  const r = await API.get('/api/training');
  // { emp_id, cat_id, ... } 배열을 { [empId]: { [catId]: row } } 형태로 변환
  const map = {};
  for (const row of (r.ok ? r.data : [])) {
    if (!map[row.emp_id]) map[row.emp_id] = {};
    map[row.emp_id][row.cat_id] = {
      submitted: !!row.submitted,
      submittedAt: row.submitted_at,
      fileName: row.file_name,
      fileData: row.file_data,
      approved: row.approved === 1 ? true : row.approved === 0 ? false : undefined,
      approvedAt: row.approved_at,
      supplementRequested: !!row.supplement_requested,
      supplementReason: row.supplement_reason,
      supplementAt: row.supplement_at,
    };
  }
  return map;
}
async function apiGetEmpTraining(empId) {
  const r = await API.get(`/api/training/${empId}`);
  const map = {};
  for (const row of (r.ok ? r.data : [])) {
    map[row.cat_id] = {
      submitted: !!row.submitted,
      submittedAt: row.submitted_at,
      fileName: row.file_name,
      fileData: row.file_data,
      approved: row.approved === 1 ? true : row.approved === 0 ? false : undefined,
      approvedAt: row.approved_at,
      supplementRequested: !!row.supplement_requested,
      supplementReason: row.supplement_reason,
      supplementAt: row.supplement_at,
    };
  }
  return map;
}
async function apiSubmitCert(empId, catId, fileName, fileData, trainHours) {
  return API.post(`/api/training/${empId}/${catId}/submit`, { fileName, fileData, trainHours: trainHours||'' });
}
async function apiSubmitCheck(empId, catId, trainHours) {
  return API.post(`/api/training/${empId}/${catId}/check`, { trainHours: trainHours||'' });
}
async function apiReview(empId, catId, approved) {
  return API.post(`/api/training/${empId}/${catId}/review`, { approved });
}
async function apiSupplement(empId, catId, reason) {
  return API.post(`/api/training/${empId}/${catId}/supplement`, { reason });
}

// ── 교육방침 자료 ──
async function apiGetGuideline() {
  const r = await API.get('/api/guideline');
  // cat_id별로 그룹핑
  const map = {};
  for (const row of (r.ok ? r.data : [])) {
    if (!map[row.cat_id]) map[row.cat_id] = { desc: '', items: [] };
    map[row.cat_id].items.push({
      id: row.id,
      emoji: row.emoji,
      name: row.name,
      url: row.url,
      linkDesc: row.link_desc,
      type: row.type,
      videoName: row.video_name,
      videoData: row.video_data,
    });
  }
  return map;
}
async function apiAddGuidelineItem(catId, item) {
  return API.post('/api/guideline', { catId, ...item });
}
async function apiUpdateGuidelineItem(id, item) {
  return API.put(`/api/guideline/${id}`, item);
}
async function apiDeleteGuidelineItem(id) {
  return API.del(`/api/guideline/${id}`);
}

// ── 교육 지침 / 결과보고서 양식 ──
async function apiGetEduDocs(catId) {
  const path = catId ? `/api/edu-docs/${catId}` : '/api/edu-docs';
  const r = await API.get(path);
  return r.ok ? r.data : [];
}
async function apiAddEduDoc(catId, docType, title, fileName, fileData) {
  return API.post('/api/edu-docs', { catId, docType, title, fileName, fileData });
}
async function apiDeleteEduDoc(id) {
  return API.del(`/api/edu-docs/${id}`);
}
async function apiDownloadEduDoc(catId, id) {
  const r = await API.get(`/api/edu-docs/${catId}/${id}/download`);
  return r.ok ? r.data : null;
}

// ── 전체 교육 현황 내보내기 ──
async function apiExportTraining() {
  const r = await API.get('/api/export/training');
  return r.ok ? r.data : { employees: [], training: [] };
}

// ── 이수증 다중 제출 ──
async function apiGetSubmissions(empId) {
  const path = empId ? `/api/submissions/${empId}` : '/api/submissions';
  const r = await API.get(path);
  return r.ok ? r.data : [];
}
async function apiAddSubmission(empId, catId, period, fileName, fileData, trainHours, note) {
  return API.post(`/api/submissions/${empId}/${catId}`, { period, fileName, fileData, trainHours, note });
}
async function apiDeleteSubmission(id) {
  return API.del(`/api/submissions/${id}`);
}
async function apiReviewSubmission(id, approved) {
  return API.put(`/api/submissions/${id}/review`, { approved });
}
async function apiSupplementSubmission(id, reason) {
  return API.put(`/api/submissions/${id}/supplement`, { reason });
}

// ── 공통 교육결과 보고서 양식 ──
async function apiGetReportTemplates() {
  const r = await API.get('/api/report-templates');
  return r.ok ? r.data : [];
}
async function apiAddReportTemplate(title, description, fileName, fileData) {
  return API.post('/api/report-templates', { title, description, fileName, fileData });
}
async function apiUpdateReportTemplate(id, title, description) {
  return API.put(`/api/report-templates/${id}`, { title, description });
}
async function apiDeleteReportTemplate(id) {
  return API.del(`/api/report-templates/${id}`);
}
async function apiDownloadReportTemplate(id) {
  const r = await API.get(`/api/report-templates/${id}/download`);
  return r.ok ? r.data : null;
}

// ── 직원별 교육 배정 ──
async function apiGetAssignments(empId) {
  const r = await API.get(`/api/assignments/${empId}`);
  return r.ok ? r.data : [];
}
async function apiGetAllAssignments() {
  const r = await API.get('/api/assignments');
  return r.ok ? r.data : [];
}
async function apiSaveAssignments(empId, catIds) {
  return API.put(`/api/assignments/${empId}`, { catIds });
}

// ── 직원 비밀번호 변경 (직원 본인) ──
async function apiChangeEmpPw(empId, currentPw, newPw) {
  return API.post(`/api/employees/${empId}/change-pw`, { currentPw, newPw });
}

// ── 부관리자 API ──
async function apiSubAdminLogin(username, password) {
  return API.post('/api/auth/sub-admin', { username, password });
}
async function apiGetSubAdmins() {
  const r = await API.get('/api/sub-admins');
  return r.ok ? r.data : [];
}
async function apiAddSubAdmin(username, password, name, catIds) {
  return API.post('/api/sub-admins', { username, password, name, catIds });
}
async function apiUpdateSubAdmin(id, password, name, catIds) {
  return API.put(`/api/sub-admins/${id}`, { password, name, catIds });
}
async function apiDeleteSubAdmin(id) {
  return API.del(`/api/sub-admins/${id}`);
}

// ── 교육 공지 게시판 ──
async function apiGetNotices(limit, offset) {
  const r = await API.get(`/api/notices?limit=${limit||5}&offset=${offset||0}`);
  return r.ok ? r.data : { items: [], total: 0 };
}
async function apiGetNotice(id) {
  const r = await API.get(`/api/notices/${id}`);
  return r.ok ? r.data : null;
}
async function apiDownloadNoticeFile(noticeId, fileId) {
  const r = await API.get(`/api/notices/${noticeId}/files/${fileId}`);
  return r.ok ? r.data : null;
}
async function apiAddNotice(title, content, author, isPinned, files) {
  return API.post('/api/notices', { title, content, author, isPinned, files });
}
async function apiUpdateNotice(id, title, content, author, isPinned) {
  return API.put(`/api/notices/${id}`, { title, content, author, isPinned });
}
async function apiAddNoticeFile(noticeId, fileName, fileData, fileSize) {
  return API.post(`/api/notices/${noticeId}/files`, { fileName, fileData, fileSize });
}
async function apiDeleteNoticeFile(noticeId, fileId) {
  return API.del(`/api/notices/${noticeId}/files/${fileId}`);
}
async function apiDeleteNotice(id) {
  return API.del(`/api/notices/${id}`);
}

// ── DB 용량 / 파일 관리 ──
async function apiGetStorageStats() {
  const r = await API.get('/api/storage/stats');
  return r.ok ? r.data : null;
}
async function apiGetSubmissionFiles(from, to, catId) {
  const p = new URLSearchParams();
  if (from)  p.set('from', from);
  if (to)    p.set('to', to);
  if (catId) p.set('catId', catId);
  const r = await API.get(`/api/storage/submissions-files?${p}`);
  return r.ok ? r.data : [];
}
async function apiDownloadSubmissionFiles(from, to, catId, ids) {
  const p = new URLSearchParams();
  if (from)  p.set('from', from);
  if (to)    p.set('to', to);
  if (catId) p.set('catId', catId);
  if (ids?.length) p.set('ids', ids.join(','));
  const r = await API.get(`/api/storage/submissions-files/download?${p}`);
  return r.ok ? r.data : [];
}
async function apiClearSubmissionFiles(ids) {
  return API.post('/api/storage/clear-files', { ids });
}
