// ═══════════════════════════════════════════════════════════════
// SATORI DASHBOARD · Google Apps Script Backend v2.1
// ═══════════════════════════════════════════════════════════════

const SHEET_NAME_DIAS  = 'dias';
const SHEET_NAME_COMPS = 'comps';
const SHEET_NAME_META  = 'meta';
const SECRET_KEY       = 'satori2026';

// GET → lecturas (getDias, getComps, ping)
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    const params = e.parameter || {};
    if (params.key !== SECRET_KEY) {
      return output.setContent(JSON.stringify({ ok:false, error:'Unauthorized' }));
    }
    const action = params.action;
    let result = { ok:false, error:'Unknown action' };
    if      (action === 'ping')      result = { ok:true, msg:'Satori backend online' };
    else if (action === 'getDias')   result = getDias();
    else if (action === 'getComps')  result = getComps();
    output.setContent(JSON.stringify(result));
  } catch(err) {
    output.setContent(JSON.stringify({ ok:false, error:err.toString() }));
  }
  return output;
}

// POST → escrituras (saveDia, deleteDia, saveComps)
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    let params = {};
    // Leer del body del POST
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    }
    // Fallback a query string
    if (!params.action && e.parameter) {
      Object.assign(params, e.parameter);
    }
    
    console.log('POST action:', params.action, '| fecha:', params.fecha);
    
    if (params.key !== SECRET_KEY) {
      return output.setContent(JSON.stringify({ ok:false, error:'Unauthorized' }));
    }
    const action = params.action;
    let result = { ok:false, error:'Unknown action' };
    if      (action === 'saveDia')   result = saveDia(params.fecha, params.data);
    else if (action === 'deleteDia') result = deleteDia(params.fecha);
    else if (action === 'saveComps') result = saveComps(params.data);
    output.setContent(JSON.stringify(result));
  } catch(err) {
    console.error('doPost error:', err.toString());
    output.setContent(JSON.stringify({ ok:false, error:err.toString() }));
  }
  return output;
}

// ── Inicializar hojas ──────────────────────────────────────────
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET_NAME_DIAS, SHEET_NAME_COMPS, SHEET_NAME_META].forEach(name => {
    if (!ss.getSheetByName(name)) {
      const sheet = ss.insertSheet(name);
      if (name === SHEET_NAME_DIAS) {
        sheet.getRange(1,1,1,3).setValues([['fecha','uploadedAt','data']]);
        sheet.setFrozenRows(1);
        // Force column A (fecha) to plain text so Sheets never auto-converts dates
        sheet.getRange('A:A').setNumberFormat('@STRING@');
      } else if (name === SHEET_NAME_COMPS) {
        sheet.getRange(1,1,1,2).setValues([['id','data']]);
        sheet.setFrozenRows(1);
      } else if (name === SHEET_NAME_META) {
        sheet.getRange(1,1,1,2).setValues([['key','value']]);
        sheet.setFrozenRows(1);
      }
    }
  });
}

// ── DIAS ──────────────────────────────────────────────────────
function getDias() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_DIAS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, dias:{} };
  const dias = {};
  for (let i = 1; i < rows.length; i++) {
    const [fecha, uploadedAt, dataStr] = rows[i];
    if (!fecha) continue;
    // Force fecha to YYYY-MM-DD string (Sheets may return Date objects)
    let fechaStr = String(fecha);
    if (fecha instanceof Date) {
      const y = fecha.getFullYear();
      const m = String(fecha.getMonth()+1).padStart(2,'0');
      const d = String(fecha.getDate()).padStart(2,'0');
      fechaStr = `${y}-${m}-${d}`;
    } else {
      // Extract YYYY-MM-DD from any string format
      const match = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) fechaStr = `${match[1]}-${match[2]}-${match[3]}`;
    }
    try { dias[fechaStr] = JSON.parse(dataStr); } catch(e) {}
  }
  return { ok:true, dias };
}

function saveDia(fecha, dataStr) {
  if (!fecha || !dataStr) return { ok:false, error:'Missing fecha or data' };
  // Ensure fecha is always stored as plain YYYY-MM-DD string
  const match = String(fecha).match(/(\d{4})-(\d{2})-(\d{2})/);
  const cleanFecha = match ? `${match[1]}-${match[2]}-${match[3]}` : String(fecha);
  fecha = cleanFecha;
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_DIAS);
  const rows  = sheet.getDataRange().getValues();
  // Normalize existing row keys for comparison
  for (let i = 1; i < rows.length; i++) {
    let rowFecha = String(rows[i][0]);
    if (rows[i][0] instanceof Date) {
      const d = rows[i][0];
      rowFecha = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (rowFecha === String(fecha)) {
      sheet.getRange(i+1, 2, 1, 2).setValues([[new Date().toISOString(), dataStr]]);
      return { ok:true, action:'updated', fecha };
    }
  }
  const newRow = sheet.appendRow([fecha, new Date().toISOString(), dataStr]);
  // Force fecha cell to text to prevent auto-conversion
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setNumberFormat('@STRING@');
  return { ok:true, action:'created', fecha };
}

function deleteDia(fecha) {
  if (!fecha) return { ok:false, error:'Missing fecha' };
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_DIAS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(fecha)) {
      sheet.deleteRow(i+1);
      return { ok:true, action:'deleted', fecha };
    }
  }
  return { ok:false, error:'Fecha not found' };
}

// ── COMPETENCIAS ──────────────────────────────────────────────
function getComps() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_COMPS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'all') {
      try { return { ok:true, comps: JSON.parse(rows[i][1]) }; } catch(e) {}
    }
  }
  return { ok:true, comps:[] };
}

function saveComps(dataStr) {
  if (!dataStr) return { ok:false, error:'Missing data' };
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_COMPS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'all') {
      sheet.getRange(i+1, 2).setValue(dataStr);
      return { ok:true, action:'updated' };
    }
  }
  sheet.appendRow(['all', dataStr]);
  return { ok:true, action:'created' };
}
