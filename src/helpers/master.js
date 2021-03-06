import _ from 'lodash'
import { Notify } from 'quasar'

const master = {
  getAuthTokenName () {
    return process.env.AUTH_TOKEN_NAME
  },
  getStorageUserDataName () {
    return 'user_data'
  },
  getLangCookieName () {
    return process.env.LANG_COOKIE_NAME
  },
  /**
     * Opcion para obtener la url base de la api
     *
     * @param url
     * @returns {string}
     */
  api (url = '') {
    const api = process.env.API_URL
    return `${api}/${url}`
  },
  /**
   * Obtiene el conjunto de errores (error 422), si no hay, retorna false.
   *
   * @param errors
   * @returns {*}
   */
  hasErrors (errors) {
    const status = _.get(errors, ['response', 'status'])
    if (status === 422) {
      return _.get(errors, ['response', 'data', 'errors'], false)
    } else if (status === 401) {
      const message = _.get(errors, ['response', 'data', 'error'])
      if (message === 'invalid_credentials') {
        return {
          type: 'auth',
          errors: _.get(errors, ['response', 'data', 'errors'], false)
        }
      }
    }
    return false
  },
  hasRule (element, rule) {
    const ruler = _.get(element, ['failedRules', rule])
    return !_.isEmpty(ruler)
  },
  /**
     * Toma la lista errores emitida por el server (o custom) y la anexa a los errores de VeeValidate
     *
     * @param {object} observer - observer de veevalidate
     * @param {object} errors - lista de errores (parseada por hasErrors) del servidor
     */
  setErrors (observer, errors) {
    const isAuth = _.get(errors, ['type']) === 'auth'
    if (isAuth) {
      observer.$data.isAuth = true
      errors = _.get(errors, ['errors'], [])
    }
    const aux = {}
    for (const key of Object.keys(errors)) {
      if (Object.prototype.hasOwnProperty.call(errors, key)) {
        aux[key] = errors[key]
      }
    }
    observer.setErrors(aux)
  },
  onlyNumbers (evt) {
    evt = evt || window.event
    const charCode = (evt.which) ? evt.which : evt.keyCode
    switch (true) {
      case (charCode >= 48 && charCode <= 105):
      case (charCode === 8):
      case (charCode === 9):
      case (charCode === 27):
      case (charCode === 37):
      case (charCode === 39):
      case (charCode === 46):
      case (charCode === 144):
        return true
      default:
        evt.preventDefault()
        break
    }
  },
  /**
     * Formatea un numero determinado
     * @author Locutus (http://locutus.io)
     *
     * @param {float}  number - Numero sin formato
     * @param {string} [decimal=.] - Separador de decimales
     * @param {string} [thousand=,] - Separador de miles
     * @param {int} [fix=2] - Cantidad de decimales
     * @return {string}
     */
  numberFormat (number, decimal, thousand, fix) {
    let TheNumber = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    const n = ((!isFinite(+TheNumber)) ? 0 : +TheNumber)
    const prec = ((!isFinite(+fix)) ? 2 : Math.abs(fix))
    const sep = ((typeof thousand === 'undefined') ? ',' : thousand)
    const dec = ((typeof decimal === 'undefined') ? '.' : decimal)
    let s = ''
    const toFixedFix = (n, prec) => {
      const k = Math.pow(10, prec)
      return '' + (Math.round(n * k) / k)
        .toFixed(prec)
    }
    // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
    if (s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '').length < prec) {
      s[1] = s[1] || ''
      s[1] += new Array(prec - s[1].length + 1).join('0')
    }
    const regex = RegExp('\\' + dec + '00', 'g')
    TheNumber = s.join(dec)
    return TheNumber.replace(regex, '')
  },
  /**
     * Formatea un numero determinado basado en el arreglo de datos
     *
     * @param {float} number
     * @param {object} data
     * @returns {*|string}
     * @constructor
     */
  ObjectNumberFormat (number, data) {
    const decimal = _.get(data, ['decimal'], '.')
    const thousand = _.get(data, ['thousand'], ',')
    const fix = _.get(data, ['fix'], 2)
    return this.numberFormat(number, decimal, thousand, fix)
  },
  /**
     * Retorna un numero con simbolo de moneda
     *
     * @param {float|string} number - valor con o sin formato
     * @param {object} data - arreglo de moneda
     * @param {boolean} hasFormat - Si el numero ya trae formato
     * @returns {string}
     */
  currencyFormat (number, data, hasFormat = false) {
    if (!hasFormat) {
      number = this.ObjectNumberFormat(number, data)
    }
    const position = _.get(data, ['position'], 'left')
    const symbol = _.get(data, ['symbol'], '$')
    switch (position) {
      case 'left':
        return `${symbol} ${number}`
      case 'right':
        return `${number} ${symbol}`
      default:
        return `${symbol} ${number}`
    }
  },
  /**
     * Retorna un numero con sombolo ISO
     *
     * @param {float|string} number - valor con o sin formato
     * @param {object} data - arreglo de moneda
     * @param {boolean} hasFormat - Si el numero ya trae formato
     * @returns {string}
     */
  currencyISOFormat (number, data, hasFormat = false) {
    if (!hasFormat) {
      number = this.ObjectNumberFormat(number, data)
    }
    const iso = _.get(data, ['code'], 'MXN')
    return `${iso} ${number}`
  },
  /**
     * Permite la ejecucion de una funcin en intervalos de tiempos
     *
     * @param {function} fn - Funcion
     * @param {int} time - Intervalo de tiempo
     */
  Timer (fn, time) {
    let timerObj = setInterval(fn, time)

    this.stop = () => {
      if (timerObj) {
        clearInterval(timerObj)
        timerObj = null
      }
      return this
    }

    // start timer using current settings (if it's not already running)
    this.start = () => {
      if (!timerObj) {
        this.stop()
        timerObj = setInterval(fn, time)
      }
      return this
    }

    // start with new interval, stop current interval
    this.reset = (newT) => {
      time = newT
      return this.stop().start()
    }
  },
  /**
     * Permite cambiar el idioma de Google Recaptcha
     *
     * @param refs - HTML DOM
     * @param {string} language - Idioma que tomará (leer la doc de google)
     */
  setRecaptchaLang (refs, language) {
    const element = refs.getElementsByTagName('iframe')
    if (element[0]) {
      let src = element[0].getAttribute('src')
      const lang = src.match(/hl=(.*?)&/).pop()
      if (lang !== language) {
        src = src.replace(/hl=(.*?)&/, `hl=${language}&`)
        element[0].setAttribute('src', src)
      }
    }
  },
  bin2hex (s) {
    let i
    let l
    let n
    let o = ''
    s += ''
    for (i = 0, l = s.length; i < l; i++) {
      n = s.charCodeAt(i).toString(16)
      o += ((n.length < 2) ? '0' + n : n)
    }
    return o
  },
  hex2bin (bin) {
    const ret = []
    let i = 0
    let l
    bin += ''
    for (l = bin.length; i < l; i += 2) {
      const c = parseInt(bin.substr(i, 1), 16)
      const k = parseInt(bin.substr(i + 1, 1), 16)
      if (isNaN(c) || isNaN(k)) {
        return false
      }
      ret.push((c << 4) | k)
    }
    return String.fromCharCode.apply(String, ret)
  },
  /**
     * Remove all diatrics from the given text.
     * @access public
     * @param {String} text
     * @returns {String}
     */
  normalizeToBase (text) {
    const rExps = [
      { re: /[\xC0-\xC6]/g, ch: 'A' },
      { re: /[\xE0-\xE6]/g, ch: 'a' },
      { re: /[\xC8-\xCB]/g, ch: 'E' },
      { re: /[\xE8-\xEB]/g, ch: 'e' },
      { re: /[\xCC-\xCF]/g, ch: 'I' },
      { re: /[\xEC-\xEF]/g, ch: 'i' },
      { re: /[\xD2-\xD6]/g, ch: 'O' },
      { re: /[\xF2-\xF6]/g, ch: 'o' },
      { re: /[\xD9-\xDC]/g, ch: 'U' },
      { re: /[\xF9-\xFC]/g, ch: 'u' },
      { re: /[\xC7-\xE7]/g, ch: 'c' },
      { re: /[\xD1]/g, ch: 'N' },
      { re: /[\xF1]/g, ch: 'n' }
    ]
    rExps.forEach((element) => {
      text = text ? text.replace(element.re, element.ch) : ''
    })
    return text
  },
  /**
   * Search string in object
   *
   * @param {string} terms - Terminos de busqueda
   * @param {array} obj - Objecto en donde se va a buscar (arreglo de objetos)
   * @param {array} path - Mapa de la llave del objeto
   */
  search (terms, obj, path) {
    const query = this.normalizeToBase(_.get(obj, path, '').toLowerCase())
    return query.indexOf(this.normalizeToBase(terms.toLowerCase())) > -1
  },
  regexPassword () {
    return /(^[\S]{8,}$)/
  },
  errorToast (message) {
    Notify.create({
      message: message,
      type: 'negative'
    })
  },
  successToast (message) {
    Notify.create({
      message: message,
      type: 'positive'
    })
  }
}

export { master }
