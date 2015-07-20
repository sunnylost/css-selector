const nonascii               = '[^\u0000-\u007f]',
      unicode                = '\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?',
      escape                 = '(' + unicode + ')|\\[^\n\r\f0-9a-f]',
      nmstart                = '[_a-z]|(' + nonascii + ')|(' + escape + ')',
      nmchar                 = '[_a-z0-9-]|(' + nonascii + ')|(' + escape + ')',
      iden                   = '[-]?(' + nmstart + ')(' + nmchar + ')*',
      name                   = '(' + nmchar + ')+',
      rname                  = new RegExp( name ),
      rstr                   = /(?:[^\n\r\f\\"]|\n|\r\n|\r|\f)/,
      rnonascii              = new RegExp( nonascii ),
      rescape                = new RegExp( escape ),

      TokenType              = {
          EOF          : 1,
          Identifier   : 2,
          StringLiteral: 3,
          WhiteSpace   : 4,
          Punctuator   : 5,
          PseudoElement: 6,
          PseudoClass  : 7,
          Namespace    : 8
      },

      PARENTHESES_NOT_CLOSED = 'parentheses not closed.'

class Tokenizer {
    constructor( source ) {
        if ( !source || !String( source ).trim() ) {
            throw Error( 'source cannot be empty.' )
        }

        this.source             = source
        this.sourceLength       = source.length
        this.tokens             = []
        this.tokenPos           = 0
        this.isThrowError       = true
        this.isDoubleQuote      = false
        this.parenthesesCounter = 0
    }

    check() {
        let token

        while ( token = this.advance() ) {
            this.tokens.push( token )
            if ( token.type === TokenType.EOF ) {
                if ( this.parenthesesCounter !== 0 ) {
                    throw Error( PARENTHESES_NOT_CLOSED )
                }
                return
            }
        }
    }

    advance() {
        let pos = this.tokenPos

        if ( pos >= this.sourceLength ) {
            return {
                type: TokenType.EOF
            }
        }

        let c  = this.source[ pos ],
            ch = c.charCodeAt( 0 )

        if ( Tokenizer.isWhiteSpace( ch ) ) {
            return this.scanWhiteSpace( ch )
        }

        if ( Tokenizer.isIdentifier( ch, c ) ) {
            return this.scanIdentifier()
        }

        if ( this.isStringLiteralBegin( ch ) ) {
            return this.scanStringLiteral()
        }

        return this.scanPunctuator() || {
                type: TokenType.EOF
            }
    }

    /**
     * http://www.w3.org/TR/selectors/#whitespace
     */
    static isWhiteSpace( ch ) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0A || ch === 0x0C || ch === 0x0D
    }

    static isIdentifier( ch, c ) {
        return Tokenizer.isIdentifierStart( ch, c ) || (ch >= 0x30 && ch <= 0x39)
    }

    /**
     * http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
     */
    static isIdentifierStart( ch, c ) {
        return ch === 0x2D || (ch >= 0x61 && ch <= 0x7A) || rnonascii.test( c ) || rescape.test( c )
    }

    isStringLiteral( c ) {
        return c !== ( this.isDoubleQuote ? '"' : '\'' ) && ( rstr.test( c ) || rnonascii.test( c ) || rescape.test( c ) )
    }

    //0x22 "
    //0x27 '
    isStringLiteralBegin( ch ) {
        return ( ch === 0x22 && ( this.isDoubleQuote = true ) ) || ( ch === 0x27 && ( this.isDoubleQuote = false ) )
    }

    scanWhiteSpace() {
        return this.normalScan( Tokenizer.isWhiteSpace, TokenType.WhiteSpace )
    }

    scanIdentifier() {
        let tokens    = this.tokens,
            prevToken = tokens[ tokens.length - 1 ],
            token     = this.normalScan( Tokenizer.isIdentifier, TokenType.Identifier )

        if ( prevToken && prevToken.type === TokenType.Namespace ) {
            prevToken   = tokens.pop()
            token.start = prevToken.start
            token.value = prevToken.value + token.value
        }

        return token
    }

    scanStringLiteral() {
        let tokenPos = this.tokenPos,
            start    = tokenPos,
            source   = this.source,
            c, end

        while ( ( c = source[ ++tokenPos ] ) && this.isStringLiteral( c ) ) {
        }

        if ( c !== ( this.isDoubleQuote ? '"' : '\'' ) ) {
            if ( this.isSilence() ) {
                throw Error( {
                    message: 'String didn\'t finished. column must be " or \''
                } )
            } else {
                //TODO
                //return errorToken( start )
            }
        }

        this.tokenPos      = tokenPos + 1
        end                = tokenPos
        this.isDoubleQuote = false

        return {
            type : TokenType.StringLiteral,
            start: start,
            end  : end,
            value: source.slice( start + 1, end )
        }
    }

    normalScan( checker, Type ) {
        let tokenPos = this.tokenPos,
            start    = tokenPos,
            source   = this.source,
            ch, c, end

        while ( 1 ) {
            c = source[ ++tokenPos ]

            if ( c !== undefined ) {
                ch = c.charCodeAt( 0 )

                if ( !checker( ch, c ) ) {
                    break
                }
            } else {
                break
            }
        }

        this.tokenPos = tokenPos
        end           = tokenPos - 1

        return {
            type : Type,
            start: start,
            end  : end,
            value: source.slice( start, end + 1 )
        }
    }

    scanPunctuator() {
        var source   = this.source,
            tokenPos = this.tokenPos,
            tokens   = this.tokens,
            c        = source[ tokenPos ]

        switch ( c ) {
            case '|':
                let prevToken

                if ( tokens.length ) {
                    prevToken = tokens.pop()
                } else {
                    prevToken = {
                        start: tokenPos + 1,
                        end  : tokenPos + 1,
                        value: ''
                    }
                }

                prevToken.type = TokenType.Namespace
                prevToken.end += 1
                prevToken.value += '|'

                this.tokenPos++
                return prevToken

            case '#':
            case '.':
                tokens.push( {
                    type : TokenType.Punctuator,
                    start: tokenPos + 1,
                    end  : tokenPos + 2,
                    value: c
                } )

                this.tokenPos++
                return this.scanName()

            case '*':
            case '>':
            case '+':
            case '~':
            case ',':
                tokenPos++
                this.tokenPos  = tokenPos

                return {
                    type : TokenType.Punctuator,
                    start: tokenPos,
                    end  : tokenPos + 1,
                    value: c
                }

            case '[':
                tokenPos++
                this.tokenPos  = tokenPos

                tokens.push( {
                    type : TokenType.Punctuator,
                    start: tokenPos,
                    end  : tokenPos + 1,
                    value: c
                } )

                return this.scanAttribute()

            case ':':
                tokenPos++
                this.tokenPos  = tokenPos
                return source[ tokenPos ] === ':' ? this.scanPseudoElement() : this.scanPseudoClass()
        }

        return null
    }

    scanName() {
        let source   = this.source,
            tokenPos = this.tokenPos,
            start    = tokenPos,
            c

        while ( ( c = source[ tokenPos++ ] ) && rname.test( c ) ) {
        }

        tokenPos--

        if ( start == tokenPos ) {
            if ( this.isSilence() ) {
                throw Error( `column ${start} is not a name.` )
            } else {
                //TODO
                //return errorToken( start )
            }
            return
        }

        this.tokenPos = tokenPos

        return {
            type : TokenType.Identifier,
            start: start + 1,
            end  : tokenPos + 1,
            value: source.slice( start, tokenPos )
        }
    }

    scanAttribute() {
        this.tokens.push( this.scanName() )

        let tokens            = this.tokens,
            source            = this.source,
            tokenPos          = this.tokenPos,
            c                 = source[ tokenPos ],
            start             = tokenPos + 1

        switch ( c ) {
            case '=':
                tokenPos++;
                tokens.push( {
                    type : TokenType.Punctuator,
                    start: start,
                    end  : start + 1,
                    value: c
                } )
                break

            case '~':
            case '|':
            case '^':
            case '$':
            case '*':
                tokenPos++
                this.tokenPos = tokenPos //expect() will use tokenPos, so here need to sync
                this.expect( '=' )
                --tokenPos
                tokens.push( {
                    type : TokenType.Punctuator,
                    start: start,
                    end  : start + 1,
                    value: source.slice( tokenPos, tokenPos += 2 )
                } )
                break

            case ']':
                this.tokenPos++

                return {
                    type : TokenType.Punctuator,
                    start: start,
                    end  : start + 1,
                    value: c
                }
        }

        if ( this.isStringLiteralBegin( source[ tokenPos ].charCodeAt( 0 ) ) ) {
            this.tokenPos++
            tokens.push( this.scanStringLiteral() )
        } else {
            tokens.push( this.scanName() )
        }

        tokenPos = this.tokenPos

        if ( source[ tokenPos ] != ']' ) {
            if ( this.isSilence() ) {
                throw Error( 'Attribute selector did not finished correctly.' )
            }
            //TODO
            //return errorToken( start )
        }

        this.tokenPos = tokenPos

        return {
            type : TokenType.Punctuator,
            start: tokenPos,
            end  : tokenPos + 1,
            value: source[ tokenPos ]
        }
    }

    scanPseudoElement() {
        var source   = this.source,
            tokenPos = this.tokenPos,
            c        = source[ ++tokenPos ],
            start    = tokenPos - 2,
            token    = {
                start: start,
                type : TokenType.PseudoElement
            };

        switch ( c.toLowerCase() ) {
            case 'a':
                if ( 'after' === source.slice( tokenPos, tokenPos + 5 ).toLowerCase() ) {
                    token.value = '::after'
                    token.end   = start + 7
                    tokenPos += 5
                } else if ( this.isSilence() ) {
                    throw Error( `column ${start} need ::after` )
                } else {
                    //TODO
                    //return errorToken( start )
                }

                break

            case 'b':
                if ( 'before' === source.slice( tokenPos, tokenPos + 6 ).toLowerCase() ) {
                    token.value = '::before'
                    token.end   = start + 8
                    tokenPos += 6
                } else if ( this.isSilence() ) {
                    throw Error( `column ${start} need ::before` )
                } else {
                    //TODO
                    //return errorToken( start )
                }

                break

            case 'f':
                if ( 'first-line' === source.slice( tokenPos, tokenPos + 10 ).toLowerCase() ) {
                    token.value = '::first-line'
                    token.end   = start + 12
                    tokenPos += 10
                } else if ( 'first-letter' === source.slice( tokenPos, tokenPos + 12 ).toLowerCase() ) {
                    token.value = '::first-letter'
                    token.end   = start + 14
                    tokenPos += 12
                } else if ( this.isSilence() ) {
                    throw Error( `column ${start} need ::first-line or ::first-letter` )
                } else {
                    //TODO
                    //return errorToken( start )
                }

                break

            default:
                if ( this.isSilence() ) {
                    throw Error( `column ${start} need a pseudo element` )
                } else {
                    //TODO
                    //return errorToken( start )
                }
                return
        }

        this.tokenPos = tokenPos

        return token
    }

    scanPseudoClass() {
        var source       = this.source,
            tokenPos     = this.tokenPos,
            pseudoClass  = '',
            rpseudoClass = /[-a-zA-Z]/,
            len, c, isValid

        /**
         * currently, pseudo class'name is composited by a-zA-Z and -
         */
        while ( (c = source[ tokenPos ]) && rpseudoClass.test( c ) ) {
            pseudoClass += c
            tokenPos++
        }

        pseudoClass = pseudoClass.toLowerCase()

        len = pseudoClass.length

        switch ( len ) {
            case 3:
                switch ( pseudoClass ) {
                    case 'not':
                        isValid = true
                }
                break

            case 4:
                switch ( pseudoClass ) {
                    case 'link':
                    case 'past':
                    case 'root':
                    case 'lang':
                        isValid = true
                }
                break

            case 5:
                switch ( pseudoClass ) {
                    case 'blank':
                    case 'empty':
                    case 'focus':
                    case 'hover':
                    case 'scope':
                    case 'valid':
                        isValid = true
                }
                break

            case 6:
                switch ( pseudoClass ) {
                    case 'active':
                    case 'future':
                    case 'target':
                        isValid = true
                }
                break

            case 7:
                switch ( pseudoClass ) {
                    case 'checked':
                    case 'current':
                    case 'default':
                    case 'enabled':
                    case 'invalid':
                    case 'visited':
                        isValid = true
                }
                break

            case 8:
                switch ( pseudoClass ) {
                    case 'any-link':
                    case 'disabled':
                    case 'in-range':
                    case 'optional':
                    case 'required':
                        isValid = true
                }
                break

            case 9:
                switch ( pseudoClass ) {
                    case 'read-only':
                    case 'nth-child':
                        isValid = true
                }
                break

            case 10:
                switch ( pseudoClass ) {
                    case 'last-child':
                    case 'only-child':
                    case 'read-write':
                    case 'valid-drop':
                        isValid = true
                }
                break

            case 11:
                switch ( pseudoClass ) {
                    case 'active-drop':
                    case 'first-child':
                    case 'nth-of-type':
                        isValid = true
                }
                break

            case 12:
                switch ( pseudoClass ) {
                    case 'invalid-drop':
                    case 'last-of-type':
                    case 'only-of-type':
                    case 'out-of-range':
                        isValid = true
                }
                break

            case 13:
                switch ( pseudoClass ) {
                    case 'first-of-type':
                    case 'indeterminate':
                        isValid = true
                }
                break

            case 14:
                switch ( pseudoClass ) {
                    case 'nth-last-child':
                        isValid = true
                }
                break

            case 16:
                switch ( pseudoClass ) {
                    case 'nth-last-of-type':
                        isValid = true
                }
                break

            case 17:
                switch ( pseudoClass ) {
                    case 'placeholder-shown':
                        isValid = true
                }
                break

            default:
                isValid = false
        }

        if ( isValid ) {
            this.tokenPos = tokenPos
            --tokenPos

            this.tokens.push( {
                type : TokenType.PseudoClass,
                start: tokenPos - pseudoClass.length,
                end  : tokenPos + 1,
                value: ':' + pseudoClass
            } )

            if ( source[ ++tokenPos ] === '(' ) {
                return this.scanFunction( pseudoClass );
            }
        } else if ( this.isSilence() ) {
            throw Error( `${pseudoClass} is not a valid pseudo class name!` )
        } else {
            //TODO
            //return errorToken(tokPos - pseudoClass.length)
        }
    }

    //TODO
    scanFunction() {
        let tokenPos = this.tokenPos,
            source   = this.source,
            c        = source[ tokenPos ]

        if ( c === '(' ) {
            this.parenthesesCounter++
        } else if ( c === ')' ) {
            if ( !this.parenthesesCounter ) {
                throw Error( PARENTHESES_NOT_CLOSED )
            }

            this.parenthesesCounter--
        }
        //TODO
    }

    expect( c ) {
        let tokenPos = this.tokenPos

        if ( this.source.slice( tokenPos, tokenPos + c.length ) !== c && this.isSilence() ) {
            throw Error( `column ${tokenPos + 1} need ${c}` )
        } else {
            //TODO
            //return errorToken(tokPos);
        }
    }

    isSilence() {
        return this.isThrowError
    }

    silence() {
        this.isThrowError = true
    }

    unsilence() {
        this.isThrowError = false
    }
}

export default Tokenizer
