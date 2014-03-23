(function() {
	var ridentifier = /[-_\w]/,
		rblank = /\s+/;

	var selectors = {
		'#': {
			action: 'id',
			next: 'InIdentifier'
		},

		'.': {
			action: 'class',
			next: 'InIdentifier'
		}
	};

	var attributeFilters = {
		'~': {
			action: 'one-of-attribute',
			next: 'NeedEqualSign'
		},

		'^': {
			action: 'begin-with-attribute',
			next: 'NeedEqualSign'
		},

		'$': {
			action: 'end-with-attribute',
			next: 'NeedEqualSign'
		},

		'*': {
			action: 'contain-attribute',
			next: 'NeedEqualSign'
		},

		'|': {
			action: 'hyphen-seperate-with-attribute',
			next: 'NeedEqualSign'
		}
	};

	var pseudos = {

	};

	var combinators = {
		'+': {
			action: 'next-sibling',
			next: 'Start'
		},

		'~': {
			action: 'following-sibling',
			next: 'Start'
		},

		'>': {
			action: 'child',
			next: 'Start'
		}
	};

	function log() {
		console.log.apply(console, arguments);
	}

	function parse(s) {
		s = s.trim();

		var st = 'InitStart',
			c,
			tmp,
			tokens = [],
			action = '',
			result = [];

		for(var i = 0, len = s.length; i < len; i++) {
			c = s[i];
			switch(st) {
				case 'InitStart':
					if(ridentifier.test(c)) {
						st = 'InIdentifier';
						action = 'tag';
						tokens.push(c);
					} else if(rblank.test(c)) {
						continue;
					} else if((tmp = selectors[c])) {
						st = tmp.next;
						action = tmp.action;
					} else if(c == '[') {
						st = 'NeedAttributeIdentifier';
						action = 'has-attribute';
						tokens = [];
					} else {
						throw Error(c + ' is not a valid identifier.')
					}
					break;

				case 'Start':
					if(ridentifier.test(c)) {
						st = 'InIdentifier';
						action = 'tag';
						tokens.push(c);
					} else if(rblank.test(c)) {
						st = 'Start';
						if(action != 'decendent') {
							action = 'decendent';
							result.push({
								action: action,
								tokens: []
							})
						}
					} else if((tmp = selectors[c]) || (tmp = combinators[c])) {
						if(action) {
							result.push({
								action: action,
								tokens: tokens
							})
							tokens = [];
						}
						st = tmp.next;
						action = tmp.action;
					} else if(c == '[') {
						st = 'NeedAttributeIdentifier';
						action = 'has-attribute';
						tokens = [];
					} else {
						throw Error(c + ' is not a valid identifier.')
					}
					break;

				case 'InIdentifier':
					if(ridentifier.test(c)) {
						tokens.push(c);
					} else if(rblank.test(c)) {
						st = 'Start';

						result.push({
							action: action,
							tokens: [tokens.join('')]
						});

						result.push({
							action: 'decendent',
							tokens: []
						});

						tokens = [];
						action = '';
					} else if(tmp = selectors[c]) {
						if(action) {
							result.push({
								action: action,
								tokens: tokens
							})
							tokens = [];
						}
						st = tmp.next;
						action = tmp.action;
					} else {
						throw Error(c + ' is not a valid identifier.')
					}
					break;

				case 'InDecendent':
					action = 'decendent';
					if(rblank.test(c)) {
						st = 'Start';
					} else if(ridentifier.test(c)) {
						result.push({
							action: action,
							tokens: []
						})
						tokens = [c];
						action = '';
						st = 'Start';
					}
					break;

				case 'NeedAttributeIdentifier':
					if(ridentifier.test(c)) {
						tokens.push(c);
						st = 'InAttribute';
					} else {
						throw Error(c + ' is not right, need an identifier at position ' + i);
					}
					break;

				case 'InAttribute':
					if(ridentifier.test(c)) {
						tokens.push(c);
					} else if(c == '=') {
						action = 'equal-attribute';
						tokens = [tokens.join('')];
						st = 'NeedBeginQuoteSign';
					} else if(c == '"') {
						throw Error(c + ' cannot appear here, need identifier at position ' + i);
					} else if(c == ']') {
						if(action) {
							result.push({
								action: action,
								tokens: [ tokens.join('') ]
							})
							action = '';
							tokens = [];
						}
						st = 'Start';
					} else if(tmp = attributeFilters[c]) {
						tokens = [tokens.join('')];
						action = tmp.action;
						st = tmp.next;
					} else {
						throw Error(c + ' is not right, need identifier at position ' + i);
					}
					break;

				case 'NeedEqualSign':
					if(c != '=') {
						throw Error('Need an equal sign at position ' + i);
					} else {
						st = 'NeedBeginQuoteSign';
					}
					break;

				case 'NeedBeginQuoteSign':
					if(c == '"') {
						st = 'NeedEndQuoteSign';
						tokens = [tokens.join('')];
					} else {
						throw Error('There must be a quote sign at position ' + i);
					}
					break;

				case 'NeedEndQuoteSign':
					if(c == '"') {
						tokens = [tokens.shift(), tokens.join('')];
						st = 'AfterEndQuote';
					} else {
						tokens.push(c);
					}
					break;

				case 'AfterEndQuote':
					if(rblank.test(c)) {
						st = 'NeedAttributeIgnoreOrEnd';
						continue;
					} else if(c == ']') {
						result.push({
							action: action,
							tokens: tokens
						})
						action = '';
						tokens = [];
						st = 'Start';
					}
					break;

				case 'NeedAttributeIgnoreOrEnd':
					if(c == 'i') {
						if(action != 'equal-attribute') {
							throw Error('i must be used like [foo="bar" i].');
						} else {
							action = 'exactly-equal-attribute';
							st = 'NeedEndSqureBracket';
						}
					}
					break;

				case 'NeedEndSqureBracket':
					if(rblank.test(c)) {
						continue;
					} else if(c == ']') {
						result.push({
							action: action,
							tokens: tokens
						})
						action = '';
						tokens = [];
						st = 'Start';
					} else {
						throw Error('Need a ] at position ' + i);
					}
					break;
			}
		}

		if(action) {
			result.push({
				action: action,
				tokens: [tokens.join('')]
			})
		}
		log(result);
		return result;
	}

	window.parse = parse;
}())