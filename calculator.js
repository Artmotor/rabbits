document.addEventListener('DOMContentLoaded', function() {
  // Инициализация вкладок
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      openTab(tabId);
    });
  });

  // Инициализация кнопок расчета
  document.getElementById('calculate-btn')?.addEventListener('click', calculateNorms);
  setupAdvancedCalculator();
});

function openTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.style.display = 'none');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabId).style.display = 'block';
  document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
}

// Простой расчет
function calculateNorms() {
  try {
    const rabbitsCount = parseInt(document.getElementById('rabbits-count')?.value) || 1;
    const lifePeriod = document.getElementById('life-period')?.value;
    const weight = document.getElementById('rabbit-weight')?.value;
    
    const table = document.querySelector('#data-tab table');
    if (!table) {
      alert('Пожалуйста, дождитесь загрузки данных таблицы');
      return;
    }
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const columnMapping = getColumnMapping();
    const expectedHeader = columnMapping[lifePeriod]?.[weight];
    
    if (!expectedHeader) {
      alert('Неизвестная комбинация параметров');
      return;
    }
    
    const columnIndex = headers.findIndex(h => h.includes(expectedHeader));
    if (columnIndex === -1) {
      alert(`Не удалось найти данные для: ${expectedHeader}`);
      return;
    }
    
    const rows = table.querySelectorAll('tbody tr');
    const resultData = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length > columnIndex) {
        const name = cells[0]?.textContent || '';
        const cellContent = cells[columnIndex]?.textContent || '0';
        const value = safeParseFloat(cellContent);
        const calculatedValue = value * rabbitsCount;
        
        resultData.push({ name, value, calculatedValue });
      }
    });
    
    displayResults(resultData, rabbitsCount, lifePeriod, weight);
  } catch (error) {
    console.error('Ошибка в calculateNorms:', error);
    alert('Произошла ошибка при расчете. Проверьте консоль для подробностей.');
  }
}

