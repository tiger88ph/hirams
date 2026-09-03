// Bespoke template — NOT built via buildIframeTemplate, because the cheque
// print layout needs a custom 4-value @page margin (letter landscape) and a
// pt→px height conversion (×1.333) that the shared builder doesn't support.
// This is copied verbatim from the original PrintCheque.jsx injectedScript
// so behavior is unchanged.
export const iframeTemplate = `
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
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
    margin: 1.20in 1.34in 0in 0.25in !important; /* top right bottom left */
    size: letter landscape;
  }
  html, body {
    margin: 0 !important;
    
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body > div {
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
    display: block !important;
    width: 100% !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  table {
    table-layout: fixed !important;
    border-collapse: collapse !important;
    width: 100% !important;
  }
  tr { page-break-inside: avoid !important; }
  td, th { overflow: hidden !important; }
}
  </style>
  <script>
    window.__printCheque = function () { window.print(); };
    document.addEventListener('DOMContentLoaded', function () {
      var tables = document.querySelectorAll('table');
      tables.forEach(function (table) {
        table.style.setProperty('table-layout', 'fixed', 'important');
        table.style.setProperty('border-collapse', 'collapse', 'important');
        table.style.setProperty('background', '#fff', 'important');
        var cols = table.querySelectorAll('col');
        var colIdx = 0;
        cols.forEach(function (col) {
          if (colIdx >= 14) {
            col.style.cssText = 'width:0!important;min-width:0!important;max-width:0!important;visibility:collapse!important;';
          } else {
            var w = col.style.width || '';
            if (w) {
              col.style.setProperty('width', w, 'important');
              col.style.setProperty('min-width', w, 'important');
              col.style.setProperty('max-width', w, 'important');
            }
          }
          colIdx++;
        });
        var rowspanMap = {};
        var rows = table.querySelectorAll('tr');
        rows.forEach(function (row) {
          var inlineHeight = row.style.height;
          if (inlineHeight) {
            var pt = parseFloat(inlineHeight);
            if (pt > 0) {
              var pxH = pt * 1.333;
              row.style.setProperty('height',     pxH + 'px', 'important');
              row.style.setProperty('max-height', pxH + 'px', 'important');
              row.style.setProperty('min-height', pxH + 'px', 'important');
              row.style.setProperty('overflow',   'hidden',   'important');
            }
          }
          var logicalCol = 0;
          var cells = Array.from(row.querySelectorAll('td, th'));
          cells.forEach(function (cell) {
            while (rowspanMap[logicalCol] && rowspanMap[logicalCol] > 0) {
              rowspanMap[logicalCol]--;
              logicalCol++;
            }
            var colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            var rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
            if (logicalCol >= 14) {
              cell.style.cssText = [
                'padding:0!important',
                'width:0!important',
                'min-width:0!important',
                'max-width:0!important',
                'border:none!important',
                'overflow:hidden!important',
                'background:transparent!important',
              ].join(';');
              cell.innerHTML = '';
            } else if (logicalCol + colspan > 14) {
              var allowed = 14 - logicalCol;
              cell.setAttribute('colspan', allowed);
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
                var chpt = parseFloat(cellH);
                if (chpt > 0) {
                  var chpxConverted = chpt * 1.333;
                  cell.style.setProperty('height',     chpxConverted + 'px', 'important');
                  cell.style.setProperty('max-height', chpxConverted + 'px', 'important');
                  cell.style.setProperty('overflow',   'hidden',             'important');
                  if (chpt < 8) {
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
            if (parseInt(k) >= 14 && rowspanMap[k] > 0) rowspanMap[k]--;
          });
        });
      });
    });
  <\/script>
`;

export default iframeTemplate;