/**
 * Accordion block.
 * Each row is one item: first cell is the label (question), second cell is the body.
 * Rows without a label are dropped; extra cells are appended to the body.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, ...bodyCells] = [...row.children];
    if (!label || !label.textContent.trim()) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    bodyCells.forEach((cell) => body.append(...cell.childNodes));

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
