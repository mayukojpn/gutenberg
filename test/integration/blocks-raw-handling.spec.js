/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * WordPress dependencies
 */
import {
	getBlockContent,
	rawHandler,
	serialize,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

describe( 'Blocks raw handling', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( '../../packages/editor/src/hooks' );
		registerCoreBlocks();
	} );

	it( 'should filter inline content', () => {
		const filtered = rawHandler( {
			HTML: '<h2><em>test</em></h2>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( '<em>test</em>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should parse Markdown', () => {
		const filtered = rawHandler( {
			HTML: '* one<br>* two<br>* three',
			plainText: '* one\n* two\n* three',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<ul><li>one</li><li>two</li><li>three</li></ul>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should parse inline Markdown', () => {
		const filtered = rawHandler( {
			HTML: 'Some **bold** text.',
			plainText: 'Some **bold** text.',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'Some <strong>bold</strong> text.' );
		expect( console ).toHaveLogged();
	} );

	it( 'should parse HTML in plainText', () => {
		const filtered = rawHandler( {
			HTML: '&lt;p&gt;Some &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;',
			plainText: '<p>Some <strong>bold</strong> text.</p>',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'Some <strong>bold</strong> text.' );
		expect( console ).toHaveLogged();
	} );

	it( 'should parse Markdown with HTML', () => {
		const filtered = rawHandler( {
			HTML: '',
			plainText: '# Some <em>heading</em>\n\nA paragraph.',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<h1>Some <em>heading</em></h1><p>A paragraph.</p>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should break up forced inline content', () => {
		const filtered = rawHandler( {
			HTML: '<p>test</p><p>test</p>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( 'test<br>test' );
		expect( console ).toHaveLogged();
	} );

	it( 'should normalize decomposed characters', () => {
		const filtered = rawHandler( {
			HTML: 'schön',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( 'schön' );
		expect( console ).toHaveLogged();
	} );

	it( 'should treat single list item as inline text', () => {
		const filtered = rawHandler( {
			HTML: '<ul><li>Some <strong>bold</strong> text.</li></ul>',
			plainText: 'Some <strong>bold</strong> text.\n',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'Some <strong>bold</strong> text.' );
		expect( console ).toHaveLogged();
	} );

	it( 'should treat multiple list items as a block', () => {
		const filtered = rawHandler( {
			HTML: '<ul><li>One</li><li>Two</li><li>Three</li></ul>',
			plainText: 'One\nTwo\nThree\n',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		expect( console ).toHaveLogged();
	} );

	describe( 'serialize', () => {
		function readFile( filePath ) {
			return fs.existsSync( filePath ) ? fs.readFileSync( filePath, 'utf8' ).trim() : '';
		}

		[
			'plain',
			'classic',
			'apple',
			'google-docs',
			'ms-word',
			'ms-word-styled',
			'ms-word-online',
			'evernote',
			'iframe-embed',
			'one-image',
			'two-images',
			'markdown',
			'wordpress',
			'gutenberg',
			'caption-shortcode',
		].forEach( ( type ) => {
			it( type, () => {
				const HTML = readFile( path.join( __dirname, `fixtures/${ type }-in.html` ) );
				const plainText = readFile( path.join( __dirname, `fixtures/${ type }-in.txt` ) );
				const output = readFile( path.join( __dirname, `fixtures/${ type }-out.html` ) );
				const converted = rawHandler( { HTML, plainText, canUserUseUnfilteredHTML: true } );
				const serialized = typeof converted === 'string' ? converted : serialize( converted );

				expect( serialized ).toBe( output );

				if ( type !== 'gutenberg' ) {
					expect( console ).toHaveLogged();
				}
			} );
		} );
	} );
} );
