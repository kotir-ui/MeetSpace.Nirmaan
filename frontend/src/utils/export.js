// Client-side exporters for platform tables/reports.

export function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Print the current view (browser "Save as PDF").
export function printView() {
  window.print();
}

// Fetch an image URL and convert it to a data URL (for embedding in exports).
// Returns null on any failure (missing/cross-origin/blocked).
async function toDataURL(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    // Guard against SPA fallbacks returning HTML for a missing image path.
    if (!blob.type.startsWith('image/')) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// L-shaped Nirmaan brand frame for PPT slides: a vertical blue/orange bar down
// the left edge meeting a horizontal red/green bar along the bottom-left.
function addBrandFrame(slide, pptx) {
  const rect = pptx.ShapeType.rect;
  const T = 0.16; // bar thickness
  slide.addShape(rect, { x: 0, y: 2.6, w: T, h: 2.45, fill: { color: '0C4DA2' }, line: { type: 'none' } });
  slide.addShape(rect, { x: 0, y: 5.05, w: T, h: 2.45, fill: { color: 'F4A81D' }, line: { type: 'none' } });
  slide.addShape(rect, { x: 0, y: 7.5 - T, w: 1.35, h: T, fill: { color: 'E4002B' }, line: { type: 'none' } });
  slide.addShape(rect, { x: 1.35, y: 7.5 - T, w: 1.35, h: T, fill: { color: '5AAA46' }, line: { type: 'none' } });
}

// Export a headers+rows table to an Excel-openable .xls (HTML table) file.
export function downloadExcel(filename, headers, rows) {
  const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const thead = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">${thead}${tbody}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Open a print-ready window with a clean table for "Save as PDF".
// leftLogo (report's portal logo) sits top-left, rightLogo (org logo) top-right.
export function printTablePDF(title, headers, rows, { leftLogo, rightLogo } = {}) {
  const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const thead = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  const leftImg = leftLogo ? `<img class="logo" src="${esc(leftLogo)}" alt="" />` : '<span class="logo"></span>';
  const rightImg = rightLogo ? `<img class="logo" src="${esc(rightLogo)}" alt="" />` : '<span class="logo"></span>';
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(
    `<html><head><title>${esc(title)}</title><style>` +
      'body{font-family:Arial,Helvetica,sans-serif;padding:16px;color:#0f172a}' +
      '.hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;border-bottom:2px solid #0A2947;padding-bottom:10px}' +
      '.logo{height:46px;width:120px;object-fit:contain}' +
      'img.logo{display:block}' +
      'span.logo{display:inline-block}' +
      'h1{font-size:18px;margin:0;text-align:center;flex:1}' +
      'table{border-collapse:collapse;width:100%;font-size:12px}' +
      'th,td{border:1px solid #cbd5e1;padding:4px 8px;text-align:right}' +
      'th:first-child,td:first-child{text-align:left}' +
      'thead th{background:#0A2947;color:#fff}' +
      '</style></head><body>' +
      `<div class="hdr">${leftImg}<h1>${esc(title)}</h1>${rightImg}</div>` +
      `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>` +
      '<script>window.onload=function(){setTimeout(function(){window.print();},300);}</scr' + 'ipt></body></html>'
  );
  w.document.close();
}

// Professional A4-portrait PDF report — one page (section) per portal, with
// org + portal logos, portal info block, and a metrics table. `portals` is an
// array of { name, url, category, logo, from, to, headers, rows }.
export function printReportPDF({ reportTitle = 'Report', orgLogo, badgeLogo, generatedAt } = {}, portals = []) {
  if (!portals.length) return;
  const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const orgImg = orgLogo ? `<img class="logo" src="${esc(orgLogo)}" alt="" />` : '<span class="logo"></span>';
  const badgeHtml = badgeLogo ? `<img class="badge" src="${esc(badgeLogo)}" alt="" onerror="this.style.display='none'" />` : '';

  const sections = portals
    .map((pt, idx) => {
      const thead = `<tr>${(pt.headers || []).map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
      const tbody = (pt.rows || []).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
      const portalImg = pt.logo ? `<img class="logo" src="${esc(pt.logo)}" alt="" />` : '<span class="logo"></span>';
      const range = pt.from || pt.to ? `${esc(pt.from)} – ${esc(pt.to)}` : '';
      return (
        `<section class="page"${idx > 0 ? ' style="page-break-before:always"' : ''}>` +
        `<div class="hdr">${portalImg}<div class="hcenter"><div class="pname">${esc(pt.name)}</div>` +
        `<div class="rtitle">${esc(reportTitle)}</div>${range ? `<div class="range">${range}</div>` : ''}</div>${orgImg}</div>` +
        `<div class="info"><span><b>Portal:</b> ${esc(pt.name)}</span><span><b>URL:</b> ${esc(pt.url || '—')}</span>` +
        `<span><b>Category:</b> ${esc(pt.category || '—')}</span>` +
        `<span class="gen"><b>Generated:</b> ${esc(generatedAt || '')}</span></div>` +
        `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table></section>`
      );
    })
    .join('');

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(
    `<html><head><title>${esc(reportTitle)}</title><style>` +
      '@page{size:A4 portrait;margin:12mm;}' +
      'body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0}' +
      '.page{page-break-inside:avoid;box-sizing:border-box}' +
      '.page + .page{page-break-before:always}' +
      '.hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:2px solid #0A2947;padding-bottom:10px;margin-bottom:12px}' +
      '.logo{height:52px;width:130px;object-fit:contain}' +
      'img.logo{display:block}span.logo{display:inline-block}' +
      '.hcenter{flex:1;text-align:center}' +
      '.pname{font-size:20px;font-weight:700}' +
      '.rtitle{font-size:13px;color:#475569}' +
      '.range{font-size:12px;color:#64748b;margin-top:2px}' +
      '.info{display:flex;gap:18px;flex-wrap:wrap;align-items:center;font-size:12px;background:#f1f5f9;padding:8px 12px;border-radius:6px;margin-bottom:12px}' +
      '.info .gen{margin-left:auto;color:#64748b}' +
      'table{border-collapse:collapse;margin:0 auto;font-size:12px}' +
      'th,td{border:1px solid #cbd5e1;padding:6px 16px;text-align:center;min-width:90px}' +
      'th:first-child,td:first-child{text-align:left;min-width:180px}' +
      'thead th{background:#0A2947;color:#fff;white-space:nowrap}' +
      '.badge{position:fixed;bottom:8mm;right:6mm;height:64px;object-fit:contain}' +
      '</style></head><body>' +
      sections +
      badgeHtml +
      '<script>window.onload=function(){setTimeout(function(){window.print();},350);}</scr' + 'ipt></body></html>'
  );
  w.document.close();
}

// Export a table to a PowerPoint (.pptx) file. Loaded on demand.
// Pass `slides` (array of { title, subtitle, rows, leftLogo, rightLogo }) to
// render one slide per group (e.g. per portal), or a single `rows` set.
export async function downloadPPTX(filename, { title, subtitle, rows, slides, leftLogo, rightLogo, badgeLogo } = {}) {
  const groups = slides && slides.length ? slides : [{ title, subtitle, rows, leftLogo, rightLogo }];
  const usable = groups.filter((g) => g.rows && g.rows.length);
  if (!usable.length) return;
  const { default: PptxGen } = await import('pptxgenjs');
  const pptx = new PptxGen();
  pptx.layout = 'LAYOUT_WIDE';

  // Cache logo fetches so shared logos are only downloaded once.
  const cache = new Map();
  const getImg = async (url) => {
    if (!url) return null;
    if (!cache.has(url)) cache.set(url, await toDataURL(url));
    return cache.get(url);
  };

  const badgeImg = await getImg(badgeLogo);

  for (const g of usable) {
    const slide = pptx.addSlide();

    addBrandFrame(slide, pptx);

    const [leftImg, rightImg] = await Promise.all([getImg(g.leftLogo), getImg(g.rightLogo)]);
    if (leftImg) slide.addImage({ data: leftImg, x: 0.3, y: 0.25, w: 1.4, h: 0.8, sizing: { type: 'contain', w: 1.4, h: 0.8 } });
    if (rightImg) slide.addImage({ data: rightImg, x: 11.6, y: 0.25, w: 1.4, h: 0.8, sizing: { type: 'contain', w: 1.4, h: 0.8 } });

    // Certification badge, bottom-right corner.
    if (badgeImg) slide.addImage({ data: badgeImg, x: 12.15, y: 5.85, w: 1.0, h: 1.3, sizing: { type: 'contain', w: 1.0, h: 1.3 } });

    slide.addText(g.title || 'Report', {
      x: 1.8,
      y: 0.3,
      w: 9.7,
      h: 0.6,
      fontSize: 22,
      bold: true,
      align: 'center',
      color: '0A2947',
    });
    if (g.subtitle) {
      slide.addText(g.subtitle, { x: 1.8, y: 0.9, w: 9.7, h: 0.4, fontSize: 12, align: 'center', color: '667085' });
    }

    const columns = Object.keys(g.rows[0]);
    const cellBorder = { type: 'solid', pt: 1, color: '94A3B8' };
    const header = columns.map((c) => ({
      text: c,
      options: {
        bold: true,
        color: 'FFFFFF',
        fill: '0A2947',
        align: c === columns[0] ? 'left' : 'center',
        border: cellBorder,
      },
    }));
    const body = g.rows.map((r, ri) =>
      columns.map((c) => ({
        text: r[c] == null ? '' : String(r[c]),
        options: {
          align: c === columns[0] ? 'left' : 'center',
          border: cellBorder,
          fill: ri % 2 === 1 ? 'F1F5F9' : 'FFFFFF',
        },
      }))
    );

    // Fixed column widths so the table isn't stretched full-width; centered on slide.
    const SLIDE_W = 13.33;
    const firstColW = 3.2;
    const otherColW = 1.9;
    let colW = [firstColW, ...columns.slice(1).map(() => otherColW)];
    let totalW = colW.reduce((s, v) => s + v, 0);
    if (totalW > 12.3) {
      // Too many columns — fall back to full-width scaling.
      const scale = 12.3 / totalW;
      colW = colW.map((v) => v * scale);
      totalW = 12.3;
    }
    const tableX = Math.max(0.5, (SLIDE_W - totalW) / 2);

    // Vertically center the table within the slide body area (below the header).
    const SLIDE_H = 7.5;
    const rowH = 0.45;
    const areaTop = 1.7;
    const areaBottom = SLIDE_H - 0.4;
    const tableH = rowH * (g.rows.length + 1);
    const tableY = tableH < areaBottom - areaTop ? areaTop + (areaBottom - areaTop - tableH) / 2 : areaTop;

    slide.addTable([header, ...body], {
      x: tableX,
      y: tableY,
      colW,
      fontSize: 14,
      rowH,
      border: { type: 'solid', pt: 1, color: '94A3B8' },
      valign: 'middle',
      autoPage: true,
      autoPageRepeatHeader: true,
      autoPageLineWeight: 0.5,
    });
  }

  await pptx.writeFile({ fileName: filename.endsWith('.pptx') ? filename : `${filename}.pptx` });
}

// Infographic-style PPTX — one slide per portal, each metric shown as a marker
// card comparing two report periods (top value, colored ring, bottom value).
// `portals`: [{ name, url, period, metrics: [{ label, v1, v2 }] }]
export async function downloadInfographicPPTX(filename, { orgLogo, badgeLogo, portals = [] } = {}) {
  const usable = portals.filter((p) => p.metrics && p.metrics.length);
  if (!usable.length) return;
  const { default: PptxGen } = await import('pptxgenjs');
  const pptx = new PptxGen();
  pptx.layout = 'LAYOUT_WIDE';

  const cache = new Map();
  const getImg = async (url) => {
    if (!url) return null;
    if (!cache.has(url)) cache.set(url, await toDataURL(url));
    return cache.get(url);
  };
  const orgImg = await getImg(orgLogo);
  const badgeImg = await getImg(badgeLogo);

  const COLORS = ['F1592A', 'F5A623', 'F7C948', 'B9AEF0', '7C6BE0', '2FB0C9'];
  const LIGHT = new Set(['F7C948', 'B9AEF0']);

  for (const p of usable) {
    const slide = pptx.addSlide();

    addBrandFrame(slide, pptx);

    if (orgImg) slide.addImage({ data: orgImg, x: 11.6, y: 0.25, w: 1.4, h: 0.8, sizing: { type: 'contain', w: 1.4, h: 0.8 } });
    if (badgeImg) slide.addImage({ data: badgeImg, x: 12.15, y: 5.85, w: 1.0, h: 1.3, sizing: { type: 'contain', w: 1.0, h: 1.3 } });

    slide.addText(p.name || 'Report', { x: 1.4, y: 0.35, w: 10.5, h: 0.6, fontSize: 26, bold: true, align: 'center', color: '0A2947' });
    if (p.url) slide.addText(p.url, { x: 1.4, y: 1.0, w: 10.5, h: 0.4, fontSize: 14, align: 'center', color: '2563EB' });

    const metrics = p.metrics.slice(0, 6);
    const n = metrics.length || 1;
    const startX = 0.6;
    const usableW = 12.1;
    const colW = usableW / n;

    metrics.forEach((m, i) => {
      const color = COLORS[i % COLORS.length];
      const txtColor = LIGHT.has(color) ? '0A2947' : 'FFFFFF';
      const cx = startX + colW * (i + 0.5);
      const pillW = Math.min(1.6, colW - 0.15);

      slide.addText(m.label, { x: cx - colW / 2 + 0.05, y: 1.95, w: colW - 0.1, h: 0.8, fontSize: 13, align: 'center', color: '334155', valign: 'top' });

      slide.addShape(pptx.ShapeType.roundRect, { x: cx - pillW / 2, y: 2.85, w: pillW, h: 0.5, fill: { color }, line: { type: 'none' }, rectRadius: 0.08 });
      slide.addText(String(m.v1 ?? '—'), { x: cx - pillW / 2, y: 2.85, w: pillW, h: 0.5, fontSize: 15, bold: true, align: 'center', color: txtColor, valign: 'middle' });

      slide.addShape(pptx.ShapeType.ellipse, { x: cx - 0.6, y: 3.5, w: 1.2, h: 1.2, fill: { color: 'FFFFFF' }, line: { color, width: 4 } });
      slide.addText((m.label || '?').trim().slice(0, 1).toUpperCase(), { x: cx - 0.6, y: 3.5, w: 1.2, h: 1.2, fontSize: 26, bold: true, align: 'center', color, valign: 'middle' });

      slide.addShape(pptx.ShapeType.roundRect, { x: cx - pillW / 2, y: 4.85, w: pillW, h: 0.5, fill: { color }, line: { type: 'none' }, rectRadius: 0.08 });
      slide.addText(String(m.v2 ?? '—'), { x: cx - pillW / 2, y: 4.85, w: pillW, h: 0.5, fontSize: 15, bold: true, align: 'center', color: txtColor, valign: 'middle' });
    });

    if (p.period) {
      slide.addText(p.period, { x: 1.4, y: 6.85, w: 10.5, h: 0.5, fontSize: 16, bold: true, align: 'center', color: '0A2947' });
    }
  }

  await pptx.writeFile({ fileName: filename.endsWith('.pptx') ? filename : `${filename}.pptx` });
}

// "VS" comparison-style PPTX — one slide per portal comparing two report
// periods. Left (teal) banner = period 1, right (orange) banner = period 2;
// each metric row shows both values with a check marker on each side.
// `portals`: [{ name, url, leftLabel, rightLabel, rows: [{ label, v1, v2 }] }]
export async function downloadComparisonPPTX(filename, { orgLogo, badgeLogo, portals = [] } = {}) {
  const usable = portals.filter((p) => p.rows && p.rows.length);
  if (!usable.length) return;
  const { default: PptxGen } = await import('pptxgenjs');
  const pptx = new PptxGen();
  pptx.layout = 'LAYOUT_WIDE';

  const cache = new Map();
  const getImg = async (url) => {
    if (!url) return null;
    if (!cache.has(url)) cache.set(url, await toDataURL(url));
    return cache.get(url);
  };
  const orgImg = await getImg(orgLogo);
  const badgeImg = await getImg(badgeLogo);

  const TEAL = '1BA098';
  const ORANGE = 'F26B21';

  for (const p of usable) {
    const slide = pptx.addSlide();

    addBrandFrame(slide, pptx);
    if (orgImg) slide.addImage({ data: orgImg, x: 11.6, y: 0.2, w: 1.4, h: 0.75, sizing: { type: 'contain', w: 1.4, h: 0.75 } });
    if (badgeImg) slide.addImage({ data: badgeImg, x: 12.15, y: 5.85, w: 1.0, h: 1.3, sizing: { type: 'contain', w: 1.0, h: 1.3 } });

    // Title.
    slide.addText(p.name || 'Report', { x: 1.4, y: 0.25, w: 10.5, h: 0.55, fontSize: 24, bold: true, align: 'center', color: '0A2947' });

    // Centered, narrower comparison block — horizontally + vertically centered.
    const SLIDE_W = 13.33;
    const blockX = 2.0; // left/right margin
    const bw = 3.7; // banner width
    const rightBannerX = SLIDE_W - blockX - bw;
    const vsW = 0.85;
    const vsX = (SLIDE_W - vsW) / 2;

    const rows = p.rows.slice(0, 8);
    const n = rows.length || 1;
    const bannerH = 0.72;
    const gap = 0.45;
    const rowH = Math.min(0.58, 4.0 / n);
    const totalBlock = bannerH + gap + n * rowH;
    const bodyTop = 1.35;
    const bodyBottom = 7.0;
    const bannersY = bodyTop + Math.max(0, (bodyBottom - bodyTop - totalBlock) / 2);
    const rowsTop = bannersY + bannerH + gap;

    // Banners + VS.
    const banner = pptx.ShapeType.roundRect;
    slide.addShape(banner, { x: blockX, y: bannersY, w: bw, h: bannerH, fill: { color: TEAL }, line: { type: 'none' }, rectRadius: 0.1 });
    slide.addText(p.leftLabel || 'Report 1', { x: blockX, y: bannersY, w: bw, h: bannerH, fontSize: 14, bold: true, align: 'center', color: 'FFFFFF', valign: 'middle' });
    slide.addShape(banner, { x: rightBannerX, y: bannersY, w: bw, h: bannerH, fill: { color: ORANGE }, line: { type: 'none' }, rectRadius: 0.1 });
    slide.addText(p.rightLabel || 'Report 2', { x: rightBannerX, y: bannersY, w: bw, h: bannerH, fontSize: 14, bold: true, align: 'center', color: 'FFFFFF', valign: 'middle' });
    slide.addShape(pptx.ShapeType.ellipse, { x: vsX, y: bannersY - (0.9 - bannerH) / 2, w: vsW, h: 0.9, fill: { color: '0A2947' }, line: { type: 'none' } });
    slide.addText('VS', { x: vsX, y: bannersY - (0.9 - bannerH) / 2, w: vsW, h: 0.9, fontSize: 18, bold: true, align: 'center', color: 'FFFFFF', valign: 'middle' });

    // Metric rows (columns aligned under the banners; name centered).
    const leftCheckX = blockX;
    const leftValX = blockX + 0.5;
    const leftValW = bw - 0.6;
    const centerNameX = vsX - 1.65;
    const centerNameW = 3.3;
    const rightValW = bw - 0.6;
    const rightValX = rightBannerX + 0.1;
    const rightCheckX = SLIDE_W - blockX - 0.32;

    rows.forEach((r, i) => {
      const y = rowsTop + i * rowH;
      const cy = y + (rowH - 0.32) / 2;
      slide.addShape(pptx.ShapeType.ellipse, { x: leftCheckX, y: cy, w: 0.32, h: 0.32, fill: { color: TEAL }, line: { type: 'none' } });
      slide.addText('✓', { x: leftCheckX, y: cy, w: 0.32, h: 0.32, fontSize: 13, bold: true, align: 'center', color: 'FFFFFF', valign: 'middle' });
      slide.addText(String(r.v1 ?? '—'), { x: leftValX, y, w: leftValW, h: rowH, fontSize: 14, bold: true, align: 'left', color: '0F172A', valign: 'middle' });
      slide.addText(r.label, { x: centerNameX, y, w: centerNameW, h: rowH, fontSize: 12, align: 'center', color: '334155', valign: 'middle' });
      slide.addText(String(r.v2 ?? '—'), { x: rightValX, y, w: rightValW, h: rowH, fontSize: 14, bold: true, align: 'right', color: '0F172A', valign: 'middle' });
      slide.addShape(pptx.ShapeType.ellipse, { x: rightCheckX, y: cy, w: 0.32, h: 0.32, fill: { color: ORANGE }, line: { type: 'none' } });
      slide.addText('✓', { x: rightCheckX, y: cy, w: 0.32, h: 0.32, fontSize: 13, bold: true, align: 'center', color: 'FFFFFF', valign: 'middle' });
    });

    if (p.url) {
      slide.addText(p.url, { x: 1.4, y: 0.82, w: 10.5, h: 0.35, fontSize: 12, align: 'center', color: '2563EB' });
    }
  }

  await pptx.writeFile({ fileName: filename.endsWith('.pptx') ? filename : `${filename}.pptx` });
}
