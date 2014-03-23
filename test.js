(function(win) {
	function Test(selector, b) {
		var a = parse(selector),
			len = a.length,
			tlen,
			i = 0,
			j = 0,

			aa, bb,
			atokens,
			btokens,
			at, bt;

		if(len != b.length) {
			console.log(a);
			console.log(b);
			result.innerHTML += '<div class="fail">' + selector + ' FAILED!</div>';
			throw Error('The result length is not equal!');
		}

		for(; i < len; i++) {
			aa = a[i];
			bb = b[i];
			if(aa.action != bb.action) {
				console.log(a);
				console.log(b);
				result.innerHTML += '<div class="fail">' + selector + ' FAILED!</div>';
				throw Error(aa.action + ' is not equal ' + bb.action);
			}

			atokens = aa.tokens;
			btokens = bb.tokens;
			tlen = atokens.length;
			if(tlen != btokens.length) {
				console.log(a);
				console.log(b);
				result.innerHTML += '<div class="fail">' + selector + ' FAILED!</div>';
				throw Error('The tokens length is not equal!');
			}

			for(j = 0; j < tlen; j++) {
				if(atokens[j] != btokens[j]) {
					console.log(a);
					console.log(b);
					result.innerHTML += '<div class="fail">' + selector + ' FAILED!</div>';
					throw Error('The generated tokens are not equal!');
				}
			}
		}
		result.innerHTML += '<div class="pass">' + selector + ' PASSED!</div>'
	}

	win.Test = Test;
}(window))