var should    = require( 'should' ),
    Tokenizer = require( '../build/tokenizer' ).default

function prepare( selector ) {
    var t = new Tokenizer( selector )
    t.check()
    return filter( t.tokens )
}

function filter( arr ) {
    return arr.map( function( v ) {
        delete v.start
        delete v.end
        delete v.type
        return v
    } )
}

function generate( values ) {
    return values.map( function( v ) {
        return {
            value: v
        }
    } ).concat( {} )
}

describe( 'Tokenizer', function() {
    it( 'empty source will cause error', function() {
        ( function() {
            return new Tokenizer
        } ).should.throw()
    } )

    it( 'universal', function() {
        should.deepEqual( prepare( '*' ), generate( [ '*' ] ) )
    } )

    it( 'namespace', function() {
        should.deepEqual( prepare( 'ns|div' ), generate( [ 'ns|div' ] ) )
        should.deepEqual( prepare( '*|div' ), generate( [ '*|div' ] ) )
        should.deepEqual( prepare( '|div' ), generate( [ '|div' ] ) )
    } )

    it( 'html tag', function() {
        should.deepEqual( prepare( 'div' ), generate( [ 'div' ] ) )
    } )

    it( 'descendant', function() {
        should.deepEqual( prepare( 'div a span' ), generate( [ 'div', ' ', 'a', ' ', 'span' ] ) )
    } )

    it( 'child', function() {
        should.deepEqual( prepare( 'div > p' ), generate( [ 'div', ' ', '>', ' ', 'p' ] ) )
    } )

    it( 'adjacent sibling', function() {
        should.deepEqual( prepare( 'div + p' ), generate( [ 'div', ' ', '+', ' ', 'p' ] ) )
    } )

    it( 'general sibling', function() {
        should.deepEqual( prepare( 'div ~ p' ), generate( [ 'div', ' ', '~', ' ', 'p' ] ) )
    } )

    it( 'id', function() {
        should.deepEqual( prepare( 'div #abc' ), generate( [ 'div', ' ', '#', 'abc' ] ) )
        should.deepEqual( prepare( '#abc p' ), generate( [ '#', 'abc', ' ', 'p' ] ) )
    } )

    it( 'class', function() {
        should.deepEqual( prepare( 'header.top' ), generate( [ 'header', '.', 'top' ] ) )
        should.deepEqual( prepare( '.top div' ), generate( [ '.', 'top', ' ', 'div' ] ) )
    } )

    it( 'multiple classes', function() {
        should.deepEqual( prepare( '.top.left' ), generate( [ '.', 'top', '.', 'left' ] ) )
    } )

    it( 'attribute', function() {
        should.deepEqual( prepare( 'a[href]' ), generate( [ 'a', '[', 'href', ']' ] ) )
        should.deepEqual( prepare( '[lang]' ), generate( [ '[', 'lang', ']' ] ) )
        should.deepEqual( prepare( 'span[foo="bar"]' ), generate( [ 'span', '[', 'foo', '=', 'bar', ']' ] ) )
        should.deepEqual( prepare( 'h1[foo~="bar"]' ), generate( [ 'h1', '[', 'foo', '~=', 'bar', ']' ] ) )
        should.deepEqual( prepare( 'article[foo^="hello"]' ), generate( [ 'article', '[', 'foo', '^=', 'hello', ']' ] ) )
        should.deepEqual( prepare( 'p[foo$="hey"]' ), generate( [ 'p', '[', 'foo', '$=', 'hey', ']' ] ) )
        should.deepEqual( prepare( 'p[foo*="hey"]' ), generate( [ 'p', '[', 'foo', '*=', 'hey', ']' ] ) )
        should.deepEqual( prepare( 'p[foo|="en"]' ), generate( [ 'p', '[', 'foo', '|=', 'en', ']' ] ) )
    } )

    it( 'pseudo class', function() {
        should.deepEqual( prepare( 'div:root' ), generate( [ 'div', ':root' ] ) )
        should.deepEqual( prepare( 'div:nth-child(2)' ), generate( [ 'div', ':nth-child', '(', '2', ')' ] ) )
        should.deepEqual( prepare( 'div:nth-last-child(2)' ), generate( [ 'div', ':nth-last-child', '(', '2', ')' ] ) )
        should.deepEqual( prepare( 'div:nth-of-type(1)' ), generate( [ 'div', ':nth-of-type', '(', '1', ')' ] ) )
        should.deepEqual( prepare( 'div:nth-last-of-type(2)' ), generate( [ 'div', ':nth-last-of-type', '(', '2', ')' ] ) )
        should.deepEqual( prepare( 'div:first-child' ), generate( [ 'div', ':first-child' ] ) )
        should.deepEqual( prepare( 'div:last-child' ), generate( [ 'div', ':last-child' ] ) )
        should.deepEqual( prepare( 'div:first-of-type' ), generate( [ 'div', ':first-of-type' ] ) )
        should.deepEqual( prepare( 'div:only-child' ), generate( [ 'div', ':only-child' ] ) )
        should.deepEqual( prepare( 'div:only-of-type' ), generate( [ 'div', ':only-of-type' ] ) )
        should.deepEqual( prepare( 'div:empty' ), generate( [ 'div', ':empty' ] ) )
        should.deepEqual( prepare( 'div:link' ), generate( [ 'div', ':link' ] ) )
        should.deepEqual( prepare( 'div:visited' ), generate( [ 'div', ':visited' ] ) )
        should.deepEqual( prepare( 'div:active' ), generate( [ 'div', ':active' ] ) )
        should.deepEqual( prepare( 'div:hover' ), generate( [ 'div', ':hover' ] ) )
        should.deepEqual( prepare( 'div:focus' ), generate( [ 'div', ':focus' ] ) )
        should.deepEqual( prepare( 'div:target' ), generate( [ 'div', ':target' ] ) )
        should.deepEqual( prepare( 'div:lang(fr)' ), generate( [ 'div', ':lang', '(', 'fr', ')' ] ) )
        should.deepEqual( prepare( 'div:enabled' ), generate( [ 'div', ':enabled' ] ) )
        should.deepEqual( prepare( 'div:disabled' ), generate( [ 'div', ':disabled' ] ) )
        should.deepEqual( prepare( 'div:checked' ), generate( [ 'div', ':checked' ] ) )
    } )

    it( 'pseudo element', function() {
        should.deepEqual( prepare( 'div::first-line' ), generate( [ 'div', '::first-line' ] ) )
        should.deepEqual( prepare( 'div::first-letter' ), generate( [ 'div', '::first-letter' ] ) )
        should.deepEqual( prepare( 'div::before' ), generate( [ 'div', '::before' ] ) )
        should.deepEqual( prepare( 'div::after' ), generate( [ 'div', '::after' ] ) )
    } )
} )
