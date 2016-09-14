freemat.js: freemat.pegjs
	pegjs freemat.pegjs

.PHONY: debug
debug:
	pegjs --trace freemat.pegjs

.PHONY: test
test: freemat.js
	mocha
