document.addEventListener('DOMContentLoaded', fetchData);

const COLUMN_MAPPING = {
  'C': 'E',
  'D': 'E',
  'F': 'H',
  'G': 'H',
  'I': 'K',
  'J': 'K'
};

async function fetchData() {
  const container = document.getElementById('table-container');
  
  try {
    const response = await fetch(
      'https://api.allorigins.win/raw?url=' + 
      encodeURIComponent(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vSXQ7mkU0CoKkab83sVHB-K0oZhCzH2SALfFpJqP6c21A4jgqbsNNDZ8yLgVV_mOzjsC4e_SRzXOo3Y/pub?output=csv'
      )
    );

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const csvData = await response.text();
    const { headers, data } = parseCSV(csvData);
    
    // Применяем правила подмены столбцов
    const correctedData = data.map(row => applyColumnMapping(row, headers));
    
    renderTable(headers, correctedData);

  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `
      <div class="error">
        Ошибка загрузки: ${error.message}
        <button class="refresh-btn" onclick="fetchData()">Обновить</button>
      </div>
    `;
  }
}

function parseCSV(csv) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  let lastChar = '';

  for (let char of csv) {
    if (char === '"' && lastChar !== '\\') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cleanValue(value));
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (value || row.length) row.push(cleanValue(value));
      if (row.length) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
    lastChar = char;
  }

  // Добавляем последнюю строку
  if (value || row.length) {
    row.push(cleanValue(value));
    rows.push(row);
  }

  const headers = rows[0] || [];
  const data = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = {
        value: row[index] || '',
        source: getCellCoordinate(index, rows.indexOf(row) + 1)
      };
    });
    return obj;
  });

  return { headers, data };
}

function cleanValue(value) {
  return value.trim()
    .replace(/^"(.*)"$/, '$1')
    .replace(/""/g, '"');
}

function getCellCoordinate(colIndex, rowNumber) {
  const colLetter = String.fromCharCode(65 + colIndex);
  return `${colLetter}${rowNumber + 1}`; // +1 потому что в Sheets нумерация с 1
}

function applyColumnMapping(row, headers) {
  const mappedRow = { ...row };
  
  Object.entries(COLUMN_MAPPING).forEach(([targetCol, sourceCol]) => {
    const targetIndex = headers.findIndex(h => h === targetCol);
    const sourceIndex = headers.findIndex(h => h === sourceCol);
    
    if (targetIndex !== -1 && sourceIndex !== -1) {
      mappedRow[headers[targetIndex]] = {
        value: row[headers[sourceIndex]].value,
        source: row[headers[sourceIndex]].source
      };
    }
  });

  return mappedRow;
}

function renderTable(headers, data) {
  const container = document.getElementById('table-container');
  
  const tableHTML = `
    <div class="table-responsive">
      <table>
        <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `
                <td class="cell-tooltip" 
                    data-source="${escapeHtml(row[header].source)}">
                  ${escapeHtml(row[header].value)}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <button class="refresh-btn" onclick="fetchData()">Обновить данные</button>
    </div>
  `;

  container.innerHTML = tableHTML;
}

function escapeHtml(text) {
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}