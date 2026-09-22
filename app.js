'use strict';

const tbody = document.querySelector('#models-table tbody');

const formatPrice = (pricePerToken) =>
  '$' + (pricePerToken * 1e6).toFixed(2) + '/M';

const formatTokens = (value) =>
  new Intl.NumberFormat('es-ES', { notation: 'compact' }).format(value);

const formatModality = (modality) =>
  modality === 'Text+Image' ? 'Texto+Imagen' : modality;

const createCell = (tag, text, className) => {
  const cell = document.createElement(tag);
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  return cell;
};

const renderRow = (model) => {
  const tr = document.createElement('tr');

  tr.appendChild(createCell('td', model.name, 'model-name'));
  tr.appendChild(createCell('td', formatPrice(model.inputPricePerToken), 'price'));
  tr.appendChild(createCell('td', formatPrice(model.outputPricePerToken), 'price'));
  tr.appendChild(createCell('td', model.ttft_ms + ' ms'));
  tr.appendChild(createCell('td', formatModality(model.inputModality), 'modality'));
  tr.appendChild(createCell('td', formatModality(model.outputModality), 'modality'));
  tr.appendChild(createCell('td', formatTokens(model.inputTokensDay), 'tokens'));
  tr.appendChild(createCell('td', formatTokens(model.outputTokensDay), 'tokens'));
  tr.appendChild(createCell('td', formatTokens(model.inputTokensWeek), 'tokens'));
  tr.appendChild(createCell('td', formatTokens(model.outputTokensWeek), 'tokens'));

  tbody.appendChild(tr);
};

fetch('mock-data.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error('No se pudo cargar mock-data.json');
    }
    return response.json();
  })
  .then((models) => models.forEach(renderRow))
  .catch((error) => {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 10;
    td.textContent = error.message;
    tr.appendChild(td);
    tbody.appendChild(tr);
  });