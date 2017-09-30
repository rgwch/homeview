
export class Util {

  /* Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
   From David Walsh (https://davidwalsh.name/javascript-debounce-function)
  */
  public static debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  /**
   * taken and modified from
   * https://www.npmjs.com/package/x-www-form-urlencode
   */
  public static urlencode(s) {
    return encodeURIComponent(s)
      .replace(/\%0(?:D|d)(?=\%0(?:A|a))\%0(A|a)/g, '&')
      .replace(/\%0(?:D|d)/g, '&')
      .replace(/\%0(?:A|a)/g, '&')
      .replace(/\&/g, '%0D%0A')
      .replace(/\%20/g, '+')
  }

  public static decode(s) {
    return decodeURIComponent(s.replace(/\+/g, '%20'))
      .replace(/\r\n/g, '\n')

  }
}
