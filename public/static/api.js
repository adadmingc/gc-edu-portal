// ══════════════════════════════════════
// GC 교육 포털 — 공통 API 클라이언트
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
async function apiEmpLogin(name, empId) {
  return API.post('/api/auth/employee', { name, empId });
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
async function apiBulkEmps(employees) {
  return API.post('/api/employees/bulk', { employees });
}

// ── 이수 현황 ──
async function apiGetTraining() {
  const r = await API.get('/api/training');
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
      trainHours: row.train_hours,
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
      trainHours: row.train_hours,
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

// ── 교육 방침 자료 ──
async function apiGetGuideline() {
  const r = await API.get('/api/guideline');
  const map = {};
  for (const row of (r.ok ? r.data : [])) {
    if (!map[row.cat_id]) map[row.cat_id] = { desc: '', items: [] };
    if (row.name === '__desc__') {
      map[row.cat_id].desc = row.link_desc || '';
    } else {
      map[row.cat_id].items.push({
        id: row.id,
        type: row.type,
        emoji: row.emoji,
        name: row.name,
        url: row.url,
        linkDesc: row.link_desc,
        videoName: row.video_name,
        videoData: row.video_data,
      });
    }
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
