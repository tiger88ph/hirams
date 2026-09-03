export function buildIframeTemplate({
  columnLimit = 10,
  printFnName = "__print",
  pageSize = "A4 portrait",
  extraStyles = "",
} = {}) {
  return `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'DM Sans', sans-serif;
    }

    body > div {
      display: flex;
      justify-content: center;
      padding: 24px 0 80px;
      min-height: 100vh;
      background: #f1f5f9;
    }

    table {
      table-layout: fixed !important;
      border-collapse: collapse !important;
      background: #fff !important;
    }

    tr { overflow: hidden !important; }

    @media print {
      @page {
        margin: 10mm;
        size: ${pageSize};
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body > div {
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
        display: block !important;
        width: auto !important; /* ← NOT full width */
        max-width: none !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      tr { page-break-inside: avoid !important; overflow: hidden !important; }
      td, th { overflow: hidden !important; }
    }

    ${extraStyles}
  </style>

  <script>
    window.${printFnName} = function () { window.print(); };

    document.addEventListener('DOMContentLoaded', function () {
      var tables = document.querySelectorAll('table');
      tables.forEach(function (table) {
        table.style.setProperty('table-layout', 'fixed', 'important');
        table.style.setProperty('border-collapse', 'collapse', 'important');
        table.style.setProperty('background', '#fff', 'important');

        // ── YOUR EXACT COLUMN LOGIC ──────────────────────────────────
        var cols = table.querySelectorAll('col');
        var colIdx = 0;
        cols.forEach(function (col) {
          var span = parseInt(col.getAttribute('span') || '1', 10);
          if (colIdx >= ${columnLimit}) {
            col.style.cssText = 'width:0!important;min-width:0!important;max-width:0!important;visibility:collapse!important;';
          } else {
            var w = col.style.width || '';
            if (w) {
              col.style.setProperty('width', w, 'important');
              col.style.setProperty('min-width', w, 'important');
              col.style.setProperty('max-width', w, 'important');
            }
          }
          colIdx += span;
        });

        // ── YOUR EXACT ROW + BORDER + HEIGHT LOGIC ──────────────────
        var rowspanMap = {};
        var rows = table.querySelectorAll('tr');

        rows.forEach(function (row) {
          // LOCK ROW HEIGHT EXACTLY AS YOU HAD IT
          var inlineHeight = row.style.height;
          if (inlineHeight) {
            var px = parseFloat(inlineHeight);
            if (px > 0) {
              row.style.setProperty('height',     px + 'px', 'important');
              row.style.setProperty('max-height', px + 'px', 'important');
              row.style.setProperty('min-height', px + 'px', 'important');
              row.style.setProperty('overflow',   'hidden',  'important');
            }
          }

          var logicalCol = 0;
          var cells = Array.from(row.querySelectorAll('td, th'));

          // YOUR EXACT LAST VISIBLE CELL / BORDER FIX
          var lastVisibleCellIdx = -1;
          var tempCol = 0;
          var tempRowspanMap = Object.assign({}, rowspanMap);
          cells.forEach(function (cell, i) {
            while (tempRowspanMap[tempCol] && tempRowspanMap[tempCol] > 0) {
              tempRowspanMap[tempCol]--;
              tempCol++;
            }
            var cs = parseInt(cell.getAttribute('colspan') || '1', 10);
            if (tempCol < ${columnLimit}) lastVisibleCellIdx = i;
            tempCol += cs;
          });

          cells.forEach(function (cell, cellDomIdx) {
            while (rowspanMap[logicalCol] && rowspanMap[logicalCol] > 0) {
              rowspanMap[logicalCol]--;
              logicalCol++;
            }

            var colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            var rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);

            if (logicalCol >= ${columnLimit}) {
              cell.style.cssText = [
                'padding:0!important',
                'width:0!important',
                'min-width:0!important',
                'max-width:0!important',
                'border:none!important',
                'border-left:none!important',
                'border-right:none!important',
                'border-top:none!important',
                'border-bottom:none!important',
                'overflow:hidden!important',
                'background:transparent!important',
                'outline:none!important',
              ].join(';');
              cell.innerHTML = '';

            } else if (logicalCol + colspan > ${columnLimit}) {
              var allowed = ${columnLimit} - logicalCol;
              cell.setAttribute('colspan', allowed);
              var w = cell.style.width;
              if (w) cell.style.setProperty('width', w, 'important');
              var existingBorderRight = cell.style.borderRight || cell.style.border || '';
              if (!existingBorderRight) {
                cell.style.setProperty('border-right', '1px solid #000', 'important');
              }
              for (var c = logicalCol; c < logicalCol + allowed; c++) {
                if (rowspan > 1) rowspanMap[c] = (rowspanMap[c] || 0) + (rowspan - 1);
              }
              logicalCol += allowed;
              return;

            } else {
              var cellW = cell.style.width;
              if (cellW) cell.style.setProperty('width', cellW, 'important');

              var cellH = cell.style.height || (inlineHeight ? inlineHeight : '');
              if (cellH) {
                var chpx = parseFloat(cellH);
                if (chpx > 0) {
                  cell.style.setProperty('height',     chpx + 'px', 'important');
                  cell.style.setProperty('max-height', chpx + 'px', 'important');
                  cell.style.setProperty('overflow',   'hidden',    'important');
                  if (chpx < 8) {
                    cell.style.setProperty('padding-top',    '0',   'important');
                    cell.style.setProperty('padding-bottom', '0',   'important');
                    cell.style.setProperty('line-height',    '1',   'important');
                    cell.style.setProperty('font-size',      '1px', 'important');
                  }
                }
              }

              for (var c = logicalCol; c < logicalCol + colspan; c++) {
                if (rowspan > 1) rowspanMap[c] = (rowspanMap[c] || 0) + (rowspan - 1);
              }
            }

            logicalCol += colspan;
          });

          Object.keys(rowspanMap).forEach(function (k) {
            if (parseInt(k) >= ${columnLimit} && rowspanMap[k] > 0) rowspanMap[k]--;
          });
        });
      });
    });
  <\/script>
`;
}