// Сложный расчет
function setupAdvancedCalculator() {
  // Добавление строки параметров
  document.getElementById('add-row-btn')?.addEventListener('click', () => {
    const tbody = document.getElementById('params-body');
    if (!tbody) return;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>
        <select class="life-period">
          <option value="non-breeding">Неслучный</option>
          <option value="breeding">Случный</option>
          <option value="pregnant">Сукрольный</option>
        </select>
      </td>
      <td>
        <select class="rabbit-weight">
          <option value="4">4</option>
          <option value="4.5">4.5</option>
          <option value="5">5</option>
        </select>
      </td>
      <td><input type="number" class="rabbits-count" min="1" value="1"></td>
      <td><button class="remove-row-btn">×</button></td>
    `;
    tbody.appendChild(newRow);
  });

  // Удаление строки параметров
  document.getElementById('params-body')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-row-btn')) {
      const row = e.target.closest('tr');
      if (row && document.querySelectorAll('#params-body tr').length > 1) {
        row.remove();
      } else {
        alert('Должна остаться хотя бы одна строка');
      }
    }
  });

  // Переключение между вариантами расчета
  document.querySelectorAll('.calc-tab-btn')?.forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.calc-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.calc-tab-content').forEach(c => c.style.display = 'none');
      
      this.classList.add('active');
      const tabId = this.dataset.calcTab;
      if (tabId) document.getElementById(tabId).style.display = 'block';
    });
  });

  // Кнопка сложного расчета
  document.getElementById('calculate-advanced-btn')?.addEventListener('click', calculateAdvancedNorms);
}

function calculateAdvancedNorms() {
  try {
    const paramsRows = document.querySelectorAll('#params-body tr');
    const table = document.querySelector('#data-tab table');
    
    if (!table || paramsRows.length === 0) {
      alert('Пожалуйста, добавьте параметры и дождитесь загрузки таблицы');
      return;
    }
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const columnMapping = getColumnMapping();
    const allGroups = [];
    
    paramsRows.forEach(row => {
      const lifePeriod = row.querySelector('.life-period')?.value;
      const weight = row.querySelector('.rabbit-weight')?.value;
      const rabbitsCount = parseInt(row.querySelector('.rabbits-count')?.value) || 1;
      
      if (!lifePeriod || !weight) return;
      
      const expectedHeader = columnMapping[lifePeriod]?.[weight];
      if (!expectedHeader) return;
      
      const columnIndex = headers.findIndex(h => h.includes(expectedHeader));
      if (columnIndex === -1) return;
      
      const rows = table.querySelectorAll('tbody tr');
      const groupResults = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > columnIndex) {
          const name = cells[0]?.textContent || '';
          const cellContent = cells[columnIndex]?.textContent || '0';
          const value = safeParseFloat(cellContent);
          const calculatedValue = value * rabbitsCount;
          
          groupResults.push({ name, calculatedValue });
        }
      });
      
      allGroups.push({
        title: `${rabbitsCount} кроликов (${getPeriodName(lifePeriod)}, ${weight} кг)`,
        data: groupResults
      });
    });
    
    displayAdvancedResults(allGroups);
  } catch (error) {
    console.error('Ошибка в calculateAdvancedNorms:', error);
    alert('Произошла ошибка при расчете. Проверьте консоль для подробностей.');
  }
}

// Отображение результатов сложного расчета
function displayAdvancedResults(groups) {
  try {
    const container = document.getElementById('advanced-calculation-result');
    const resultContainer = document.getElementById('advanced-result-tables');
    
    if (!container || !resultContainer) return;
    
    resultContainer.innerHTML = '';
    
    if (!groups || groups.length === 0 || !groups[0].data || groups[0].data.length === 0) {
      console.error('Нет данных для отображения');
      return;
    }
    
    const table = document.createElement('table');
    table.className = 'result-table';
    
    // Заголовок таблицы
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    headerRow.appendChild(createHeaderCell('Показатель'));
    groups.forEach(group => headerRow.appendChild(createHeaderCell(group.title)));
    headerRow.appendChild(createHeaderCell('Всего'));
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Тело таблицы
    const tbody = document.createElement('tbody');
    const numRows = groups[0].data.length;
    
    for (let i = 0; i < numRows; i++) {
      const row = document.createElement('tr');
      const rowName = groups[0].data[i]?.name || '';
      
      row.appendChild(createCell(rowName, true));
      
      let rowTotal = 0;
      let hasData = false;
      
      groups.forEach(group => {
        const value = group.data[i]?.calculatedValue;
        if (typeof value === 'number') {
          rowTotal += value;
          hasData = true;
        }
        row.appendChild(createCell(formatNumber(value)));
      });
      
      row.appendChild(createCell(hasData ? formatNumber(rowTotal) : '—', false, true));
      tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    resultContainer.appendChild(table);
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Ошибка в displayAdvancedResults:', error);
  }
}

// Вспомогательные функции
function getColumnMapping() {
  return {
    'non-breeding': {
      '4': 'Неслучный период (вес 4 кг)',
      '4.5': 'Неслучный период (вес 4,5 кг)',
      '5': 'Неслучный период (вес 5 кг)'
    },
    'breeding': {
      '4': 'Случный период (вес 4 кг)',
      '4.5': 'Случный период (вес 4,5 кг)',
      '5': 'Случный период (вес 5 кг)'
    },
    'pregnant': {
      '4': 'В сукрольный период (вес 4 кг)',
      '4.5': 'В сукрольный период (вес 4,5 кг)',
      '5': 'В сукрольный период (вес 5 кг)'
    }
  };
}

function getPeriodName(period) {
  const periodNames = {
    'non-breeding': 'Неслучный период',
    'breeding': 'Случный период',
    'pregnant': 'Сукрольный период'
  };
  return periodNames[period] || period;
}

function safeParseFloat(str) {
  if (typeof str !== 'string') return 0;
  return parseFloat(str.replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
}

function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '—';
  return num.toFixed(2).replace('.', ',');
}

function createHeaderCell(text) {
  const th = document.createElement('th');
  th.textContent = text;
  return th;
}

function createCell(text, isLeftAligned = false, isTotal = false) {
  const td = document.createElement('td');
  td.textContent = text;
  if (isLeftAligned) td.style.textAlign = 'left';
  if (isTotal) td.style.fontWeight = 'bold';
  return td;
}

// Отображение результатов простого расчета
function displayResults(data, count, period, weight) {
  try {
    const resultContainer = document.getElementById('calculation-result');
    const resultTable = document.getElementById('result-table');
    
    if (!resultContainer || !resultTable) return;
    
    resultTable.innerHTML = '';
    
    const caption = document.createElement('caption');
    caption.textContent = `Расчет для ${count} кроликов (${getPeriodName(period)}, ${weight} кг)`;
    resultTable.appendChild(caption);
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Показатель</th>
        <th>Норма на ${count} кроликов</th>
      </tr>
    `;
    resultTable.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${formatNumber(item.calculatedValue)}</td>
      `;
      tbody.appendChild(row);
    });
    
    resultTable.appendChild(tbody);
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Ошибка в displayResults:', error);
  }
}
