export class UrlEncoder {

  encode(s) {
    return encodeURIComponent(s)
      .replace(/\%0(?:D|d)(?=\%0(?:A|a))\%0(A|a)/g, '&')
      .replace(/\%0(?:D|d)/g, '&')
      .replace(/\%0(?:A|a)/g, '&')
      .replace(/\&/g, '%0D%0A')
      .replace(/\%20/g, '+')
  }

  decode(s) {
    return decodeURIComponent(s.replace(/\+/g, '%20'))
      .replace(/\r\n/g, '\n')

  }
}
