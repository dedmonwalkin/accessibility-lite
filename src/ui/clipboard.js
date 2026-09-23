export function bindCopy(button, source, status) {
  button.addEventListener('click', async function () {
    var text = 'value' in source ? source.value : source.textContent;
    status.textContent = '';
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied!';
    } catch (_) {
      source.focus();
      if (typeof source.select === 'function') {
        source.select();
      } else {
        var selection = window.getSelection();
        if (selection) {
          var range = document.createRange();
          range.selectNodeContents(source);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      status.textContent = 'Automatic copying is unavailable. Copy the selected text using your browser or device controls.';
    }
  });
}

export function clipboardScript() {
  return bindCopy.toString();
}
