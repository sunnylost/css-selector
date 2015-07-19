var should    = require( 'should' ),
    Tokenizer = require( '../build/tokenizer' )

function prepare( selector ) {
    var t = new Tokenizer( selector )
    t.check()
    return filter( t.tokens )
}

function filter( arr ) {
    return arr.map( function ( v ) {
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

describe( 'Tokenizer', function () {
    it( 'empty source will cause error', function () {
        ( function () {
            return new Tokenizer
        } ).should.throw()
    } )

    it( 'universal', function() {
        should.deepEqual( prepare( '*' ), generate( [ '*' ] ) )
    } )

    it( 'html tag', function () {
        should.deepEqual( prepare( 'div' ), generate( [ 'div' ] ) )
    } )

    it( 'multiple tags', function() {
        should.deepEqual( prepare( 'div a span'), generate( [ 'div', ' ', 'a', ' ', 'span' ] ) )
    } )

    it( 'id', function() {
        should.deepEqual( prepare( 'div #abc' ), generate( [ 'div', ' ', '#', 'abc' ] ) )
        should.deepEqual( prepare( '#abc p' ), generate( [ '#', 'abc', ' ', 'p' ] ) )
    } )

    it( 'class', function() {
        should.deepEqual( prepare( 'header.top' ), generate( [ 'header', '.', 'top' ] ) )
        should.deepEqual( prepare( '.top div' ), generate( [ '.', 'top', ' ', 'div' ] ) )
    } )

    it( 'multiple classes', function () {
        should.deepEqual( prepare( '.top.left' ), generate( [ '.', 'top', '.', 'left' ] ) )
    } )

    it( 'attribute', function () {
        should.deepEqual( prepare( 'a[href]' ), generate( [ 'a', '[', 'href', ']' ] ) )
        should.deepEqual( prepare( '[lang]' ), generate( [ '[', 'lang', ']' ] ) )
        should.deepEqual( prepare( 'span[foo="bar"]' ), generate( [ 'span', '[', 'foo', '=', 'bar', ']' ] ) )
        should.deepEqual( prepare( 'h1[foo~="bar"]' ), generate( [ 'h1', '[', 'foo', '~=', 'bar', ']' ] ) )
        should.deepEqual( prepare( 'article[foo^="hello"]' ), generate( [ 'article', '[', 'foo', '^=', 'hello', ']' ] ) )
        should.deepEqual( prepare( 'p[foo$="hey"]' ), generate( [ 'p', '[', 'foo', '$=', 'hey', ']' ] ) )
    } )
} )
