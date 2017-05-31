import classList from 'dom-classlist';
import matches from 'dom-matches';
import 'custom-event-polyfill';

/* https://github.com/WICG/focus-ring */
document.addEventListener('DOMContentLoaded', function() {
  var lastKeyboardEvent = null;
  var keyboardThrottleTimeoutID = 0;

  // These elements should always have a focus ring drawn, because they are
  // associated with switching to a keyboard modality.
  var keyboardModalityWhitelist = [
    'input:not([type])',
    'input[type=text]',
    'input[type=search]',
    'input[type=url]',
    'input[type=tel]',
    'input[type=email]',
    'input[type=password]',
    'input[type=number]',
    'input[type=date]',
    'input[type=month]',
    'input[type=week]',
    'input[type=time]',
    'input[type=datetime]',
    'input[type=datetime-local]',
    'textarea',
    '[role=textbox]',
  ].join(',');

  /**
   * Computes whether the given element should automatically trigger the
   * `focus-ring` class being added, i.e. whether it should always match
   * `:focus-ring` when focused.
   * @param {Element} el
   * @return {boolean}
   */
  function focusTriggersKeyboardModality(el) {
    return matches(el, keyboardModalityWhitelist) && matches(el, ':not([readonly])');
  }

  /**
   * Add the `focus-ring` class to the given element if it was not added by
   * the author.
   * @param {Event} e
   * @param {Element} el
   */
  function addFocusRingClass(e, el) {
    if (el.classList.contains('focus-ring'))
        return;

    var focusRingEvent = new CustomEvent('focusring', {
      'view': window,
      'bubbles': true,
      'cancelable': true,
      'detail': {
        'srcEvent': e,
      },
    });

    var wasPrevented = !el.dispatchEvent(focusRingEvent);
    if (!wasPrevented) {
      classList(el).add('focus-ring');
      el.setAttribute('data-focus-ring-added', '');
    }
  }

  /**
   * Remove the `focus-ring` class from the given element if it was not
   * originally added by the author.
   * @param {Element} el
   */
  function removeFocusRingClass(el) {
    if (!el.hasAttribute('data-focus-ring-added'))
      return;
    classList(el).remove('focus-ring');
    el.removeAttribute('data-focus-ring-added');
  }

  /**
   * On `keydown`, set `lastKeyboardEvent`, to be removed 100ms later if there
   * are no further keyboard events.  The 100ms throttle handles cases where
   * focus is redirected programmatically after a keyboard event, such as
   * opening a menu or dialog.
   * @param {Event} e
   */
  function onKeyDown(e) {
    lastKeyboardEvent = e;
    // `activeElement` defaults to document.body if nothing focused,
    // so check the active element is actually focused.
    if (matches(document.activeElement, ':focus'))
      addFocusRingClass(lastKeyboardEvent, document.activeElement);
    if (keyboardThrottleTimeoutID !== 0)
      clearTimeout(keyboardThrottleTimeoutID);
    keyboardThrottleTimeoutID = setTimeout(function() {
      lastKeyboardEvent = null;
      keyboardThrottleTimeoutID = 0;
    }, 100);
  }

  /**
   * On `focus`, add the `focus-ring` class to the target if:
   * - a keyboard event happened in the past 100ms, or
   * - the focus event target triggers "keyboard modality" and should always
   *   have a focus ring drawn.
   * @param {Event} e
   */
  function onFocus(e) {
    if (lastKeyboardEvent || focusTriggersKeyboardModality(e.target))
      addFocusRingClass(lastKeyboardEvent, e.target);
  }

  /**
   * On `blur`, remove the `focus-ring` class from the target.
   * @param {Event} e
   */
  function onBlur(e) {
    removeFocusRingClass(e.target);
  }

  document.body.addEventListener('keydown', onKeyDown, true);
  document.body.addEventListener('focus', onFocus, true);
  document.body.addEventListener('blur', onBlur, true);
});
