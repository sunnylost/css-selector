(function(win, doc) {
	var parse = win.parse,

		isArray = Array.isArray,

		slice = Array.prototype.slice;

	function toArray(obj) {
		return slice.call(obj, 0);
	}

	/**
	 * 数组去重
	 * @return {[type]} [description]
	 */
	function unique() {
	}

	var filter = {
		id: function(id, context) {
			var result = [];
			context = [].concat(context);
			context.forEach(function(el) {
				el.id === id && result.push(el);
			})
			return result;
		}
	};

	var query = {
		'id': function(id, context) {
			if(context) {

			} else {
				return doc.getElementById(id);
			}
		},

		'tag': function(tag, context) {
			context = context || doc;

			var els = [];

			if(isArray(context)) {
				context.forEach(function(el) {
					els.concat(toArray(el.getElementsByTagName(tag)));
				})
				return unique(els);
			} else {
				return toArray(doc.getElementsByTagName(tag));
			}
		}
	};

	function search(selector) {
		var parseResult = parse(selector),
			result = [],
			needFilter = false,
			action,
			item;

		for(var i = 0, len = parseResult.length; i < len; i++) {
			item = parseResult[i];
			if(!needFilter) {
				needFilter = true;
				action = query[item.action];
				if(!action) {
					throw Error(selector + ' is not a valid css selector');
				}
				result = result.concat(action.apply(null, item.tokens));
			} else {
				action = filter[item.action];
				if(!action) {
					throw Error(selector + ' is not a valid css selector');
				}
				result = action.apply(null, item.tokens.concat(result));
			}
		}
		console.log('final result is ', result);
	}

	win.search = search;
}(window, document))