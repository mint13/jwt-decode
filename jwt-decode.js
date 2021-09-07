(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) : factory()
}((function () {
    'use strict'

    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

    let InvalidCharacterError = (message) =>  this.message = message

    InvalidCharacterError.prototype = new Error()
    InvalidCharacterError.prototype.name = "InvalidCharacterError"

    let polyfill = input => {
        let str = String(input).replace(/=+$/, "")
        if (str.length % 4 == 1) {
            throw new InvalidCharacterError(
                "'atob' failed: The string to be decoded is not correctly encoded."
            )
        }
        for (
            // initialize result and counters
            let bc = 0, bs, buffer, idx = 0, output = "";
            // get next character   
            (buffer = str.charAt(idx++));
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer &&
            ((bs = bc % 4 ? bs * 64 + buffer : buffer),
                // and if not first of each 4 characters,
                // convert the first 8 bits to one ascii character
                bc++ % 4) ?
            (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) :
            0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer)
        }
        return output
    }

    let atob = (typeof window !== "undefined" && window.atob && window.atob.bind(window)) || polyfill

    let b64DecodeUnicode = str => {
        return decodeURIComponent(
            atob(str).replace(/(.)/g, function(m, p) {
                let code = p.charCodeAt(0).toString(16).toUpperCase()
                if (code.length < 2) {
                    code = "0" + code
                }
                return "%" + code
            })
        )
    }

    let base64_url_decode = str => {
        let output = str.replace(/-/g, "+").replace(/_/g, "/")
        switch (output.length % 4) {
            case 0:
                break
            case 2:
                output += "=="
                break
            case 3:
                output += "="
                break
            default:
                throw "Illegal base64url string!"
        }

        try {
            return b64DecodeUnicode(output)
        } catch (err) {
            return atob(output)
        }
    }

    let InvalidTokenError = message => {
        this.message = message
    }

    InvalidTokenError.prototype = new Error()
    InvalidTokenError.prototype.name = "InvalidTokenError"

    let jwtDecode = (token, options) => {
        if (typeof token !== "string") {
            throw new InvalidTokenError("Invalid token specified")
        }

        options = options || {};
        let pos = options.header === true ? 0 : 1
        try {
            return JSON.parse(base64_url_decode(token.split(".")[pos]))
        } catch (e) {
            throw new InvalidTokenError("Invalid token specified: " + e.message)
        }
    }

    /*
     * Expose the function on the window object
     */

    //use amd or just through the window object.
    if (window) {
        if (typeof window.define == "function" && window.define.amd) {
            window.define("jwt_decode", function() {
                return jwtDecode
            });
        } else if (window) {
            window.jwt_decode = jwtDecode
        }
    }

})))
