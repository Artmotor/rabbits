document.addEventListener('DOMContentLoaded', function() {
  // Инициализация вкладок
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      openTab(tabId);
    });
  });

  // Инициализация калькулятора
  document.getElementById('calculate-btn').addEventListener('click', calculateNorms);
});

function openTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.style.display = 'none');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabId).style.display = 'block';
  document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
}

function calculateNorms() {
  const rabbitsCount = parseInt(document.getElementById('rabbits-count').value) || 1;
  const lifePeriod = document.getElementById('life-period').value;
  const weight = document.getElementById('rabbit-weight').value;
  
  const table = document.querySelector('#data-tab table');
  if (!table) {
    alert('Пожалуйста, дождитесь загрузки данных таблицы');
    return;
  }
  
  // Получаем все заголовки таблицы
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
  
  // Определяем нужный столбец на основе выбранных параметров
  const columnMapping = {
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
  
  const expectedHeader = columnMapping[lifePeriod]?.[weight];
  
  if (!expectedHeader) {
    alert('Неизвестная комбинация параметров');
    return;
  }
  
  // Ищем столбец по полному соответствию
  let columnIndex = headers.findIndex(h => h === expectedHeader);
  
  // Если не нашли, попробуем найти по частичному соответствию
  if (columnIndex === -1) {
    columnIndex = headers.findIndex(h => h.includes(expectedHeader));
  }
  
  if (columnIndex === -1) {
    console.error('Не удалось найти столбец', {
      expectedHeader,
      availableHeaders: headers,
      lifePeriod,
      weight
    });
    alert(`Не удалось найти данные для: ${expectedHeader}\nДоступные заголовки:\n${headers.join('\n')}`);
    return;
  }
  
  // Собираем данные для расчета
  const rows = table.querySelectorAll('tbody tr');
  const resultData = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > columnIndex) {
      const name = cells[0].textContent;
      const cellContent = cells[columnIndex].textContent;
      const numericValue = parseFloat(cellContent.replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
      const calculatedValue = numericValue * rabbitsCount;
      
      resultData.push({
        name,
        value: numericValue,
        calculatedValue
      });
    }
  });
  
  displayResults(resultData, rabbitsCount, lifePeriod, weight);
}

function displayResults(data, count, period, weight) {
  const resultContainer = document.getElementById('calculation-result');
  const resultTable = document.getElementById('result-table');
  
  resultTable.innerHTML = '';
  
  const periodNames = {
    'non-breeding': 'Неслучный период',
    'breeding': 'Случный период',
    'pregnant': 'Сукрольный период'
  };
  
  const caption = document.createElement('caption');
  caption.textContent = `Расчет для ${count} кроликов (${periodNames[period]}, ${weight} кг)`;
  resultTable.appendChild(caption);
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  ['Показатель', 'Норма на 1 кролика', `Норма на ${count} кроликов`].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  resultTable.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  
  data.forEach(item => {
    const row = document.createElement('tr');
    
    [item.name, 
     item.value.toFixed(2).replace('.', ','), 
     item.calculatedValue.toFixed(2).replace('.', ',')].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      row.appendChild(td);
    });
    
    tbody.appendChild(row);
  });
  
  resultTable.appendChild(tbody);
  resultContainer.style.display = 'block';
  resultContainer.scrollIntoView({ behavior: 'smooth' });
}