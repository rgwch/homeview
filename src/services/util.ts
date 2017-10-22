export class Util {

  /* Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
   From David Walsh (https://davidwalsh.name/javascript-debounce-function)

  public static debounce(func, wait,parms) {
    let timeout
    let delayer=(parms)=>{
      clearTimeout(timeout)
      setTimeout(()=>func(),timeout)
    }
    return delayer
  };
*/
  /**
   * debouncing, executes the function if there was no new event in $wait milliseconds
   * @param func
   * @param wait
   * @param scope
   * @returns {Function}
   */
  static debounce(func, wait, scope) {
    var timeout;
    return function () {
      var context = scope || this, args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * In case of a "storm of events", this executes once every $threshold
   * @param fn
   * @param threshold
   * @param scope
   * @returns {Function}
   */
  static throttle(fn, threshold, scope) {
    threshold || (threshold = 250);
    var last, deferTimer;

    return function (arg = {}) {
      var context = scope || this;
      var now = +new Date, args = arguments;

      if (last && now < last + threshold) {
        // Hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }

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
